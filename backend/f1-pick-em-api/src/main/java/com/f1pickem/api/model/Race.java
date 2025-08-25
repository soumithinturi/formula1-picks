package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

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
  private LocalDate date;

  @Column(name = "has_sprint")
  private boolean hasSprint;

  @Column(name = "status")
  private String status;
}
