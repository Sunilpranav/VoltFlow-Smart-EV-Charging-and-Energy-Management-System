package com.voltflow.controller;

import com.voltflow.dto.*;
import com.voltflow.service.*;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Admin-only REST controller.
 * All endpoints require ROLE_ADMIN or ROLE_SUPER_ADMIN.
 * Read-only list endpoints do NOT write audit-log rows.
 * Meaningful administrative business operations trigger audit logs.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AdminStationService adminStationService;
    private final AdminTariffService adminTariffService;
    private final AdminPlanService adminPlanService;
    private final AdminMaintenanceService adminMaintenanceService;
    private final AdminRefundService adminRefundService;

    public AdminController(AdminService adminService,
                           AdminStationService adminStationService,
                           AdminTariffService adminTariffService,
                           AdminPlanService adminPlanService,
                           AdminMaintenanceService adminMaintenanceService,
                           AdminRefundService adminRefundService) {
        this.adminService = adminService;
        this.adminStationService = adminStationService;
        this.adminTariffService = adminTariffService;
        this.adminPlanService = adminPlanService;
        this.adminMaintenanceService = adminMaintenanceService;
        this.adminRefundService = adminRefundService;
    }

    // ── Dashboard & Reporting ──────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    // ── Stations ──────────────────────────────────────────────────────────────

    @GetMapping("/stations")
    public ResponseEntity<List<StationResponse>> getStations(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status) {
        return ResponseEntity.ok(adminService.getStations(search, status));
    }

    @PostMapping("/stations")
    public ResponseEntity<StationResponse> createStation(
            @Valid @RequestBody CreateStationRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminStationService.createStation(req, principal.getName()));
    }

    @PutMapping("/stations/{id}")
    public ResponseEntity<StationResponse> updateStation(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateStationRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminStationService.updateStation(id, req, principal.getName()));
    }

    @DeleteMapping("/stations/{id}")
    public ResponseEntity<Void> deactivateStation(
            @PathVariable("id") Long id,
            Principal principal) {
        adminStationService.deactivateStation(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    // ── Chargers ──────────────────────────────────────────────────────────────

    @GetMapping("/chargers")
    public ResponseEntity<List<ChargerResponse>> getChargers(
            @RequestParam(name = "stationId", required = false) Long stationId,
            @RequestParam(name = "connectorType", required = false) String connectorType,
            @RequestParam(name = "status", required = false) String status) {
        return ResponseEntity.ok(adminService.getChargers(stationId, connectorType, status));
    }

    @PostMapping("/chargers")
    public ResponseEntity<ChargerResponse> createCharger(
            @Valid @RequestBody CreateChargerRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminStationService.createCharger(req, principal.getName()));
    }

    @PutMapping("/chargers/{id}")
    public ResponseEntity<ChargerResponse> updateCharger(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateChargerRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminStationService.updateCharger(id, req, principal.getName()));
    }

    @DeleteMapping("/chargers/{id}")
    public ResponseEntity<Void> deactivateCharger(
            @PathVariable("id") Long id,
            Principal principal) {
        adminStationService.deactivateCharger(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    // ── Tariffs ───────────────────────────────────────────────────────────────

    @GetMapping("/tariffs")
    public ResponseEntity<List<TariffResponse>> getTariffs() {
        return ResponseEntity.ok(adminTariffService.getAllTariffs());
    }

    @GetMapping("/tariffs/{id}")
    public ResponseEntity<TariffResponse> getTariff(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminTariffService.getTariff(id));
    }

    @PostMapping("/tariffs")
    public ResponseEntity<TariffResponse> createTariff(
            @Valid @RequestBody CreateTariffRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminTariffService.createTariff(req, principal.getName()));
    }

    @PutMapping("/tariffs/{id}")
    public ResponseEntity<TariffResponse> updateTariff(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateTariffRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminTariffService.updateTariff(id, req, principal.getName()));
    }

    @DeleteMapping("/tariffs/{id}")
    public ResponseEntity<Void> deleteTariff(
            @PathVariable("id") Long id,
            Principal principal) {
        adminTariffService.deleteTariff(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    // ── Prepaid Plans ─────────────────────────────────────────────────────────

    @GetMapping("/plans")
    public ResponseEntity<List<PrepaidPlanResponse>> getPlans() {
        return ResponseEntity.ok(adminPlanService.getAllPlans());
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<PrepaidPlanResponse> getPlan(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminPlanService.getPlan(id));
    }

    @PostMapping("/plans")
    public ResponseEntity<PrepaidPlanResponse> createPlan(
            @Valid @RequestBody CreatePlanRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminPlanService.createPlan(req, principal.getName()));
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<PrepaidPlanResponse> updatePlan(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdatePlanRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminPlanService.updatePlan(id, req, principal.getName()));
    }

    @PatchMapping("/plans/{id}/status")
    public ResponseEntity<Void> setPlanStatus(
            @PathVariable("id") Long id,
            @RequestParam("active") boolean active,
            Principal principal) {
        adminPlanService.setActive(id, active, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/plans/{id}")
    public ResponseEntity<Void> deactivatePlan(
            @PathVariable("id") Long id,
            Principal principal) {
        adminPlanService.setActive(id, false, principal.getName());
        return ResponseEntity.noContent().build();
    }

    // ── Maintenance ───────────────────────────────────────────────────────────

    @GetMapping("/maintenance")
    public ResponseEntity<PageResponse<MaintenanceRecordResponse>> getMaintenance(
            @RequestParam(name = "chargerId", required = false) Long chargerId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "severity", required = false) String severity,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(
                adminMaintenanceService.getMaintenanceRecords(chargerId, status, severity, page, size));
    }

    @GetMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceRecordResponse> getMaintenanceById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminMaintenanceService.getMaintenanceRecord(id));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceRecordResponse> createMaintenance(
            @Valid @RequestBody CreateMaintenanceRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminMaintenanceService.createMaintenanceRecord(req, principal.getName()));
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceRecordResponse> updateMaintenance(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateMaintenanceRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminMaintenanceService.updateMaintenanceRecord(id, req, principal.getName()));
    }

    // ── Sessions & Monitoring ─────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ResponseEntity<PageResponse<ChargingSessionResponse>> getSessions(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "paymentStatus", required = false) String paymentStatus,
            @RequestParam(name = "stationId", required = false) Long stationId,
            @RequestParam(name = "start", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(name = "end", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(
                adminService.getSessions(status, paymentStatus, stationId, start, end, page, size));
    }

    @PostMapping("/sessions/{id}/refund")
    public ResponseEntity<PaySessionResponse> refundSession(
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminRefundRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminRefundService.refundSession(id, req, principal.getName()));
    }

    @PostMapping("/refunds")
    public ResponseEntity<PaySessionResponse> refundSessionViaBody(
            @Valid @RequestBody AdminRefundRequest req,
            Principal principal) {
        if (req.sessionId() == null) {
            throw new IllegalArgumentException("sessionId is required in request body for /api/admin/refunds");
        }
        return ResponseEntity.ok(adminRefundService.refundSession(req.sessionId(), req, principal.getName()));
    }

    // ── Transactions ──────────────────────────────────────────────────────────

    @GetMapping("/transactions")
    public ResponseEntity<PageResponse<WalletTransactionResponse>> getTransactions(
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getTransactions(type, page, size));
    }

    // ── Audit Logs ────────────────────────────────────────────────────────────

    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(action, entityType, page, size));
    }
}