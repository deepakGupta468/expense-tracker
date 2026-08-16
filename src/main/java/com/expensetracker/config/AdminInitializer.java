package com.expensetracker.config;

import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registration always creates a plain USER, so without this there is no way to
 * get a first admin short of editing the database by hand. Set ADMIN_EMAIL and
 * ADMIN_PASSWORD to create (or promote) one at startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.full-name:System Administrator}")
    private String adminFullName;

    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail == null || adminEmail.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            log.debug("Admin bootstrap skipped: app.admin.email / app.admin.password not set");
            return;
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                this::promoteIfNeeded,
                this::createAdmin
        );
    }

    private void promoteIfNeeded(User existing) {
        if (existing.getRole() == Role.ADMIN) {
            log.info("Admin account {} already present", existing.getEmail());
            return;
        }
        existing.setRole(Role.ADMIN);
        userRepository.save(existing);
        log.info("Promoted existing account {} to ADMIN", existing.getEmail());
    }

    private void createAdmin() {
        User admin = User.builder()
                .email(adminEmail)
                .fullName(adminFullName)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("Created bootstrap admin account {}", adminEmail);
    }
}
