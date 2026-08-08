package com.expensetracker.controller;

import com.expensetracker.dto.response.ReportResponse;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.service.ReportService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ReportResponse> getDailyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(reportService.getDailyReport(date, userDetails.getUsername()));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ReportResponse> getMonthlyReport(
            @RequestParam(required = false) @Min(1) @Max(12) Integer month,
            @RequestParam(required = false) @Min(2000) @Max(2099) Integer year,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (month == null) month = LocalDate.now().getMonthValue();
        if (year == null) year = LocalDate.now().getYear();
        return ResponseEntity.ok(reportService.getMonthlyReport(month, year, userDetails.getUsername()));
    }

    @GetMapping("/range")
    public ResponseEntity<ReportResponse> getDateRangeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date cannot be after end date");
        }
        return ResponseEntity.ok(reportService.getDateRangeReport(startDate, endDate, userDetails.getUsername()));
    }
}
