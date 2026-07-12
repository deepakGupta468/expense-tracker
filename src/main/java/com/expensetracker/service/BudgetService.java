package com.expensetracker.service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;

import java.util.List;

public interface BudgetService {
    BudgetResponse createBudget(BudgetRequest request, String userEmail);
    List<BudgetResponse> getAllBudgets(String userEmail);
    List<BudgetResponse> getBudgetsByMonth(int month, int year, String userEmail);
    BudgetResponse updateBudget(Long id, BudgetRequest request, String userEmail);
    void deleteBudget(Long id, String userEmail);
}
