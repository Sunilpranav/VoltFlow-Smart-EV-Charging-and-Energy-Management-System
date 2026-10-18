package com.voltflow.service;

import com.voltflow.dto.*;
import com.voltflow.entity.*;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Admin-only service for station and charger write operations.
 */
@Service
@Transactional
public class AdminStationService {

    private static final Set<String> VALID_STATION_STATUSES = Set.of("ACTIVE", "INACTIVE", "MAINTENANCE");
    private static final Set<String> VALID_CHARGER_STATUSES = Set.of("AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_ORDER");
    private static final Set<String> VALID_CONNECTOR_TYPES = Set.of("CCS2", "CHAdeMO", "Type 2", "GBT", "CSS1", "OTHER");

    private final StationRepository stationRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingSessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminStationService(StationRepository stationRepository,
                               ChargerRepository chargerRepository,
                               ChargingSessionRepository sessionRepository,
                               AuditLogRepository auditLogRepository,
                               UserRepository userRepository) {
        this.stationRepository = stationRepository;
        this.chargerRepository = chargerRepository;
        this.sessionRepository = sessionRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    // ── Stations ──────────────────────────────────────────────────────────────

    public StationResponse createStation(CreateStationRequest req, String actorEmail) {
        validateStationStatus(req.status());

        Station station = Station.builder()
                .name(req.name().trim())
                .address(req.address().trim())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .status(req.status() != null ? req.status().toUpperCase() : "ACTIVE")
                .build();

        Station saved = stationRepository.save(station);
        audit("CREATE_STATION", "STATION", saved.getId(),
                "Created station: " + saved.getName(), actorEmail);

        return toStationResponse(saved, List.of());
    }

    public StationResponse updateStation(Long id, UpdateStationRequest req, String actorEmail) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found: " + id));
        validateStationStatus(req.status());

        String old = station.getName();
        station.setName(req.name().trim());
        station.setAddress(req.address().trim());
        station.setLatitude(req.latitude());
        station.setLongitude(req.longitude());
        if (req.status() != null) station.setStatus(req.status().toUpperCase());

        Station saved = stationRepository.save(station);
        audit("UPDATE_STATION", "STATION", id,
                "Updated station " + old + " -> " + saved.getName(), actorEmail);

        List<ChargerResponse> chargers = chargerRepository.findByStationId(id)
                .stream().map(this::toChargerResponse).toList();
        return toStationResponse(saved, chargers);
    }

    /**
     * Safe deactivation: sets status to INACTIVE.
     * Refuses if any charger has an active (CHARGING) session.
     */
    public void deactivateStation(Long id, String actorEmail) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found: " + id));

        boolean hasActiveSessions = sessionRepository.existsByStationIdAndStatus(id, "CHARGING");
        if (hasActiveSessions) {
            throw new IllegalStateException(
                    "Cannot deactivate station " + id + " — it has active charging sessions in progress.");
        }

        station.setStatus("INACTIVE");
        stationRepository.save(station);

        // Mark available chargers as OUT_OF_ORDER to prevent charging
        List<Charger> chargers = chargerRepository.findByStationId(id);
        for (Charger c : chargers) {
            if ("AVAILABLE".equalsIgnoreCase(c.getStatus())) {
                c.setStatus("OUT_OF_ORDER");
                chargerRepository.save(c);
            }
        }

