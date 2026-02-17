package com.telecom.network_monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class NetworkMonitorApplication {
    public static void main(String[] args) {
        SpringApplication.run(NetworkMonitorApplication.class, args);
    }
}

