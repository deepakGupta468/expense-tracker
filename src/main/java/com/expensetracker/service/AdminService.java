package com.expensetracker.service;

import com.expensetracker.dto.response.UserResponse;

import java.util.List;

public interface AdminService {

    List<UserResponse> getAllUsers();

    void deactivateUser(Long userId);

    void activateUser(Long userId);

    void deleteUser(Long userId);
}
