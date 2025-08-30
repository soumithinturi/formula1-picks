package com.f1pickem.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverApiResponse {
  @JsonProperty("FullName")
  private String fullName;

  @JsonProperty("RacingNumber")
  private String racingNumber;

  @JsonProperty("TeamName")
  private String teamName;

  @JsonProperty("Tla")
  private String tla;
}
