package com.voltflow.config;

import com.voltflow.filter.JwtAuthenticationFilter;
import com.voltflow.service.UserDetailsServiceImpl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            UserDetailsServiceImpl userDetailsService,
            @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:80,http://127.0.0.1:5173}")
            String allowedOrigins) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.allowedOrigins = allowedOrigins;
    }

    /**
     * Returns HTTP 401 when authentication is missing or invalid.
     */
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            response.getWriter().write(
                    "{\"error\":\"Authentication required or token expired\"}"
            );
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .cors(cors ->
                cors.configurationSource(corsConfigurationSource())
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .exceptionHandling(exceptions ->
                exceptions.authenticationEntryPoint(authenticationEntryPoint())
            )

            .authorizeHttpRequests(auth -> auth

                // Public authentication and health endpoints
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()

                // Public station and charger information
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/stations/**",
                    "/api/chargers/**"
                ).permitAll()

                // Admin-only endpoints
                .requestMatchers("/api/admin/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")

                // Only admins can modify stations and chargers
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/stations/**",
                    "/api/chargers/**"
                ).hasAnyRole("ADMIN", "SUPER_ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/stations/**",
                    "/api/chargers/**"
                ).hasAnyRole("ADMIN", "SUPER_ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/stations/**",
                    "/api/chargers/**"
                ).hasAnyRole("ADMIN", "SUPER_ADMIN")

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )

            .authenticationProvider(daoAuthenticationProvider())

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {

        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList());

        config.setAllowedOrigins(origins);

        config.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        config.setAllowedHeaders(
                List.of(
                    "Authorization",
                    "Content-Type",
                    "Accept",
                    "X-Requested-With",
                    "Origin"
                )
        );

        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}