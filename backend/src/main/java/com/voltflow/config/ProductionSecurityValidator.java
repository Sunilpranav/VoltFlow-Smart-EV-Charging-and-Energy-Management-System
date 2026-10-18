package com.voltflow.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Validates that critical security secrets are properly supplied and do not use
 * default development values or placeholders when running with the production profile.
 */
@Component
@Profile("prod")
public class ProductionSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionSecurityValidator.class);

    private static final List<String> INSECURE_JWT_SECRETS = List.of(
            "ChangeMeToAtLeast32CharsLongSecret!",
            "replace_with_secure_random_jwt_secret_min_32_chars",
            "TestSecretKeyForJWTThatIsAtLeast32CharsLong!",
            "secret",
            "admin"
    );

    private static final List<String> INSECURE_DB_PASSWORDS = List.of(
            "secret",
            "root_secret",
            "replace_with_strong_random_user_password_min_16_chars",
            "replace_with_strong_random_root_password_min_16_chars",
            "password",
            "admin"
    );

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${cors.allowed-origins:}")
    private String corsOrigins;

    @PostConstruct
    public void validateProductionSecurity() {
        log.info("Executing Production Security Validation...");

        // 1. Validate JWT Secret
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException(
                    "FATAL SECURITY CONFIGURATION: Production profile active but JWT_SECRET is empty! " +
                    "A cryptographically secure key of at least 32 characters (256 bits) must be provided."
            );
        }

        if (jwtSecret.trim().length() < 32) {
            throw new IllegalStateException(
                    "FATAL SECURITY CONFIGURATION: Production JWT_SECRET is too short (" + jwtSecret.trim().length() + " chars). " +
                    "It must be at least 32 characters long."
            );
        }

        for (String insecure : INSECURE_JWT_SECRETS) {
            if (jwtSecret.trim().equalsIgnoreCase(insecure) || jwtSecret.contains("replace_with")) {
                throw new IllegalStateException(
                        "FATAL SECURITY CONFIGURATION: Production profile active with an insecure default/placeholder JWT_SECRET! " +
                        "Generate a unique secret via 'openssl rand -hex 32'."
                );
            }
        }

        // 2. Validate Database Password
        if (dbPassword != null) {
            for (String insecure : INSECURE_DB_PASSWORDS) {
                if (dbPassword.equalsIgnoreCase(insecure)) {
                    throw new IllegalStateException(
                            "FATAL SECURITY CONFIGURATION: Production profile active with an insecure default/placeholder database password! " +
                            "Please supply a strong random database password via MYSQL_PASSWORD in .env."
                    );
                }
            }
        }

        // 3. Validate CORS
        if (corsOrigins != null && corsOrigins.contains("*")) {
            throw new IllegalStateException(
                    "FATAL SECURITY CONFIGURATION: Wildcard '*' CORS origin is not permitted in production profile!"
            );
        }

        log.info("Production Security Validation PASSED. Secret hygiene and origin constraints verified.");
    }
}
