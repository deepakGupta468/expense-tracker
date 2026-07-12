package com.expensetracker.service;

import com.expensetracker.dto.response.ReportResponse;

import java.time.LocalDate;

public interface ReportService {
    ReportResponse getDailyReport(LocalDate date, String userEmail);
    ReportResponse getMonthlyReport(int month, int year, String userEmail);
    ReportResponse getDateRangeReport(LocalDate startDate, LocalDate endDate, String userEmail);
}
