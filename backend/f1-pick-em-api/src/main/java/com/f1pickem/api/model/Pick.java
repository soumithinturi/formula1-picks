package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name="Picks")
public class Pick {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "driver_name", nullable = false)
  private String name;

  @Column(name = "team_name", nullable = false)
  private String team;

  @Column(name = "race_event")
  private String event;
}
