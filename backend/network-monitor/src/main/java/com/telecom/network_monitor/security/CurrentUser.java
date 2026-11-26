package com.telecom.network_monitor.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Who is performing the current action, for audit entries. */
public final class CurrentUser {

    public static final String SYSTEM = "system";
    public static final String MONITOR = "monitor";

    private CurrentUser() {
    }

    public static String username() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return SYSTEM;
        }
        return auth.getName();
    }
}
