package com.f1pickem.api.dto;

import com.f1pickem.api.model.PickSelections;
import lombok.Data;

@Data
public class ResultSubmissionRequest {
  private Long raceId;
  private PickSelections results;
}
