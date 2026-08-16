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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Override
    public BudgetResponse createBudget(BudgetRequest request, String userEmail) {
        User user = getUser(userEmail);
        Category category = resolveCategory(request.getCategoryId(), user);

        requireNoConflict(user, category, request.getMonth(), request.getYear(), null);

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
    @Transactional(readOnly = true)
    public List<BudgetResponse> getAllBudgets(String userEmail) {
        User user = getUser(userEmail);
        return budgetRepository.findByUser(user).stream()
                .map(b -> mapToResponse(b, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
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

        Category category = resolveCategory(request.getCategoryId(), user);

        // Moving a budget to a different category/period must not collide with
        // one that already covers that slot.
        requireNoConflict(user, category, request.getMonth(), request.getYear(), budget.getId());

        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());
        budget.setCategory(category);

        return mapToResponse(budgetRepository.save(budget), user);
    }

    @Override
    public void deleteBudget(Long id, String userEmail) {
        User user = getUser(userEmail);
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        budgetRepository.delete(budget);
    }

    /** null categoryId means an overall (all-categories) budget. */
    private Category resolveCategory(Long categoryId, User user) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
    }

    private void requireNoConflict(User user, Category category, int month, int year, Long excludeId) {
        Optional<Budget> existing = category != null
                ? budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, month, year)
                : budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, month, year);

        boolean conflict = existing
                .filter(b -> excludeId == null || !b.getId().equals(excludeId))
                .isPresent();

        if (conflict) {
            throw new BadRequestException(category != null
                    ? "A budget for this category and period already exists"
                    : "An overall budget for this period already exists");
        }
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
