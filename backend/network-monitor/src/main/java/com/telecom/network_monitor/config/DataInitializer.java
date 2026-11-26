package com.telecom.network_monitor.config;

import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initUsers(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                @Value("${app.admin.username:admin}") String adminUsername,
                                @Value("${app.admin.password:admin123}") String adminPassword,
                                @Value("${app.demo.enabled:false}") boolean demoEnabled,
                                @Value("${app.demo.username:demo}") String demoUsername,
                                @Value("${app.demo.password:demo123}") String demoPassword) {
        return args -> {
            if (!userRepository.existsByUsername(adminUsername)) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }

            // Read-only account for a public portfolio demo: can browse, cannot change data
            if (demoEnabled && !userRepository.existsByUsername(demoUsername)) {
                User demo = new User();
                demo.setUsername(demoUsername);
                demo.setPassword(passwordEncoder.encode(demoPassword));
                demo.setRole("VIEWER");
                userRepository.save(demo);
            }
        };
    }
}