package com.telecom.network_monitor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequestDTO(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 10, max = 100, message = "New password must be 10 to 100 characters")
        String newPassword
) {
}
