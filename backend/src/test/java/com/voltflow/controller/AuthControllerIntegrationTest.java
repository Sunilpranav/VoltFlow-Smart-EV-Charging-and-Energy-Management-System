package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.LoginRequest;
import com.voltflow.dto.RegisterRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired com.voltflow.repository.UserRepository userRepository;

    // Shared token across ordered tests
    static String jwtToken;

    // ── Registration ───────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void register_withValidData_returns200AndToken() throws Exception {
        var req = new RegisterRequest("Alice Smith", "alice@voltflow.test", "Password123!", "+1234567890");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("alice@voltflow.test"))
                .andExpect(jsonPath("$.fullName").value("Alice Smith"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        jwtToken = objectMapper.readTree(body).get("token").asText();
        assertThat(jwtToken).isNotBlank();
    }

    @Test
    @Order(2)
    void register_duplicateEmail_returns400() throws Exception {
        var req = new RegisterRequest("Alice Duplicate", "alice@voltflow.test", "Password123!", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered: alice@voltflow.test"));
    }

    @Test
    @Order(3)
    void register_invalidEmail_returns400() throws Exception {
        var req = new RegisterRequest("Bob", "not-an-email", "Password123!", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    void register_shortPassword_returns400() throws Exception {
        var req = new RegisterRequest("Bob", "bob@voltflow.test", "short", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Test
    @Order(5)
    void login_withCorrectCredentials_returns200AndToken() throws Exception {
        var req = new LoginRequest("alice@voltflow.test", "Password123!");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("alice@voltflow.test"))
                .andReturn();

        // Update the shared token with a fresh login token
        String body = result.getResponse().getContentAsString();
        jwtToken = objectMapper.readTree(body).get("token").asText();
    }

    @Test
    @Order(6)
    void login_withWrongPassword_returns401() throws Exception {
        var req = new LoginRequest("alice@voltflow.test", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
    void login_withUnknownEmail_returns401() throws Exception {
        var req = new LoginRequest("nobody@voltflow.test", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ── JWT protection ────────────────────────────────────────────────────────

    @Test
    @Order(8)
    void protectedEndpoint_withoutToken_returns403() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(9)
    void protectedEndpoint_withValidToken_returns200OrNotFound() throws Exception {
        // /api/vehicles doesn't exist yet but a valid token must not get 403
        int status = mockMvc.perform(get("/api/vehicles")
                        .header("Authorization", "Bearer " + jwtToken))
                .andReturn().getResponse().getStatus();

        assertThat(status).isNotEqualTo(403);
        assertThat(status).isNotEqualTo(401);
    }

    @Test
    @Order(10)
    void protectedEndpoint_withTamperedToken_returns403() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .header("Authorization", "Bearer " + jwtToken + "tampered"))
                .andExpect(status().isForbidden());
    }

    // ── Actuator ──────────────────────────────────────────────────────────────

    @Test
    @Order(11)
    void actuatorHealth_isPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    // ── Admin authorization ───────────────────────────────────────────────────

    @Test
    @Order(12)
    void adminEndpoint_withCustomerToken_returns403() throws Exception {
        // CUSTOMER should not access admin-only paths
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isForbidden());
    }

    // ── BCrypt Hashing Verification ───────────────────────────────────────────

    @Test
    @Order(13)
    void password_isHashedWithBCrypt() {
        var user = userRepository.findByEmail("alice@voltflow.test").orElseThrow();
        assertThat(user.getPasswordHash()).startsWith("$2a$");
        assertThat(user.getPasswordHash()).isNotEqualTo("Password123!");
    }

    // ── Profile /me Endpoint ──────────────────────────────────────────────────

    @Test
    @Order(14)
    void getMe_withValidCustomerToken_returns200AndProfile() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@voltflow.test"))
                .andExpect(jsonPath("$.fullName").value("Alice Smith"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @Order(15)
    void getMe_withoutToken_returns403() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    // ── Admin Access Verification ─────────────────────────────────────────────

    @Test
    @Order(16)
    void adminEndpoint_withAdminToken_returns200() throws Exception {
        var req = new LoginRequest("admin@voltflow.test", "AdminPass123!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        String adminToken = objectMapper.readTree(body).get("token").asText();

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }
}
