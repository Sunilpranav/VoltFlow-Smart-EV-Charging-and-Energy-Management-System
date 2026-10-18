package com.voltflow.service;

import com.voltflow.dto.*;
import com.voltflow.entity.ChargingSession;
import com.voltflow.entity.WalletTransaction;
import com.voltflow.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service backing the read-only admin portal endpoints.
 */
@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final StationRepository stationRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingSessionRepository sessionRepository;
    private final WalletTransactionRepository txRepository;
    private final PrepaidPlanRepository planRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminService(UserRepository userRepository,
                        VehicleRepository vehicleRepository,
                        StationRepository stationRepository,
                        ChargerRepository chargerRepository,
                        ChargingSessionRepository sessionRepository,
                        WalletTransactionRepository txRepository,
                        PrepaidPlanRepository planRepository,
                        AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.stationRepository = stationRepository;
        this.chargerRepository = chargerRepository;
        this.sessionRepository = sessionRepository;
        this.txRepository = txRepository;
        this.planRepository = planRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public AdminDashboardResponse getDashboard() {
        long customerCount = userRepository.countByRolesName("CUSTOMER");
        long vehicleCount  = vehicleRepository.count();
        long stationCount  = stationRepository.count();
        long chargerCount  = chargerRepository.count();

        long availableChargers   = chargerRepository.countByStatus("AVAILABLE");
        long occupiedChargers    = chargerRepository.countByStatus("OCCUPIED");
        long maintenanceChargers = chargerRepository.countByStatus("MAINTENANCE");

        long activeSessions    = sessionRepository.countByStatus("CHARGING");
        long completedSessions = sessionRepository.countByStatus("COMPLETED");

        BigDecimal totalEnergyKwh = coalesce(sessionRepository.sumTotalEnergyConsumed());
        BigDecimal paidRevenue    = coalesce(sessionRepository.sumPaidRevenue());
        BigDecimal unpaidRevenue  = coalesce(sessionRepository.sumUnpaidRevenue());

        long       topUpsCount  = txRepository.countByTransactionType("CREDIT");
        BigDecimal topUpsAmount = coalesce(txRepository.sumAmountByTransactionType("CREDIT"));

        long       refundsCount  = txRepository.countByTransactionType("REFUND");
        BigDecimal refundsAmount = coalesce(txRepository.sumAmountByTransactionType("REFUND"));

        long       planCount  = planRepository.count();
        BigDecimal planAmount = coalesce(planRepository.sumPurchaseAmount());

        return new AdminDashboardResponse(
            "ok",
            customerCount,
            vehicleCount,
            stationCount,
            chargerCount,
            availableChargers,
            occupiedChargers,
            maintenanceChargers,
            activeSessions,
            completedSessions,
            totalEnergyKwh,
            paidRevenue,
            unpaidRevenue,
            topUpsCount,
            topUpsAmount,
            refundsCount,
            refundsAmount,
            planCount,
            planAmount
        );
    }

    // ── Stations ──────────────────────────────────────────────────────────────

    public List<StationResponse> getStations(String search, String status) {
        return stationRepository.searchStations(nullIfBlank(search), nullIfBlank(status))
            .stream()
            .map(this::toStationResponse)
            .toList();
    }

    // ── Chargers ──────────────────────────────────────────────────────────────

    public List<ChargerResponse> getChargers(Long stationId, String connectorType, String status) {
        return chargerRepository
            .findFilteredChargers(stationId, nullIfBlank(connectorType), nullIfBlank(status))
            .stream()
            .map(c -> new ChargerResponse(
                c.getId(),
                c.getStation().getId(),
                c.getChargerCode(),
                c.getConnectorType(),
                c.getMaxPowerKw(),
                c.getStatus(),
                c.getCreatedAt()))
            .toList();
    }

    // ── Charging sessions ─────────────────────────────────────────────────────

    public PageResponse<ChargingSessionResponse> getSessions(
            String status, String paymentStatus, Long stationId,
            LocalDateTime start, LocalDateTime end, int page, int size) {
        validatePage(page, size);
        Page<ChargingSession> raw = sessionRepository.findFilteredSessions(
            nullIfBlank(status), nullIfBlank(paymentStatus), stationId, start, end,
            PageRequest.of(page, size, Sort.by("startTime").descending().and(Sort.by("id").descending())));
        return PageResponse.of(raw.map(this::toSessionResponse));
    }

    // ── Wallet transactions ───────────────────────────────────────────────────

    public PageResponse<WalletTransactionResponse> getTransactions(
            String type, int page, int size) {
        validatePage(page, size);
        String txType = parseTransactionType(type);
        Page<WalletTransaction> raw = txRepository.findFiltered(
            txType, PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending())));
        return PageResponse.of(raw.map(this::toTxResponse));
    }

    // ── Audit logs ────────────────────────────────────────────────────────────

    public PageResponse<AuditLogResponse> getAuditLogs(
            String action, String entityType, int page, int size) {
        validatePage(page, size);
        Page<com.voltflow.entity.AuditLog> raw = auditLogRepository.findFiltered(
            nullIfBlank(action), nullIfBlank(entityType),
            PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending())));
        return PageResponse.of(raw.map(this::toAuditResponse));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private StationResponse toStationResponse(com.voltflow.entity.Station s) {
        List<ChargerResponse> chargers = s.getChargers().stream()
            .map(c -> new ChargerResponse(c.getId(), s.getId(), c.getChargerCode(),
                        c.getConnectorType(), c.getMaxPowerKw(), c.getStatus(), c.getCreatedAt()))
            .toList();
        long available = chargers.stream()
            .filter(c -> "AVAILABLE".equalsIgnoreCase(c.status())).count();
        return new StationResponse(s.getId(), s.getName(), s.getAddress(),
            s.getLatitude(), s.getLongitude(), s.getStatus(),
            chargers.size(), (int) available, chargers, s.getCreatedAt());
    }

    private ChargingSessionResponse toSessionResponse(ChargingSession s) {
        return new ChargingSessionResponse(
            s.getId(),
            s.getCustomer().getId(),
            s.getCustomer().getEmail(),
            s.getCustomer().getFullName(),
            s.getVehicle().getId(),
            s.getVehicle().getMake(),
            s.getVehicle().getModel(),
            s.getVehicle().getRegistrationNumber(),
            s.getVehicle().getConnectorType(),
            s.getStation().getId(),
            s.getStation().getName(),
            s.getStation().getAddress(),
            s.getCharger().getId(),
            s.getCharger().getChargerCode(),
            s.getCharger().getMaxPowerKw(),
            s.getStatus(),
            s.getStartTime(),
            s.getStopTime(),
            s.getStartMeterKwh(),
            s.getStopMeterKwh(),
            s.getEnergyConsumedKwh(),
            s.getTariffPerKwh(),
            s.getTotalCost(),
            s.getPaymentStatus(),
            s.getSimulationNote(),
            s.getCreatedAt()
        );
    }

    private WalletTransactionResponse toTxResponse(WalletTransaction t) {
        Long sessionId = t.getChargingSession() != null ? t.getChargingSession().getId() : null;
        return new WalletTransactionResponse(
            t.getId(),
            t.getWallet().getId(),
            t.getTransactionType(),
            t.getAmount(),
            t.getBalanceAfter(),
            t.getCurrency(),
            t.getStatus(),
            t.getDescription(),
            t.getReferenceId(),
            sessionId,
            t.getIdempotencyKey(),
            t.getCreatedAt()
        );
    }

    private AuditLogResponse toAuditResponse(com.voltflow.entity.AuditLog a) {
        String actorEmail = a.getActorUser() != null ? a.getActorUser().getEmail() : null;
        return new AuditLogResponse(
            a.getId(),
            a.getAction(),
            a.getEntityType(),
            a.getEntityId(),
            a.getDetails(),
            actorEmail,
            a.getCreatedAt()
        );
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    private static void validatePage(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("Page index must be >= 0");
        if (size < 1 || size > 200)
            throw new IllegalArgumentException("Page size must be between 1 and 200");
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static BigDecimal coalesce(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /**
     * Validates and normalises an optional transaction-type filter.
     * Returns null (= no filter) for blank input.
     * Throws IllegalArgumentException for unrecognised values.
     */
    private static String parseTransactionType(String type) {
        if (type == null || type.isBlank()) return null;
        String upper = type.toUpperCase();
        if (!upper.equals("CREDIT") && !upper.equals("DEBIT") && !upper.equals("REFUND")) {
            throw new IllegalArgumentException(
                "Invalid transaction type: " + type + ". Allowed values: CREDIT, DEBIT, REFUND");
        }
        return upper;
    }
}
