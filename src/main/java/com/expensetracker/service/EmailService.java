package com.expensetracker.service;

import java.math.BigDecimal;

public interface EmailService {

    void sendBudgetAlert(String toEmail, String fullName, String categoryName,
                         BigDecimal monthlyLimit, BigDecimal totalSpent, int month, int year);
}
