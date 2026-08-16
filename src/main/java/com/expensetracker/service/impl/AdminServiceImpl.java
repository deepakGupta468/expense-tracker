package com.expensetracker.service.impl;

import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deactivateUser(Long userId, Long currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        User user = getUser(userId);
        if (user.getIsActive() != null && !user.getIsActive()) {
            return;
        }
        user.setIsActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void activateUser(Long userId) {
        User user = getUser(userId);
        if (Boolean.TRUE.equals(user.getIsActive())) {
            return;
        }
        user.setIsActive(true);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId, Long currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        User user = getUser(userId);
        expenseRepository.deleteByUser(user);
        budgetRepository.deleteByUser(user);
        categoryRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
