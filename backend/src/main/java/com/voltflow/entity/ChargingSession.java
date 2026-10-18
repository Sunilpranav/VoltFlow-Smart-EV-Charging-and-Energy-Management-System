package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "charging_sessions")
public class ChargingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charger_id", nullable = false)
    private Charger charger;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // PENDING, CHARGING, COMPLETED, CANCELLED, FAILED

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "stop_time")
    private LocalDateTime stopTime;

    @Column(name = "start_meter_kwh", nullable = false, precision = 12, scale = 4)
    private BigDecimal startMeterKwh;

    @Column(name = "stop_meter_kwh", precision = 12, scale = 4)
    private BigDecimal stopMeterKwh;

    @Column(name = "energy_consumed_kwh", precision = 12, scale = 4)
    private BigDecimal energyConsumedKwh;

    @Column(name = "tariff_per_kwh", nullable = false, precision = 10, scale = 4)
    private BigDecimal tariffPerKwh;

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus = "UNPAID"; // UNPAID, PAID, REFUNDED

    @Column(name = "simulation_note", length = 255)
    private String simulationNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ChargingSession() {
    }

    public ChargingSession(Long id, User customer, Vehicle vehicle, Station station, Charger charger, String status, LocalDateTime startTime, LocalDateTime stopTime, BigDecimal startMeterKwh, BigDecimal stopMeterKwh, BigDecimal energyConsumedKwh, BigDecimal tariffPerKwh, BigDecimal totalCost, String paymentStatus, String simulationNote, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.customer = customer;
        this.vehicle = vehicle;
        this.station = station;
        this.charger = charger;
        this.status = status;
        this.startTime = startTime;
        this.stopTime = stopTime;
        this.startMeterKwh = startMeterKwh;
        this.stopMeterKwh = stopMeterKwh;
        this.energyConsumedKwh = energyConsumedKwh;
        this.tariffPerKwh = tariffPerKwh;
        this.totalCost = totalCost;
        this.paymentStatus = paymentStatus != null ? paymentStatus : "UNPAID";
        this.simulationNote = simulationNote;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ChargingSessionBuilder builder() {
        return new ChargingSessionBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Station getStation() {
        return station;
    }

    public void setStation(Station station) {
        this.station = station;
    }

    public Charger getCharger() {
        return charger;
    }

    public void setCharger(Charger charger) {
        this.charger = charger;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getStopTime() {
        return stopTime;
    }

    public void setStopTime(LocalDateTime stopTime) {
        this.stopTime = stopTime;
    }

    public BigDecimal getStartMeterKwh() {
        return startMeterKwh;
    }

    public void setStartMeterKwh(BigDecimal startMeterKwh) {
        this.startMeterKwh = startMeterKwh;
    }

    public BigDecimal getStopMeterKwh() {
        return stopMeterKwh;
    }

    public void setStopMeterKwh(BigDecimal stopMeterKwh) {
        this.stopMeterKwh = stopMeterKwh;
    }

    public BigDecimal getEnergyConsumedKwh() {
        return energyConsumedKwh;
    }

    public void setEnergyConsumedKwh(BigDecimal energyConsumedKwh) {
        this.energyConsumedKwh = energyConsumedKwh;
    }

    public BigDecimal getTariffPerKwh() {
        return tariffPerKwh;
    }

    public void setTariffPerKwh(BigDecimal tariffPerKwh) {
        this.tariffPerKwh = tariffPerKwh;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getSimulationNote() {
        return simulationNote;
    }

    public void setSimulationNote(String simulationNote) {
        this.simulationNote = simulationNote;
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

    public static class ChargingSessionBuilder {
        private Long id;
        private User customer;
        private Vehicle vehicle;
        private Station station;
        private Charger charger;
        private String status;
        private LocalDateTime startTime;
        private LocalDateTime stopTime;
        private BigDecimal startMeterKwh;
        private BigDecimal stopMeterKwh;
        private BigDecimal energyConsumedKwh;
        private BigDecimal tariffPerKwh;
        private BigDecimal totalCost;
        private String paymentStatus = "UNPAID";
        private String simulationNote;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        ChargingSessionBuilder() {
        }

        public ChargingSessionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ChargingSessionBuilder customer(User customer) {
            this.customer = customer;
            return this;
        }

        public ChargingSessionBuilder vehicle(Vehicle vehicle) {
            this.vehicle = vehicle;
            return this;
        }

        public ChargingSessionBuilder station(Station station) {
            this.station = station;
            return this;
        }

        public ChargingSessionBuilder charger(Charger charger) {
            this.charger = charger;
            return this;
        }

        public ChargingSessionBuilder status(String status) {
            this.status = status;
            return this;
        }

        public ChargingSessionBuilder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public ChargingSessionBuilder stopTime(LocalDateTime stopTime) {
            this.stopTime = stopTime;
            return this;
        }

        public ChargingSessionBuilder startMeterKwh(BigDecimal startMeterKwh) {
            this.startMeterKwh = startMeterKwh;
            return this;
        }

        public ChargingSessionBuilder stopMeterKwh(BigDecimal stopMeterKwh) {
            this.stopMeterKwh = stopMeterKwh;
            return this;
        }

        public ChargingSessionBuilder energyConsumedKwh(BigDecimal energyConsumedKwh) {
            this.energyConsumedKwh = energyConsumedKwh;
            return this;
        }

        public ChargingSessionBuilder tariffPerKwh(BigDecimal tariffPerKwh) {
            this.tariffPerKwh = tariffPerKwh;
            return this;
        }

        public ChargingSessionBuilder totalCost(BigDecimal totalCost) {
            this.totalCost = totalCost;
            return this;
        }

        public ChargingSessionBuilder paymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
            return this;
        }

        public ChargingSessionBuilder simulationNote(String simulationNote) {
            this.simulationNote = simulationNote;
            return this;
        }

        public ChargingSessionBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ChargingSessionBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public ChargingSession build() {
            return new ChargingSession(id, customer, vehicle, station, charger, status, startTime, stopTime, startMeterKwh, stopMeterKwh, energyConsumedKwh, tariffPerKwh, totalCost, paymentStatus, simulationNote, createdAt, updatedAt);
        }

        @Override
        public String toString() {
            return "ChargingSession.ChargingSessionBuilder(id=" + this.id + ", customer=" + this.customer + ", vehicle=" + this.vehicle + ", station=" + this.station + ", charger=" + this.charger + ", status=" + this.status + ", startTime=" + this.startTime + ", stopTime=" + this.stopTime + ", startMeterKwh=" + this.startMeterKwh + ", stopMeterKwh=" + this.stopMeterKwh + ", energyConsumedKwh=" + this.energyConsumedKwh + ", tariffPerKwh=" + this.tariffPerKwh + ", totalCost=" + this.totalCost + ", paymentStatus=" + this.paymentStatus + ", simulationNote=" + this.simulationNote + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ")";
        }
    }
}
