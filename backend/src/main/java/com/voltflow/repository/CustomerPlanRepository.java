package com.voltflow.repository;

import com.voltflow.entity.CustomerPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerPlanRepository extends JpaRepository<CustomerPlan, Long> {

    List<CustomerPlan> findByUserIdOrderByPurchasedAtDesc(Long userId);

    List<CustomerPlan> findByUserIdAndStatus(Long userId, String status);

    Optional<CustomerPlan> findByIdempotencyKey(String idempotencyKey);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(c.purchasePrice), 0) FROM CustomerPlan c")
    java.math.BigDecimal sumTotalPurchasesAmount();

    @org.springframework.data.jpa.repository.Query("SELECT c FROM CustomerPlan c WHERE " +
           "(:planId IS NULL OR c.plan.id = :planId) AND " +
           "(:status IS NULL OR LOWER(c.status) = LOWER(:status)) " +
           "ORDER BY c.purchasedAt DESC")
    org.springframework.data.domain.Page<CustomerPlan> findFiltered(
            @org.springframework.data.repository.query.Param("planId") Long planId,
            @org.springframework.data.repository.query.Param("status") String status,
            org.springframework.data.domain.Pageable pageable
    );
}
