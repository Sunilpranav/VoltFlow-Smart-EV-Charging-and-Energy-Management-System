package com.voltflow.repository;

import com.voltflow.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByOwnerId(Long ownerId);
    Optional<Vehicle> findByIdAndOwnerId(Long id, Long ownerId);
    boolean existsByRegistrationNumber(String registrationNumber);
    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);
}
