package com.f1pickem.api.dto;

import com.f1pickem.api.model.PickSelections;
import lombok.Data;

@Data
public class PickSubmissionRequest {
  private Long raceId;
  private PickSelections selections;
}
