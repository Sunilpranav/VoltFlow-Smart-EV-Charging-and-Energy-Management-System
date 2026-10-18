package com.voltflow.service;

import com.voltflow.dto.CreateTariffRequest;
import com.voltflow.dto.TariffResponse;
import com.voltflow.dto.UpdateTariffRequest;
import com.voltflow.entity.AuditLog;
import com.voltflow.entity.Tariff;
import com.voltflow.entity.User;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.TariffRepository;
import com.voltflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/**
 * Admin-only service for tariff CRUD.
 */
@Service
@Transactional
public class AdminTariffService {

    private static final Set<String> VALID_CONNECTOR_TYPES = Set.of(
            "CCS2", "CHAdeMO", "Type 2", "GBT", "CCS1", "J1772", "OTHER"
    );

    private final TariffRepository tariffRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminTariffService(TariffRepository tariffRepository,
                              AuditLogRepository auditLogRepository,
                              UserRepository userRepository) {
        this.tariffRepository = tariffRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TariffResponse> getAllTariffs() {
        return tariffRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TariffResponse getTariff(Long id) {
        return toResponse(findById(id));
    }

    public TariffResponse createTariff(CreateTariffRequest req, String actorEmail) {
        validateRatePerKwh(req.ratePerKwh());
        validateConnectorType(req.connectorType());

        String name = req.name().trim();
        if (tariffRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("A tariff with name '" + name + "' already exists.");
        }

        String currency = (req.currency() != null && !req.currency().isBlank())
                ? req.currency().toUpperCase().trim() : "USD";

        // Prevent duplicate active connector-type+currency combination
        if (req.connectorType() != null && !req.connectorType().isBlank()) {
            boolean duplicate = tariffRepository
                    .existsByConnectorTypeIgnoreCaseAndCurrencyIgnoreCaseAndActiveTrue(
                            req.connectorType(), currency);
            if (duplicate && !Boolean.FALSE.equals(req.active())) {
                throw new IllegalArgumentException(
                        "An active tariff for connector type '" + req.connectorType()
                                + "' and currency '" + currency + "' already exists.");
            }
        }

        Tariff tariff = Tariff.builder()
                .name(name)
                .ratePerKwh(req.ratePerKwh())
                .connectorType(req.connectorType() != null && !req.connectorType().isBlank()
                        ? req.connectorType().trim() : null)
                .currency(currency)
                .active(req.active() != null ? req.active() : true)
                .build();

        Tariff saved = tariffRepository.save(tariff);
        audit("CREATE_TARIFF", "TARIFF", saved.getId(), "Created tariff: " + saved.getName(), actorEmail);
        return toResponse(saved);
    }

    public TariffResponse updateTariff(Long id, UpdateTariffRequest req, String actorEmail) {
        validateRatePerKwh(req.ratePerKwh());
        validateConnectorType(req.connectorType());

        Tariff tariff = findById(id);
        String name = req.name().trim();

        // Name uniqueness (allow same if unchanged)
        tariffRepository.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("A tariff with name '" + name + "' already exists.");
            }
        });

        String currency = (req.currency() != null && !req.currency().isBlank())
                ? req.currency().toUpperCase().trim() : tariff.getCurrency();

        String connectorType = (req.connectorType() != null && !req.connectorType().isBlank())
                ? req.connectorType().trim() : tariff.getConnectorType();

        // Check duplicate active tariff for connector+currency if activating
        if (connectorType != null && Boolean.TRUE.equals(req.active() != null ? req.active() : tariff.getActive())) {
            boolean duplicate = tariffRepository
                    .existsByConnectorTypeIgnoreCaseAndCurrencyIgnoreCaseAndActiveTrueAndIdNot(
                            connectorType, currency, id);
            if (duplicate) {
                throw new IllegalArgumentException(
                        "An active tariff for connector type '" + connectorType
                                + "' and currency '" + currency + "' already exists.");
            }
        }

        tariff.setName(name);
        tariff.setRatePerKwh(req.ratePerKwh());
        tariff.setConnectorType(connectorType);
        tariff.setCurrency(currency);
        if (req.active() != null) tariff.setActive(req.active());

        Tariff saved = tariffRepository.save(tariff);
        audit("UPDATE_TARIFF", "TARIFF", id, "Updated tariff: " + saved.getName(), actorEmail);
        return toResponse(saved);
    }

    public void deleteTariff(Long id, String actorEmail) {
        Tariff tariff = findById(id);
        // Soft-delete by deactivating rather than destructive delete
        tariff.setActive(false);
        tariffRepository.save(tariff);
        audit("DEACTIVATE_TARIFF", "TARIFF", id, "Deactivated tariff: " + tariff.getName(), actorEmail);
    }

    // ── Validation Helpers ───────────────────────────────────────────────────

    private void validateRatePerKwh(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Rate per kWh must be greater than zero");
        }
        if (rate.compareTo(BigDecimal.valueOf(1000.0)) > 0) {
            throw new IllegalArgumentException("Rate per kWh cannot exceed 1000.00");
        }
    }

    private void validateConnectorType(String connectorType) {
        if (connectorType != null && !connectorType.isBlank()) {
            boolean valid = VALID_CONNECTOR_TYPES.stream()
                    .anyMatch(v -> v.equalsIgnoreCase(connectorType.trim()));
            if (!valid) {
                throw new IllegalArgumentException(
                        "Invalid connector type: " + connectorType + ". Allowed: " + VALID_CONNECTOR_TYPES);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Tariff findById(Long id) {
        return tariffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tariff not found: " + id));
    }

    private TariffResponse toResponse(Tariff t) {
        return new TariffResponse(t.getId(), t.getName(), t.getRatePerKwh(),
                t.getConnectorType(), t.getCurrency(), t.getActive(),
                t.getCreatedAt(), t.getUpdatedAt());
    }

    private void audit(String action, String entityType, Long entityId, String details, String actorEmail) {
        User actor = actorEmail != null ? userRepository.findByEmail(actorEmail).orElse(null) : null;
        auditLogRepository.save(AuditLog.builder()
                .action(action).entityType(entityType).entityId(entityId)
                .details(details).actorUser(actor).build());
    }
}
