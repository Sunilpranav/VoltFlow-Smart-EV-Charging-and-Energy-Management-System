package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.LoginRequest;
import com.voltflow.entity.AuditLog;
import com.voltflow.repository.AuditLogRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for admin portal endpoints.
 * Uses the shared H2 in-memory database seeded by TestDataInitializer.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AuditLogRepository auditLogRepository;

    static String adminToken;
    static String customerToken;

    // ── Authentication setup ──────────────────────────────────────────────────

    @Test
    @Order(1)
    void setup_adminLogin_returnsToken() throws Exception {
        var req = new LoginRequest("admin@voltflow.test", "AdminPass123!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        adminToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
        assertThat(adminToken).isNotBlank();
    }

    @Test
    @Order(2)
    void setup_customerLogin_returnsToken() throws Exception {
        var req = new LoginRequest("customer2@voltflow.test", "Password123!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        customerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
        assertThat(customerToken).isNotBlank();
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Test
    @Order(10)
    void dashboard_asAdmin_returns200WithMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.customerCount").isNumber())
                .andExpect(jsonPath("$.stationCount").isNumber())
                .andExpect(jsonPath("$.chargerCount").isNumber())
                .andExpect(jsonPath("$.totalEnergyKwh").isNumber())
                .andExpect(jsonPath("$.paidRevenue").isNumber())
                .andExpect(jsonPath("$.planPurchasesAmount").isNumber());
    }

    @Test
    @Order(11)
    void dashboard_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void dashboard_withoutToken_returns401Or403() throws Exception {
        int status = mockMvc.perform(get("/api/admin/dashboard"))
                .andReturn().getResponse().getStatus();
        assertThat(status).isIn(401, 403);
    }

    // ── Stations ──────────────────────────────────────────────────────────────

    @Test
    @Order(20)
    void stations_asAdmin_returnsList() throws Exception {
        mockMvc.perform(get("/api/admin/stations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(21)
    void stations_withStatusFilter_returnsFilteredList() throws Exception {
        mockMvc.perform(get("/api/admin/stations?status=ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(22)
    void stations_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/stations")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ── Chargers ──────────────────────────────────────────────────────────────

    @Test
    @Order(30)
    void chargers_asAdmin_returnsList() throws Exception {
        mockMvc.perform(get("/api/admin/chargers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(31)
    void chargers_withConnectorTypeFilter_returnsFilteredList() throws Exception {
        mockMvc.perform(get("/api/admin/chargers?connectorType=CCS2")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── Charging sessions ─────────────────────────────────────────────────────

    @Test
    @Order(40)
    void sessions_asAdmin_returnsPageResponse() throws Exception {
        mockMvc.perform(get("/api/admin/sessions?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    @Order(41)
    void sessions_invalidPageSize_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/sessions?page=0&size=0")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(42)
    void sessions_negativePage_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/sessions?page=-1&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(43)
    void sessions_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/sessions")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ── Wallet transactions ───────────────────────────────────────────────────

    @Test
    @Order(50)
    void transactions_asAdmin_returnsPageResponse() throws Exception {
        mockMvc.perform(get("/api/admin/transactions?page=0&size=20")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalPages").isNumber());
    }

    @Test
    @Order(51)
    void transactions_withValidTypeFilter_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/transactions?type=CREDIT&page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(52)
    void transactions_withInvalidType_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/transactions?type=BOGUS")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(53)
    void transactions_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/transactions")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ── Audit log – read endpoints must NOT generate audit rows ───────────────

    @Test
    @Order(60)
    void readOnlyAdminEndpoints_doNotCreateAuditRows() throws Exception {
        long before = auditLogRepository.count();

        mockMvc.perform(get("/api/admin/dashboard")
                .header("Authorization", "Bearer " + adminToken)).andReturn();
        mockMvc.perform(get("/api/admin/stations")
                .header("Authorization", "Bearer " + adminToken)).andReturn();
        mockMvc.perform(get("/api/admin/chargers")
                .header("Authorization", "Bearer " + adminToken)).andReturn();
        mockMvc.perform(get("/api/admin/sessions")
                .header("Authorization", "Bearer " + adminToken)).andReturn();
        mockMvc.perform(get("/api/admin/transactions")
                .header("Authorization", "Bearer " + adminToken)).andReturn();

        long after = auditLogRepository.count();
        assertThat(after)
                .as("Read-only admin requests must not write audit log rows")
                .isEqualTo(before);
    }

    // ── Audit log persistence ─────────────────────────────────────────────────

    @Test
    @Order(70)
    void auditLog_directPersistence_works() {
        AuditLog entry = AuditLog.builder()
                .action("TEST_ACTION")
                .entityType("Station")
                .entityId(1L)
                .details("Integration test audit entry")
                .build();
        AuditLog saved = auditLogRepository.save(entry);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    // ── Pagination – edge cases ───────────────────────────────────────────────

    @Test
    @Order(80)
    void sessions_pageSizeExceedsMax_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/sessions?page=0&size=201")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(81)
    void sessions_defaultPagination_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/sessions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.page").value(0));
    }
}
