package com.f1pickem.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaderboardEntryDto {
  private String username;
  private int totalPoints;

}
