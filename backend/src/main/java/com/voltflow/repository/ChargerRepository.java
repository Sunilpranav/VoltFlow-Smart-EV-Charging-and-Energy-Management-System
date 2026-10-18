package com.voltflow.repository;

import com.voltflow.entity.Charger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChargerRepository extends JpaRepository<Charger, Long> {
    List<Charger> findByStationId(Long stationId);
    List<Charger> findByStatus(String status);

    @Query("SELECT c FROM Charger c WHERE " +
           "(:stationId IS NULL OR c.station.id = :stationId) AND " +
           "(:connectorType IS NULL OR LOWER(c.connectorType) = LOWER(:connectorType)) AND " +
           "(:status IS NULL OR LOWER(c.status) = LOWER(:status))")
    List<Charger> findFilteredChargers(@Param("stationId") Long stationId,
                                       @Param("connectorType") String connectorType,
                                       @Param("status") String status);

    long countByStatus(String status);
    boolean existsByChargerCode(String chargerCode);
    boolean existsByChargerCodeAndIdNot(String chargerCode, Long id);

    @Modifying
    @Query("UPDATE Charger c SET c.status = 'OCCUPIED' WHERE c.id = :id AND c.status = 'AVAILABLE'")
    int occupyChargerIfAvailable(@Param("id") Long id);
}
