package com.voltflow.controller;

import com.voltflow.dto.CustomerDashboardResponse;
import com.voltflow.service.CustomerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/customer/dashboard")
public class CustomerDashboardController {

    private final CustomerDashboardService customerDashboardService;

    public CustomerDashboardController(CustomerDashboardService customerDashboardService) {
        this.customerDashboardService = customerDashboardService;
    }

    @GetMapping
    public ResponseEntity<CustomerDashboardResponse> getDashboard(Principal principal) {
        return ResponseEntity.ok(customerDashboardService.getDashboard(principal.getName()));
    }
}
