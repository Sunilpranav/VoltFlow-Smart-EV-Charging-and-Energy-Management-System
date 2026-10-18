package com.voltflow.service;

import com.voltflow.dto.AdminRefundRequest;
import com.voltflow.dto.PaySessionResponse;
import com.voltflow.entity.AuditLog;
import com.voltflow.entity.ChargingSession;
import com.voltflow.entity.User;
import com.voltflow.entity.Wallet;
import com.voltflow.entity.WalletTransaction;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.ChargingSessionRepository;
import com.voltflow.repository.UserRepository;
import com.voltflow.repository.WalletRepository;
import com.voltflow.repository.WalletTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service for administrator-initiated refunds.
 * Validates session ownership, payment status, eligible refund amounts,
 * uses pessimistic wallet locking to prevent race conditions,
 * enforces idempotency to prevent duplicate refunds, maintains full immutable ledger records,
 * and records comprehensive audit trails.
 */
@Service
public class AdminRefundService {

    private static final Logger log = LoggerFactory.getLogger(AdminRefundService.class);

    private final ChargingSessionRepository sessionRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminRefundService(ChargingSessionRepository sessionRepository,
                              WalletRepository walletRepository,
                              WalletTransactionRepository transactionRepository,
                              AuditLogRepository auditLogRepository,
                              UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PaySessionResponse refundSession(Long sessionId, AdminRefundRequest req, String adminEmail) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID is required for refund processing.");
        }

        ChargingSession session = sessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + sessionId));

        String idempotencyKey = "ADMIN-REFUND-SESSION-" + session.getId();
        if (transactionRepository.existsByIdempotencyKey(idempotencyKey)
                || "REFUNDED".equalsIgnoreCase(session.getPaymentStatus())) {
            throw new IllegalStateException("Charging session #" + sessionId + " has already been refunded.");
        }

        if (!"PAID".equalsIgnoreCase(session.getPaymentStatus())) {
            throw new IllegalStateException("Only PAID sessions can be refunded. Current payment status: " + session.getPaymentStatus());
        }

        BigDecimal refundAmount = (req != null && req.amount() != null) ? req.amount() : session.getTotalCost();
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Cannot refund session with zero or negative total cost.");
        }
        if (session.getTotalCost() != null && refundAmount.compareTo(session.getTotalCost()) > 0) {
            throw new IllegalArgumentException("Refund amount $" + refundAmount + " cannot exceed session total cost of $" + session.getTotalCost());
        }

        User customer = session.getCustomer();
        if (customer == null) {
            throw new IllegalStateException("Charging session #" + sessionId + " is not associated with a customer.");
        }

        // Lock wallet for safe balance update against concurrent requests
        Wallet wallet = walletRepository.findByUserWithLock(customer)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for customer: " + customer.getEmail()));

        BigDecimal newBalance = wallet.getBalance().add(refundAmount);
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        String reason = (req != null && req.reason() != null && !req.reason().isBlank())
                ? req.reason().trim() : "Administrator authorized refund";
        String description = "Admin refund for Charging Session #" + session.getId() + " - " + reason;

        WalletTransaction refundTx = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType("REFUND")
                .amount(refundAmount)
                .balanceAfter(newBalance)
                .currency(wallet.getCurrency())
                .status("COMPLETED")
                .description(description)
                .referenceId("SESSION-" + session.getId())
                .chargingSession(session)
                .idempotencyKey(idempotencyKey)
                .build();
        WalletTransaction savedTx = transactionRepository.save(refundTx);

        session.setPaymentStatus("REFUNDED");
        sessionRepository.save(session);

        User adminActor = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditLogRepository.save(AuditLog.builder()
                .actorUser(adminActor)
                .action("ADMIN_REFUND")
                .entityType("CHARGING_SESSION")
                .entityId(session.getId())
                .details(String.format("Admin %s refunded $%s for session #%d to customer %s (%s). Reason: %s. New balance: $%s",
                        adminEmail, refundAmount, session.getId(), customer.getEmail(), customer.getFullName(), reason, newBalance))
                .build());

        log.info("Admin {} successfully processed refund of ${} for session #{}. Customer wallet new balance: ${}",
                adminEmail, refundAmount, session.getId(), newBalance);

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
}
