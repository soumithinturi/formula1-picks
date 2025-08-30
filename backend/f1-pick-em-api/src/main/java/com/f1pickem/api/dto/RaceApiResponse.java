package com.f1pickem.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RaceApiResponse {
  @JsonProperty("gPrx")
  private String name;

  @JsonProperty("startDate")
  private String startDate; // We will parse this to a date
}
