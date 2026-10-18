package com.voltflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltflow.dto.ConfirmTopUpRequest;
import com.voltflow.dto.CreateTopUpIntentRequest;
import com.voltflow.dto.LoginRequest;
import com.voltflow.dto.PurchasePlanRequest;
import com.voltflow.entity.PrepaidPlan;
import com.voltflow.entity.Role;
import com.voltflow.entity.User;
import com.voltflow.repository.PrepaidPlanRepository;
import com.voltflow.repository.RoleRepository;
import com.voltflow.repository.UserRepository;
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
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PrepaidPlanControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PrepaidPlanRepository planRepository;
    @Autowired PasswordEncoder passwordEncoder;

    User testUser;
    String testUserToken;

    @BeforeEach
    void setup() throws Exception {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        Role customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();

        testUser = userRepository.save(User.builder()
                .fullName("Plan Test User")
                .email("planuser_" + uniqueSuffix + "@voltflow.test")
                .passwordHash(passwordEncoder.encode("TestPass123!"))
                .roles(Set.of(customerRole))
                .enabled(true)
                .build());

        var login = new LoginRequest(testUser.getEmail(), "TestPass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        testUserToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void getActivePlans_returnsSeededPlans() throws Exception {
        mockMvc.perform(get("/api/plans")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].price").isNumber())
                .andExpect(jsonPath("$[0].creditAmount").isNumber());
    }

    @Test
    void purchasePlan_sufficientBalance_debitsPriceAndCreditsBonus() throws Exception {
        // Top up wallet with $100
        topUpTestUser(BigDecimal.valueOf(100.00));

        PrepaidPlan plan = planRepository.findAll().get(0); // e.g. VoltStarter: price 25, credit 28

        var req = new PurchasePlanRequest("purchase_" + UUID.randomUUID());

        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planId").value(plan.getId()))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.purchasePrice").value(plan.getPrice().doubleValue()))
                .andExpect(jsonPath("$.creditedAmount").value(plan.getCreditAmount().doubleValue()));

        // Expected balance: 100 - price + creditAmount = 100 - 25 + 28 = 103.00
        BigDecimal expectedBalance = BigDecimal.valueOf(100.00).subtract(plan.getPrice()).add(plan.getCreditAmount());
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(expectedBalance.doubleValue()));

        // Check getMyPlans
        mockMvc.perform(get("/api/plans/my-plans")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].planId").value(plan.getId()))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void purchasePlan_insufficientBalance_returns400() throws Exception {
        // Wallet balance is 0.00
        PrepaidPlan plan = planRepository.findAll().get(0);
        var req = new PurchasePlanRequest("purchase_fail_" + UUID.randomUUID());

        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Insufficient wallet balance")));
    }

    @Test
    void purchasePlan_idempotent_returnsExistingPurchase() throws Exception {
        topUpTestUser(BigDecimal.valueOf(100.00));
        PrepaidPlan plan = planRepository.findAll().get(0);
        String sharedKey = "shared_key_" + UUID.randomUUID();
        var req = new PurchasePlanRequest(sharedKey);

        // First purchase
        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Repeated purchase with same idempotency key
        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idempotencyKey").value(sharedKey));

        // Wallet was only charged once
        BigDecimal expectedBalance = BigDecimal.valueOf(100.00).subtract(plan.getPrice()).add(plan.getCreditAmount());
        mockMvc.perform(get("/api/wallet")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(expectedBalance.doubleValue()));
    }

    @Test
    void purchasePlan_crossUserIdempotencyKeyCollision_returns403Forbidden() throws Exception {
        topUpTestUser(BigDecimal.valueOf(100.00));
        PrepaidPlan plan = planRepository.findAll().get(0);

        String sharedKey = "cross_plan_key_" + UUID.randomUUID();

        // User 1 purchases with sharedKey
        var req1 = new PurchasePlanRequest(sharedKey);
        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + testUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk());

        // Create User 2
        String u2Suffix = UUID.randomUUID().toString().substring(0, 8);
        Role customerRole = roleRepository.findByName("CUSTOMER").orElseThrow();
        User user2 = userRepository.save(User.builder()
                .fullName("Second Plan User")
                .email("secondplan_" + u2Suffix + "@voltflow.test")
                .passwordHash(passwordEncoder.encode("TestPass123!"))
                .roles(Set.of(customerRole))
                .enabled(true)
                .build());

        var login = new LoginRequest(user2.getEmail(), "TestPass123!");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        String user2Token = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        // User 2 attempts to purchase with User 1's sharedKey
        var req2 = new PurchasePlanRequest(sharedKey);
        mockMvc.perform(post("/api/plans/" + plan.getId() + "/purchase")
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Idempotency key belongs to another user")));
    }

    private void topUpTestUser(BigDecimal amount) throws Exception {
        var createReq = new CreateTopUpIntentRequest(amount, "topup_" + UUID.randomUUID(), "Test Topup");
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
}
