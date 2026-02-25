package com.telecom.network_monitor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nodeName;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String status; // ACTIVE / DOWN
}