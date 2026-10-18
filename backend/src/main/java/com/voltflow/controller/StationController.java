package com.voltflow.controller;

import com.voltflow.dto.ChargerResponse;
import com.voltflow.dto.CreateStationRequest;
import com.voltflow.dto.StationResponse;
import com.voltflow.dto.StationSummaryResponse;
import com.voltflow.dto.UpdateStationRequest;
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
@RequestMapping("/api/stations")
public class StationController {

    private final StationService stationService;
    private final AdminStationService adminStationService;

    public StationController(StationService stationService, AdminStationService adminStationService) {
        this.stationService = stationService;
        this.adminStationService = adminStationService;
    }

    @GetMapping
    public ResponseEntity<List<StationSummaryResponse>> getStations(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(stationService.getStations(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StationResponse> getStationById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(stationService.getStationById(id));
    }

    @GetMapping("/{id}/chargers")
    public ResponseEntity<List<ChargerResponse>> getStationChargers(@PathVariable("id") Long id) {
        return ResponseEntity.ok(stationService.getStationChargers(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<StationResponse> createStation(
            @Valid @RequestBody CreateStationRequest req,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminStationService.createStation(req, principal.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<StationResponse> updateStation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStationRequest req,
            Principal principal) {
        return ResponseEntity.ok(adminStationService.updateStation(id, req, principal.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deactivateStation(
            @PathVariable Long id,
            Principal principal) {
        adminStationService.deactivateStation(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
