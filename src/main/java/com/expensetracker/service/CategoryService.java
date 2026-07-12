package com.expensetracker.service;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request, String userEmail);
    List<CategoryResponse> getAllCategories(String userEmail);
    CategoryResponse getCategoryById(Long id, String userEmail);
    CategoryResponse updateCategory(Long id, CategoryRequest request, String userEmail);
    void deleteCategory(Long id, String userEmail);
}
