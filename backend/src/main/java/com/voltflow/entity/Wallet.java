package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Wallet() {
    }

    public Wallet(Long id, User user, BigDecimal balance, String currency, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.balance = balance != null ? balance : BigDecimal.ZERO;
        this.currency = currency != null ? currency : "USD";
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static WalletBuilder builder() {
        return new WalletBuilder();
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

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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

    public static class WalletBuilder {
        private Long id;
        private User user;
        private BigDecimal balance = BigDecimal.ZERO;
        private String currency = "USD";
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        WalletBuilder() {
        }

        public WalletBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalletBuilder user(User user) {
            this.user = user;
            return this;
        }

        public WalletBuilder balance(BigDecimal balance) {
            this.balance = balance;
            return this;
        }

        public WalletBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public WalletBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalletBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Wallet build() {
            return new Wallet(id, user, balance, currency, createdAt, updatedAt);
        }

        @Override
        public String toString() {
            return "Wallet.WalletBuilder(id=" + this.id + ", user=" + this.user + ", balance=" + this.balance + ", currency=" + this.currency + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ")";
        }
    }
}
