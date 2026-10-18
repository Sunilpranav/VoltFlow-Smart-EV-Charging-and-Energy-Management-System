package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.*;
import com.voltflow.entity.*;
import com.voltflow.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive integration tests for Phase 6B: Admin Business Operations.
 * Tests stations, chargers, tariffs, prepaid plans, maintenance workflows,
 * admin refunds with pessimistic wallet locking & idempotency, and audit logging.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminBusinessOperationsIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Autowired StationRepository stationRepository;
    @Autowired ChargerRepository chargerRepository;
    @Autowired TariffRepository tariffRepository;
    @Autowired PrepaidPlanRepository planRepository;
    @Autowired MaintenanceRecordRepository maintenanceRepository;
    @Autowired ChargingSessionRepository sessionRepository;
    @Autowired WalletRepository walletRepository;
    @Autowired WalletTransactionRepository transactionRepository;
    @Autowired UserRepository userRepository;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired AuditLogRepository auditLogRepository;

    static String adminToken;
    static String customerToken;

    static Long createdStationId;
    static Long createdChargerId;
    static Long createdTariffId;
    static Long createdPlanId;
    static Long createdMaintenanceId;
    static Long refundSessionId;
    static Long customerWalletId;
    static BigDecimal preRefundBalance;

    @Test
    @Order(1)
    void setup_tokens() throws Exception {
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin@voltflow.test", "AdminPass123!"))))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString()).get("token").asText();

        MvcResult custResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("customer2@voltflow.test", "Password123!"))))
                .andExpect(status().isOk())
                .andReturn();
        customerToken = objectMapper.readTree(custResult.getResponse().getContentAsString()).get("token").asText();

        assertThat(adminToken).isNotBlank();
        assertThat(customerToken).isNotBlank();
    }

    // ── 1. Station Management ──────────────────────────────────────────────────

    @Test
    @Order(10)
    void station_createAsAdmin_returns201AndAudits() throws Exception {
        CreateStationRequest req = new CreateStationRequest(
                "Bay Area Tech Park Station",
                "999 Silicon Ave, San Jose",
                37.3382,
                -121.8863,
                "ACTIVE"
        );

        MvcResult result = mockMvc.perform(post("/api/admin/stations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Bay Area Tech Park Station"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        createdStationId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdStationId).isNotNull();

        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "CREATE_STATION".equals(a.getAction()) && createdStationId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(11)
    void station_createAsCustomer_returns403() throws Exception {
        CreateStationRequest req = new CreateStationRequest(
                "Unauthorized Station",
                "123 Fake Street",
                37.0, -122.0, "ACTIVE"
        );

        mockMvc.perform(post("/api/admin/stations")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void station_updateAsAdmin_returns200() throws Exception {
        UpdateStationRequest req = new UpdateStationRequest(
                "Bay Area Tech Park SuperStation",
                "999 Silicon Ave, Suite 100, San Jose",
                37.3385,
                -121.8865,
                "ACTIVE"
        );

        mockMvc.perform(put("/api/admin/stations/" + createdStationId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bay Area Tech Park SuperStation"));
    }

    @Test
    @Order(13)
    void station_deactivateIdleStation_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/stations/" + createdStationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        Station station = stationRepository.findById(createdStationId).orElseThrow();
        assertThat(station.getStatus()).isEqualTo("INACTIVE");
    }

    @Test
    @Order(14)
    void station_deactivateWithActiveSession_returns400() throws Exception {
        // Find or create an active charging session on station 1
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        ChargingSession activeSession = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("CHARGING")
                .startTime(LocalDateTime.now())
                .startMeterKwh(BigDecimal.valueOf(100.0))
                .tariffPerKwh(BigDecimal.valueOf(0.35))
                .paymentStatus("UNPAID")
                .build());

        // Deactivating station while session is CHARGING must fail
        mockMvc.perform(delete("/api/admin/stations/" + station.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("active charging sessions")));

        // Clean up test active session
        sessionRepository.delete(activeSession);
    }

    // ── 2. Charger Management ──────────────────────────────────────────────────

    @Test
    @Order(20)
    void charger_createAsAdmin_returns201AndAudits() throws Exception {
        Station station = stationRepository.findById(createdStationId).orElseThrow();
        CreateChargerRequest req = new CreateChargerRequest(
                station.getId(),
                "VF-EXP-900",
                "CCS2",
                BigDecimal.valueOf(250.0),
                "AVAILABLE"
        );

        MvcResult result = mockMvc.perform(post("/api/admin/chargers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chargerCode").value("VF-EXP-900"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn();

        createdChargerId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdChargerId).isNotNull();

        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "CREATE_CHARGER".equals(a.getAction()) && createdChargerId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(21)
    void charger_createDuplicateCode_returns400() throws Exception {
        Station station = stationRepository.findById(createdStationId).orElseThrow();
        CreateChargerRequest req = new CreateChargerRequest(
                station.getId(),
                "VF-EXP-900", // duplicate
                "CCS2",
                BigDecimal.valueOf(150.0),
                "AVAILABLE"
        );

        mockMvc.perform(post("/api/admin/chargers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(22)
    void charger_updateAsAdmin_returns200() throws Exception {
        UpdateChargerRequest req = new UpdateChargerRequest(
                "VF-EXP-900",
                "CCS2",
                BigDecimal.valueOf(300.0),
                "AVAILABLE"
        );

        mockMvc.perform(put("/api/admin/chargers/" + createdChargerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxPowerKw").value(300.0));
    }

    @Test
    @Order(23)
    void charger_deactivateAsAdmin_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/chargers/" + createdChargerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        Charger charger = chargerRepository.findById(createdChargerId).orElseThrow();
        assertThat(charger.getStatus()).isEqualTo("OUT_OF_ORDER");
    }

    // ── 3. Tariff Management ───────────────────────────────────────────────────

    @Test
    @Order(30)
    void tariff_listAsAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(31)
    void tariff_listAsCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(32)
    void tariff_createAsAdmin_returns201AndAudits() throws Exception {
        CreateTariffRequest req = new CreateTariffRequest(
                "ULTRA_FAST_GB_TARIFF",
                BigDecimal.valueOf(0.4200),
                "GBT",
                "USD",
                true
        );

        MvcResult result = mockMvc.perform(post("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("ULTRA_FAST_GB_TARIFF"))
                .andExpect(jsonPath("$.ratePerKwh").value(0.42))
                .andReturn();

        createdTariffId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdTariffId).isNotNull();

        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "CREATE_TARIFF".equals(a.getAction()) && createdTariffId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(33)
    void tariff_createDuplicateName_returns400() throws Exception {
        CreateTariffRequest req = new CreateTariffRequest(
                "ULTRA_FAST_GB_TARIFF",
                BigDecimal.valueOf(0.50),
                "GBT",
                "USD",
                true
        );

        mockMvc.perform(post("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(34)
    void tariff_updateAsAdmin_returns200() throws Exception {
        UpdateTariffRequest req = new UpdateTariffRequest(
                "ULTRA_FAST_GB_TARIFF",
                BigDecimal.valueOf(0.4500),
                "GBT",
                "USD",
                true
        );

        mockMvc.perform(put("/api/admin/tariffs/" + createdTariffId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ratePerKwh").value(0.45));
    }

    @Test
    @Order(35)
    void tariff_deleteAsAdmin_softDeactivatesTariff() throws Exception {
        mockMvc.perform(delete("/api/admin/tariffs/" + createdTariffId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        Tariff tariff = tariffRepository.findById(createdTariffId).orElseThrow();
        assertThat(tariff.getActive()).isFalse();
    }

    // ── 4. Prepaid Plan Management ─────────────────────────────────────────────

    @Test
    @Order(40)
    void plan_listAsAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/plans")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(41)
    void plan_createAsAdmin_returns201AndAudits() throws Exception {
        CreatePlanRequest req = new CreatePlanRequest(
                "Solar Commuter Pro",
                "Ideal for daily commuters utilizing green solar energy.",
                BigDecimal.valueOf(75.00),
                BigDecimal.valueOf(90.00),
                BigDecimal.valueOf(250.00),
                45,
                "USD",
                true
        );

        MvcResult result = mockMvc.perform(post("/api/admin/plans")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Solar Commuter Pro"))
                .andReturn();

        createdPlanId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdPlanId).isNotNull();

        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "CREATE_PLAN".equals(a.getAction()) && createdPlanId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(42)
    void plan_updateAsAdmin_returns200() throws Exception {
        UpdatePlanRequest req = new UpdatePlanRequest(
                "Solar Commuter Pro Max",
                "Updated description with more credits.",
                BigDecimal.valueOf(80.00),
                BigDecimal.valueOf(100.00),
                BigDecimal.valueOf(280.00),
                60,
                "USD",
                true
        );

        mockMvc.perform(put("/api/admin/plans/" + createdPlanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Solar Commuter Pro Max"))
                .andExpect(jsonPath("$.price").value(80.00));
    }

    @Test
    @Order(43)
    void plan_deactivateAndReactivate_returns204() throws Exception {
        mockMvc.perform(patch("/api/admin/plans/" + createdPlanId + "/status?active=false")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        PrepaidPlan plan = planRepository.findById(createdPlanId).orElseThrow();
        assertThat(plan.getActive()).isFalse();

        mockMvc.perform(patch("/api/admin/plans/" + createdPlanId + "/status?active=true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        plan = planRepository.findById(createdPlanId).orElseThrow();
        assertThat(plan.getActive()).isTrue();
    }

    // ── 5. Maintenance Workflows ───────────────────────────────────────────────

    @Test
    @Order(50)
    void maintenance_listAsAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/maintenance")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(51)
    void maintenance_createHighSeverity_setsChargerToMaintenance() throws Exception {
        // Use our test charger and reset its status to AVAILABLE
        Charger availableCharger = chargerRepository.findById(createdChargerId).orElseThrow();
        availableCharger.setStatus("AVAILABLE");
        chargerRepository.save(availableCharger);

        CreateMaintenanceRequest req = new CreateMaintenanceRequest(
                availableCharger.getId(),
                "ELECTRICAL",
                "Overvoltage spike observed during peak load",
                "HIGH",
                "admin@voltflow.test",
                "Technician Dave"
        );

        MvcResult result = mockMvc.perform(post("/api/admin/maintenance")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("REPORTED"))
                .andExpect(jsonPath("$.severity").value("HIGH"))
                .andReturn();

        createdMaintenanceId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertThat(createdMaintenanceId).isNotNull();

        // Verify charger was automatically marked as MAINTENANCE
        Charger updatedCharger = chargerRepository.findById(availableCharger.getId()).orElseThrow();
        assertThat(updatedCharger.getStatus()).isEqualTo("MAINTENANCE");

        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "CREATE_MAINTENANCE".equals(a.getAction()) && createdMaintenanceId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(52)
    void maintenance_updateToInProgress_returns200() throws Exception {
        UpdateMaintenanceRequest req = new UpdateMaintenanceRequest(
                "ELECTRICAL",
                "Overvoltage spike observed during peak load - diagnostic tools connected",
                "HIGH",
                "IN_PROGRESS",
                "Technician Dave",
                null
        );

        mockMvc.perform(put("/api/admin/maintenance/" + createdMaintenanceId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @Order(53)
    void maintenance_resolveRecord_restoresChargerToAvailable() throws Exception {
        MaintenanceRecord record = maintenanceRepository.findById(createdMaintenanceId).orElseThrow();
        Long chargerId = record.getCharger().getId();

        UpdateMaintenanceRequest req = new UpdateMaintenanceRequest(
                "ELECTRICAL",
                "Overvoltage spike resolved by replacing faulty capacitor module",
                "HIGH",
                "RESOLVED",
                "Technician Dave",
                "Capacitor replaced and load-tested for 30 minutes with zero faults."
        );

        mockMvc.perform(put("/api/admin/maintenance/" + createdMaintenanceId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // Verify charger returned to AVAILABLE
        Charger charger = chargerRepository.findById(chargerId).orElseThrow();
        assertThat(charger.getStatus()).isEqualTo("AVAILABLE");
    }

    @Test
    @Order(54)
    void maintenance_modifyResolvedRecord_returns400() throws Exception {
        UpdateMaintenanceRequest req = new UpdateMaintenanceRequest(
                "ELECTRICAL",
                "Attempt re-opening",
                "HIGH",
                "IN_PROGRESS",
                "Technician Dave",
                null
        );

        mockMvc.perform(put("/api/admin/maintenance/" + createdMaintenanceId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("already RESOLVED")));
    }

    // ── 6. Admin Refund Operations ─────────────────────────────────────────────

    @Test
    @Order(60)
    void refund_setupPaidSessionAndWallet() {
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        Wallet wallet = walletRepository.findByUser(customer).orElseGet(() ->
                walletRepository.save(Wallet.builder()
                        .user(customer)
                        .balance(BigDecimal.valueOf(50.00))
                        .currency("USD")
                        .build())
        );
        customerWalletId = wallet.getId();
        preRefundBalance = wallet.getBalance();

        ChargingSession session = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("COMPLETED")
                .startTime(LocalDateTime.now().minusHours(1))
                .stopTime(LocalDateTime.now().minusMinutes(30))
                .startMeterKwh(BigDecimal.valueOf(100.0))
                .stopMeterKwh(BigDecimal.valueOf(125.0))
                .energyConsumedKwh(BigDecimal.valueOf(25.0))
                .tariffPerKwh(BigDecimal.valueOf(0.40))
                .totalCost(BigDecimal.valueOf(10.00))
                .paymentStatus("PAID")
                .build());

        refundSessionId = session.getId();
        assertThat(refundSessionId).isNotNull();
    }

    @Test
    @Order(61)
    void refund_asCustomer_returns403() throws Exception {
        AdminRefundRequest req = new AdminRefundRequest("Customer attempting admin refund");

        mockMvc.perform(post("/api/admin/sessions/" + refundSessionId + "/refund")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(62)
    void refund_asAdmin_creditsWalletAndCreatesLedgerAndAudit() throws Exception {
        AdminRefundRequest req = new AdminRefundRequest("Station connector dislodged prematurely during charging");

        mockMvc.perform(post("/api/admin/sessions/" + refundSessionId + "/refund")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.amountPaid").value(10.00));

        // Verify session payment status updated
        ChargingSession session = sessionRepository.findById(refundSessionId).orElseThrow();
        assertThat(session.getPaymentStatus()).isEqualTo("REFUNDED");

        // Verify wallet balance was credited by $10.00
        Wallet wallet = walletRepository.findById(customerWalletId).orElseThrow();
        assertThat(wallet.getBalance()).isEqualByComparingTo(preRefundBalance.add(BigDecimal.valueOf(10.00)));

        // Verify ledger transaction was saved
        String expectedKey = "ADMIN-REFUND-SESSION-" + refundSessionId;
        WalletTransaction tx = transactionRepository.findByIdempotencyKey(expectedKey).orElseThrow();
        assertThat(tx.getTransactionType()).isEqualTo("REFUND");
        assertThat(tx.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(10.00));
        assertThat(tx.getDescription()).contains("Station connector dislodged prematurely");

        // Verify audit log entry was created
        assertThat(auditLogRepository.findAll().stream()
                .anyMatch(a -> "ADMIN_REFUND".equals(a.getAction()) && refundSessionId.equals(a.getEntityId())))
                .isTrue();
    }

    @Test
    @Order(63)
    void refund_duplicateAttempt_returns400() throws Exception {
        AdminRefundRequest req = new AdminRefundRequest("Second attempt at refund");

        mockMvc.perform(post("/api/admin/sessions/" + refundSessionId + "/refund")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("already been refunded")));
    }

    @Test
    @Order(64)
    void refund_nonexistentSession_returns404() throws Exception {
        AdminRefundRequest req = new AdminRefundRequest("Nonexistent refund");

        mockMvc.perform(post("/api/admin/sessions/999999/refund")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(65)
    void tariff_createInvalidConnectorType_returns400() throws Exception {
        CreateTariffRequest req = new CreateTariffRequest(
                "INVALID_CONNECTOR_TARIFF",
                BigDecimal.valueOf(0.50),
                "NUCLEAR_PLUG",
                "USD",
                true
        );

        mockMvc.perform(post("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Invalid connector type")));
    }

    @Test
    @Order(66)
    void tariff_createInvalidRate_returns400() throws Exception {
        CreateTariffRequest req = new CreateTariffRequest(
                "ZERO_RATE_TARIFF",
                BigDecimal.valueOf(0.00),
                "CCS2",
                "USD",
                true
        );

        mockMvc.perform(post("/api/admin/tariffs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(67)
    void maintenance_inProgressOnActivelyChargingCharger_returns400() throws Exception {
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        // Put charger in CHARGING
        ChargingSession liveSession = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("CHARGING")
                .startTime(LocalDateTime.now())
                .startMeterKwh(BigDecimal.valueOf(50.0))
                .tariffPerKwh(BigDecimal.valueOf(0.35))
                .paymentStatus("UNPAID")
                .build());

        // Create reported maintenance record on this charger
        MaintenanceRecord record = maintenanceRepository.save(MaintenanceRecord.builder()
                .charger(charger)
                .category("HARDWARE")
                .description("Pending cable replacement")
                .severity("MEDIUM")
                .status("REPORTED")
                .reportedBy("admin@voltflow.test")
                .build());

        // Attempting to set to IN_PROGRESS while charger is actively delivering power must fail
        UpdateMaintenanceRequest updateReq = new UpdateMaintenanceRequest(
                "HARDWARE",
                "Starting work immediately",
                "MEDIUM",
                "IN_PROGRESS",
                "Tech Alice",
                null
        );

        mockMvc.perform(put("/api/admin/maintenance/" + record.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("active charging session in progress")));

        // Cleanup
        sessionRepository.delete(liveSession);
        maintenanceRepository.delete(record);
    }

    @Test
    @Order(68)
    void chargingSession_startOnInactiveStation_returns400() throws Exception {
        // Create an inactive station with an available charger
        Station inactiveStation = stationRepository.save(Station.builder()
                .name("Closed Station for Testing")
                .address("101 Inactive Way")
                .latitude(37.5)
                .longitude(-122.2)
                .status("INACTIVE")
                .build());

        Charger chargerAtInactive = chargerRepository.save(Charger.builder()
                .station(inactiveStation)
                .chargerCode("VF-INACTIVE-01")
                .connectorType("CCS2")
                .maxPowerKw(BigDecimal.valueOf(100.0))
                .status("AVAILABLE")
                .build());

        try {
            User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
            Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

            StartSessionRequest startReq = new StartSessionRequest(vehicle.getId(), chargerAtInactive.getId());

            mockMvc.perform(post("/api/sessions/start")
                            .header("Authorization", "Bearer " + customerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(startReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("currently unavailable")));
        } finally {
            chargerRepository.delete(chargerAtInactive);
            stationRepository.delete(inactiveStation);
        }
    }

    @Test
    @Order(69)
    void refund_withCustomAmount_creditsExactAmount() throws Exception {
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        Wallet wallet = walletRepository.findByUser(customer).orElseThrow();
        BigDecimal balanceBefore = wallet.getBalance();

        ChargingSession session = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("COMPLETED")
                .startTime(LocalDateTime.now().minusHours(2))
                .stopTime(LocalDateTime.now().minusHours(1))
                .startMeterKwh(BigDecimal.valueOf(200.0))
                .stopMeterKwh(BigDecimal.valueOf(250.0))
                .energyConsumedKwh(BigDecimal.valueOf(50.0))
                .tariffPerKwh(BigDecimal.valueOf(0.40))
                .totalCost(BigDecimal.valueOf(20.00))
                .paymentStatus("PAID")
                .build());

        // Refund partial amount: $12.50
        AdminRefundRequest req = new AdminRefundRequest(session.getId(), "Partial goodwill refund", BigDecimal.valueOf(12.50));

        mockMvc.perform(post("/api/admin/sessions/" + session.getId() + "/refund")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.amountPaid").value(12.50));

        Wallet updatedWallet = walletRepository.findById(wallet.getId()).orElseThrow();
        assertThat(updatedWallet.getBalance()).isEqualByComparingTo(balanceBefore.add(BigDecimal.valueOf(12.50)));
    }

    @Test
    @Order(70)
    void refund_withExcessiveAmount_returns400() throws Exception {
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        ChargingSession session = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("COMPLETED")
                .startTime(LocalDateTime.now().minusHours(2))
                .stopTime(LocalDateTime.now().minusHours(1))
                .startMeterKwh(BigDecimal.valueOf(100.0))
                .stopMeterKwh(BigDecimal.valueOf(137.5))
                .energyConsumedKwh(BigDecimal.valueOf(37.5))
                .tariffPerKwh(BigDecimal.valueOf(0.40))
                .totalCost(BigDecimal.valueOf(15.00))
                .paymentStatus("PAID")
                .build());

        try {
            // Request refund of $999.00 on a $15.00 session
            AdminRefundRequest req = new AdminRefundRequest(session.getId(), "Excessive amount", BigDecimal.valueOf(999.00));

            mockMvc.perform(post("/api/admin/sessions/" + session.getId() + "/refund")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("cannot exceed session total cost")));
        } finally {
            sessionRepository.delete(session);
        }
    }

    @Test
    @Order(71)
    void refund_unpaidSession_returns400() throws Exception {
        User customer = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findByStationId(station.getId()).get(0);
        Vehicle vehicle = vehicleRepository.findByOwnerId(customer.getId()).get(0);

        ChargingSession session = sessionRepository.save(ChargingSession.builder()
                .customer(customer)
                .vehicle(vehicle)
                .station(station)
                .charger(charger)
                .status("COMPLETED")
                .startTime(LocalDateTime.now().minusHours(2))
                .stopTime(LocalDateTime.now().minusHours(1))
                .startMeterKwh(BigDecimal.valueOf(100.0))
                .stopMeterKwh(BigDecimal.valueOf(125.0))
                .energyConsumedKwh(BigDecimal.valueOf(25.0))
                .tariffPerKwh(BigDecimal.valueOf(0.40))
                .totalCost(BigDecimal.valueOf(10.00))
                .paymentStatus("UNPAID")
                .build());

        try {
            AdminRefundRequest req = new AdminRefundRequest(session.getId(), "Trying to refund unpaid session");

            mockMvc.perform(post("/api/admin/sessions/" + session.getId() + "/refund")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Only PAID sessions can be refunded")));
        } finally {
            sessionRepository.delete(session);
        }
    }
}
