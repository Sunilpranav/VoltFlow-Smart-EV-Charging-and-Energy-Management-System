package com.voltflow.config;

import com.voltflow.entity.*;
import com.voltflow.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final StationRepository stationRepository;
    private final ChargerRepository chargerRepository;
    private final TariffRepository tariffRepository;
    private final PrepaidPlanRepository prepaidPlanRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            WalletRepository walletRepository,
            StationRepository stationRepository,
            ChargerRepository chargerRepository,
            TariffRepository tariffRepository,
            PrepaidPlanRepository prepaidPlanRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.stationRepository = stationRepository;
        this.chargerRepository = chargerRepository;
        this.tariffRepository = tariffRepository;
        this.prepaidPlanRepository = prepaidPlanRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("--- Initializing VoltFlow Dev Mode In-Memory Seed Data ---");

        // 1. Roles
        Role customerRole = roleRepository.findByName("CUSTOMER").orElseGet(() -> {
            Role r = new Role();
            r.setName("CUSTOMER");
            return roleRepository.save(r);
        });

        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role r = new Role();
            r.setName("ADMIN");
            return roleRepository.save(r);
        });

        roleRepository.findByName("SUPER_ADMIN").orElseGet(() -> {
            Role r = new Role();
            r.setName("SUPER_ADMIN");
            return roleRepository.save(r);
        });

        // 2. Default Admin User
        if (userRepository.findByEmail("admin@voltflow.com").isEmpty()) {
            Set<Role> roles = new HashSet<>();
            roles.add(customerRole);
            roles.add(adminRole);

            User admin = User.builder()
                    .fullName("VoltFlow Administrator")
                    .email("admin@voltflow.com")
                    .passwordHash(passwordEncoder.encode("AdminPass123!"))
                    .phone("+1 (555) 019-2834")
                    .enabled(true)
                    .roles(roles)
                    .build();
            User savedAdmin = userRepository.save(admin);

            Wallet adminWallet = Wallet.builder()
                    .user(savedAdmin)
                    .balance(new BigDecimal("500.00"))
                    .currency("USD")
                    .build();
            walletRepository.save(adminWallet);
            log.info("Created dev admin account: admin@voltflow.com / AdminPass123!");
        }

        // 3. Stations & Chargers
        if (stationRepository.count() == 0) {
            // Station 1: Central Hub
            Station s1 = Station.builder()
                    .name("VoltFlow Central Hub")
                    .address("100 Innovation Blvd, Metro City")
                    .latitude(37.7749)
                    .longitude(-122.4194)
                    .status("ACTIVE")
                    .build();
            s1 = stationRepository.save(s1);

            createCharger(s1, "VF-C101", "CCS2", new BigDecimal("150.00"), "AVAILABLE", new BigDecimal("1000.0000"));
            createCharger(s1, "VF-C102", "CCS2", new BigDecimal("150.00"), "OCCUPIED", new BigDecimal("1050.2500"));
            createCharger(s1, "VF-C103", "Type 2", new BigDecimal("22.00"), "AVAILABLE", new BigDecimal("450.0000"));
            createCharger(s1, "VF-C104", "CHAdeMO", new BigDecimal("50.00"), "AVAILABLE", new BigDecimal("800.0000"));

            // Station 2: Downtown Express
            Station s2 = Station.builder()
                    .name("Downtown Express Charging")
                    .address("450 Market Street, Metro City")
                    .latitude(37.7891)
                    .longitude(-122.4014)
                    .status("ACTIVE")
                    .build();
            s2 = stationRepository.save(s2);

            createCharger(s2, "VF-D201", "CCS2", new BigDecimal("350.00"), "AVAILABLE", new BigDecimal("2100.0000"));
            createCharger(s2, "VF-D202", "CCS2", new BigDecimal("350.00"), "AVAILABLE", new BigDecimal("1900.5000"));
            createCharger(s2, "VF-D203", "Type 2", new BigDecimal("43.00"), "OCCUPIED", new BigDecimal("320.0000"));

            // Station 3: Silicon Bay Tech Park
            Station s3 = Station.builder()
                    .name("Silicon Bay Tech Park Hub")
                    .address("800 Technology Way, Silicon Bay")
                    .latitude(37.3861)
                    .longitude(-122.0839)
                    .status("ACTIVE")
                    .build();
            s3 = stationRepository.save(s3);

            createCharger(s3, "VF-S301", "CCS2", new BigDecimal("150.00"), "AVAILABLE", new BigDecimal("1400.0000"));
            createCharger(s3, "VF-S302", "Type 2", new BigDecimal("22.00"), "AVAILABLE", new BigDecimal("600.0000"));
            createCharger(s3, "VF-S303", "CHAdeMO", new BigDecimal("50.00"), "OFFLINE", new BigDecimal("950.0000"));

            // Station 4: Airport EcoPort
            Station s4 = Station.builder()
                    .name("Airport EcoPort Charging")
                    .address("1 Terminal Drive, International Airport")
                    .latitude(37.6213)
                    .longitude(-122.3790)
                    .status("MAINTENANCE")
                    .build();
            s4 = stationRepository.save(s4);

            createCharger(s4, "VF-A401", "CCS2", new BigDecimal("150.00"), "OFFLINE", new BigDecimal("1200.0000"));
            createCharger(s4, "VF-A402", "Type 2", new BigDecimal("22.00"), "OFFLINE", new BigDecimal("300.0000"));

            log.info("Seeded 4 stations and 12 charging stalls.");
        }

        // 4. Tariffs
        if (tariffRepository.count() == 0) {
            tariffRepository.save(Tariff.builder()
                    .name("Standard CCS2 High-Power")
                    .ratePerKwh(new BigDecimal("0.3500"))
                    .connectorType("CCS2")
                    .currency("USD")
                    .active(true)
                    .build());

            tariffRepository.save(Tariff.builder()
                    .name("AC Type 2 Standard Rate")
                    .ratePerKwh(new BigDecimal("0.2200"))
                    .connectorType("Type 2")
                    .currency("USD")
                    .active(true)
                    .build());

            tariffRepository.save(Tariff.builder()
                    .name("CHAdeMO Fast Rate")
                    .ratePerKwh(new BigDecimal("0.3000"))
                    .connectorType("CHAdeMO")
                    .currency("USD")
                    .active(true)
                    .build());
            log.info("Seeded standard charging tariffs.");
        }

        // 5. Prepaid Energy Plans
        if (prepaidPlanRepository.count() == 0) {
            prepaidPlanRepository.save(PrepaidPlan.builder()
                    .name("VoltStarter Pack")
                    .description("Ideal for first-time EV drivers. Includes $3 bonus credit.")
                    .price(new BigDecimal("25.00"))
                    .creditAmount(new BigDecimal("28.00"))
                    .energyAllowanceKwh(new BigDecimal("50.00"))
                    .validityDays(30)
                    .currency("USD")
                    .active(true)
                    .build());

            prepaidPlanRepository.save(PrepaidPlan.builder()
                    .name("Commuter Booster")
                    .description("Optimized for daily city commuters. Includes $10 bonus credit.")
                    .price(new BigDecimal("50.00"))
                    .creditAmount(new BigDecimal("60.00"))
                    .energyAllowanceKwh(new BigDecimal("150.00"))
                    .validityDays(60)
                    .currency("USD")
                    .active(true)
                    .build());

            prepaidPlanRepository.save(PrepaidPlan.builder()
                    .name("Green Fleet Mega")
                    .description("Maximum savings for high-mileage drivers and fleets. Includes $25 bonus credit.")
                    .price(new BigDecimal("100.00"))
                    .creditAmount(new BigDecimal("125.00"))
                    .energyAllowanceKwh(new BigDecimal("400.00"))
                    .validityDays(90)
                    .currency("USD")
                    .active(true)
                    .build());
            log.info("Seeded prepaid energy plans.");
        }

        log.info("--- VoltFlow Dev Mode Seed Data Initialized Successfully ---");
    }

    private void createCharger(Station station, String code, String connector, BigDecimal maxPower, String status, BigDecimal meter) {
        Charger c = Charger.builder()
                .station(station)
                .chargerCode(code)
                .connectorType(connector)
                .maxPowerKw(maxPower)
                .status(status)
                .build();
        c.setMeterReadingKwh(meter);
        chargerRepository.save(c);
    }
}
