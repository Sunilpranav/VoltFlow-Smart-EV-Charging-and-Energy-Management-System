package com.voltflow.repository;

import com.voltflow.entity.PaymentIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, Long> {

    Optional<PaymentIntent> findByIntentId(String intentId);

    Optional<PaymentIntent> findByIdempotencyKey(String idempotencyKey);

    List<PaymentIntent> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentIntent p WHERE p.status = :status")
    java.math.BigDecimal sumAmountByStatus(@org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PaymentIntent p WHERE " +
           "(:status IS NULL OR LOWER(p.status) = LOWER(:status)) " +
           "ORDER BY p.createdAt DESC")
    org.springframework.data.domain.Page<PaymentIntent> findFiltered(
            @org.springframework.data.repository.query.Param("status") String status,
            org.springframework.data.domain.Pageable pageable
    );
}
