package com.voltflow.service;

import com.voltflow.dto.CreateMaintenanceRequest;
import com.voltflow.dto.MaintenanceRecordResponse;
import com.voltflow.dto.PageResponse;
import com.voltflow.dto.UpdateMaintenanceRequest;
import com.voltflow.entity.AuditLog;
import com.voltflow.entity.Charger;
import com.voltflow.entity.MaintenanceRecord;
import com.voltflow.entity.Station;
import com.voltflow.entity.User;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.ChargerRepository;
import com.voltflow.repository.ChargingSessionRepository;
import com.voltflow.repository.MaintenanceRecordRepository;
import com.voltflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Service for administrative maintenance workflows:
 * creation, status updates, technician assignments, charger status sync, and audit logging.
 */
@Service
@Transactional
public class AdminMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(AdminMaintenanceService.class);

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "HARDWARE", "SOFTWARE", "ELECTRICAL", "PHYSICAL_DAMAGE", "ROUTINE", "OTHER"
    );
    private static final Set<String> VALID_SEVERITIES = Set.of(
            "LOW", "MEDIUM", "HIGH", "CRITICAL"
    );
    private static final Set<String> VALID_STATUSES = Set.of(
            "REPORTED", "IN_PROGRESS", "RESOLVED", "CANCELLED"
    );
    private static final List<String> ACTIVE_MAINTENANCE_STATUSES = List.of("REPORTED", "IN_PROGRESS");

    private final MaintenanceRecordRepository maintenanceRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingSessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminMaintenanceService(MaintenanceRecordRepository maintenanceRepository,
                                   ChargerRepository chargerRepository,
                                   ChargingSessionRepository sessionRepository,
                                   AuditLogRepository auditLogRepository,
                                   UserRepository userRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.chargerRepository = chargerRepository;
        this.sessionRepository = sessionRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<MaintenanceRecordResponse> getMaintenanceRecords(Long chargerId, String status, String severity, int page, int size) {
        int pageNum = Math.max(0, page);
        int pageSize = Math.max(1, Math.min(100, size));
        Page<MaintenanceRecord> paged = maintenanceRepository.findFilteredMaintenance(
                chargerId,
                (status != null && !status.isBlank()) ? status.trim() : null,
                (severity != null && !severity.isBlank()) ? severity.trim() : null,
                PageRequest.of(pageNum, pageSize)
        );
        return PageResponse.of(paged.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public MaintenanceRecordResponse getMaintenanceRecord(Long id) {
        return toResponse(findById(id));
    }

    public MaintenanceRecordResponse createMaintenanceRecord(CreateMaintenanceRequest req, String adminEmail) {
        Charger charger = chargerRepository.findById(req.chargerId())
                .orElseThrow(() -> new ResourceNotFoundException("Charger not found with id: " + req.chargerId()));

        validateCategory(req.category());
        validateSeverity(req.severity());

        String reportedBy = (req.reportedBy() != null && !req.reportedBy().isBlank())
                ? req.reportedBy().trim() : adminEmail;

        MaintenanceRecord record = MaintenanceRecord.builder()
                .charger(charger)
                .category(req.category().trim().toUpperCase())
                .description(req.description().trim())
                .severity(req.severity().trim().toUpperCase())
                .status("REPORTED")
                .reportedBy(reportedBy)
                .assignedTechnician(req.assignedTechnician() != null ? req.assignedTechnician().trim() : null)
                .build();

        // If high or critical severity and charger is available, set charger status to MAINTENANCE
        if (Set.of("HIGH", "CRITICAL").contains(record.getSeverity())
                && "AVAILABLE".equalsIgnoreCase(charger.getStatus())) {
            charger.setStatus("MAINTENANCE");
            chargerRepository.save(charger);
            log.info("Charger {} automatically marked as MAINTENANCE due to {} severity maintenance record",
                    charger.getChargerCode(), record.getSeverity());
        }

        MaintenanceRecord saved = maintenanceRepository.save(record);
        audit("CREATE_MAINTENANCE", "MAINTENANCE_RECORD", saved.getId(),
                String.format("Created %s severity maintenance for charger %s: %s",
                        saved.getSeverity(), charger.getChargerCode(), saved.getDescription()),
                adminEmail);

        return toResponse(saved);
    }

    public MaintenanceRecordResponse updateMaintenanceRecord(Long id, UpdateMaintenanceRequest req, String adminEmail) {
        MaintenanceRecord record = findById(id);
        String currentStatus = record.getStatus().toUpperCase();
        String targetStatus = req.status().trim().toUpperCase();

        validateStatus(targetStatus);

        // Terminal state guards
        if ("RESOLVED".equals(currentStatus) && !"RESOLVED".equals(targetStatus)) {
            throw new IllegalStateException("Cannot change status of an already RESOLVED maintenance record.");
        }
        if ("CANCELLED".equals(currentStatus) && !"CANCELLED".equals(targetStatus)) {
            throw new IllegalStateException("Cannot change status of a CANCELLED maintenance record.");
        }

        if (req.category() != null && !req.category().isBlank()) {
            validateCategory(req.category());
            record.setCategory(req.category().trim().toUpperCase());
        }
        if (req.severity() != null && !req.severity().isBlank()) {
            validateSeverity(req.severity());
            record.setSeverity(req.severity().trim().toUpperCase());
        }
        if (req.description() != null && !req.description().isBlank()) {
            record.setDescription(req.description().trim());
        }
        if (req.assignedTechnician() != null) {
            record.setAssignedTechnician(req.assignedTechnician().trim());
        }
        if (req.resolutionNotes() != null) {
            record.setResolutionNotes(req.resolutionNotes().trim());
        }

        Charger charger = record.getCharger();

        // Transition handling
        if ("IN_PROGRESS".equals(targetStatus)) {
            if (charger != null && sessionRepository.existsByChargerIdAndStatus(charger.getId(), "CHARGING")) {
                throw new IllegalStateException("Cannot start maintenance work while charger " + charger.getChargerCode() + " has an active charging session in progress.");
            }
            record.setStatus("IN_PROGRESS");
            if (charger != null && "AVAILABLE".equalsIgnoreCase(charger.getStatus())) {
                charger.setStatus("MAINTENANCE");
                chargerRepository.save(charger);
            }
        } else if ("RESOLVED".equals(targetStatus)) {
            record.setStatus("RESOLVED");
            record.setResolvedAt(LocalDateTime.now());
            // If no other open records exist for this charger, restore charger to AVAILABLE if currently MAINTENANCE
            if (charger != null && "MAINTENANCE".equalsIgnoreCase(charger.getStatus())) {
                boolean otherActive = maintenanceRepository.existsByChargerIdAndStatusInAndIdNot(
                        charger.getId(), ACTIVE_MAINTENANCE_STATUSES, id);
                if (!otherActive) {
                    charger.setStatus("AVAILABLE");
                    chargerRepository.save(charger);
                    log.info("Charger {} restored to AVAILABLE following resolution of maintenance record #{}",
                            charger.getChargerCode(), id);
                }
            }
        } else if ("CANCELLED".equals(targetStatus)) {
            record.setStatus("CANCELLED");
            if (charger != null && "MAINTENANCE".equalsIgnoreCase(charger.getStatus())) {
                boolean otherActive = maintenanceRepository.existsByChargerIdAndStatusInAndIdNot(
                        charger.getId(), ACTIVE_MAINTENANCE_STATUSES, id);
                if (!otherActive) {
                    charger.setStatus("AVAILABLE");
                    chargerRepository.save(charger);
                }
            }
        } else {
            record.setStatus(targetStatus);
        }

        MaintenanceRecord saved = maintenanceRepository.save(record);
        audit("UPDATE_MAINTENANCE", "MAINTENANCE_RECORD", id,
                String.format("Updated maintenance record #%d status to %s", id, targetStatus),
                adminEmail);

        return toResponse(saved);
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private MaintenanceRecord findById(Long id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found with id: " + id));
    }

    private void validateCategory(String category) {
        if (category == null || !VALID_CATEGORIES.contains(category.trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid maintenance category: " + category + ". Allowed: " + VALID_CATEGORIES);
        }
    }

    private void validateSeverity(String severity) {
        if (severity == null || !VALID_SEVERITIES.contains(severity.trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid maintenance severity: " + severity + ". Allowed: " + VALID_SEVERITIES);
        }
    }

    private void validateStatus(String status) {
        if (status == null || !VALID_STATUSES.contains(status.trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid maintenance status: " + status + ". Allowed: " + VALID_STATUSES);
        }
    }

    private MaintenanceRecordResponse toResponse(MaintenanceRecord m) {
        Charger c = m.getCharger();
        Station s = c != null ? c.getStation() : null;
        return new MaintenanceRecordResponse(
                m.getId(),
                c != null ? c.getId() : null,
                c != null ? c.getChargerCode() : null,
                s != null ? s.getId() : null,
                s != null ? s.getName() : null,
                m.getCategory(),
                m.getDescription(),
                m.getSeverity(),
                m.getStatus(),
                m.getReportedBy(),
                m.getAssignedTechnician(),
                m.getResolutionNotes(),
                m.getResolvedAt(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }

    private void audit(String action, String entityType, Long entityId, String details, String adminEmail) {
        User actor = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditLogRepository.save(AuditLog.builder()
                .actorUser(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build());
    }
}
