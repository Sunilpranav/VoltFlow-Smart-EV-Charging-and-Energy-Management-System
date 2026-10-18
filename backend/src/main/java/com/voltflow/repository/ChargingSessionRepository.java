package com.voltflow.repository;

import com.voltflow.entity.ChargingSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ChargingSession s WHERE s.id = :id")
    Optional<ChargingSession> findByIdWithLock(@Param("id") Long id);

    List<ChargingSession> findByCustomerIdOrderByStartTimeDesc(Long customerId);

    List<ChargingSession> findByStatusIgnoreCase(String status);

    Optional<ChargingSession> findByIdAndCustomerId(Long id, Long customerId);

    boolean existsByChargerIdAndStatus(Long chargerId, String status);

    Optional<ChargingSession> findFirstByChargerIdAndStatus(Long chargerId, String status);

    long countByCustomerIdAndStatus(Long customerId, String status);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(s.energyConsumedKwh), 0) FROM ChargingSession s WHERE s.customer.id = :userId AND s.status = 'COMPLETED'")
    BigDecimal sumEnergyByCustomerId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(s.totalCost), 0) FROM ChargingSession s WHERE s.customer.id = :userId AND s.status = 'COMPLETED'")
    BigDecimal sumCostByCustomerId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(s.energyConsumedKwh), 0) FROM ChargingSession s WHERE s.status = 'COMPLETED'")
    BigDecimal sumTotalEnergyConsumed();

    @Query("SELECT COALESCE(SUM(s.totalCost), 0) FROM ChargingSession s WHERE s.paymentStatus = 'PAID'")
    BigDecimal sumPaidRevenue();

    @Query("SELECT COALESCE(SUM(s.totalCost), 0) FROM ChargingSession s WHERE s.status = 'COMPLETED' AND (s.paymentStatus = 'UNPAID' OR s.paymentStatus IS NULL)")
    BigDecimal sumUnpaidRevenue();

    @Query("SELECT COALESCE(SUM(s.totalCost), 0) FROM ChargingSession s WHERE s.paymentStatus = 'PAID' AND s.startTime >= :start AND s.startTime <= :end")
    BigDecimal sumRevenueBetween(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.energyConsumedKwh), 0) FROM ChargingSession s WHERE s.status = 'COMPLETED' AND s.startTime >= :start AND s.startTime <= :end")
    BigDecimal sumEnergyBetween(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT s FROM ChargingSession s WHERE " +
           "(:status IS NULL OR LOWER(s.status) = LOWER(:status)) AND " +
           "(:paymentStatus IS NULL OR LOWER(s.paymentStatus) = LOWER(:paymentStatus)) AND " +
           "(:stationId IS NULL OR s.station.id = :stationId) AND " +
           "(:start IS NULL OR s.startTime >= :start) AND " +
           "(:end IS NULL OR s.startTime <= :end) " +
           "ORDER BY s.startTime DESC")
    org.springframework.data.domain.Page<ChargingSession> findFilteredSessions(
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus,
            @Param("stationId") Long stationId,
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end,
            org.springframework.data.domain.Pageable pageable
    );

    boolean existsByStationIdAndStatus(Long stationId, String status);
}
