package com.voltflow.service;

import com.voltflow.dto.CreatePlanRequest;
import com.voltflow.dto.PrepaidPlanResponse;
import com.voltflow.dto.UpdatePlanRequest;
import com.voltflow.entity.AuditLog;
import com.voltflow.entity.PrepaidPlan;
import com.voltflow.entity.User;
import com.voltflow.exception.ResourceNotFoundException;
import com.voltflow.repository.AuditLogRepository;
import com.voltflow.repository.CustomerPlanRepository;
import com.voltflow.repository.PrepaidPlanRepository;
import com.voltflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-only service for prepaid plan management.
 * Customer purchase history (CustomerPlan records) is never modified here.
 */
@Service
@Transactional
public class AdminPlanService {

    private final PrepaidPlanRepository planRepository;
    private final CustomerPlanRepository customerPlanRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminPlanService(PrepaidPlanRepository planRepository,
                            CustomerPlanRepository customerPlanRepository,
                            AuditLogRepository auditLogRepository,
                            UserRepository userRepository) {
        this.planRepository = planRepository;
        this.customerPlanRepository = customerPlanRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PrepaidPlanResponse> getAllPlans() {
        return planRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PrepaidPlanResponse getPlan(Long id) {
        return toResponse(findById(id));
    }

    public PrepaidPlanResponse createPlan(CreatePlanRequest req, String actorEmail) {
        String name = req.name().trim();
        if (planRepository.existsByName(name)) {
            throw new IllegalArgumentException("A plan with name '" + name + "' already exists.");
        }
        String currency = (req.currency() != null && !req.currency().isBlank())
                ? req.currency().toUpperCase().trim() : "USD";

        PrepaidPlan plan = PrepaidPlan.builder()
                .name(name)
                .description(req.description() != null ? req.description().trim() : null)
                .price(req.price())
                .creditAmount(req.creditAmount())
                .energyAllowanceKwh(req.energyAllowanceKwh())
                .validityDays(req.validityDays())
                .currency(currency)
                .active(req.active() != null ? req.active() : true)
                .build();

        PrepaidPlan saved = planRepository.save(plan);
        audit("CREATE_PLAN", "PREPAID_PLAN", saved.getId(), "Created plan: " + saved.getName(), actorEmail);
        return toResponse(saved);
    }

    public PrepaidPlanResponse updatePlan(Long id, UpdatePlanRequest req, String actorEmail) {
        PrepaidPlan plan = findById(id);
        String name = req.name().trim();

        if (planRepository.existsByNameAndIdNot(name, id)) {
            throw new IllegalArgumentException("A plan with name '" + name + "' already exists.");
        }

        String currency = (req.currency() != null && !req.currency().isBlank())
                ? req.currency().toUpperCase().trim() : plan.getCurrency();

        plan.setName(name);
        plan.setDescription(req.description() != null ? req.description().trim() : plan.getDescription());
        plan.setPrice(req.price());
        plan.setCreditAmount(req.creditAmount());
        plan.setEnergyAllowanceKwh(req.energyAllowanceKwh());
        plan.setValidityDays(req.validityDays());
        plan.setCurrency(currency);
        if (req.active() != null) plan.setActive(req.active());

        PrepaidPlan saved = planRepository.save(plan);
        audit("UPDATE_PLAN", "PREPAID_PLAN", id, "Updated plan: " + saved.getName(), actorEmail);
        return toResponse(saved);
    }

    public void setActive(Long id, boolean active, String actorEmail) {
        PrepaidPlan plan = findById(id);
        plan.setActive(active);
        planRepository.save(plan);
        String action = active ? "ACTIVATE_PLAN" : "DEACTIVATE_PLAN";
        audit(action, "PREPAID_PLAN", id,
                (active ? "Activated" : "Deactivated") + " plan: " + plan.getName(), actorEmail);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PrepaidPlan findById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prepaid plan not found: " + id));
    }

    private PrepaidPlanResponse toResponse(PrepaidPlan p) {
        return new PrepaidPlanResponse(p.getId(), p.getName(), p.getDescription(),
                p.getPrice(), p.getCreditAmount(), p.getEnergyAllowanceKwh(),
                p.getValidityDays(), p.getCurrency(), p.getActive());
    }

    private void audit(String action, String entityType, Long entityId, String details, String actorEmail) {
        User actor = actorEmail != null ? userRepository.findByEmail(actorEmail).orElse(null) : null;
        auditLogRepository.save(AuditLog.builder()
                .action(action).entityType(entityType).entityId(entityId)
                .details(details).actorUser(actor).build());
    }
}
