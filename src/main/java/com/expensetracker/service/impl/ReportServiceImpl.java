package com.expensetracker.service.impl;

import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.dto.response.ReportResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final ExpenseMapper expenseMapper;

    @Override
    public ReportResponse getDailyReport(LocalDate date, String userEmail) {
        User user = getUser(userEmail);
        List<Expense> expenses = expenseRepository.findByUserAndExpenseDateOrderByExpenseDateDesc(user, date);
        List<ExpenseResponse> expenseResponses = expenses.stream()
                .map(expenseMapper::toResponse).collect(Collectors.toList());

        BigDecimal total = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> breakdown = buildCategoryBreakdown(expenses);

        return ReportResponse.builder()
                .totalAmount(total)
                .totalTransactions(expenses.size())
                .categoryBreakdown(breakdown)
                .expenses(expenseResponses)
                .period("Daily: " + date)
                .build();
    }

    @Override
    public ReportResponse getMonthlyReport(int month, int year, String userEmail) {
        User user = getUser(userEmail);
        List<Expense> expenses = expenseRepository.findByUserAndMonthAndYear(user, year, month);
        List<ExpenseResponse> expenseResponses = expenses.stream()
                .map(expenseMapper::toResponse).collect(Collectors.toList());

        BigDecimal total = expenseRepository.sumByUserAndMonthAndYear(user, year, month);
        if (total == null) total = BigDecimal.ZERO;

        Map<String, BigDecimal> breakdown = buildCategoryBreakdown(expenses);

        return ReportResponse.builder()
                .totalAmount(total)
                .totalTransactions(expenses.size())
                .categoryBreakdown(breakdown)
                .expenses(expenseResponses)
                .period(String.format("Monthly: %d/%d", month, year))
                .build();
    }

    @Override
    public ReportResponse getDateRangeReport(LocalDate startDate, LocalDate endDate, String userEmail) {
        User user = getUser(userEmail);
        List<Expense> expenses = expenseRepository
                .findByUserAndExpenseDateBetweenOrderByExpenseDateDesc(user, startDate, endDate);
        List<ExpenseResponse> expenseResponses = expenses.stream()
                .map(expenseMapper::toResponse).collect(Collectors.toList());

        BigDecimal total = expenseRepository.sumByUserAndDateRange(user, startDate, endDate);
        if (total == null) total = BigDecimal.ZERO;

        Map<String, BigDecimal> breakdown = buildCategoryBreakdown(expenses);

        return ReportResponse.builder()
                .totalAmount(total)
                .totalTransactions(expenses.size())
                .categoryBreakdown(breakdown)
                .expenses(expenseResponses)
                .period("Range: " + startDate + " to " + endDate)
                .build();
    }

    private Map<String, BigDecimal> buildCategoryBreakdown(List<Expense> expenses) {
        return expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
