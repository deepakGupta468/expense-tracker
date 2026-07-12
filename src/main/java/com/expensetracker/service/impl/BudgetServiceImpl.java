package com.expensetracker.service.impl;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Override
    public BudgetResponse createBudget(BudgetRequest request, String userEmail) {
        User user = getUser(userEmail);
        Category category = null;

        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUser(request.getCategoryId(), user)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

            budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, request.getMonth(), request.getYear())
                    .ifPresent(b -> { throw new BadRequestException("Budget already exists for this category and period"); });
        } else {
            budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, request.getMonth(), request.getYear())
                    .ifPresent(b -> { throw new BadRequestException("Overall budget already exists for this period"); });
        }

        Budget budget = Budget.builder()
                .monthlyLimit(request.getMonthlyLimit())
                .month(request.getMonth())
                .year(request.getYear())
                .category(category)
                .user(user)
                .build();

        return mapToResponse(budgetRepository.save(budget), user);
    }

    @Override
    public List<BudgetResponse> getAllBudgets(String userEmail) {
        User user = getUser(userEmail);
        return budgetRepository.findByUser(user).stream()
                .map(b -> mapToResponse(b, user))
                .collect(Collectors.toList());
    }

    @Override
    public List<BudgetResponse> getBudgetsByMonth(int month, int year, String userEmail) {
        User user = getUser(userEmail);
        return budgetRepository.findByUserAndMonthAndYear(user, month, year).stream()
                .map(b -> mapToResponse(b, user))
                .collect(Collectors.toList());
    }

    @Override
    public BudgetResponse updateBudget(Long id, BudgetRequest request, String userEmail) {
        User user = getUser(userEmail);
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        return mapToResponse(budgetRepository.save(budget), user);
    }

    @Override
    public void deleteBudget(Long id, String userEmail) {
        User user = getUser(userEmail);
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        budgetRepository.delete(budget);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private BudgetResponse mapToResponse(Budget budget, User user) {
        BigDecimal totalSpent;
        if (budget.getCategory() != null) {
            totalSpent = expenseRepository.sumByUserAndCategoryAndMonth(
                    user, budget.getCategory(), budget.getYear(), budget.getMonth());
        } else {
            totalSpent = expenseRepository.sumByUserAndMonthAndYear(
                    user, budget.getYear(), budget.getMonth());
        }

        if (totalSpent == null) totalSpent = BigDecimal.ZERO;

        BigDecimal remaining = budget.getMonthlyLimit().subtract(totalSpent);
        boolean exceeded = totalSpent.compareTo(budget.getMonthlyLimit()) > 0;

        return BudgetResponse.builder()
                .id(budget.getId())
                .monthlyLimit(budget.getMonthlyLimit())
                .totalSpent(totalSpent)
                .remaining(remaining)
                .exceeded(exceeded)
                .month(budget.getMonth())
                .year(budget.getYear())
                .categoryId(budget.getCategory() != null ? budget.getCategory().getId() : null)
                .categoryName(budget.getCategory() != null ? budget.getCategory().getName() : "Overall")
                .createdAt(budget.getCreatedAt())
                .build();
    }
}
