package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {
    ExpenseResponse createExpense(ExpenseRequest request, String userEmail);
    Page<ExpenseResponse> getAllExpenses(String userEmail, Pageable pageable);
    ExpenseResponse getExpenseById(Long id, String userEmail);
    ExpenseResponse updateExpense(Long id, ExpenseRequest request, String userEmail);
    void deleteExpense(Long id, String userEmail);
    List<ExpenseResponse> getExpensesByCategory(Long categoryId, String userEmail);
    List<ExpenseResponse> getExpensesByDateRange(LocalDate startDate, LocalDate endDate, String userEmail);
    List<ExpenseResponse> getExpensesByDate(LocalDate date, String userEmail);
}
