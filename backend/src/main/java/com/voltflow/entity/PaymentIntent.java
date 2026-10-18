package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_intents")
public class PaymentIntent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "intent_id", nullable = false, unique = true, length = 64)
    private String intentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, SUCCEEDED, FAILED, CANCELLED

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod = "SANDBOX_CARD";

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 120)
    private String idempotencyKey;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PaymentIntent() {
    }

    public PaymentIntent(Long id, String intentId, User user, Wallet wallet, BigDecimal amount, String currency, String status, String paymentMethod, String idempotencyKey, String description, LocalDateTime confirmedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.intentId = intentId;
        this.user = user;
        this.wallet = wallet;
        this.amount = amount;
        this.currency = currency != null ? currency : "USD";
        this.status = status != null ? status : "PENDING";
        this.paymentMethod = paymentMethod != null ? paymentMethod : "SANDBOX_CARD";
        this.idempotencyKey = idempotencyKey;
        this.description = description;
        this.confirmedAt = confirmedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static PaymentIntentBuilder builder() {
        return new PaymentIntentBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIntentId() {
        return intentId;
    }

    public void setIntentId(String intentId) {
        this.intentId = intentId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Wallet getWallet() {
        return wallet;
    }

    public void setWallet(Wallet wallet) {
        this.wallet = wallet;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class PaymentIntentBuilder {
        private Long id;
        private String intentId;
        private User user;
        private Wallet wallet;
        private BigDecimal amount;
        private String currency = "USD";
        private String status = "PENDING";
        private String paymentMethod = "SANDBOX_CARD";
        private String idempotencyKey;
        private String description;
        private LocalDateTime confirmedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        PaymentIntentBuilder() {
        }

        public PaymentIntentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PaymentIntentBuilder intentId(String intentId) {
            this.intentId = intentId;
            return this;
        }

        public PaymentIntentBuilder user(User user) {
            this.user = user;
            return this;
        }

        public PaymentIntentBuilder wallet(Wallet wallet) {
            this.wallet = wallet;
            return this;
        }

        public PaymentIntentBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public PaymentIntentBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public PaymentIntentBuilder status(String status) {
            this.status = status;
            return this;
        }

        public PaymentIntentBuilder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public PaymentIntentBuilder idempotencyKey(String idempotencyKey) {
            this.idempotencyKey = idempotencyKey;
            return this;
        }

        public PaymentIntentBuilder description(String description) {
            this.description = description;
            return this;
        }

        public PaymentIntentBuilder confirmedAt(LocalDateTime confirmedAt) {
            this.confirmedAt = confirmedAt;
            return this;
        }

        public PaymentIntentBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PaymentIntentBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public PaymentIntent build() {
            return new PaymentIntent(id, intentId, user, wallet, amount, currency, status, paymentMethod, idempotencyKey, description, confirmedAt, createdAt, updatedAt);
        }

        @Override
        public String toString() {
            return "PaymentIntent.PaymentIntentBuilder(id=" + this.id + ", intentId=" + this.intentId + ", user=" + this.user + ", wallet=" + this.wallet + ", amount=" + this.amount + ", currency=" + this.currency + ", status=" + this.status + ", paymentMethod=" + this.paymentMethod + ", idempotencyKey=" + this.idempotencyKey + ", description=" + this.description + ", confirmedAt=" + this.confirmedAt + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ")";
        }
    }
}
