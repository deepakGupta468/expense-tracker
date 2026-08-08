package com.expensetracker.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Validated
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(
                budgetService.createBudget(request, userDetails.getUsername()),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(budgetService.getAllBudgets(userDetails.getUsername()));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<BudgetResponse>> getBudgetsByMonth(
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam @Min(2000) @Max(2099) int year,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(budgetService.getBudgetsByMonth(month, year, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable @Positive Long id,
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(budgetService.updateBudget(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable @Positive Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        budgetService.deleteBudget(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
