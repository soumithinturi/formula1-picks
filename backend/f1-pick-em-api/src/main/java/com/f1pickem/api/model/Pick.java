package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name="picks")
public class Pick {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "race_id", nullable = false)
  private Race race;

  @Embedded
  private PickSelections selections;

  @Column(name = "total_points")
  private Integer totalPoints;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;
}
