package com.voltflow.repository;

import com.voltflow.entity.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TariffRepository extends JpaRepository<Tariff, Long> {
    Optional<Tariff> findByConnectorTypeIgnoreCaseAndActiveTrue(String connectorType);
    Optional<Tariff> findByConnectorTypeIgnoreCaseAndCurrencyIgnoreCaseAndActiveTrue(String connectorType, String currency);
    Optional<Tariff> findByName(String name);
    List<Tariff> findByActiveTrue();
    boolean existsByConnectorTypeIgnoreCaseAndCurrencyIgnoreCaseAndActiveTrueAndIdNot(String connectorType, String currency, Long id);
    boolean existsByConnectorTypeIgnoreCaseAndCurrencyIgnoreCaseAndActiveTrue(String connectorType, String currency);
}
