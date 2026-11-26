package com.telecom.network_monitor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoteRequestDTO(
        @NotBlank(message = "Note text is required")
        @Size(max = 1000, message = "Note must be at most 1000 characters")
        String message
) {
}
