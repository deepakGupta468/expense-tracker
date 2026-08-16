package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Page<Expense> findByUserOrderByExpenseDateDesc(User user, Pageable pageable);

    void deleteByUser(User user);

    Optional<Expense> findByIdAndUser(Long id, User user);

    List<Expense> findByUserAndCategory(User user, Category category);

    long countByUserAndCategory(User user, Category category);

    List<Expense> findByUserAndExpenseDateBetweenOrderByExpenseDateDesc(
            User user, LocalDate startDate, LocalDate endDate);

    List<Expense> findByUserAndExpenseDateOrderByExpenseDateDesc(User user, LocalDate date);

    @Query("SELECT e FROM Expense e WHERE e.user = :user " +
           "AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month " +
           "ORDER BY e.expenseDate DESC")
    List<Expense> findByUserAndMonthAndYear(
            @Param("user") User user,
            @Param("year") int year,
            @Param("month") int month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user = :user " +
           "AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    BigDecimal sumByUserAndMonthAndYear(
            @Param("user") User user,
            @Param("year") int year,
            @Param("month") int month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user = :user " +
           "AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT e.category.name, SUM(e.amount) FROM Expense e WHERE e.user = :user " +
           "AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month " +
           "GROUP BY e.category.name")
    List<Object[]> sumByCategoryForMonth(
            @Param("user") User user,
            @Param("year") int year,
            @Param("month") int month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user = :user " +
           "AND e.category = :category " +
           "AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    BigDecimal sumByUserAndCategoryAndMonth(
            @Param("user") User user,
            @Param("category") Category category,
            @Param("year") int year,
            @Param("month") int month);
}
