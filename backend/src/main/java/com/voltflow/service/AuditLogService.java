package com.voltflow.service;

import com.voltflow.entity.AuditLog;
import com.voltflow.entity.User;
import com.voltflow.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for persisting admin audit log entries.
 * Uses REQUIRES_NEW so that a rollback in the calling transaction
 * does not suppress the audit record.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, Long entityId, String details, User actor) {
        AuditLog entry = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .actorUser(actor)
                .build();
        repository.save(entry);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, null);
    }
}