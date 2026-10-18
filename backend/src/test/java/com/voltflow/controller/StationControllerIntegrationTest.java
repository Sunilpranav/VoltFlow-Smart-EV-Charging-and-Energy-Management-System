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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class StationControllerIntegrationTest {

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
    void getStations_publicAccess_returns200() throws Exception {
        mockMvc.perform(get("/api/stations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").isNotEmpty())
                .andExpect(jsonPath("$[0].name").isNotEmpty())
                .andExpect(jsonPath("$[0].totalChargers").isNumber());
    }

    @Test
    void getStations_withSearchFilter_returnsMatchingStations() throws Exception {
        mockMvc.perform(get("/api/stations").param("search", "Express"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Downtown Express Charging"));
    }

    @Test
    void getStations_withStatusFilter_returnsActiveOnly() throws Exception {
        mockMvc.perform(get("/api/stations").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void getStationById_returnsFullDetailsWithChargers() throws Exception {
        mockMvc.perform(get("/api/stations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("VoltFlow Central Hub"))
                .andExpect(jsonPath("$.chargers").isArray())
                .andExpect(jsonPath("$.chargers[0].chargerCode").value("VF-C101"))
                .andExpect(jsonPath("$.chargers[0].connectorType").value("CCS2"));
    }

    @Test
    void getStationById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/stations/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Charging station not found with id: 99999"));
    }

    @Test
    void getStationChargers_returnsChargerList() throws Exception {
        mockMvc.perform(get("/api/stations/1/chargers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].chargerCode").isNotEmpty());
    }

    @Test
    void getChargers_filteredByConnectorType_returnsMatching() throws Exception {
        mockMvc.perform(get("/api/chargers").param("connectorType", "CCS2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].connectorType").value("CCS2"));
    }

    @Test
    void createStation_asCustomer_returns403() throws Exception {
        // Customers are strictly forbidden from mutating stations
        mockMvc.perform(post("/api/stations")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Fake Station\"}"))
                .andExpect(status().isForbidden());
    }
}
