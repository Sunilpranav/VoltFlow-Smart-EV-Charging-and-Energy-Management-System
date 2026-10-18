package com.voltflow.repository;

import com.voltflow.entity.Wallet;
import com.voltflow.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByWalletOrderByCreatedAtDesc(Wallet wallet);

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);

    List<WalletTransaction> findByChargingSessionId(Long sessionId);

    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    long countByTransactionType(String transactionType);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t WHERE t.transactionType = :type")
    BigDecimal sumAmountByTransactionType(@Param("type") String type);

    @Query("SELECT t FROM WalletTransaction t WHERE " +
           "(:type IS NULL OR t.transactionType = :type) " +
           "ORDER BY t.createdAt DESC")
    Page<WalletTransaction> findFiltered(@Param("type") String type, Pageable pageable);
}