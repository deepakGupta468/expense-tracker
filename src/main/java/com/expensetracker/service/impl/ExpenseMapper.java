package com.expensetracker.service.impl;

import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.entity.Expense;
import org.springframework.stereotype.Component;

/**
 * Shared Expense -> ExpenseResponse mapping so that services do not have to
 * depend on each other's implementation classes.
 */
@Component
public class ExpenseMapper {

    public ExpenseResponse toResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .categoryId(expense.getCategory().getId())
                .categoryName(expense.getCategory().getName())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
