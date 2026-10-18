package com.voltflow.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionSecurityValidatorTest {

    @Test
    @DisplayName("Throws exception when JWT secret is empty in production")
    void validate_emptyJwtSecret_throws() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "");
        ReflectionTestUtils.setField(validator, "dbPassword", "StrongProdPassword123!");
        ReflectionTestUtils.setField(validator, "corsOrigins", "https://voltflow.example.com");

        assertThatThrownBy(validator::validateProductionSecurity)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET is empty");
    }

    @Test
    @DisplayName("Throws exception when JWT secret is shorter than 32 characters")
    void validate_shortJwtSecret_throws() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "TooShortKey123");
        ReflectionTestUtils.setField(validator, "dbPassword", "StrongProdPassword123!");
        ReflectionTestUtils.setField(validator, "corsOrigins", "https://voltflow.example.com");

        assertThatThrownBy(validator::validateProductionSecurity)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("too short");
    }

    @Test
    @DisplayName("Throws exception when JWT secret uses default development secret")
    void validate_defaultInsecureJwtSecret_throws() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "ChangeMeToAtLeast32CharsLongSecret!");
        ReflectionTestUtils.setField(validator, "dbPassword", "StrongProdPassword123!");
        ReflectionTestUtils.setField(validator, "corsOrigins", "https://voltflow.example.com");

        assertThatThrownBy(validator::validateProductionSecurity)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("insecure default/placeholder JWT_SECRET");
    }

    @Test
    @DisplayName("Throws exception when database password uses development default 'secret'")
    void validate_defaultDbPassword_throws() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "AValidCryptographicallySecureKeyOver32CharsLong!");
        ReflectionTestUtils.setField(validator, "dbPassword", "secret");
        ReflectionTestUtils.setField(validator, "corsOrigins", "https://voltflow.example.com");

        assertThatThrownBy(validator::validateProductionSecurity)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("insecure default/placeholder database password");
    }

    @Test
    @DisplayName("Throws exception when CORS origin uses wildcard in production")
    void validate_wildcardCors_throws() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "AValidCryptographicallySecureKeyOver32CharsLong!");
        ReflectionTestUtils.setField(validator, "dbPassword", "StrongProdPassword123!");
        ReflectionTestUtils.setField(validator, "corsOrigins", "*");

        assertThatThrownBy(validator::validateProductionSecurity)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Wildcard '*' CORS origin is not permitted");
    }

    @Test
    @DisplayName("Passes validation when strong secrets and explicit CORS origins are provided")
    void validate_strongProductionConfiguration_passes() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "d7a4f932e6b185038c92f146a810d7e5b23891467cf8190342b5890214a1c5d9");
        ReflectionTestUtils.setField(validator, "dbPassword", "X9#vL2$pQ8@zW4!mK1&t");
        ReflectionTestUtils.setField(validator, "corsOrigins", "https://voltflow.example.com");

        assertThatCode(validator::validateProductionSecurity).doesNotThrowAnyException();
    }
}
