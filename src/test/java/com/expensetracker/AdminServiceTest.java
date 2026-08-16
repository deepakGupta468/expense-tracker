package com.expensetracker;

import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.impl.AdminServiceImpl;
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
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private CategoryRepository categoryRepository;

    @InjectMocks private AdminServiceImpl adminService;

    private User target;

    private static final Long ADMIN_ID = 1L;
    private static final Long TARGET_ID = 2L;

    @BeforeEach
    void setUp() {
        target = User.builder()
                .id(TARGET_ID).email("user@example.com").fullName("Regular User")
                .role(Role.USER).isActive(true)
                .build();
    }

    @Test
    void getAllUsers_ShouldMapEveryUser() {
        User admin = User.builder().id(ADMIN_ID).email("admin@example.com")
                .fullName("Admin").role(Role.ADMIN).isActive(true).build();
        when(userRepository.findAll()).thenReturn(List.of(admin, target));

        List<UserResponse> users = adminService.getAllUsers();

        assertThat(users).hasSize(2);
        assertThat(users.get(0).getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void deactivateUser_ShouldFlipTheActiveFlag() {
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        adminService.deactivateUser(TARGET_ID, ADMIN_ID);

        assertThat(target.getIsActive()).isFalse();
        verify(userRepository).save(target);
    }

    @Test
    void deactivateUser_ShouldThrow_WhenAdminTargetsThemselves() {
        assertThatThrownBy(() -> adminService.deactivateUser(ADMIN_ID, ADMIN_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("your own account");

        verifyNoInteractions(userRepository);
    }

    @Test
    void deactivateUser_ShouldBeANoOp_WhenAlreadyInactive() {
        target.setIsActive(false);
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        adminService.deactivateUser(TARGET_ID, ADMIN_ID);

        verify(userRepository, never()).save(any());
    }

    @Test
    void activateUser_ShouldFlipTheActiveFlagBack() {
        target.setIsActive(false);
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        adminService.activateUser(TARGET_ID);

        assertThat(target.getIsActive()).isTrue();
        verify(userRepository).save(target);
    }

    @Test
    void deleteUser_ShouldRemoveOwnedDataBeforeTheUser() {
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        adminService.deleteUser(TARGET_ID, ADMIN_ID);

        InOrder order = inOrder(expenseRepository, budgetRepository, categoryRepository, userRepository);
        order.verify(expenseRepository).deleteByUser(target);
        order.verify(budgetRepository).deleteByUser(target);
        order.verify(categoryRepository).deleteByUser(target);
        order.verify(userRepository).delete(target);
    }

    @Test
    void deleteUser_ShouldThrow_WhenAdminTargetsThemselves() {
        assertThatThrownBy(() -> adminService.deleteUser(ADMIN_ID, ADMIN_ID))
                .isInstanceOf(BadRequestException.class);

        verifyNoInteractions(userRepository);
    }

    @Test
    void deleteUser_ShouldThrow_WhenUserDoesNotExist() {
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteUser(TARGET_ID, ADMIN_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
