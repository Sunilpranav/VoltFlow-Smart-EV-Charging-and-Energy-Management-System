package com.voltflow.controller;

import com.voltflow.dto.*;
import com.voltflow.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(Principal principal) {
        return ResponseEntity.ok(walletService.getWallet(principal.getName()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> getTransactions(Principal principal) {
        return ResponseEntity.ok(walletService.getTransactionHistory(principal.getName()));
    }

    @PostMapping("/topup/intent")
    public ResponseEntity<PaymentIntentResponse> createTopUpIntent(
            @Valid @RequestBody CreateTopUpIntentRequest request,
            Principal principal) {
        return ResponseEntity.ok(walletService.createTopUpIntent(request, principal.getName()));
    }

    @PostMapping("/topup/confirm")
    public ResponseEntity<PaymentIntentResponse> confirmTopUp(
            @Valid @RequestBody ConfirmTopUpRequest request,
            Principal principal) {
        return ResponseEntity.ok(walletService.confirmTopUp(request, principal.getName()));
    }
}
