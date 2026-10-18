package com.voltflow.service;

import com.voltflow.dto.*;
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
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public WalletService(WalletRepository walletRepository,
                         WalletTransactionRepository transactionRepository,
                         PaymentIntentRepository paymentIntentRepository,
                         ChargingSessionRepository chargingSessionRepository,
                         UserRepository userRepository,
                         AuditLogRepository auditLogRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.paymentIntentRepository = paymentIntentRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public Wallet getOrCreateWallet(User user) {
        return walletRepository.findByUser(user)
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO.setScale(2))
                            .currency("USD")
                            .build();
                    Wallet saved = walletRepository.save(newWallet);
                    log.info("Created new wallet #{} for user {}", saved.getId(), user.getEmail());
                    return saved;
                });
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(String userEmail) {
        User user = getUserByEmail(userEmail);
        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> Wallet.builder()
                        .user(user)
                        .balance(BigDecimal.ZERO.setScale(2))
                        .currency("USD")
                        .build());

        return mapToWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getTransactionHistory(String userEmail) {
        User user = getUserByEmail(userEmail);
        var optionalWallet = walletRepository.findByUser(user);
        if (optionalWallet.isEmpty()) {
            return List.of();
        }

        return transactionRepository.findByWalletOrderByCreatedAtDesc(optionalWallet.get()).stream()
                .map(this::mapToTransactionResponse)
                .toList();
    }

    @Transactional
    public PaymentIntentResponse createTopUpIntent(CreateTopUpIntentRequest req, String userEmail) {
        User user = getUserByEmail(userEmail);
        Wallet wallet = getOrCreateWallet(user);

        String idempotencyKey = req.idempotencyKey();
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = "topup_" + UUID.randomUUID();
        }

        // Check if intent with this idempotency key already exists
        var existing = paymentIntentRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            if (!existing.get().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Idempotency key belongs to another user");
            }
            return mapToIntentResponse(existing.get());
        }

        String intentId = "pi_sbx_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        PaymentIntent intent = PaymentIntent.builder()
                .intentId(intentId)
                .user(user)
                .wallet(wallet)
                .amount(req.amount().setScale(2, java.math.RoundingMode.HALF_UP))
                .currency("USD")
                .status("PENDING")
                .paymentMethod("SANDBOX_CARD")
                .idempotencyKey(idempotencyKey)
                .description(req.description() != null ? req.description() : "Sandbox Wallet Top-Up")
                .build();

        PaymentIntent saved = paymentIntentRepository.save(intent);
        log.info("Created sandbox top-up intent {} for ${} by {}", intentId, req.amount(), userEmail);

        return mapToIntentResponse(saved);
    }

    @Transactional
    public PaymentIntentResponse confirmTopUp(ConfirmTopUpRequest req, String userEmail) {
        User user = getUserByEmail(userEmail);
        PaymentIntent intent = paymentIntentRepository.findByIntentId(req.intentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment intent not found: " + req.intentId()));

        if (!intent.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized to confirm this payment intent");
        }

        // Idempotency: if already confirmed as SUCCEEDED, return without duplicate credit
        if ("SUCCEEDED".equalsIgnoreCase(intent.getStatus())) {
            log.info("Payment intent {} was already confirmed. Returning idempotent result.", intent.getIntentId());
            return mapToIntentResponse(intent);
        }

        if ("FAILED".equalsIgnoreCase(intent.getStatus()) || "CANCELLED".equalsIgnoreCase(intent.getStatus())) {
            return mapToIntentResponse(intent);
        }

        String action = req.action() != null ? req.action().trim().toUpperCase() : "SUCCEED";

        if ("SUCCEED".equals(action)) {
            // Lock wallet for safe balance update
            Wallet wallet = walletRepository.findByIdWithLock(intent.getWallet().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

            BigDecimal newBalance = wallet.getBalance().add(intent.getAmount());
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);

            // Record immutable ledger entry
            String txKey = "CONFIRM-" + intent.getIntentId();
            if (!transactionRepository.existsByIdempotencyKey(txKey)) {
                WalletTransaction tx = WalletTransaction.builder()
                        .wallet(wallet)
                        .transactionType("CREDIT")
                        .amount(intent.getAmount())
                        .balanceAfter(newBalance)
                        .currency(wallet.getCurrency())
                        .status("COMPLETED")
                        .description("Sandbox Top-Up: " + intent.getIntentId())
                        .referenceId(intent.getIntentId())
                        .idempotencyKey(txKey)
                        .build();
                transactionRepository.save(tx);
            }

            intent.setStatus("SUCCEEDED");
            intent.setConfirmedAt(LocalDateTime.now());
            paymentIntentRepository.save(intent);

            auditLogRepository.save(AuditLog.builder()
                    .actorUser(user)
                    .action("WALLET_TOP_UP")
                    .entityType("WALLET")
                    .entityId(wallet.getId())
                    .details(String.format("Top-up of $%s confirmed. New balance: $%s (Intent: %s)",
                            intent.getAmount(), newBalance, intent.getIntentId()))
                    .build());

            log.info("Successfully confirmed top-up for intent {}. New balance: ${}", intent.getIntentId(), newBalance);
        } else if ("FAIL".equals(action)) {
            intent.setStatus("FAILED");
            intent.setConfirmedAt(LocalDateTime.now());
            paymentIntentRepository.save(intent);
            log.info("Top-up intent {} marked as FAILED via simulation", intent.getIntentId());
        } else if ("CANCEL".equals(action)) {
            intent.setStatus("CANCELLED");
            intent.setConfirmedAt(LocalDateTime.now());
            paymentIntentRepository.save(intent);
            log.info("Top-up intent {} marked as CANCELLED via simulation", intent.getIntentId());
        } else {
            throw new IllegalArgumentException("Unknown simulation action: " + action + ". Allowed: SUCCEED, FAIL, CANCEL");
        }

        return mapToIntentResponse(intent);
    }

    @Transactional
    public PaySessionResponse payChargingSession(Long sessionId, String userEmail) {
        User user = getUserByEmail(userEmail);
        ChargingSession session = chargingSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + sessionId));

        validateOwnership(session, user);

        if ("REFUNDED".equalsIgnoreCase(session.getStatus())
                || "REFUNDED".equalsIgnoreCase(session.getPaymentStatus())) {
            throw new IllegalStateException("A refunded charging session cannot be paid again.");
        }

        if (!"COMPLETED".equalsIgnoreCase(session.getStatus())) {
            throw new IllegalStateException("Only COMPLETED charging sessions can be paid. Current status: " + session.getStatus());
        }

        String idempotencyKey = "PAY-SESSION-" + session.getId();

        // Idempotency: If already paid, return existing receipt without double debiting
        if ("PAID".equalsIgnoreCase(session.getPaymentStatus())) {
            log.info("Session #{} is already PAID. Returning idempotent response.", sessionId);
            Wallet wallet = walletRepository.findByUser(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
            var existingTx = transactionRepository.findByIdempotencyKey(idempotencyKey);
            return new PaySessionResponse(
                    session.getId(),
                    "PAID",
                    session.getTotalCost() != null ? session.getTotalCost() : BigDecimal.ZERO,
                    wallet.getBalance(),
                    existingTx.map(WalletTransaction::getId).orElse(null),
                    idempotencyKey,
                    session.getUpdatedAt() != null ? session.getUpdatedAt() : LocalDateTime.now()
            );
        }

        BigDecimal cost = session.getTotalCost() != null ? session.getTotalCost() : BigDecimal.ZERO;

        // Lock wallet for safe debit
        Wallet wallet = walletRepository.findByUserWithLock(user)
                .orElseGet(() -> {
                    Wallet w = getOrCreateWallet(user);
                    return walletRepository.findByIdWithLock(w.getId()).orElse(w);
                });

        if (wallet.getBalance().compareTo(cost) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient wallet balance ($%s). Session cost is $%s. Please top up your wallet to proceed.",
                    wallet.getBalance(), cost
            ));
        }

        BigDecimal newBalance = wallet.getBalance().subtract(cost);
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        // Record immutable ledger debit
        WalletTransaction debitTx = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType("DEBIT")
                .amount(cost)
                .balanceAfter(newBalance)
                .currency(wallet.getCurrency())
                .status("COMPLETED")
                .description("Payment for Charging Session #" + session.getId())
                .referenceId("SESSION-" + session.getId())
                .chargingSession(session)
                .idempotencyKey(idempotencyKey)
                .build();
        WalletTransaction savedTx = transactionRepository.save(debitTx);

        session.setPaymentStatus("PAID");
        chargingSessionRepository.save(session);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("PAY_CHARGING_SESSION")
                .entityType("CHARGING_SESSION")
                .entityId(session.getId())
                .details(String.format("Paid $%s for session #%d from wallet. Remaining balance: $%s",
                        cost, session.getId(), newBalance))
                .build());

        log.info("Debited ${} from wallet #{} for session #{}. Remaining balance: ${}", cost, wallet.getId(), session.getId(), newBalance);

        return new PaySessionResponse(
                session.getId(),
                "PAID",
                cost,
                newBalance,
                savedTx.getId(),
                idempotencyKey,
                LocalDateTime.now()
        );
    }

    @Transactional
    public PaySessionResponse refundChargingSession(Long sessionId, String userEmail) {
        User user = getUserByEmail(userEmail);
        ChargingSession session = chargingSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + sessionId));

        validateOwnership(session, user);

        if (!"PAID".equalsIgnoreCase(session.getPaymentStatus())) {
            throw new IllegalStateException("Only PAID sessions can be refunded. Current payment status: " + session.getPaymentStatus());
        }

        String idempotencyKey = "REFUND-SESSION-" + session.getId();

        Wallet wallet = walletRepository.findByUserWithLock(session.getCustomer())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for customer"));

        BigDecimal refundAmount = session.getTotalCost() != null ? session.getTotalCost() : BigDecimal.ZERO;
        BigDecimal newBalance = wallet.getBalance().add(refundAmount);
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        WalletTransaction refundTx = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType("REFUND")
                .amount(refundAmount)
                .balanceAfter(newBalance)
                .currency(wallet.getCurrency())
                .status("COMPLETED")
                .description("Refund for Charging Session #" + session.getId())
                .referenceId("SESSION-" + session.getId())
                .chargingSession(session)
                .idempotencyKey(idempotencyKey)
                .build();
        WalletTransaction savedTx = transactionRepository.save(refundTx);

        session.setPaymentStatus("REFUNDED");
        chargingSessionRepository.save(session);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("REFUND_CHARGING_SESSION")
                .entityType("CHARGING_SESSION")
                .entityId(session.getId())
                .details(String.format("Refunded $%s for session #%d to wallet. New balance: $%s",
                        refundAmount, session.getId(), newBalance))
                .build());

        return new PaySessionResponse(
                session.getId(),
                "REFUNDED",
                refundAmount,
                newBalance,
                savedTx.getId(),
                idempotencyKey,
                LocalDateTime.now()
        );
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateOwnership(ChargingSession session, User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()) || "SUPER_ADMIN".equalsIgnoreCase(r.getName()));

        if (!isAdmin && !session.getCustomer().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to access session: " + session.getId());
        }
    }

    private WalletResponse mapToWalletResponse(Wallet wallet) {
        return new WalletResponse(
                wallet.getId(),
                wallet.getUser() != null ? wallet.getUser().getId() : null,
                wallet.getUser() != null ? wallet.getUser().getEmail() : null,
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getCreatedAt(),
                wallet.getUpdatedAt()
        );
    }

    private WalletTransactionResponse mapToTransactionResponse(WalletTransaction tx) {
        return new WalletTransactionResponse(
                tx.getId(),
                tx.getWallet().getId(),
                tx.getTransactionType(),
                tx.getAmount(),
                tx.getBalanceAfter(),
                tx.getCurrency(),
                tx.getStatus(),
                tx.getDescription(),
                tx.getReferenceId(),
                tx.getChargingSession() != null ? tx.getChargingSession().getId() : null,
                tx.getIdempotencyKey(),
                tx.getCreatedAt()
        );
    }

    private PaymentIntentResponse mapToIntentResponse(PaymentIntent intent) {
        return new PaymentIntentResponse(
                intent.getIntentId(),
                intent.getAmount(),
                intent.getCurrency(),
                intent.getStatus(),
                intent.getPaymentMethod(),
                intent.getIdempotencyKey(),
                intent.getDescription(),
                intent.getConfirmedAt(),
                intent.getCreatedAt(),
                true
        );
    }
}
