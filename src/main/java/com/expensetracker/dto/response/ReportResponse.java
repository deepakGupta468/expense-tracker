package com.expensetracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportResponse {
    private BigDecimal totalAmount;
    private int totalTransactions;
    private Map<String, BigDecimal> categoryBreakdown;
    private List<ExpenseResponse> expenses;
    private String period;
}
