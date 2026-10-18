package com.voltflow.repository;

import com.voltflow.entity.PrepaidPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for PrepaidPlan entities.
 * sumPurchaseAmount() sums the price field of all plans - used by the admin dashboard.
 */
@Repository
public interface PrepaidPlanRepository extends JpaRepository<PrepaidPlan, Long> {

    /** Returns the total of all plan prices; returns 0 when no plans exist. */
    @Query("SELECT COALESCE(SUM(p.price), 0) FROM PrepaidPlan p")
    BigDecimal sumPurchaseAmount();

    List<PrepaidPlan> findByActiveTrue();

    Optional<PrepaidPlan> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}