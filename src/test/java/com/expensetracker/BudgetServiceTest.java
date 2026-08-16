package com.expensetracker;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.impl.BudgetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock private BudgetRepository budgetRepository;
    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ExpenseRepository expenseRepository;

    @InjectMocks private BudgetServiceImpl budgetService;

    private User user;
    private Category category;
    private BudgetRequest request;

    private static final String EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email(EMAIL).fullName("Test User").role(Role.USER).build();
        category = Category.builder().id(10L).name("Food").user(user).build();

        request = new BudgetRequest();
        request.setMonthlyLimit(new BigDecimal("5000.00"));
        request.setMonth(8);
        request.setYear(2026);
        request.setCategoryId(10L);
    }

    private Budget budget(Long id, Category cat) {
        return Budget.builder()
                .id(id)
                .monthlyLimit(new BigDecimal("5000.00"))
                .month(8).year(2026)
                .category(cat)
                .user(user)
                .build();
    }

    @Test
    void createBudget_ShouldThrow_WhenCategoryBudgetForPeriodAlreadyExists() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(budget(1L, category)));

        assertThatThrownBy(() -> budgetService.createBudget(request, EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");

        verify(budgetRepository, never()).save(any());
    }

    @Test
    void createBudget_ShouldCreateOverallBudget_WhenCategoryIdIsNull() {
        request.setCategoryId(null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenReturn(budget(1L, null));
        when(expenseRepository.sumByUserAndMonthAndYear(user, 2026, 8)).thenReturn(new BigDecimal("1200.00"));

        BudgetResponse response = budgetService.createBudget(request, EMAIL);

        assertThat(response.getCategoryName()).isEqualTo("Overall");
        assertThat(response.getCategoryId()).isNull();
        assertThat(response.getRemaining()).isEqualByComparingTo("3800.00");
        assertThat(response.isExceeded()).isFalse();
        verifyNoInteractions(categoryRepository);
    }

    @Test
    void mapping_ShouldFlagExceeded_AndTreatNullSumAsZero() {
        request.setCategoryId(null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenReturn(budget(1L, null));
        when(expenseRepository.sumByUserAndMonthAndYear(user, 2026, 8)).thenReturn(new BigDecimal("6000.00"));

        assertThat(budgetService.createBudget(request, EMAIL).isExceeded()).isTrue();

        reset(expenseRepository);
        when(expenseRepository.sumByUserAndMonthAndYear(user, 2026, 8)).thenReturn(null);

        BudgetResponse empty = budgetService.createBudget(request, EMAIL);
        assertThat(empty.getTotalSpent()).isEqualByComparingTo("0");
        assertThat(empty.getRemaining()).isEqualByComparingTo("5000.00");
    }

    @Test
    void updateBudget_ShouldPersistTheNewCategory() {
        Budget existing = budget(1L, null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(existing)).thenReturn(existing);
        when(expenseRepository.sumByUserAndCategoryAndMonth(user, category, 2026, 8))
                .thenReturn(new BigDecimal("100.00"));

        BudgetResponse response = budgetService.updateBudget(1L, request, EMAIL);

        assertThat(existing.getCategory()).isEqualTo(category);
        assertThat(response.getCategoryName()).isEqualTo("Food");
    }

    @Test
    void updateBudget_ShouldAllowSavingTheBudgetOntoItsOwnSlot() {
        Budget existing = budget(1L, category);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(existing));
        when(budgetRepository.save(existing)).thenReturn(existing);
        when(expenseRepository.sumByUserAndCategoryAndMonth(user, category, 2026, 8))
                .thenReturn(BigDecimal.ZERO);

        assertThat(budgetService.updateBudget(1L, request, EMAIL)).isNotNull();
    }

    @Test
    void updateBudget_ShouldThrow_WhenTargetSlotIsTakenByAnotherBudget() {
        Budget existing = budget(1L, null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(budget(2L, category)));

        assertThatThrownBy(() -> budgetService.updateBudget(1L, request, EMAIL))
                .isInstanceOf(BadRequestException.class);

        verify(budgetRepository, never()).save(any());
    }

    @Test
    void deleteBudget_ShouldThrow_WhenBudgetIsNotOwnedByUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(budgetRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.deleteBudget(99L, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
