package com.voltflow.service;

import com.voltflow.dto.CustomerPlanResponse;
import com.voltflow.dto.PrepaidPlanResponse;
import com.voltflow.dto.PurchasePlanRequest;
import com.voltflow.entity.*;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class PrepaidPlanService {

    private final PrepaidPlanRepository prepaidPlanRepository;
    private final CustomerPlanRepository customerPlanRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final WalletService walletService;

    public PrepaidPlanService(PrepaidPlanRepository prepaidPlanRepository,
                              CustomerPlanRepository customerPlanRepository,
                              WalletRepository walletRepository,
                              WalletTransactionRepository transactionRepository,
                              UserRepository userRepository,
                              AuditLogRepository auditLogRepository,
                              WalletService walletService) {
        this.prepaidPlanRepository = prepaidPlanRepository;
        this.customerPlanRepository = customerPlanRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.walletService = walletService;
    }

    @Transactional(readOnly = true)
    public List<PrepaidPlanResponse> getActivePlans() {
        return prepaidPlanRepository.findByActiveTrue().stream()
                .map(this::mapToPlanResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPlanResponse> getCustomerPlans(String userEmail) {
        User user = getUserByEmail(userEmail);
        return customerPlanRepository.findByUserIdOrderByPurchasedAtDesc(user.getId()).stream()
                .map(this::mapToCustomerPlanResponse)
                .toList();
    }

    @Transactional
    public CustomerPlanResponse purchasePlan(Long planId, PurchasePlanRequest req, String userEmail) {
        User user = getUserByEmail(userEmail);
        PrepaidPlan plan = prepaidPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Prepaid plan not found with id: " + planId));

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new IllegalStateException("Plan '" + plan.getName() + "' is not currently active for purchase");
        }

        String idempotencyKey = (req != null && req.idempotencyKey() != null && !req.idempotencyKey().isBlank())
                ? req.idempotencyKey()
                : "plan_purchase_" + UUID.randomUUID();

        // Idempotency: check if customer already completed purchase with this idempotency key
        var existing = customerPlanRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            if (!existing.get().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Idempotency key belongs to another user");
            }
            log.info("Idempotent purchase request detected for key {}. Returning existing record.", idempotencyKey);
            return mapToCustomerPlanResponse(existing.get());
        }

        // Lock wallet for safe balance check and transaction
        Wallet wallet = walletRepository.findByUserWithLock(user)
                .orElseGet(() -> {
                    Wallet w = walletService.getOrCreateWallet(user);
                    return walletRepository.findByIdWithLock(w.getId()).orElse(w);
                });

        if (wallet.getBalance().compareTo(plan.getPrice()) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient wallet balance ($%s). Plan price is $%s. Please top up your wallet to purchase this plan.",
                    wallet.getBalance(), plan.getPrice()
            ));
        }

        // 1. Debit purchase price
        BigDecimal afterDebit = wallet.getBalance().subtract(plan.getPrice());
        wallet.setBalance(afterDebit);
        walletRepository.save(wallet);

        WalletTransaction debitTx = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType("DEBIT")
                .amount(plan.getPrice())
                .balanceAfter(afterDebit)
                .currency(wallet.getCurrency())
                .status("COMPLETED")
                .description("Purchase Prepaid Plan: " + plan.getName())
                .idempotencyKey("DEBIT-PLAN-" + idempotencyKey)
                .build();
        transactionRepository.save(debitTx);

        // 2. Credit plan bonus/credit amount
        BigDecimal afterCredit = afterDebit.add(plan.getCreditAmount());
        wallet.setBalance(afterCredit);
        walletRepository.save(wallet);

        WalletTransaction creditTx = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType("CREDIT")
                .amount(plan.getCreditAmount())
                .balanceAfter(afterCredit)
                .currency(wallet.getCurrency())
                .status("COMPLETED")
                .description("Plan Credit Bonus: " + plan.getName())
                .idempotencyKey("CREDIT-PLAN-" + idempotencyKey)
                .build();
        transactionRepository.save(creditTx);

        // 3. Save CustomerPlan
        CustomerPlan customerPlan = CustomerPlan.builder()
                .user(user)
                .plan(plan)
                .purchasePrice(plan.getPrice())
                .creditedAmount(plan.getCreditAmount())
                .remainingEnergyKwh(plan.getEnergyAllowanceKwh())
                .status("ACTIVE")
                .idempotencyKey(idempotencyKey)
                .expiresAt(LocalDateTime.now().plusDays(plan.getValidityDays()))
                .build();
        CustomerPlan savedPlan = customerPlanRepository.save(customerPlan);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("PURCHASE_PREPAID_PLAN")
                .entityType("PREPAID_PLAN")
                .entityId(plan.getId())
                .details(String.format("Purchased '%s' for $%s. Credited $%s to wallet.",
                        plan.getName(), plan.getPrice(), plan.getCreditAmount()))
                .build());

        log.info("User {} purchased plan '{}'. Debited ${}, Credited ${}. New wallet balance: ${}",
                userEmail, plan.getName(), plan.getPrice(), plan.getCreditAmount(), afterCredit);

        return mapToCustomerPlanResponse(savedPlan);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private PrepaidPlanResponse mapToPlanResponse(PrepaidPlan plan) {
        return new PrepaidPlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getDescription(),
                plan.getPrice(),
                plan.getCreditAmount(),
                plan.getEnergyAllowanceKwh(),
                plan.getValidityDays(),
                plan.getCurrency(),
                plan.getActive()
        );
    }

    private CustomerPlanResponse mapToCustomerPlanResponse(CustomerPlan cp) {
        return new CustomerPlanResponse(
                cp.getId(),
                cp.getPlan().getId(),
                cp.getPlan().getName(),
                cp.getPlan().getDescription(),
                cp.getPurchasePrice(),
                cp.getCreditedAmount(),
                cp.getRemainingEnergyKwh(),
                cp.getStatus(),
                cp.getIdempotencyKey(),
                cp.getPurchasedAt(),
                cp.getExpiresAt()
        );
    }
}
