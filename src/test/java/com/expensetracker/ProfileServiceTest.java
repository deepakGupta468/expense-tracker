package com.expensetracker;

import com.expensetracker.dto.request.ChangePasswordRequest;
import com.expensetracker.dto.request.UpdateProfileRequest;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.impl.ProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private ProfileServiceImpl profileService;

    private User user;

    private static final String EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email(EMAIL).fullName("Test User")
                .password("encodedCurrent").role(Role.USER).isActive(true)
                .build();
    }

    @Test
    void getProfile_ShouldNeverExposeThePasswordHash() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        UserResponse response = profileService.getProfile(EMAIL);

        assertThat(response.getEmail()).isEqualTo(EMAIL);
        assertThat(response.getRole()).isEqualTo(Role.USER);
        assertThat(response.getIsActive()).isTrue();
    }

    @Test
    void getProfile_ShouldThrow_WhenUserIsMissing() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void updateProfile_ShouldChangeOnlyTheFullName() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = profileService.updateProfile(EMAIL, new UpdateProfileRequest("New Name"));

        assertThat(response.getFullName()).isEqualTo("New Name");
        assertThat(response.getEmail()).isEqualTo(EMAIL);
    }

    @Test
    void changePassword_ShouldStoreTheEncodedNewPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest("current123", "newPass123");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current123", "encodedCurrent")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("encodedNew");

        profileService.changePassword(EMAIL, request);

        assertThat(user.getPassword()).isEqualTo("encodedNew");
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_ShouldThrow_WhenCurrentPasswordIsWrong() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrong", "newPass123");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encodedCurrent")).thenReturn(false);

        assertThatThrownBy(() -> profileService.changePassword(EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current password is incorrect");

        verify(userRepository, never()).save(any());
    }
}
