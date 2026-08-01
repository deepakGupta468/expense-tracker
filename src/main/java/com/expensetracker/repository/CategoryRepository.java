package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUser(User user);

    void deleteByUser(User user);
    Optional<Category> findByIdAndUser(Long id, User user);
    boolean existsByNameAndUser(String name, User user);
}
