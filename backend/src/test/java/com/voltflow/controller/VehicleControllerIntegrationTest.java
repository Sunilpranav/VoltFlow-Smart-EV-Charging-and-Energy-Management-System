package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.LoginRequest;
import com.voltflow.dto.RegisterRequest;
import com.voltflow.dto.VehicleRequest;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class VehicleControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    String user1Token;
    String user2Token;
    Long createdVehicleId;

    @BeforeAll
    void setupTokens() throws Exception {
        // Register User 1
        var reg1 = new RegisterRequest("EV Owner 1", "evowner1@voltflow.test", "Password123!", "+1000000001");
        MvcResult res1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg1)))
                .andExpect(status().isOk())
                .andReturn();
        user1Token = objectMapper.readTree(res1.getResponse().getContentAsString()).get("token").asText();

        // Login User 2 (seeded in TestDataInitializer)
        var login2 = new LoginRequest("customer2@voltflow.test", "Password123!");
        MvcResult res2 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login2)))
                .andExpect(status().isOk())
                .andReturn();
        user2Token = objectMapper.readTree(res2.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(1)
    void getVehicles_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(2)
    void createVehicle_withValidData_returns201AndVehicle() throws Exception {
        var req = new VehicleRequest("Tesla", "Model 3", "ev-123-ca", BigDecimal.valueOf(75.0), "CCS2", 2023);

        MvcResult result = mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.make").value("Tesla"))
                .andExpect(jsonPath("$.model").value("Model 3"))
                .andExpect(jsonPath("$.registrationNumber").value("EV-123-CA")) // Normalized to uppercase
                .andExpect(jsonPath("$.batteryCapacityKwh").value(75.0))
                .andExpect(jsonPath("$.connectorType").value("CCS2"))
                .andExpect(jsonPath("$.modelYear").value(2023))
                .andExpect(jsonPath("$.ownerEmail").value("evowner1@voltflow.test"))
                .andReturn();

        createdVehicleId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdVehicleId).isNotNull();
    }

    @Test
    @Order(3)
    void createVehicle_duplicateNormalizedRegistration_returns400() throws Exception {
        // Attempt with spaces and lowercase, should normalize to EV-123-CA and conflict
        var req = new VehicleRequest("Tesla", "Model Y", " ev - 123 - ca ", BigDecimal.valueOf(82.0), "CCS2", 2024);

        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Registration number already registered: EV-123-CA"));
    }

    @Test
    @Order(4)
    void createVehicle_invalidData_returns400() throws Exception {
        // Missing make, non-positive battery capacity
        var req = new VehicleRequest("", "Model Y", "VALID-1", BigDecimal.valueOf(-10.0), "CCS2", 2024);

        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(5)
    void getVehicles_asOwner_returnsListOfOwnedVehicles() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(createdVehicleId))
                .andExpect(jsonPath("$[0].registrationNumber").value("EV-123-CA"));
    }

    @Test
    @Order(6)
    void getVehicleById_asOwner_returnsVehicle() throws Exception {
        mockMvc.perform(get("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdVehicleId))
                .andExpect(jsonPath("$.make").value("Tesla"));
    }

    @Test
    @Order(7)
    void getVehicleById_asDifferentCustomer_returns403() throws Exception {
        // User 2 tries to access User 1's vehicle
        mockMvc.perform(get("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(8)
    void updateVehicle_asOwner_returnsUpdatedVehicle() throws Exception {
        var req = new VehicleRequest("Tesla", "Model 3 Performance", "EV-123-CA", BigDecimal.valueOf(82.0), "CCS2", 2024);

        mockMvc.perform(put("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.model").value("Model 3 Performance"))
                .andExpect(jsonPath("$.batteryCapacityKwh").value(82.0))
                .andExpect(jsonPath("$.modelYear").value(2024));
    }

    @Test
    @Order(9)
    void updateVehicle_asDifferentCustomer_returns403() throws Exception {
        var req = new VehicleRequest("Hacked Make", "Hacked Model", "HACK-999", BigDecimal.valueOf(100.0), "CCS2", 2025);

        mockMvc.perform(put("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(10)
    void deleteVehicle_asDifferentCustomer_returns403() throws Exception {
        mockMvc.perform(delete("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    void deleteVehicle_asOwner_returns204() throws Exception {
        mockMvc.perform(delete("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(12)
    void getVehicleById_afterDeleted_returns404() throws Exception {
        mockMvc.perform(get("/api/vehicles/" + createdVehicleId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound());
    }
}