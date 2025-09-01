package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "race_results")
public class RaceResult {
  @Id
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private Race race;

  @Embedded
  private PickSelections results;
}
