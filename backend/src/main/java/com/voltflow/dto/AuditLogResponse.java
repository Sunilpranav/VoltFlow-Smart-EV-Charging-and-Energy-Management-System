package com.voltflow.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    String action,
    String entityType,
    Long entityId,
    String details,
    String actorEmail,
    LocalDateTime createdAt
) {
    public AuditLogResponse(Long id, String action, String entityType, Long entityId, String details, LocalDateTime createdAt) {
        this(id, action, entityType, entityId, details, null, createdAt);
    }
}
