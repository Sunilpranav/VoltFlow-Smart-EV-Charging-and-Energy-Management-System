package com.voltflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "stations")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "status", length = 50)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Charger> chargers = new HashSet<>();

    public Station() {
    }

    public Station(Long id, String name, String address, Double latitude, Double longitude, String status, LocalDateTime createdAt, Set<Charger> chargers) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.createdAt = createdAt;
        this.chargers = chargers != null ? chargers : new HashSet<>();
    }

    public static StationBuilder builder() {
        return new StationBuilder();
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<Charger> getChargers() {
        return chargers;
    }

    public void setChargers(Set<Charger> chargers) {
        this.chargers = chargers;
    }

    public static class StationBuilder {
        private Long id;
        private String name;
        private String address;
        private Double latitude;
        private Double longitude;
        private String status;
        private LocalDateTime createdAt;
        private Set<Charger> chargers = new HashSet<>();

        StationBuilder() {
        }

        public StationBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public StationBuilder name(String name) {
            this.name = name;
            return this;
        }

        public StationBuilder address(String address) {
            this.address = address;
            return this;
        }

        public StationBuilder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }

        public StationBuilder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }

        public StationBuilder status(String status) {
            this.status = status;
            return this;
        }

        public StationBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public StationBuilder chargers(Set<Charger> chargers) {
            this.chargers = chargers;
            return this;
        }

        public Station build() {
            return new Station(id, name, address, latitude, longitude, status, createdAt, chargers);
        }

        @Override
        public String toString() {
            return "Station.StationBuilder(id=" + this.id + ", name=" + this.name + ", address=" + this.address + ", latitude=" + this.latitude + ", longitude=" + this.longitude + ", status=" + this.status + ", createdAt=" + this.createdAt + ", chargers=" + this.chargers + ")";
        }
    }
}
