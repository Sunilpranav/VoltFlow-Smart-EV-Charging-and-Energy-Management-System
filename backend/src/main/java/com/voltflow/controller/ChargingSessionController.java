package com.voltflow.controller;

import com.voltflow.dto.ChargingSessionResponse;
import com.voltflow.dto.SessionSummaryResponse;
import com.voltflow.dto.StartSessionRequest;
import com.voltflow.service.ChargingSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class ChargingSessionController {

    private final ChargingSessionService sessionService;
    private final com.voltflow.service.WalletService walletService;

    public ChargingSessionController(ChargingSessionService sessionService, com.voltflow.service.WalletService walletService) {
        this.sessionService = sessionService;
        this.walletService = walletService;
    }

    @PostMapping("/start")
    public ResponseEntity<ChargingSessionResponse> startSession(
            @Valid @RequestBody StartSessionRequest request,
            Principal principal) {
        ChargingSessionResponse response = sessionService.startSession(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ChargingSessionResponse>> getSessions(Principal principal) {
        return ResponseEntity.ok(sessionService.getSessions(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingSessionResponse> getSessionById(
            @PathVariable("id") Long id,
            Principal principal) {
        return ResponseEntity.ok(sessionService.getSessionById(id, principal.getName()));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<ChargingSessionResponse> stopSession(
            @PathVariable("id") Long id,
            Principal principal) {
        return ResponseEntity.ok(sessionService.stopSession(id, principal.getName()));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<SessionSummaryResponse> getSessionSummary(
            @PathVariable("id") Long id,
            Principal principal) {
        return ResponseEntity.ok(sessionService.getSessionSummary(id, principal.getName()));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<com.voltflow.dto.PaySessionResponse> paySession(
            @PathVariable("id") Long id,
            Principal principal) {
        return ResponseEntity.ok(walletService.payChargingSession(id, principal.getName()));
    }

}
