package com.expensetracker.service.impl;

import com.expensetracker.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendBudgetAlert(String toEmail, String fullName, String categoryName,
                                BigDecimal monthlyLimit, BigDecimal totalSpent, int month, int year) {
        String subject = "Budget Alert: " + categoryName + " budget exceeded!";
        String message = buildMessage(fullName, categoryName, monthlyLimit, totalSpent, month, year);

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(message);
            mailSender.send(mail);
            log.info("Budget alert email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send budget alert email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildMessage(String fullName, String categoryName,
                               BigDecimal monthlyLimit, BigDecimal totalSpent, int month, int year) {
        return "Hi " + fullName + ",\n\n"
                + "You have exceeded your " + categoryName + " budget!\n\n"
                + "Budget limit: Rs " + monthlyLimit + "\n"
                + "Total spent:  Rs " + totalSpent + "\n"
                + "Over by:     Rs " + totalSpent.subtract(monthlyLimit) + "\n"
                + "Month:       " + month + "/" + year + "\n\n"
                + "Keep track of your expenses to stay within budget.\n\n"
                + "Regards,\nExpense Tracker Team";
    }
}
