package com.voltflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charger_id", nullable = false)
    private Charger charger;

    @Column(name = "category", nullable = false, length = 50)
    private String category; // HARDWARE, SOFTWARE, ELECTRICAL, PHYSICAL_DAMAGE, ROUTINE, OTHER

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "status", nullable = false, length = 30)
    private String status = "REPORTED"; // REPORTED, IN_PROGRESS, RESOLVED, CANCELLED

    @Column(name = "reported_by")
    private String reportedBy;

    @Column(name = "assigned_technician")
    private String assignedTechnician;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public MaintenanceRecord() {
    }

    public MaintenanceRecord(Long id, Charger charger, String category, String description, String severity, String status, String reportedBy, String assignedTechnician, String resolutionNotes, LocalDateTime resolvedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.charger = charger;
        this.category = category;
        this.description = description;
        this.severity = severity;
        this.status = status != null ? status : "REPORTED";
        this.reportedBy = reportedBy;
        this.assignedTechnician = assignedTechnician;
        this.resolutionNotes = resolutionNotes;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static MaintenanceRecordBuilder builder() {
        return new MaintenanceRecordBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Charger getCharger() {
        return charger;
    }

    public void setCharger(Charger charger) {
        this.charger = charger;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public String getAssignedTechnician() {
        return assignedTechnician;
    }

    public void setAssignedTechnician(String assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
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

    public static class MaintenanceRecordBuilder {
        private Long id;
        private Charger charger;
        private String category;
        private String description;
        private String severity;
        private String status = "REPORTED";
        private String reportedBy;
        private String assignedTechnician;
        private String resolutionNotes;
        private LocalDateTime resolvedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        MaintenanceRecordBuilder() {
        }

        public MaintenanceRecordBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public MaintenanceRecordBuilder charger(Charger charger) {
            this.charger = charger;
            return this;
        }

        public MaintenanceRecordBuilder category(String category) {
            this.category = category;
            return this;
        }

        public MaintenanceRecordBuilder description(String description) {
            this.description = description;
            return this;
        }

        public MaintenanceRecordBuilder severity(String severity) {
            this.severity = severity;
            return this;
        }

        public MaintenanceRecordBuilder status(String status) {
            this.status = status;
            return this;
        }

        public MaintenanceRecordBuilder reportedBy(String reportedBy) {
            this.reportedBy = reportedBy;
            return this;
        }

        public MaintenanceRecordBuilder assignedTechnician(String assignedTechnician) {
            this.assignedTechnician = assignedTechnician;
            return this;
        }

        public MaintenanceRecordBuilder resolutionNotes(String resolutionNotes) {
            this.resolutionNotes = resolutionNotes;
            return this;
        }

        public MaintenanceRecordBuilder resolvedAt(LocalDateTime resolvedAt) {
            this.resolvedAt = resolvedAt;
            return this;
        }

        public MaintenanceRecordBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public MaintenanceRecordBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public MaintenanceRecord build() {
            return new MaintenanceRecord(id, charger, category, description, severity, status, reportedBy, assignedTechnician, resolutionNotes, resolvedAt, createdAt, updatedAt);
        }

        @Override
        public String toString() {
            return "MaintenanceRecord.MaintenanceRecordBuilder(id=" + this.id + ", charger=" + this.charger + ", category=" + this.category + ", description=" + this.description + ", severity=" + this.severity + ", status=" + this.status + ", reportedBy=" + this.reportedBy + ", assignedTechnician=" + this.assignedTechnician + ", resolutionNotes=" + this.resolutionNotes + ", resolvedAt=" + this.resolvedAt + ", createdAt=" + this.createdAt + ", updatedAt=" + this.updatedAt + ")";
        }
    }
}
