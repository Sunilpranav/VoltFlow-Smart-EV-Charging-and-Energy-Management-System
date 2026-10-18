package com.voltflow.service;

import com.voltflow.dto.AuthResponse;
import com.voltflow.dto.LoginRequest;
import com.voltflow.dto.RegisterRequest;
import com.voltflow.entity.Role;
import com.voltflow.entity.User;
import com.voltflow.repository.RoleRepository;
import com.voltflow.repository.UserRepository;
import com.voltflow.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered: " + request.email());
        }

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role not found. Check DB seed."));

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), "CUSTOMER");
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String role = user.getRoles().stream()
                .map(Role::getName)
                .filter(r -> "SUPER_ADMIN".equals(r) || "ADMIN".equals(r))
                .findFirst()
                .orElseGet(() -> user.getRoles().stream()
                        .map(Role::getName)
                        .findFirst()
                        .orElse("CUSTOMER"));

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), role);
    }

    @Transactional(readOnly = true)
    public com.voltflow.dto.UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        String role = user.getRoles().stream()
                .map(Role::getName)
                .filter(r -> "SUPER_ADMIN".equals(r) || "ADMIN".equals(r))
                .findFirst()
                .orElseGet(() -> user.getRoles().stream()
                        .map(Role::getName)
                        .findFirst()
                        .orElse("CUSTOMER"));

        return new com.voltflow.dto.UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                role
        );
    }
}
