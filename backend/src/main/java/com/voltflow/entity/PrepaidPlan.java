package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prepaid_plans")
public class PrepaidPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "credit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal creditAmount;

    @Column(name = "energy_allowance_kwh", precision = 10, scale = 2)
    private BigDecimal energyAllowanceKwh;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays = 30;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public PrepaidPlan() {
    }

    public PrepaidPlan(Long id, String name, String description, BigDecimal price, BigDecimal creditAmount, BigDecimal energyAllowanceKwh, Integer validityDays, String currency, Boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.creditAmount = creditAmount;
        this.energyAllowanceKwh = energyAllowanceKwh;
        this.validityDays = validityDays != null ? validityDays : 30;
        this.currency = currency != null ? currency : "USD";
        this.active = active != null ? active : true;
        this.createdAt = createdAt;
    }

    public static PrepaidPlanBuilder builder() {
        return new PrepaidPlanBuilder();
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getCreditAmount() {
        return creditAmount;
    }

    public void setCreditAmount(BigDecimal creditAmount) {
        this.creditAmount = creditAmount;
    }

    public BigDecimal getEnergyAllowanceKwh() {
        return energyAllowanceKwh;
    }

    public void setEnergyAllowanceKwh(BigDecimal energyAllowanceKwh) {
        this.energyAllowanceKwh = energyAllowanceKwh;
    }

    public Integer getValidityDays() {
        return validityDays;
    }

    public void setValidityDays(Integer validityDays) {
        this.validityDays = validityDays;
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

    public static class PrepaidPlanBuilder {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private BigDecimal creditAmount;
        private BigDecimal energyAllowanceKwh;
        private Integer validityDays = 30;
        private String currency = "USD";
        private Boolean active = true;
        private LocalDateTime createdAt;

        PrepaidPlanBuilder() {
        }

        public PrepaidPlanBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PrepaidPlanBuilder name(String name) {
            this.name = name;
            return this;
        }

        public PrepaidPlanBuilder description(String description) {
            this.description = description;
            return this;
        }

        public PrepaidPlanBuilder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public PrepaidPlanBuilder creditAmount(BigDecimal creditAmount) {
            this.creditAmount = creditAmount;
            return this;
        }

        public PrepaidPlanBuilder energyAllowanceKwh(BigDecimal energyAllowanceKwh) {
            this.energyAllowanceKwh = energyAllowanceKwh;
            return this;
        }

        public PrepaidPlanBuilder validityDays(Integer validityDays) {
            this.validityDays = validityDays;
            return this;
        }

        public PrepaidPlanBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public PrepaidPlanBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public PrepaidPlanBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PrepaidPlan build() {
            return new PrepaidPlan(id, name, description, price, creditAmount, energyAllowanceKwh, validityDays, currency, active, createdAt);
        }

        @Override
        public String toString() {
            return "PrepaidPlan.PrepaidPlanBuilder(id=" + this.id + ", name=" + this.name + ", description=" + this.description + ", price=" + this.price + ", creditAmount=" + this.creditAmount + ", energyAllowanceKwh=" + this.energyAllowanceKwh + ", validityDays=" + this.validityDays + ", currency=" + this.currency + ", active=" + this.active + ", createdAt=" + this.createdAt + ")";
        }
    }
}