        audit("DEACTIVATE_STATION", "STATION", id,
                "Deactivated station: " + station.getName(), actorEmail);
    }

    // ── Chargers ──────────────────────────────────────────────────────────────

    public ChargerResponse createCharger(CreateChargerRequest req, String actorEmail) {
        Station station = stationRepository.findById(req.stationId())
                .orElseThrow(() -> new ResourceNotFoundException("Station not found: " + req.stationId()));

        validateConnectorType(req.connectorType());
        validateChargerStatus(req.status());

        if (chargerRepository.existsByChargerCode(req.chargerCode().trim())) {
            throw new IllegalArgumentException("Charger code already exists: " + req.chargerCode());
        }

        Charger charger = Charger.builder()
                .station(station)
                .chargerCode(req.chargerCode().trim())
                .connectorType(req.connectorType().trim())
                .maxPowerKw(req.maxPowerKw())
                .status(req.status() != null ? req.status().toUpperCase() : "AVAILABLE")
                .build();

        Charger saved = chargerRepository.save(charger);
        audit("CREATE_CHARGER", "CHARGER", saved.getId(),
                "Created charger " + saved.getChargerCode() + " at station " + station.getName(), actorEmail);

        return toChargerResponse(saved);
    }

    public ChargerResponse updateCharger(Long id, UpdateChargerRequest req, String actorEmail) {
        Charger charger = chargerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charger not found: " + id));

        validateConnectorType(req.connectorType());
        validateChargerStatus(req.status());

        // Prevent status change while actively charging
        if (req.status() != null && !req.status().equalsIgnoreCase(charger.getStatus())) {
            boolean activeSession = sessionRepository.existsByChargerIdAndStatus(id, "CHARGING");
            if (activeSession) {
                throw new IllegalStateException(
                        "Cannot change charger status — it has an active charging session.");
            }
        }

        // Code uniqueness (allow same code if unchanged)
        if (!charger.getChargerCode().equalsIgnoreCase(req.chargerCode().trim())
                && chargerRepository.existsByChargerCodeAndIdNot(req.chargerCode().trim(), id)) {
            throw new IllegalArgumentException("Charger code already used: " + req.chargerCode());
        }

        charger.setChargerCode(req.chargerCode().trim());
        charger.setConnectorType(req.connectorType().trim());
        charger.setMaxPowerKw(req.maxPowerKw());
        if (req.status() != null) charger.setStatus(req.status().toUpperCase());

        Charger saved = chargerRepository.save(charger);
        audit("UPDATE_CHARGER", "CHARGER", id,
                "Updated charger " + saved.getChargerCode(), actorEmail);

        return toChargerResponse(saved);
    }

    public void deactivateCharger(Long id, String actorEmail) {
        Charger charger = chargerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charger not found: " + id));

        boolean activeSession = sessionRepository.existsByChargerIdAndStatus(id, "CHARGING");
        if (activeSession) {
            throw new IllegalStateException(
                    "Cannot deactivate charger " + id + " — it has an active charging session.");
        }

        charger.setStatus("OUT_OF_ORDER");
        chargerRepository.save(charger);
        audit("DEACTIVATE_CHARGER", "CHARGER", id,
                "Deactivated charger: " + charger.getChargerCode(), actorEmail);
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    private void validateStationStatus(String status) {
        if (status != null && !VALID_STATION_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid station status: " + status + ". Allowed: " + VALID_STATION_STATUSES);
        }
    }

    private void validateChargerStatus(String status) {
        if (status != null && !VALID_CHARGER_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid charger status: " + status + ". Allowed: " + VALID_CHARGER_STATUSES);
        }
    }

    private void validateConnectorType(String type) {
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Connector type is required");
        }
        // Accept any non-blank value — connector types are extensible
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private StationResponse toStationResponse(Station s, List<ChargerResponse> chargers) {
        long available = chargers.stream()
                .filter(c -> "AVAILABLE".equalsIgnoreCase(c.status())).count();
        return new StationResponse(s.getId(), s.getName(), s.getAddress(),
                s.getLatitude(), s.getLongitude(), s.getStatus(),
                chargers.size(), (int) available, chargers, s.getCreatedAt());
    }

    private ChargerResponse toChargerResponse(Charger c) {
        return new ChargerResponse(c.getId(),
                c.getStation() != null ? c.getStation().getId() : null,
                c.getChargerCode(), c.getConnectorType(), c.getMaxPowerKw(),
                c.getStatus(), c.getCreatedAt());
    }

    // ── Audit helper ──────────────────────────────────────────────────────────

    private void audit(String action, String entityType, Long entityId, String details, String actorEmail) {
        User actor = null;
        if (actorEmail != null) {
            actor = userRepository.findByEmail(actorEmail).orElse(null);
        }
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .actorUser(actor)
                .build());
    }
}
