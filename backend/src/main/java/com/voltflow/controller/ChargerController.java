package com.voltflow.controller;

import com.voltflow.dto.ChargerResponse;
import com.voltflow.dto.CreateChargerRequest;
import com.voltflow.dto.UpdateChargerRequest;
import com.voltflow.service.AdminStationService;
import com.voltflow.service.StationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chargers")
public class ChargerController {

    private final StationService stationService;
    private final AdminStationService adminStationService;

    public ChargerController(StationService stationService, AdminStationService adminStationService) {
        this.stationService = stationService;
        this.adminStationService = adminStationService;
    }

    @GetMapping
    public ResponseEntity<List<ChargerResponse>> getChargers(
            @RequestParam(value = "stationId", required = false) Long stationId,
            @RequestParam(value = "connectorType", required = false) String connectorType,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(stationService.getChargers(stationId, connectorType, status));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ChargerResponse> createCharger(
            @Valid @RequestBody CreateChargerRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminStationService.createCharger(req, principal.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ChargerResponse> updateCharger(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChargerRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminStationService.updateCharger(id, req, principal.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deactivateCharger(
            @PathVariable Long id,
            Principal principal) {
        adminStationService.deactivateCharger(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
