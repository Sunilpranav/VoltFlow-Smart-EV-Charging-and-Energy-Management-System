package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions")
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // CREDIT, DEBIT, REFUND

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "COMPLETED"; // PENDING, COMPLETED, FAILED

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ChargingSession chargingSession;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 120)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public WalletTransaction() {
    }

    public WalletTransaction(Long id, Wallet wallet, String transactionType, BigDecimal amount, BigDecimal balanceAfter, String currency, String status, String description, String referenceId, ChargingSession chargingSession, String idempotencyKey, LocalDateTime createdAt) {
        this.id = id;
        this.wallet = wallet;
        this.transactionType = transactionType;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.currency = currency != null ? currency : "USD";
        this.status = status != null ? status : "COMPLETED";
        this.description = description;
        this.referenceId = referenceId;
        this.chargingSession = chargingSession;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = createdAt;
    }

    public static WalletTransactionBuilder builder() {
        return new WalletTransactionBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Wallet getWallet() {
        return wallet;
    }

    public void setWallet(Wallet wallet) {
        this.wallet = wallet;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(BigDecimal balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public ChargingSession getChargingSession() {
        return chargingSession;
    }

    public void setChargingSession(ChargingSession chargingSession) {
        this.chargingSession = chargingSession;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class WalletTransactionBuilder {
        private Long id;
        private Wallet wallet;
        private String transactionType;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private String currency = "USD";
        private String status = "COMPLETED";
        private String description;
        private String referenceId;
        private ChargingSession chargingSession;
        private String idempotencyKey;
        private LocalDateTime createdAt;

        WalletTransactionBuilder() {
        }

        public WalletTransactionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalletTransactionBuilder wallet(Wallet wallet) {
            this.wallet = wallet;
            return this;
        }

        public WalletTransactionBuilder transactionType(String transactionType) {
            this.transactionType = transactionType;
            return this;
        }

        public WalletTransactionBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public WalletTransactionBuilder balanceAfter(BigDecimal balanceAfter) {
            this.balanceAfter = balanceAfter;
            return this;
        }

        public WalletTransactionBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public WalletTransactionBuilder status(String status) {
            this.status = status;
            return this;
        }

        public WalletTransactionBuilder description(String description) {
            this.description = description;
            return this;
        }

        public WalletTransactionBuilder referenceId(String referenceId) {
            this.referenceId = referenceId;
            return this;
        }

        public WalletTransactionBuilder chargingSession(ChargingSession chargingSession) {
            this.chargingSession = chargingSession;
            return this;
        }

        public WalletTransactionBuilder idempotencyKey(String idempotencyKey) {
            this.idempotencyKey = idempotencyKey;
            return this;
        }

        public WalletTransactionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalletTransaction build() {
            return new WalletTransaction(id, wallet, transactionType, amount, balanceAfter, currency, status, description, referenceId, chargingSession, idempotencyKey, createdAt);
        }

        @Override
        public String toString() {
            return "WalletTransaction.WalletTransactionBuilder(id=" + this.id + ", wallet=" + this.wallet + ", transactionType=" + this.transactionType + ", amount=" + this.amount + ", balanceAfter=" + this.balanceAfter + ", currency=" + this.currency + ", status=" + this.status + ", description=" + this.description + ", referenceId=" + this.referenceId + ", chargingSession=" + this.chargingSession + ", idempotencyKey=" + this.idempotencyKey + ", createdAt=" + this.createdAt + ")";
        }
    }
}
