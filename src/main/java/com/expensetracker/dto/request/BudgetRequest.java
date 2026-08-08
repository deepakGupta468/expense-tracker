package com.expensetracker.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {

    @NotNull(message = "Monthly limit is required")
    @DecimalMin(value = "0.01", message = "Budget limit must be greater than 0")
    private BigDecimal monthlyLimit;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2000, message = "Year must be valid")
    @Max(value = 2099, message = "Year must be valid")
    private Integer year;

    private Long categoryId; // null = overall budget
}
