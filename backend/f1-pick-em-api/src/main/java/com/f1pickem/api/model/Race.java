package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name="Races")
public class Race {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "race_name", nullable = false)
  private String name;

  @Column(name = "race_date", nullable = false)
  private LocalDateTime date;

  @Column(name = "has_sprint")
  private boolean hasSprint;

  @Column(name = "status")
  private String status;

  @Column(name = "sprint_deadline")
  private LocalDateTime sprintDeadline;

  @Column(name = "race_deadline")
  private LocalDateTime raceDeadline;
}
