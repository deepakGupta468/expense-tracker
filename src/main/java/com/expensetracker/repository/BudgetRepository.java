package com.expensetracker.repository;

import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser(User user);

    void deleteByUser(User user);

    /** Budgets point at a category with a plain FK, so they must go before the category does. */
    void deleteByUserAndCategory(User user, Category category);

    List<Budget> findByUserAndMonthAndYear(User user, int month, int year);

    Optional<Budget> findByUserAndCategoryAndMonthAndYear(
            User user, Category category, int month, int year);

    Optional<Budget> findByUserAndCategoryIsNullAndMonthAndYear(
            User user, int month, int year);

    Optional<Budget> findByIdAndUser(Long id, User user);
}
