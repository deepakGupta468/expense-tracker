package com.expensetracker.service.impl;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request, String userEmail) {
        User user = getUser(userEmail);

        if (categoryRepository.existsByNameAndUser(request.getName(), user)) {
            throw new BadRequestException("Category already exists: " + request.getName());
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .user(user)
                .build();

        Category saved = categoryRepository.save(category);
        return mapToResponse(saved, user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(String userEmail) {
        User user = getUser(userEmail);
        return categoryRepository.findByUser(user).stream()
                .map(category -> mapToResponse(category, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id, String userEmail) {
        User user = getUser(userEmail);
        Category category = getCategory(id, user);
        return mapToResponse(category, user);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request, String userEmail) {
        User user = getUser(userEmail);
        Category category = getCategory(id, user);

        // Renaming onto an existing category name would create a duplicate.
        if (!category.getName().equals(request.getName())
                && categoryRepository.existsByNameAndUser(request.getName(), user)) {
            throw new BadRequestException("Category already exists: " + request.getName());
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        Category updated = categoryRepository.save(category);
        return mapToResponse(updated, user);
    }

    @Override
    public void deleteCategory(Long id, String userEmail) {
        User user = getUser(userEmail);
        Category category = getCategory(id, user);
        // Budgets hold a foreign key to the category but are not cascaded from it,
        // so they have to be cleared first or the delete hits a constraint error.
        budgetRepository.deleteByUserAndCategory(user, category);
        categoryRepository.delete(category);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Category getCategory(Long id, User user) {
        return categoryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private CategoryResponse mapToResponse(Category category, User user) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .icon(category.getIcon())
                .expenseCount(expenseRepository.countByUserAndCategory(user, category))
                .createdAt(category.getCreatedAt())
                .build();
    }
}
