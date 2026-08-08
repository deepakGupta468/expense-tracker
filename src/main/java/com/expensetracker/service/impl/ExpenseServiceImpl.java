package com.expensetracker.service.impl;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;
    private final EmailServiceImpl emailService;

    @Override
    public ExpenseResponse createExpense(ExpenseRequest request, String userEmail) {
        User user = getUser(userEmail);
        Category category = getCategory(request.getCategoryId(), user);

        Expense expense = Expense.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .category(category)
                .user(user)
                .build();

        Expense saved = expenseRepository.save(expense);
        checkBudgetAndNotify(user, category, request.getExpenseDate());
        return mapToResponse(saved);
    }

    @Override
    public List<ExpenseResponse> getAllExpenses(String userEmail) {
        User user = getUser(userEmail);
        return expenseRepository.findByUserOrderByExpenseDateDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExpenseResponse getExpenseById(Long id, String userEmail) {
        User user = getUser(userEmail);
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        return mapToResponse(expense);
    }

    @Override
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, String userEmail) {
        User user = getUser(userEmail);
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        Category category = getCategory(request.getCategoryId(), user);

        expense.setTitle(request.getTitle());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setCategory(category);

        return mapToResponse(expenseRepository.save(expense));
    }

    @Override
    public void deleteExpense(Long id, String userEmail) {
        User user = getUser(userEmail);
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        expenseRepository.delete(expense);
    }

    @Override
    public List<ExpenseResponse> getExpensesByCategory(Long categoryId, String userEmail) {
        User user = getUser(userEmail);
        Category category = getCategory(categoryId, user);
        return expenseRepository.findByUserAndCategory(user, category).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExpenseResponse> getExpensesByDateRange(LocalDate startDate, LocalDate endDate, String userEmail) {
        User user = getUser(userEmail);
        return expenseRepository.findByUserAndExpenseDateBetweenOrderByExpenseDateDesc(user, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExpenseResponse> getExpensesByDate(LocalDate date, String userEmail) {
        User user = getUser(userEmail);
        return expenseRepository.findByUserAndExpenseDateOrderByExpenseDateDesc(user, date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void checkBudgetAndNotify(User user, Category category, LocalDate expenseDate) {
        int year = expenseDate.getYear();
        int month = expenseDate.getMonthValue();

        if (category != null) {
            budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, month, year)
                    .ifPresent(budget -> {
                        BigDecimal spent = expenseRepository.sumByUserAndCategoryAndMonth(user, category, year, month);
                        if (spent != null && spent.compareTo(budget.getMonthlyLimit()) > 0) {
                            sendBudgetAlert(user, budget.getMonthlyLimit(), spent, category.getName(), month, year);
                        }
                    });
        }

        budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, month, year)
                .ifPresent(budget -> {
                    BigDecimal spent = expenseRepository.sumByUserAndMonthAndYear(user, year, month);
                    if (spent != null && spent.compareTo(budget.getMonthlyLimit()) > 0) {
                        sendBudgetAlert(user, budget.getMonthlyLimit(), spent, "Overall", month, year);
                    }
                });
    }

    private void sendBudgetAlert(User user, BigDecimal limit, BigDecimal spent,
                                 String categoryName, int month, int year) {
        emailService.sendBudgetAlert(
                user.getEmail(),
                user.getFullName(),
                categoryName,
                limit,
                spent,
                month,
                year
        );
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Category getCategory(Long categoryId, User user) {
        return categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
    }

    public ExpenseResponse mapToResponse(Expense expense) {
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
