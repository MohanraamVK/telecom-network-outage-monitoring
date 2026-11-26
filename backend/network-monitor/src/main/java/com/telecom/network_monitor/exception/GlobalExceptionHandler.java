package com.telecom.network_monitor.exception;

import com.telecom.network_monitor.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    /** A live-updates (SSE) client closed its tab: nothing to report and no response to write. */
    @ExceptionHandler(org.springframework.web.context.request.async.AsyncRequestNotUsableException.class)
    public void handleClientDisconnected() {
        // intentionally empty
    }

    /** Someone else (or the outage monitor) changed the row since it was loaded. */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflict(Exception ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse<>(false,
                "This item was changed by someone else in the meantime. Refresh and try again.", null));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    /** e.g. GET /api/incidents?status=FOO or GET /api/nodes/abc */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'";

        Class<?> requiredType = ex.getRequiredType();
        if (requiredType != null && requiredType.isEnum()) {
            message += ". Allowed values: " + java.util.Arrays.toString(requiredType.getEnumConstants());
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, message, null));
    }

    /**
     * Anything unexpected is a server error. The real cause is logged, but not
     * sent to the client, so stack details and SQL messages never leak out.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        // Spring MVC's own exceptions (404 no route, 405 wrong method, 415 ...) already
        // know their HTTP status: keep it instead of turning them into a 500.
        if (ex instanceof ErrorResponse errorResponse) {
            return ResponseEntity.status(errorResponse.getStatusCode())
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }

        log.error("Unhandled exception", ex);
        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "An unexpected error occurred. Please try again later.",
                null
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
