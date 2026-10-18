package com.voltflow.controller;

import com.voltflow.dto.CustomerPlanResponse;
import com.voltflow.dto.PrepaidPlanResponse;
import com.voltflow.dto.PurchasePlanRequest;
import com.voltflow.service.PrepaidPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PrepaidPlanController {

    private final PrepaidPlanService prepaidPlanService;

    public PrepaidPlanController(PrepaidPlanService prepaidPlanService) {
        this.prepaidPlanService = prepaidPlanService;
    }

    @GetMapping
    public ResponseEntity<List<PrepaidPlanResponse>> getActivePlans() {
        return ResponseEntity.ok(prepaidPlanService.getActivePlans());
    }

    @GetMapping("/my-plans")
    public ResponseEntity<List<CustomerPlanResponse>> getMyPlans(Principal principal) {
        return ResponseEntity.ok(prepaidPlanService.getCustomerPlans(principal.getName()));
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<CustomerPlanResponse> purchasePlan(
            @PathVariable("id") Long id,
            @RequestBody(required = false) PurchasePlanRequest request,
            Principal principal) {
        return ResponseEntity.ok(prepaidPlanService.purchasePlan(id, request, principal.getName()));
    }
}
