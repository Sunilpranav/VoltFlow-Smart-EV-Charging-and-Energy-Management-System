package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.LoginRequest;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CustomerDashboardIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    String customerToken;

    @BeforeAll
    void setupCustomer() throws Exception {
        var login = new LoginRequest("customer2@voltflow.test", "Password123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        customerToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void getDashboard_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/customer/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDashboard_authenticated_returnsRealAggregatedData() throws Exception {
        mockMvc.perform(get("/api/customer/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.email").value("customer2@voltflow.test"))
                .andExpect(jsonPath("$.profile.fullName").value("Second Customer"))
                .andExpect(jsonPath("$.profile.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.vehicleCount").isNumber())
                .andExpect(jsonPath("$.vehicles").isArray())
                .andExpect(jsonPath("$.availableStationCount").isNumber())
                .andExpect(jsonPath("$.recommendedStations").isArray())
                .andExpect(jsonPath("$.recentActivity").isArray())
                .andExpect(jsonPath("$.totalEnergyConsumedKwh").isNumber())
                .andExpect(jsonPath("$.totalSpend").isNumber())
                .andExpect(jsonPath("$.activeSessionCount").isNumber());
    }
}
