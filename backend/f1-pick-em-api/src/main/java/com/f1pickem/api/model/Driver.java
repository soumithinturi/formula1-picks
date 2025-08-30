package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "drivers")
public class Driver {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "full_name", nullable = false)
  private String fullName;

  @Column(name = "racing_number", nullable = false)
  private String racingNumber;

  @Column(name = "team_name")
  private String teamName;

  @Column(name = "abbreviation", unique = true)
  private String tla; // Three-Letter Abbreviation
}
