package com.voltflow.controller;

import com.voltflow.dto.VehicleRequest;
import com.voltflow.dto.VehicleResponse;
import com.voltflow.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getVehicles(Principal principal) {
        return ResponseEntity.ok(vehicleService.getVehicles(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable("id") Long id, Principal principal) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleRequest request,
                                                         Principal principal) {
        VehicleResponse response = vehicleService.createVehicle(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponse> updateVehicle(@PathVariable("id") Long id,
                                                         @Valid @RequestBody VehicleRequest request,
                                                         Principal principal) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable("id") Long id, Principal principal) {
        vehicleService.deleteVehicle(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
