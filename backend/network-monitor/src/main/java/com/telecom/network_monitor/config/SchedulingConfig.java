package com.telecom.network_monitor.config;

import com.telecom.network_monitor.monitoring.MonitoringProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Background jobs: the node monitor and SSE keep-alives. */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(MonitoringProperties.class)
public class SchedulingConfig {
}
