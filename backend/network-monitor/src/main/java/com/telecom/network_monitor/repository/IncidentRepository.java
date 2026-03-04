package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByNodeId(Long nodeId);
    List<Incident> findByStatus(String status);
}