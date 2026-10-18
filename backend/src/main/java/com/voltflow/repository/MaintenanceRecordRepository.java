package com.voltflow.repository;

import com.voltflow.entity.MaintenanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {

    List<MaintenanceRecord> findByChargerIdOrderByCreatedAtDesc(Long chargerId);

    @Query("SELECT m FROM MaintenanceRecord m WHERE " +
           "(:chargerId IS NULL OR m.charger.id = :chargerId) AND " +
           "(:status IS NULL OR LOWER(m.status) = LOWER(:status)) AND " +
           "(:severity IS NULL OR LOWER(m.severity) = LOWER(:severity)) " +
           "ORDER BY m.createdAt DESC")
    Page<MaintenanceRecord> findFilteredMaintenance(
            @Param("chargerId") Long chargerId,
            @Param("status") String status,
            @Param("severity") String severity,
            Pageable pageable
    );

    boolean existsByChargerIdAndStatusIn(Long chargerId, List<String> statuses);

    boolean existsByChargerIdAndStatusInAndIdNot(Long chargerId, List<String> statuses, Long id);

    long countByStatus(String status);
}
