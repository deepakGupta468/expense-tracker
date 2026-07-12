package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {
    ExpenseResponse createExpense(ExpenseRequest request, String userEmail);
    List<ExpenseResponse> getAllExpenses(String userEmail);
    ExpenseResponse getExpenseById(Long id, String userEmail);
    ExpenseResponse updateExpense(Long id, ExpenseRequest request, String userEmail);
    void deleteExpense(Long id, String userEmail);
    List<ExpenseResponse> getExpensesByCategory(Long categoryId, String userEmail);
    List<ExpenseResponse> getExpensesByDateRange(LocalDate startDate, LocalDate endDate, String userEmail);
    List<ExpenseResponse> getExpensesByDate(LocalDate date, String userEmail);
}
