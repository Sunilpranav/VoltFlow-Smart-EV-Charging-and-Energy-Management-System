package com.voltflow.service;

import com.voltflow.dto.VehicleRequest;
import com.voltflow.dto.VehicleResponse;
import com.voltflow.entity.AuditLog;
import com.voltflow.entity.User;
import com.voltflow.entity.Vehicle;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.UserRepository;
import com.voltflow.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          UserRepository userRepository,
                          AuditLogRepository auditLogRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehicles(String userEmail) {
        User user = getUserByEmail(userEmail);
        return vehicleRepository.findByOwnerId(user.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        validateOwnership(vehicle, user);
        return mapToResponse(vehicle);
    }

    public VehicleResponse createVehicle(VehicleRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        String normalizedReg = normalizeRegistrationNumber(request.registrationNumber());

        if (vehicleRepository.existsByRegistrationNumber(normalizedReg)) {
            throw new IllegalArgumentException("Registration number already registered: " + normalizedReg);
        }

        Vehicle vehicle = Vehicle.builder()
                .owner(user)
                .make(request.make().trim())
                .model(request.model().trim())
                .registrationNumber(normalizedReg)
                .batteryCapacityKwh(request.batteryCapacityKwh())
                .connectorType(request.connectorType().trim())
                .modelYear(request.modelYear())
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("CREATE_VEHICLE")
                .entityType("VEHICLE")
                .entityId(saved.getId())
                .details("Registered EV: " + saved.getMake() + " " + saved.getModel() + " (" + normalizedReg + ")")
                .build());

        return mapToResponse(saved);
    }

    public VehicleResponse updateVehicle(Long id, VehicleRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        validateOwnership(vehicle, user);

        String normalizedReg = normalizeRegistrationNumber(request.registrationNumber());
        vehicleRepository.findByRegistrationNumber(normalizedReg).ifPresent(existing -> {
            if (!existing.getId().equals(vehicle.getId())) {
                throw new IllegalArgumentException("Registration number already registered: " + normalizedReg);
            }
        });

        vehicle.setMake(request.make().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setRegistrationNumber(normalizedReg);
        vehicle.setBatteryCapacityKwh(request.batteryCapacityKwh());
        vehicle.setConnectorType(request.connectorType().trim());
        vehicle.setModelYear(request.modelYear());

        Vehicle updated = vehicleRepository.save(vehicle);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("UPDATE_VEHICLE")
                .entityType("VEHICLE")
                .entityId(updated.getId())
                .details("Updated EV: " + updated.getMake() + " " + updated.getModel() + " (" + normalizedReg + ")")
                .build());

        return mapToResponse(updated);
    }

    public void deleteVehicle(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        validateOwnership(vehicle, user);

        auditLogRepository.save(AuditLog.builder()
                .actorUser(user)
                .action("DELETE_VEHICLE")
                .entityType("VEHICLE")
                .entityId(vehicle.getId())
                .details("Deleted EV: " + vehicle.getMake() + " " + vehicle.getModel() + " (" + vehicle.getRegistrationNumber() + ")")
                .build());

        vehicleRepository.delete(vehicle);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateOwnership(Vehicle vehicle, User user) {
        if (!vehicle.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to access vehicle: " + vehicle.getId());
        }
    }

    private String normalizeRegistrationNumber(String reg) {
        if (reg == null) {
            throw new IllegalArgumentException("Registration number cannot be null");
        }
        String normalized = reg.trim().replaceAll("\\s+", "").toUpperCase();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Registration number cannot be empty");
        }
        return normalized;
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getRegistrationNumber(),
                vehicle.getBatteryCapacityKwh(),
                vehicle.getConnectorType(),
                vehicle.getModelYear(),
                vehicle.getOwner() != null ? vehicle.getOwner().getEmail() : null,
                vehicle.getCreatedAt()
        );
    }
}
