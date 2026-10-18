package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_plans")
public class CustomerPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private PrepaidPlan plan;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "credited_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal creditedAmount;

    @Column(name = "remaining_energy_kwh", precision = 10, scale = 2)
    private BigDecimal remainingEnergyKwh;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, DEPLETED

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 120)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "purchased_at", updatable = false)
    private LocalDateTime purchasedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public CustomerPlan() {
    }

    public CustomerPlan(Long id, User user, PrepaidPlan plan, BigDecimal purchasePrice, BigDecimal creditedAmount, BigDecimal remainingEnergyKwh, String status, String idempotencyKey, LocalDateTime purchasedAt, LocalDateTime expiresAt) {
        this.id = id;
        this.user = user;
        this.plan = plan;
        this.purchasePrice = purchasePrice;
        this.creditedAmount = creditedAmount;
        this.remainingEnergyKwh = remainingEnergyKwh;
        this.status = status != null ? status : "ACTIVE";
        this.idempotencyKey = idempotencyKey;
        this.purchasedAt = purchasedAt;
        this.expiresAt = expiresAt;
    }

    public static CustomerPlanBuilder builder() {
        return new CustomerPlanBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public PrepaidPlan getPlan() {
        return plan;
    }

    public void setPlan(PrepaidPlan plan) {
        this.plan = plan;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimal getCreditedAmount() {
        return creditedAmount;
    }

    public void setCreditedAmount(BigDecimal creditedAmount) {
        this.creditedAmount = creditedAmount;
    }

    public BigDecimal getRemainingEnergyKwh() {
        return remainingEnergyKwh;
    }

    public void setRemainingEnergyKwh(BigDecimal remainingEnergyKwh) {
        this.remainingEnergyKwh = remainingEnergyKwh;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(LocalDateTime purchasedAt) {
        this.purchasedAt = purchasedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public static class CustomerPlanBuilder {
        private Long id;
        private User user;
        private PrepaidPlan plan;
        private BigDecimal purchasePrice;
        private BigDecimal creditedAmount;
        private BigDecimal remainingEnergyKwh;
        private String status = "ACTIVE";
        private String idempotencyKey;
        private LocalDateTime purchasedAt;
        private LocalDateTime expiresAt;

        CustomerPlanBuilder() {
        }

        public CustomerPlanBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CustomerPlanBuilder user(User user) {
            this.user = user;
            return this;
        }

        public CustomerPlanBuilder plan(PrepaidPlan plan) {
            this.plan = plan;
            return this;
        }

        public CustomerPlanBuilder purchasePrice(BigDecimal purchasePrice) {
            this.purchasePrice = purchasePrice;
            return this;
        }

        public CustomerPlanBuilder creditedAmount(BigDecimal creditedAmount) {
            this.creditedAmount = creditedAmount;
            return this;
        }

        public CustomerPlanBuilder remainingEnergyKwh(BigDecimal remainingEnergyKwh) {
            this.remainingEnergyKwh = remainingEnergyKwh;
            return this;
        }

        public CustomerPlanBuilder status(String status) {
            this.status = status;
            return this;
        }

        public CustomerPlanBuilder idempotencyKey(String idempotencyKey) {
            this.idempotencyKey = idempotencyKey;
            return this;
        }

        public CustomerPlanBuilder purchasedAt(LocalDateTime purchasedAt) {
            this.purchasedAt = purchasedAt;
            return this;
        }

        public CustomerPlanBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public CustomerPlan build() {
            return new CustomerPlan(id, user, plan, purchasePrice, creditedAmount, remainingEnergyKwh, status, idempotencyKey, purchasedAt, expiresAt);
        }

        @Override
        public String toString() {
            return "CustomerPlan.CustomerPlanBuilder(id=" + this.id + ", user=" + this.user + ", plan=" + this.plan + ", purchasePrice=" + this.purchasePrice + ", creditedAmount=" + this.creditedAmount + ", remainingEnergyKwh=" + this.remainingEnergyKwh + ", status=" + this.status + ", idempotencyKey=" + this.idempotencyKey + ", purchasedAt=" + this.purchasedAt + ", expiresAt=" + this.expiresAt + ")";
        }
    }
}
