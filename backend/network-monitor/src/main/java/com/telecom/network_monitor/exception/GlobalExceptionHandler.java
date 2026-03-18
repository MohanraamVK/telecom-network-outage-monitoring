package com.telecom.network_monitor.exception;

import com.telecom.network_monitor.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        ApiResponse<Object> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "Validation failed",
                errors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleJsonParse(HttpMessageNotReadableException ex) {

        String message = "Invalid request body";

        Throwable cause = ex.getMostSpecificCause();
        if (cause != null) {
            String causeMessage = cause.getMessage();

            if (causeMessage != null && causeMessage.contains("IncidentSeverity")) {
                message = "Invalid severity. Allowed values: LOW, MEDIUM, HIGH, CRITICAL";
            } else if (causeMessage != null && causeMessage.contains("IncidentStatus")) {
                message = "Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED, CLOSED";
            } else if (causeMessage != null && causeMessage.contains("NodeStatus")) {
                message = "Invalid node status. Allowed values: ACTIVE, DOWN, MAINTENANCE";
            } else if (causeMessage != null && causeMessage.contains("JSON")) {
                message = "Malformed JSON request body";
            }
        }

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                message,
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        ApiResponse<Object> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "Something went wrong: " + ex.getMessage(),
                null
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}