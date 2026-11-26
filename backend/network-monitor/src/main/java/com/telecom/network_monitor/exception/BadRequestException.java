package com.telecom.network_monitor.exception;

/**
 * Thrown when a request is well-formed JSON but breaks a business rule
 * (unknown enum value, forbidden status transition, ...). Mapped to HTTP 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
