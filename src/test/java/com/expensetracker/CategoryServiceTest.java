package com.expensetracker;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private BudgetRepository budgetRepository;

    @InjectMocks private CategoryServiceImpl categoryService;

    private User user;
    private Category category;
    private CategoryRequest request;

    private static final String EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email(EMAIL).fullName("Test User").role(Role.USER).build();
        category = Category.builder().id(10L).name("Food").description("Meals").icon("🍔").user(user).build();

        request = new CategoryRequest();
        request.setName("Food");
        request.setDescription("Meals");
        request.setIcon("🍔");
    }

    @Test
    void createCategory_ShouldReturnResponse_WhenNameIsUnique() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByNameAndUser("Food", user)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);
        when(expenseRepository.countByUserAndCategory(user, category)).thenReturn(3L);

        CategoryResponse response = categoryService.createCategory(request, EMAIL);

        assertThat(response.getName()).isEqualTo("Food");
        assertThat(response.getExpenseCount()).isEqualTo(3L);
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void createCategory_ShouldThrow_WhenNameAlreadyExistsForUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByNameAndUser("Food", user)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request, EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void getAllCategories_ShouldOnlyReturnCategoriesOfTheGivenUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByUser(user)).thenReturn(List.of(category));
        when(expenseRepository.countByUserAndCategory(user, category)).thenReturn(0L);

        List<CategoryResponse> result = categoryService.getAllCategories(EMAIL);

        assertThat(result).hasSize(1);
        verify(categoryRepository).findByUser(user);
    }

    @Test
    void getCategoryById_ShouldThrow_WhenCategoryBelongsToSomeoneElse() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(99L, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCategory_ShouldThrow_WhenRenamingOntoAnExistingName() {
        request.setName("Travel");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByNameAndUser("Travel", user)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.updateCategory(10L, request, EMAIL))
                .isInstanceOf(BadRequestException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void updateCategory_ShouldAllowKeepingTheSameName() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));
        when(categoryRepository.save(category)).thenReturn(category);
        when(expenseRepository.countByUserAndCategory(user, category)).thenReturn(0L);

        CategoryResponse response = categoryService.updateCategory(10L, request, EMAIL);

        assertThat(response.getName()).isEqualTo("Food");
        verify(categoryRepository, never()).existsByNameAndUser(any(), any());
    }

    @Test
    void deleteCategory_ShouldRemoveDependentBudgetsFirst() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(category));

        categoryService.deleteCategory(10L, EMAIL);

        InOrder order = inOrder(budgetRepository, categoryRepository);
        order.verify(budgetRepository).deleteByUserAndCategory(user, category);
        order.verify(categoryRepository).delete(category);
    }
}
