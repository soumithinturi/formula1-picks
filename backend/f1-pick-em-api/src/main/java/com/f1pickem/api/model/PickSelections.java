package com.f1pickem.api.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class PickSelections {
  // Sprint Picks
  private String sprintQualifyingP1;
  private String sprintP1;
  private String sprintP2;
  private String sprintP3;

  // Race Picks
  private String raceQualifyingP1;
  private String raceP1;
  private String raceP2;
  private String raceP3;
  private String fastestLap;
  private String firstDnf;
}
