package com.voltflow.service;

import com.voltflow.dto.*;
import com.voltflow.entity.Role;
import com.voltflow.entity.User;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.ChargingSessionRepository;
import com.voltflow.repository.StationRepository;
import com.voltflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerDashboardService {

    private final UserRepository userRepository;
    private final VehicleService vehicleService;
    private final StationService stationService;
    private final StationRepository stationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final com.voltflow.repository.WalletRepository walletRepository;

    public CustomerDashboardService(UserRepository userRepository,
                                    VehicleService vehicleService,
                                    StationService stationService,
                                    StationRepository stationRepository,
                                    AuditLogRepository auditLogRepository,
                                    ChargingSessionRepository chargingSessionRepository,
                                    com.voltflow.repository.WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.vehicleService = vehicleService;
        this.stationService = stationService;
        this.stationRepository = stationRepository;
        this.auditLogRepository = auditLogRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.walletRepository = walletRepository;
    }

    public CustomerDashboardResponse getDashboard(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with email: " + userEmail));

        String role = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("CUSTOMER");

        UserResponse profile = new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                role
        );

        List<VehicleResponse> vehicles = vehicleService.getVehicles(userEmail);
        int vehicleCount = vehicles.size();

        long availableStationCount = stationRepository.countByStatusIgnoreCase("ACTIVE");

        // Top active stations for recommendation (up to 3)
        List<StationSummaryResponse> allActive = stationService.getStations(null, "ACTIVE");
        List<StationSummaryResponse> recommended = allActive.stream().limit(3).toList();

        // Real user activity history from audit logs
        List<AuditLogResponse> recentActivity = auditLogRepository
                .findByActorUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .limit(5)
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getAction(),
                        log.getEntityType(),
                        log.getEntityId(),
                        log.getDetails(),
                        log.getCreatedAt()
                ))
                .toList();

        // Real session metrics
        java.math.BigDecimal totalEnergy = chargingSessionRepository.sumEnergyByCustomerId(user.getId());
        java.math.BigDecimal totalSpend = chargingSessionRepository.sumCostByCustomerId(user.getId());
        int activeSessions = (int) chargingSessionRepository.countByCustomerIdAndStatus(user.getId(), "CHARGING");
        java.math.BigDecimal walletBal = walletRepository.findByUser(user)
                .map(com.voltflow.entity.Wallet::getBalance)
                .orElse(java.math.BigDecimal.ZERO);

        return new CustomerDashboardResponse(
                profile,
                vehicleCount,
                vehicles,
                availableStationCount,
                recommended,
                recentActivity != null ? recentActivity : Collections.emptyList(),
                totalEnergy != null ? totalEnergy : java.math.BigDecimal.ZERO,
                totalSpend != null ? totalSpend : java.math.BigDecimal.ZERO,
                activeSessions,
                walletBal
        );
    }
}
