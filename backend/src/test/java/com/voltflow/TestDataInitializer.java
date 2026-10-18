package com.voltflow;

import com.voltflow.entity.*;
import com.voltflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Set;

@Configuration
@Profile("test")
public class TestDataInitializer {

    @Bean
    CommandLineRunner seedTestData(RoleRepository roleRepository,
                                  UserRepository userRepository,
                                  PasswordEncoder passwordEncoder,
                                  StationRepository stationRepository,
                                  ChargerRepository chargerRepository,
                                  VehicleRepository vehicleRepository,
                                  TariffRepository tariffRepository,
                                  PrepaidPlanRepository prepaidPlanRepository) {
        return args -> {
            Role adminRole = null;
            Role customerRole = null;
            for (String name : new String[]{"CUSTOMER", "ADMIN", "SUPER_ADMIN"}) {
                Role role = roleRepository.findByName(name)
                        .orElseGet(() -> roleRepository.save(Role.builder().name(name).build()));
                if ("ADMIN".equals(name)) {
                    adminRole = role;
                } else if ("CUSTOMER".equals(name)) {
                    customerRole = role;
                }
            }

            if (userRepository.findByEmail("admin@voltflow.test").isEmpty() && adminRole != null) {
                userRepository.save(User.builder()
                        .fullName("Admin User")
                        .email("admin@voltflow.test")
                        .passwordHash(passwordEncoder.encode("AdminPass123!"))
                        .enabled(true)
                        .roles(Set.of(adminRole))
                        .build());
            }

            User customer2 = null;
            if (userRepository.findByEmail("customer2@voltflow.test").isEmpty() && customerRole != null) {
                customer2 = userRepository.save(User.builder()
                        .fullName("Second Customer")
                        .email("customer2@voltflow.test")
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .enabled(true)
                        .roles(Set.of(customerRole))
                        .build());
            } else {
                customer2 = userRepository.findByEmail("customer2@voltflow.test").orElse(null);
            }

            // Seed sample vehicle for customer2 if none exists
            if (customer2 != null && vehicleRepository.findByOwnerId(customer2.getId()).isEmpty()) {
                vehicleRepository.save(Vehicle.builder()
                        .owner(customer2)
                        .make("Hyundai")
                        .model("Ioniq 5")
                        .registrationNumber("EV-CUST2-1")
                        .batteryCapacityKwh(BigDecimal.valueOf(77.4))
                        .connectorType("CCS2")
                        .modelYear(2023)
                        .build());
            }

            // Seed Tariffs
            if (tariffRepository.count() == 0) {
                tariffRepository.save(Tariff.builder()
                        .name("DC_FAST_TARIFF")
                        .ratePerKwh(BigDecimal.valueOf(0.3500))
                        .connectorType("CCS2")
                        .active(true)
                        .build());

                tariffRepository.save(Tariff.builder()
                        .name("CHADEMO_TARIFF")
                        .ratePerKwh(BigDecimal.valueOf(0.3500))
                        .connectorType("CHAdeMO")
                        .active(true)
                        .build());

                tariffRepository.save(Tariff.builder()
                        .name("AC_DESTINATION_TARIFF")
                        .ratePerKwh(BigDecimal.valueOf(0.2200))
                        .connectorType("Type 2")
                        .active(true)
                        .build());

                tariffRepository.save(Tariff.builder()
                        .name("DEFAULT_STANDARD_TARIFF")
                        .ratePerKwh(BigDecimal.valueOf(0.2800))
                        .connectorType(null)
                        .active(true)
                        .build());
            }

            // Seed Stations and Chargers
            if (stationRepository.count() == 0) {
                Station s1 = stationRepository.save(Station.builder()
                        .name("VoltFlow Central Hub")
                        .address("100 Innovation Blvd, Metro City")
                        .latitude(37.7749)
                        .longitude(-122.4194)
                        .status("ACTIVE")
                        .build());

                chargerRepository.save(Charger.builder()
                        .station(s1)
                        .chargerCode("VF-C101")
                        .connectorType("CCS2")
                        .maxPowerKw(BigDecimal.valueOf(150.0))
                        .status("AVAILABLE")
                        .build());

                chargerRepository.save(Charger.builder()
                        .station(s1)
                        .chargerCode("VF-C102")
                        .connectorType("Type 2")
                        .maxPowerKw(BigDecimal.valueOf(22.0))
                        .status("OCCUPIED")
                        .build());

                Station s2 = stationRepository.save(Station.builder()
                        .name("Downtown Express Charging")
                        .address("450 Market Street, Metro City")
                        .latitude(37.7891)
                        .longitude(-122.4014)
                        .status("ACTIVE")
                        .build());

                chargerRepository.save(Charger.builder()
                        .station(s2)
                        .chargerCode("VF-D201")
                        .connectorType("CCS2")
                        .maxPowerKw(BigDecimal.valueOf(350.0))
                        .status("AVAILABLE")
                        .build());
            }

            // Seed Prepaid Plans
            if (prepaidPlanRepository.count() == 0) {
                prepaidPlanRepository.save(PrepaidPlan.builder()
                        .name("VoltStarter Pack")
                        .description("Ideal for first-time EV drivers. Includes $3 bonus credit.")
                        .price(BigDecimal.valueOf(25.00))
                        .creditAmount(BigDecimal.valueOf(28.00))
                        .energyAllowanceKwh(BigDecimal.valueOf(50.00))
                        .validityDays(30)
                        .currency("USD")
                        .active(true)
                        .build());

                prepaidPlanRepository.save(PrepaidPlan.builder()
                        .name("Commuter Booster")
                        .description("Optimized for daily city commuters. Includes $10 bonus credit.")
                        .price(BigDecimal.valueOf(50.00))
                        .creditAmount(BigDecimal.valueOf(60.00))
                        .energyAllowanceKwh(BigDecimal.valueOf(150.00))
                        .validityDays(60)
                        .currency("USD")
                        .active(true)
                        .build());

                prepaidPlanRepository.save(PrepaidPlan.builder()
                        .name("Green Fleet Mega")
                        .description("Maximum savings for high-mileage drivers and fleets. Includes $25 bonus credit.")
                        .price(BigDecimal.valueOf(100.00))
                        .creditAmount(BigDecimal.valueOf(125.00))
                        .energyAllowanceKwh(BigDecimal.valueOf(400.00))
                        .validityDays(90)
                        .currency("USD")
                        .active(true)
                        .build());
            }
        };
    }
}
