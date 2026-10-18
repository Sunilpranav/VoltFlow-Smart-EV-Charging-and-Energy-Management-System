package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "chargers")
public class Charger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @Column(name = "charger_code", nullable = false, length = 100)
    private String chargerCode;

    @Column(name = "connector_type", length = 50)
    private String connectorType;

    @Column(name = "max_power_kw", precision = 10, scale = 2)
    private BigDecimal maxPowerKw;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "meter_reading_kwh", precision = 12, scale = 4, nullable = false)
    private BigDecimal meterReadingKwh = new BigDecimal("1000.0000");

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Charger() {
    }

    public Charger(Long id, Station station, String chargerCode, String connectorType, BigDecimal maxPowerKw, String status, LocalDateTime createdAt) {
        this.id = id;
        this.station = station;
        this.chargerCode = chargerCode;
        this.connectorType = connectorType;
        this.maxPowerKw = maxPowerKw;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static ChargerBuilder builder() {
        return new ChargerBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Station getStation() {
        return station;
    }

    public void setStation(Station station) {
        this.station = station;
    }

    public String getChargerCode() {
        return chargerCode;
    }

    public void setChargerCode(String chargerCode) {
        this.chargerCode = chargerCode;
    }

    public String getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(String connectorType) {
        this.connectorType = connectorType;
    }

    public BigDecimal getMaxPowerKw() {
        return maxPowerKw;
    }

    public void setMaxPowerKw(BigDecimal maxPowerKw) {
        this.maxPowerKw = maxPowerKw;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getMeterReadingKwh() {
        return meterReadingKwh;
    }

    public void setMeterReadingKwh(BigDecimal meterReadingKwh) {
        this.meterReadingKwh = meterReadingKwh;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class ChargerBuilder {
        private Long id;
        private Station station;
        private String chargerCode;
        private String connectorType;
        private BigDecimal maxPowerKw;
        private String status;
        private BigDecimal meterReadingKwh = new BigDecimal("1000.0000");
        private LocalDateTime createdAt;

        ChargerBuilder() {
        }

        public ChargerBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ChargerBuilder station(Station station) {
            this.station = station;
            return this;
        }

        public ChargerBuilder chargerCode(String chargerCode) {
            this.chargerCode = chargerCode;
            return this;
        }

        public ChargerBuilder connectorType(String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        public ChargerBuilder maxPowerKw(BigDecimal maxPowerKw) {
            this.maxPowerKw = maxPowerKw;
            return this;
        }

        public ChargerBuilder status(String status) {
            this.status = status;
            return this;
        }

        public ChargerBuilder meterReadingKwh(BigDecimal meterReadingKwh) {
            this.meterReadingKwh = meterReadingKwh;
            return this;
        }

        public ChargerBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Charger build() {
            Charger charger = new Charger(id, station, chargerCode, connectorType, maxPowerKw, status, createdAt);
            charger.setMeterReadingKwh(meterReadingKwh);
            return charger;
        }

        @Override
        public String toString() {
            return "Charger.ChargerBuilder(id=" + this.id + ", station=" + this.station + ", chargerCode=" + this.chargerCode + ", connectorType=" + this.connectorType + ", maxPowerKw=" + this.maxPowerKw + ", status=" + this.status + ", meterReadingKwh=" + this.meterReadingKwh + ", createdAt=" + this.createdAt + ")";
        }
    }
}
