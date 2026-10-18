package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles", uniqueConstraints = {@UniqueConstraint(columnNames = {"registration_number", "user_id"})})
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(name = "registration_number", nullable = false, length = 50)
    private String registrationNumber;

    @Column(name = "make", length = 100)
    private String make;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "battery_capacity_kwh", precision = 10, scale = 2)
    private BigDecimal batteryCapacityKwh;

    @Column(name = "connector_type", length = 50)
    private String connectorType;

    @Column(name = "model_year")
    private Integer modelYear;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Vehicle() {
    }

    public Vehicle(Long id, User owner, String registrationNumber, String make, String model, BigDecimal batteryCapacityKwh, String connectorType, Integer modelYear, LocalDateTime createdAt) {
        this.id = id;
        this.owner = owner;
        this.registrationNumber = registrationNumber;
        this.make = make;
        this.model = model;
        this.batteryCapacityKwh = batteryCapacityKwh;
        this.connectorType = connectorType;
        this.modelYear = modelYear;
        this.createdAt = createdAt;
    }

    public static VehicleBuilder builder() {
        return new VehicleBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public BigDecimal getBatteryCapacityKwh() {
        return batteryCapacityKwh;
    }

    public void setBatteryCapacityKwh(BigDecimal batteryCapacityKwh) {
        this.batteryCapacityKwh = batteryCapacityKwh;
    }

    public String getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(String connectorType) {
        this.connectorType = connectorType;
    }

    public Integer getModelYear() {
        return modelYear;
    }

    public void setModelYear(Integer modelYear) {
        this.modelYear = modelYear;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class VehicleBuilder {
        private Long id;
        private User owner;
        private String registrationNumber;
        private String make;
        private String model;
        private BigDecimal batteryCapacityKwh;
        private String connectorType;
        private Integer modelYear;
        private LocalDateTime createdAt;

        VehicleBuilder() {
        }

        public VehicleBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public VehicleBuilder owner(User owner) {
            this.owner = owner;
            return this;
        }

        public VehicleBuilder registrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
            return this;
        }

        public VehicleBuilder make(String make) {
            this.make = make;
            return this;
        }

        public VehicleBuilder model(String model) {
            this.model = model;
            return this;
        }

        public VehicleBuilder batteryCapacityKwh(BigDecimal batteryCapacityKwh) {
            this.batteryCapacityKwh = batteryCapacityKwh;
            return this;
        }

        public VehicleBuilder connectorType(String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        public VehicleBuilder modelYear(Integer modelYear) {
            this.modelYear = modelYear;
            return this;
        }

        public VehicleBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Vehicle build() {
            return new Vehicle(id, owner, registrationNumber, make, model, batteryCapacityKwh, connectorType, modelYear, createdAt);
        }

        @Override
        public String toString() {
            return "Vehicle.VehicleBuilder(id=" + this.id + ", owner=" + this.owner + ", registrationNumber=" + this.registrationNumber + ", make=" + this.make + ", model=" + this.model + ", batteryCapacityKwh=" + this.batteryCapacityKwh + ", connectorType=" + this.connectorType + ", modelYear=" + this.modelYear + ", createdAt=" + this.createdAt + ")";
        }
    }
}
