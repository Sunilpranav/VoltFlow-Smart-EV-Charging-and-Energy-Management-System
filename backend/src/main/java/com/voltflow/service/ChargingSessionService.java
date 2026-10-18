package com.voltflow.service;

import com.voltflow.dto.ChargingSessionResponse;
import com.voltflow.dto.SessionSummaryResponse;
import com.voltflow.dto.StartSessionRequest;
import com.voltflow.entity.*;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ChargingSessionService {

    private final ChargingSessionRepository chargingSessionRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ChargerRepository chargerRepository;
    private final TariffRepository tariffRepository;
    private final AuditLogRepository auditLogRepository;
    private final ChargingSimulatorService simulatorService;

    public ChargingSessionService(ChargingSessionRepository chargingSessionRepository,
                                  UserRepository userRepository,
                                  VehicleRepository vehicleRepository,
                                  ChargerRepository chargerRepository,
                                  TariffRepository tariffRepository,
                                  AuditLogRepository auditLogRepository,
                                  ChargingSimulatorService simulatorService) {
        this.chargingSessionRepository = chargingSessionRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.chargerRepository = chargerRepository;
        this.tariffRepository = tariffRepository;
        this.auditLogRepository = auditLogRepository;
        this.simulatorService = simulatorService;
    }

    public ChargingSessionResponse startSession(StartSessionRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.vehicleId()));

        if (!vehicle.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to charge with vehicle: " + request.vehicleId());
        }

        Charger charger = chargerRepository.findById(request.chargerId())
                .orElseThrow(() -> new ResourceNotFoundException("Charger not found with id: " + request.chargerId()));

        // Validate connector compatibility
        validateConnectorCompatibility(vehicle, charger);

        // Validate station status
        if (charger.getStation() != null && !"ACTIVE".equalsIgnoreCase(charger.getStation().getStatus())) {
            throw new IllegalStateException("Station " + charger.getStation().getName() + " is currently unavailable (" + charger.getStation().getStatus() + ")");
        }

        // Atomically occupy charger at the database level to prevent concurrent double-allocation
        int updatedRows = chargerRepository.occupyChargerIfAvailable(charger.getId());
        if (updatedRows == 0 || chargingSessionRepository.existsByChargerIdAndStatus(charger.getId(), "CHARGING")) {
            throw new IllegalStateException("Charger " + charger.getChargerCode() + " is currently in use or unavailable");
        }
        charger.setStatus("OCCUPIED");

        // Determine applicable tariff
        BigDecimal tariffPerKwh = resolveTariff(charger);

        // Simulated starting meter reading on the charger
        BigDecimal startMeterKwh = charger.getMeterReadingKwh() != null
                ? charger.getMeterReadingKwh()
                : new BigDecimal("1000.0000");

        LocalDateTime now = LocalDateTime.now();

        // Create new session
        ChargingSession session = ChargingSession.builder()
                .customer(user)
                .vehicle(vehicle)
                .station(charger.getStation())
                .charger(charger)
                .status("CHARGING")
                .startTime(now)
                .startMeterKwh(startMeterKwh)
                .tariffPerKwh(tariffPerKwh)
                .simulationNote("Deterministic simulation active (" + charger.getMaxPowerKw() + " kW output)")
                .build();

        ChargingSession savedSession = chargingSessionRepository.save(session);

        // Audit log
        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("START_CHARGING_SESSION")
                .entityType("CHARGING_SESSION")
                .entityId(savedSession.getId())
                .details(String.format("Started session on %s with %s %s (Tariff: $%s/kWh)",
                        charger.getChargerCode(), vehicle.getMake(), vehicle.getModel(), tariffPerKwh))
                .build());

        return mapToResponse(savedSession);
    }

    @Transactional(readOnly = true)
    public List<ChargingSessionResponse> getSessions(String userEmail) {
        User user = getUserByEmail(userEmail);
        return chargingSessionRepository.findByCustomerIdOrderByStartTimeDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChargingSessionResponse getSessionById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        ChargingSession session = chargingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + id));

        validateOwnership(session, user);
        return mapToResponse(session);
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChargingSessionService.class);

    public ChargingSessionResponse stopSession(Long id, String userEmail) {
        return stopSessionInternal(id, getUserByEmail(userEmail));
    }

    @Transactional
    public int autoStopStaleSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(4);
        List<Long> staleIds = chargingSessionRepository.findByStatusIgnoreCase("CHARGING").stream()
                .filter(session -> session.getStartTime() != null && session.getStartTime().isBefore(cutoff))
                .map(ChargingSession::getId)
                .toList();
        int stopped = 0;
        for (Long id : staleIds) {
            try {
                stopSessionInternal(id, null);
                stopped++;
            } catch (RuntimeException ex) {
                log.warn("Unable to auto-stop stale charging session #{}: {}", id, ex.getMessage());
            }
        }
        return stopped;
    }

    private ChargingSessionResponse stopSessionInternal(Long id, User user) {
        ChargingSession session = chargingSessionRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + id));

        if (user != null) {
            validateOwnership(session, user);
        }

        // Idempotency: If already completed, return existing result without re-billing
        if ("COMPLETED".equalsIgnoreCase(session.getStatus())) {
            return mapToResponse(session);
        }

        if (!"CHARGING".equalsIgnoreCase(session.getStatus())) {
            throw new IllegalStateException("Cannot stop session with status: " + session.getStatus());
        }

        LocalDateTime stopTime = LocalDateTime.now();
        Duration duration = Duration.between(session.getStartTime(), stopTime);

        Charger charger = session.getCharger();
        BigDecimal energyKwh = simulatorService.calculateSimulatedEnergy(charger.getMaxPowerKw(), duration);
        BigDecimal batteryCapacity = session.getVehicle().getBatteryCapacityKwh();
        if (batteryCapacity != null && batteryCapacity.signum() > 0) {
            energyKwh = energyKwh.min(batteryCapacity);
        }
        BigDecimal stopMeter = session.getStartMeterKwh().add(energyKwh);
        BigDecimal totalCost = simulatorService.calculateCost(energyKwh, session.getTariffPerKwh());

        session.setStopTime(stopTime);
        session.setStopMeterKwh(stopMeter);
        session.setEnergyConsumedKwh(energyKwh);
        session.setTotalCost(totalCost);
        session.setStatus("COMPLETED");
        charger.setMeterReadingKwh(stopMeter);
        chargerRepository.save(charger);

        ChargingSession updated = chargingSessionRepository.save(session);

        // Free charger safely: preserve MAINTENANCE or OUT_OF_SERVICE status if set by admin
        Charger freshCharger = chargerRepository.findById(charger.getId()).orElse(charger);
        if (!"MAINTENANCE".equalsIgnoreCase(freshCharger.getStatus()) && !"OUT_OF_SERVICE".equalsIgnoreCase(freshCharger.getStatus())) {
            freshCharger.setStatus("AVAILABLE");
            chargerRepository.save(freshCharger);
        } else {
            log.info("Charger #{} stopped charging but remains in {} status.", freshCharger.getId(), freshCharger.getStatus());
        }

        // Audit log
        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action(user == null ? "SYSTEM_AUTO_STOP_CHARGING_SESSION" : "STOP_CHARGING_SESSION")
                .entityType("CHARGING_SESSION")
                .entityId(updated.getId())
                .details(String.format("%s session #%d. Delivered %s kWh, Total: $%s",
                        user == null ? "Automatically stopped stale" : "Stopped",
                        updated.getId(), energyKwh, totalCost))
                .build());

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public SessionSummaryResponse getSessionSummary(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        ChargingSession session = chargingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Charging session not found with id: " + id));

        validateOwnership(session, user);

        LocalDateTime endTime = session.getStopTime() != null ? session.getStopTime() : LocalDateTime.now();
        Duration duration = Duration.between(session.getStartTime(), endTime);

        BigDecimal energy;
        BigDecimal cost;
        if ("COMPLETED".equalsIgnoreCase(session.getStatus()) && session.getEnergyConsumedKwh() != null) {
            energy = session.getEnergyConsumedKwh();
            cost = session.getTotalCost();
        } else {
            // Live intermediate calculation for ongoing session
            energy = simulatorService.calculateSimulatedEnergy(session.getCharger().getMaxPowerKw(), duration);
            BigDecimal batteryCapacity = session.getVehicle().getBatteryCapacityKwh();
            if (batteryCapacity != null && batteryCapacity.signum() > 0) {
                energy = energy.min(batteryCapacity);
            }
            cost = simulatorService.calculateCost(energy, session.getTariffPerKwh());
        }

        return new SessionSummaryResponse(
                session.getId(),
                session.getStatus(),
                session.getCustomer().getFullName(),
                session.getCustomer().getEmail(),
                session.getVehicle().getMake() + " " + session.getVehicle().getModel() + " (" + session.getVehicle().getRegistrationNumber() + ")",
                session.getStation().getName(),
                session.getStation().getAddress(),
                session.getCharger().getChargerCode(),
                session.getCharger().getConnectorType(),
                session.getStartTime(),
                session.getStopTime(),
                duration.getSeconds(),
                simulatorService.formatDuration(duration),
                session.getStartMeterKwh(),
                session.getStopMeterKwh() != null ? session.getStopMeterKwh() : session.getStartMeterKwh().add(energy),
                energy,
                session.getTariffPerKwh(),
                cost,
                session.getPaymentStatus(),
                session.getSimulationNote()
        );
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateOwnership(ChargingSession session, User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()) || "SUPER_ADMIN".equalsIgnoreCase(r.getName()));

        if (!isAdmin && !session.getCustomer().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view or manage session: " + session.getId());
        }
    }

    private void validateConnectorCompatibility(Vehicle vehicle, Charger charger) {
        if (vehicle.getConnectorType() == null || charger.getConnectorType() == null) {
            return;
        }
        String vehicleConn = vehicle.getConnectorType().trim();
        String chargerConn = charger.getConnectorType().trim();
        if (!vehicleConn.equalsIgnoreCase(chargerConn)) {
            throw new IllegalArgumentException(
                    String.format("Connector mismatch: Vehicle requires '%s' but Charger provides '%s'",
                            vehicleConn, chargerConn)
            );
        }
    }

    private BigDecimal resolveTariff(Charger charger) {
        if (charger.getConnectorType() != null) {
            var found = tariffRepository.findByConnectorTypeIgnoreCaseAndActiveTrue(charger.getConnectorType());
            if (found.isPresent()) {
                return found.get().getRatePerKwh();
            }
        }
        return tariffRepository.findByName("DEFAULT_STANDARD_TARIFF")
                .map(Tariff::getRatePerKwh)
                .orElse(BigDecimal.valueOf(0.2800));
    }

    private ChargingSessionResponse mapToResponse(ChargingSession session) {
        return new ChargingSessionResponse(
                session.getId(),
                session.getCustomer().getId(),
                session.getCustomer().getEmail(),
                session.getCustomer().getFullName(),
                session.getVehicle().getId(),
                session.getVehicle().getMake(),
                session.getVehicle().getModel(),
                session.getVehicle().getRegistrationNumber(),
                session.getVehicle().getConnectorType(),
                session.getStation().getId(),
                session.getStation().getName(),
                session.getStation().getAddress(),
                session.getCharger().getId(),
                session.getCharger().getChargerCode(),
                session.getCharger().getMaxPowerKw(),
                session.getStatus(),
                session.getStartTime(),
                session.getStopTime(),
                session.getStartMeterKwh(),
                session.getStopMeterKwh(),
                session.getEnergyConsumedKwh(),
                session.getTariffPerKwh(),
                session.getTotalCost(),
                session.getPaymentStatus(),
                session.getSimulationNote(),
                session.getCreatedAt()
        );
    }
}
