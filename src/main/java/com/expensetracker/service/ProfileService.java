package com.expensetracker.service;

import com.expensetracker.dto.request.ChangePasswordRequest;
import com.expensetracker.dto.request.UpdateProfileRequest;
import com.expensetracker.dto.response.UserResponse;

public interface ProfileService {

    UserResponse getProfile(String userEmail);

    UserResponse updateProfile(String userEmail, UpdateProfileRequest request);

    void changePassword(String userEmail, ChangePasswordRequest request);
}