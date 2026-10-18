package com.voltflow.repository;

import com.voltflow.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface StationRepository extends JpaRepository<Station, Long> {
    List<Station> findByStatusIgnoreCase(String status);
    long countByStatusIgnoreCase(String status);

    @Query("SELECT s FROM Station s WHERE " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR LOWER(s.status) = LOWER(:status))")
    List<Station> searchStations(@Param("search") String search, @Param("status") String status);
}
