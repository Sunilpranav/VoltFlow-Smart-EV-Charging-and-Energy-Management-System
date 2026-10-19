package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.LoginRequest;
import com.voltflow.dto.RegisterRequest;
import com.voltflow.dto.StartSessionRequest;
import com.voltflow.entity.Charger;
import com.voltflow.entity.Station;
import com.voltflow.entity.Vehicle;
import com.voltflow.repository.ChargerRepository;
import com.voltflow.repository.StationRepository;
import com.voltflow.repository.UserRepository;
import com.voltflow.repository.VehicleRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChargingSessionControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired ChargerRepository chargerRepository;
    @Autowired StationRepository stationRepository;
    @Autowired UserRepository userRepository;

    String customer1Token;
    String customer2Token;

    Long customer1VehicleId;
    Long customer2VehicleId;

    Long availableCcs2ChargerId;
    Long occupiedType2ChargerId;

    Station testStation;

    Long activeSessionId;

    @BeforeAll
    void setupData() throws Exception {
        // Register Customer 1
        var reg1 = new RegisterRequest("Session Tester 1", "sessiontest1@voltflow.test", "Password123!", "+15550001");
        MvcResult res1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg1)))
                .andExpect(status().isOk())
                .andReturn();
        customer1Token = objectMapper.readTree(res1.getResponse().getContentAsString()).get("token").asText();

        // Create vehicle for Customer 1 (CCS2)
        var user1 = userRepository.findByEmail("sessiontest1@voltflow.test").orElseThrow();
        Vehicle v1 = vehicleRepository.save(Vehicle.builder()
                .owner(user1)
                .make("Tesla")
                .model("Model 3")
                .registrationNumber("SESS-EV-1")
                .batteryCapacityKwh(BigDecimal.valueOf(75.0))
                .connectorType("CCS2")
                .modelYear(2023)
                .build());
        customer1VehicleId = v1.getId();

        // Customer 2 Token (from TestDataInitializer)
        var login2 = new LoginRequest("customer2@voltflow.test", "Password123!");
        MvcResult res2 = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login2)))
                .andExpect(status().isOk())
                .andReturn();
        customer2Token = objectMapper.readTree(res2.getResponse().getContentAsString()).get("token").asText();

        var user2 = userRepository.findByEmail("customer2@voltflow.test").orElseThrow();
        var v2 = vehicleRepository.findByOwnerId(user2.getId()).get(0);
        customer2VehicleId = v2.getId();

        // Dedicated station and chargers: this test must not depend on the shared seed data
        // or on sessions/chargers left in a different state by other test classes.
        testStation = stationRepository.save(Station.builder()
                .name("Session Test Station " + UUID.randomUUID().toString().substring(0, 6))
                .address("1 Test Way, Metro City")
                .latitude(37.7000)
                .longitude(-122.4000)
                .status("ACTIVE")
                .build());
        availableCcs2ChargerId = newCharger("CCS2").getId();
        occupiedType2ChargerId = newCharger("Type 2").getId();
    }

    private Charger newCharger(String connectorType) {
        return chargerRepository.save(Charger.builder()
                .station(testStation)
                .chargerCode("ST-" + UUID.randomUUID().toString().substring(0, 8))
                .connectorType(connectorType)
                .maxPowerKw(BigDecimal.valueOf(50.0))
                .status("AVAILABLE")
                .build());
    }

    @Test
    @Order(1)
    void startSession_unauthenticated_returns401() throws Exception {
        var req = new StartSessionRequest(customer1VehicleId, availableCcs2ChargerId);
        mockMvc.perform(post("/api/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(2)
    void startSession_invalidVehicleOwnership_returns403() throws Exception {
        // Customer 1 tries to use Customer 2's vehicle
        var req = new StartSessionRequest(customer2VehicleId, availableCcs2ChargerId);
        mockMvc.perform(post("/api/sessions/start")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(3)
    void startSession_connectorIncompatibility_returns400() throws Exception {
        // Customer 1 has CCS2 vehicle, tries to charge on Type 2 charger
        var req = new StartSessionRequest(customer1VehicleId, occupiedType2ChargerId);
        mockMvc.perform(post("/api/sessions/start")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Connector mismatch")));
    }

    @Test
    @Order(4)
    void startSession_withValidData_returns201AndCharging() throws Exception {
        var req = new StartSessionRequest(customer1VehicleId, availableCcs2ChargerId);
        MvcResult res = mockMvc.perform(post("/api/sessions/start")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("CHARGING"))
                .andExpect(jsonPath("$.customerEmail").value("sessiontest1@voltflow.test"))
                .andExpect(jsonPath("$.vehicleRegistrationNumber").value("SESS-EV-1"))
                .andExpect(jsonPath("$.tariffPerKwh").isNumber())
                .andReturn();

        activeSessionId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // Verify charger is now marked OCCUPIED
        Charger charger = chargerRepository.findById(availableCcs2ChargerId).orElseThrow();
        assertThat(charger.getStatus()).isEqualTo("OCCUPIED");
    }

    @Test
    @Order(5)
    void startSession_chargerAlreadyInUse_returns400() throws Exception {
        // Try starting another session on the same charger that is now in use
        var req = new StartSessionRequest(customer1VehicleId, availableCcs2ChargerId);
        mockMvc.perform(post("/api/sessions/start")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("currently in use")));
    }

    @Test
    @Order(6)
    void getSessions_asOwner_returnsSessionList() throws Exception {
        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(activeSessionId))
                .andExpect(jsonPath("$[0].status").value("CHARGING"));
    }

    @Test
    @Order(7)
    void getSessionById_asOwner_returnsSession() throws Exception {
        mockMvc.perform(get("/api/sessions/" + activeSessionId)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeSessionId))
                .andExpect(jsonPath("$.status").value("CHARGING"));
    }

    @Test
    @Order(8)
    void getSessionById_asDifferentCustomer_returns403() throws Exception {
        // Customer 2 tries to access Customer 1's session
        mockMvc.perform(get("/api/sessions/" + activeSessionId)
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(9)
    void stopSession_asDifferentCustomer_returns403() throws Exception {
        // Customer 2 tries to stop Customer 1's session
        mockMvc.perform(post("/api/sessions/" + activeSessionId + "/stop")
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(10)
    void stopSession_asOwner_returnsCompletedSessionWithBilling() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/sessions/" + activeSessionId + "/stop")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeSessionId))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.stopTime").isNotEmpty())
                .andExpect(jsonPath("$.energyConsumedKwh").isNumber())
                .andExpect(jsonPath("$.totalCost").isNumber())
                .andReturn();

        // Check charger is freed back to AVAILABLE
        Charger charger = chargerRepository.findById(availableCcs2ChargerId).orElseThrow();
        assertThat(charger.getStatus()).isEqualTo("AVAILABLE");

        // Verify calculation: 2.5000 kWh * $0.3500/kWh = $0.88
        BigDecimal energy = new BigDecimal(objectMapper.readTree(res.getResponse().getContentAsString()).get("energyConsumedKwh").asText());
        BigDecimal cost = new BigDecimal(objectMapper.readTree(res.getResponse().getContentAsString()).get("totalCost").asText());
        assertThat(energy).isGreaterThan(BigDecimal.ZERO);
        assertThat(cost).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @Order(11)
    void stopSession_repeatedCall_isIdempotent() throws Exception {
        // Repeated stop on already COMPLETED session returns existing result and does not alter cost
        MvcResult res1 = mockMvc.perform(get("/api/sessions/" + activeSessionId)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andReturn();
        String costBefore = objectMapper.readTree(res1.getResponse().getContentAsString()).get("totalCost").asText();

        MvcResult res2 = mockMvc.perform(post("/api/sessions/" + activeSessionId + "/stop")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andReturn();
        String costAfter = objectMapper.readTree(res2.getResponse().getContentAsString()).get("totalCost").asText();

        assertThat(costAfter).isEqualTo(costBefore);
    }

    @Test
    @Order(12)
    void getSessionSummary_returnsDetailedReceipt() throws Exception {
        mockMvc.perform(get("/api/sessions/" + activeSessionId + "/summary")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(activeSessionId))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.durationFormatted").isNotEmpty())
                .andExpect(jsonPath("$.energyConsumedKwh").isNumber())
                .andExpect(jsonPath("$.totalCost").isNumber())
                .andExpect(jsonPath("$.simulationNote").isNotEmpty());
    }

    @Test
    @Order(13)
    void stopSession_whenChargerMarkedForMaintenance_preservesMaintenanceStatus() throws Exception {
        Charger freshCharger = newCharger("CCS2");

        var startReq = new StartSessionRequest(customer1VehicleId, freshCharger.getId());
        MvcResult startRes = mockMvc.perform(post("/api/sessions/start")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long newSessionId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("id").asLong();

        // Charger is marked as MAINTENANCE while charging session is active
        freshCharger.setStatus("MAINTENANCE");
        chargerRepository.save(freshCharger);

        // Stop session
        mockMvc.perform(post("/api/sessions/" + newSessionId + "/stop")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Charger must remain in MAINTENANCE status
        Charger reloadedCharger = chargerRepository.findById(freshCharger.getId()).orElseThrow();
        assertThat(reloadedCharger.getStatus()).isEqualTo("MAINTENANCE");
    }
}