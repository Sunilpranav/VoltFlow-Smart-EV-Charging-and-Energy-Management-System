package com.voltflow.repository;

import com.voltflow.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorUserIdOrderByCreatedAtDesc(Long userId);
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findFiltered(@Param("action") String action,
                                @Param("entityType") String entityType,
                                Pageable pageable);
}
