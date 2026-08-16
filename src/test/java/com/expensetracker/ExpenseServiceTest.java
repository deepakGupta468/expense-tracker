package com.expensetracker;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.EmailService;
import com.expensetracker.service.impl.ExpenseMapper;
import com.expensetracker.service.impl.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private EmailService emailService;

    @Spy private ExpenseMapper expenseMapper = new ExpenseMapper();

    @InjectMocks private ExpenseServiceImpl expenseService;

    private User user;
    private Category category;
    private Expense expense;
    private ExpenseRequest request;

    private static final String EMAIL = "test@example.com";
    private static final LocalDate DATE = LocalDate.of(2026, 8, 16);

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email(EMAIL).fullName("Test User").role(Role.USER).build();
        category = Category.builder().id(10L).name("Food").user(user).build();
        expense = Expense.builder()
                .id(100L).title("Lunch").description("Office lunch")
                .amount(new BigDecimal("250.00")).expenseDate(DATE)
                .category(category).user(user)
                .build();

        request = new ExpenseRequest();
        request.setTitle("Lunch");
        request.setDescription("Office lunch");
        request.setAmount(new BigDecimal("250.00"));
        request.setExpenseDate(DATE);
        request.setCategoryId(10L);
    }

    private Budget budget(BigDecimal limit, Category cat) {
        return Budget.builder().id(1L).monthlyLimit(limit).month(8).year(2026)
                .category(cat).user(user).build();
    }

    @Test
    void createExpense_ShouldMapResponse_AndNotEmailWhenNoBudgetExists() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());

        ExpenseResponse response = expenseService.createExpense(request, EMAIL);

        assertThat(response.getTitle()).isEqualTo("Lunch");
        assertThat(response.getCategoryName()).isEqualTo("Food");
        verifyNoInteractions(emailService);
    }

    @Test
    void createExpense_ShouldSendAlert_WhenCategoryBudgetIsExceeded() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(budget(new BigDecimal("1000.00"), category)));
        when(expenseRepository.sumByUserAndCategoryAndMonth(user, category, 2026, 8))
                .thenReturn(new BigDecimal("1500.00"));
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());

        expenseService.createExpense(request, EMAIL);

        verify(emailService).sendBudgetAlert(
                eq(EMAIL), eq("Test User"), eq("Food"),
                eq(new BigDecimal("1000.00")), eq(new BigDecimal("1500.00")), eq(8), eq(2026));
    }

    @Test
    void createExpense_ShouldNotSendAlert_WhenStillWithinLimit() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(budget(new BigDecimal("1000.00"), category)));
        when(expenseRepository.sumByUserAndCategoryAndMonth(user, category, 2026, 8))
                .thenReturn(new BigDecimal("999.99"));
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());

        expenseService.createExpense(request, EMAIL);

        verifyNoInteractions(emailService);
    }

    @Test
    void createExpense_ShouldAlsoCheckTheOverallBudget() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.of(budget(new BigDecimal("2000.00"), null)));
        when(expenseRepository.sumByUserAndMonthAndYear(user, 2026, 8))
                .thenReturn(new BigDecimal("2500.00"));

        expenseService.createExpense(request, EMAIL);

        verify(emailService).sendBudgetAlert(
                anyString(), anyString(), eq("Overall"), any(), any(), anyInt(), anyInt());
    }

    @Test
    void updateExpense_ShouldAlsoRunTheBudgetCheck() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(expenseRepository.findByIdAndUser(100L, user)).thenReturn(Optional.of(expense));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(expenseRepository.save(expense)).thenReturn(expense);
        when(budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, 8, 2026))
                .thenReturn(Optional.of(budget(new BigDecimal("100.00"), category)));
        when(expenseRepository.sumByUserAndCategoryAndMonth(user, category, 2026, 8))
                .thenReturn(new BigDecimal("900.00"));
        when(budgetRepository.findByUserAndCategoryIsNullAndMonthAndYear(user, 8, 2026))
                .thenReturn(Optional.empty());

        request.setAmount(new BigDecimal("900.00"));
        expenseService.updateExpense(100L, request, EMAIL);

        verify(emailService).sendBudgetAlert(
                anyString(), anyString(), eq("Food"), any(), any(), anyInt(), anyInt());
    }

    @Test
    void updateExpense_ShouldThrow_WhenExpenseBelongsToAnotherUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(expenseRepository.findByIdAndUser(999L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.updateExpense(999L, request, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createExpense_ShouldThrow_WhenCategoryIsNotOwnedByUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.createExpense(request, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(expenseRepository, never()).save(any());
    }

    @Test
    void deleteExpense_ShouldDeleteTheOwnedExpense() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(expenseRepository.findByIdAndUser(100L, user)).thenReturn(Optional.of(expense));

        expenseService.deleteExpense(100L, EMAIL);

        verify(expenseRepository).delete(expense);
    }
}
