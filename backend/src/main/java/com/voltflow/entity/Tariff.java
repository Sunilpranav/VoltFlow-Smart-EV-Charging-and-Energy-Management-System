package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tariffs")
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "rate_per_kwh", nullable = false, precision = 10, scale = 4)
    private BigDecimal ratePerKwh;

    @Column(name = "connector_type")
    private String connectorType;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Tariff() {
    }

    public Tariff(Long id, String name, BigDecimal ratePerKwh, String connectorType, String currency, Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.ratePerKwh = ratePerKwh;
        this.connectorType = connectorType;
        this.currency = currency != null ? currency : "USD";
        this.active = active != null ? active : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static TariffBuilder builder() {
        return new TariffBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getRatePerKwh() {
        return ratePerKwh;
    }

    public void setRatePerKwh(BigDecimal ratePerKwh) {
        this.ratePerKwh = ratePerKwh;
    }

    public String getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(String connectorType) {
        this.connectorType = connectorType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    public static class TariffBuilder {
        private Long id;
        private String name;
        private BigDecimal ratePerKwh;
        private String connectorType;
        private String currency = "USD";
        private Boolean active = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        TariffBuilder() {
        }

        public TariffBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TariffBuilder name(String name) {
            this.name = name;
            return this;
        }

        public TariffBuilder ratePerKwh(BigDecimal ratePerKwh) {
            this.ratePerKwh = ratePerKwh;
            return this;
        }

        public TariffBuilder connectorType(String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        public TariffBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public TariffBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public TariffBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TariffBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Tariff build() {
            return new Tariff(id, name, ratePerKwh, connectorType, currency, active, createdAt, updatedAt);
        }

        @Override
        public String toString() {
            return "Tariff.TariffBuilder(id=" + this.id + ", name=" + this.name + ", ratePerKwh=" + this.ratePerKwh + ", connectorType=" + this.connectorType + ", currency=" + this.currency + ", active=" + this.active + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ")";
        }
    }
}
