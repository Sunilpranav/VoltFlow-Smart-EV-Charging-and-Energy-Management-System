package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.*;
import com.voltflow.entity.*;
import com.voltflow.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WalletControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired WalletRepository walletRepository;
    @Autowired WalletTransactionRepository transactionRepository;
    @Autowired PaymentIntentRepository paymentIntentRepository;
    @Autowired ChargingSessionRepository sessionRepository;
    @Autowired VehicleRepository vehicleRepository;
    @Autowired StationRepository stationRepository;
    @Autowired ChargerRepository chargerRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired com.voltflow.service.WalletService walletService;

    User testUser;
    User otherUser;
    String testUserToken;
    String otherUserToken;

    @BeforeEach
    void setup() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        Role customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();

        testUser = userRepository.save(User.builder()
                .fullName("Wallet Test User")
                .email("wallet_" + uniqueSuffix + "@voltflow.test")
                .passwordHash(passwordEncoder.encode("TestPass123!"))
                .roles(Set.of(customerRole))
                .enabled(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .fullName("Other Wallet User")
                .email("other_" + uniqueSuffix + "@voltflow.test")
                .passwordHash(passwordEncoder.encode("TestPass123!"))
                .roles(Set.of(customerRole))
                .enabled(true)
                .build());

        testUserToken = loginAndGetToken(testUser.getEmail(), "TestPass123!");
        otherUserToken = loginAndGetToken(otherUser.getEmail(), "TestPass123!");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        var login = new LoginRequest(email, password);
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void getWallet_authenticated_returnsWalletAndBalance() throws Exception {
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userEmail").value(testUser.getEmail()))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.balance").isNumber());
    }

    @Test
    void getWallet_unauthorized_returns403() throws Exception {
        mockMvc.perform(get("/api/wallet"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createTopUpIntent_success_returnsPendingIntent() throws Exception {
        var req = new CreateTopUpIntentRequest(BigDecimal.valueOf(50.00), "key_" + UUID.randomUUID(), "Test TopUp");

        mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.intentId").exists())
                .andExpect(jsonPath("$.amount").value(50.00))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.sandboxMode").value(true));
    }

    @Test
    void confirmTopUp_succeed_creditsWalletAndRecordsLedger() throws Exception {
        // 1. Create intent
        var createReq = new CreateTopUpIntentRequest(BigDecimal.valueOf(75.00), "key_" + UUID.randomUUID(), "Topup test");
        MvcResult res = mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        String intentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("intentId").asText();

        // 2. Confirm intent with SUCCEED
        var confirmReq = new ConfirmTopUpRequest(intentId, "SUCCEED");
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));

        // 3. Verify wallet balance increased
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(75.00));

        // 4. Verify transaction ledger entry
        mockMvc.perform(get("/api/wallet/transactions")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].transactionType").value("CREDIT"))
                .andExpect(jsonPath("$[0].amount").value(75.00))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
    }

    @Test
    void confirmTopUp_idempotent_doesNotDoubleCredit() throws Exception {
        var createReq = new CreateTopUpIntentRequest(BigDecimal.valueOf(100.00), "key_" + UUID.randomUUID(), "Idempotent test");
        MvcResult res = mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        String intentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("intentId").asText();

        var confirmReq = new ConfirmTopUpRequest(intentId, "SUCCEED");

        // First confirmation
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));

        // Repeated confirmation
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));

        // Balance should still be 100.00, not 200.00
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(100.00));
    }

    @Test
    void confirmTopUp_simulatedFail_doesNotCreditWallet() throws Exception {
        var createReq = new CreateTopUpIntentRequest(BigDecimal.valueOf(50.00), "key_" + UUID.randomUUID(), "Fail test");
        MvcResult res = mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        String intentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("intentId").asText();

        var confirmReq = new ConfirmTopUpRequest(intentId, "FAIL");
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));

        // Balance should remain 0.00
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(0.00));
    }

    @Test
    void confirmTopUp_unauthorizedUser_returns403() throws Exception {
        var createReq = new CreateTopUpIntentRequest(BigDecimal.valueOf(50.00), "key_" + UUID.randomUUID(), "Cross-user test");
        MvcResult res = mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        String intentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("intentId").asText();

        // otherUser attempts to confirm testUser's intent
        var confirmReq = new ConfirmTopUpRequest(intentId, "SUCCEED");
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + otherUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void payChargingSession_success_debitsWalletAndSetsPaid() throws Exception {
        // Setup: top up wallet with $50
        topUpTestUser(BigDecimal.valueOf(50.00));

        // Create completed session with cost $14.00
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(14.00));

        // Pay session
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.amountPaid").value(14.00))
                .andExpect(jsonPath("$.remainingWalletBalance").value(36.00));

        // Check wallet balance
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(36.00));
    }

    @Test
    void payChargingSession_insufficientFunds_returns400() throws Exception {
        // Wallet has $5.00
        topUpTestUser(BigDecimal.valueOf(5.00));

        // Session costs $25.00
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(25.00));

        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Insufficient wallet balance")));
    }

    @Test
    void payChargingSession_idempotent_doesNotDoubleDebit() throws Exception {
        topUpTestUser(BigDecimal.valueOf(50.00));
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(20.00));

        // First payment
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.remainingWalletBalance").value(30.00));

        // Repeated payment
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.remainingWalletBalance").value(30.00));

        // Balance remains 30.00, not 10.00
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(30.00));
    }

    @Test
    void payChargingSession_notCompleted_returns400() throws Exception {
        topUpTestUser(BigDecimal.valueOf(50.00));
        // Active CHARGING session (not completed)
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(10.00));
        session.setStatus("CHARGING");
        sessionRepository.save(session);

        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Only COMPLETED charging sessions can be paid")));
    }

    @Test
    void payChargingSession_unauthorizedUser_returns403() throws Exception {
        topUpTestUser(BigDecimal.valueOf(50.00));
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(10.00));

        // otherUser tries to pay testUser's session
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void refundChargingSession_success_creditsWalletAndSetsRefunded() throws Exception {
        topUpTestUser(BigDecimal.valueOf(50.00));
        ChargingSession session = createCompletedSession(testUser, BigDecimal.valueOf(20.00));

        // Pay first
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk());

        // Refund
        mockMvc.perform(post("/api/sessions/" + session.getId() + "/refund")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.amountPaid").value(20.00))
                .andExpect(jsonPath("$.remainingWalletBalance").value(50.00));

        // Wallet balance restored
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(50.00));
    }

    @Test
    void concurrentTopUps_updatesBalanceCorrectly() throws Exception {
        int threads = 5;
        String[] intentIds = new String[threads];
        for (int i = 0; i < threads; i++) {
            var intent = walletService.createTopUpIntent(
                    new CreateTopUpIntentRequest(BigDecimal.valueOf(10.00), "conc_" + i + "_" + UUID.randomUUID(), "Concurrent test"),
                    testUser.getEmail()
            );
            intentIds[i] = intent.intentId();
        }

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final String iId = intentIds[i];
            executor.submit(() -> {
                try {
                    walletService.confirmTopUp(new ConfirmTopUpRequest(iId, "SUCCEED"), testUser.getEmail());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Ignored
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(threads);

        var wallet = walletService.getWallet(testUser.getEmail());
        assertThat(wallet.balance()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
    }

    @Test
    void overspendingPrevention_concurrentDebitsCannotExceedBalance() throws Exception {
        topUpTestUser(BigDecimal.valueOf(50.00));

        ChargingSession s1 = createCompletedSession(testUser, BigDecimal.valueOf(40.00));
        ChargingSession s2 = createCompletedSession(testUser, BigDecimal.valueOf(40.00));

        // First payment succeeds
        mockMvc.perform(post("/api/sessions/" + s1.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));

        // Second payment fails with insufficient funds
        mockMvc.perform(post("/api/sessions/" + s2.getId() + "/pay")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Insufficient wallet balance")));

        var wallet = walletService.getWallet(testUser.getEmail());
        assertThat(wallet.balance()).isEqualByComparingTo(BigDecimal.valueOf(10.00));
    }

    @Test
    void createTopUpIntent_crossUserIdempotencyKeyCollision_returns403Forbidden() throws Exception {
        String sharedKey = "cross_user_key_" + UUID.randomUUID();

        // User 1 creates intent with shared key
        var req1 = new CreateTopUpIntentRequest(BigDecimal.valueOf(50.00), sharedKey, "User 1 Intent");
        mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk());

        // User 2 attempts to use User 1's idempotency key
        var req2 = new CreateTopUpIntentRequest(BigDecimal.valueOf(100.00), sharedKey, "User 2 Intent");
        mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + otherUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Idempotency key belongs to another user")));
    }

    private void topUpTestUser(BigDecimal amount) throws Exception {
        var createReq = new CreateTopUpIntentRequest(amount, "setup_" + UUID.randomUUID(), "Setup Topup");
        MvcResult res = mockMvc.perform(post("/api/wallet/topup/intent")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        String intentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("intentId").asText();

        var confirmReq = new ConfirmTopUpRequest(intentId, "SUCCEED");
        mockMvc.perform(post("/api/wallet/topup/confirm")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk());
    }

    private ChargingSession createCompletedSession(User user, BigDecimal cost) {
        Vehicle v = vehicleRepository.save(Vehicle.builder()
                .owner(user)
                .make("Tesla")
                .model("Model 3")
                .registrationNumber("PLATE-" + UUID.randomUUID().toString().substring(0, 6))
                .batteryCapacityKwh(BigDecimal.valueOf(60.0))
                .connectorType("CCS2")
                .build());

        Station station = stationRepository.findAll().get(0);
        Charger charger = chargerRepository.findAll().get(0);

        return sessionRepository.save(ChargingSession.builder()
                .customer(user)
                .vehicle(v)
                .station(station)
                .charger(charger)
                .status("COMPLETED")
                .startTime(LocalDateTime.now().minusHours(1))
                .stopTime(LocalDateTime.now())
                .startMeterKwh(BigDecimal.valueOf(100.00))
                .stopMeterKwh(BigDecimal.valueOf(150.00))
                .energyConsumedKwh(BigDecimal.valueOf(50.00))
                .tariffPerKwh(BigDecimal.valueOf(0.28))
                .totalCost(cost)
                .paymentStatus("UNPAID")
                .build());
    }
}
