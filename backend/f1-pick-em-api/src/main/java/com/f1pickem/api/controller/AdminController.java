package com.f1pickem.api.controller;

import com.f1pickem.api.dto.ResultSubmissionRequest;
import com.f1pickem.api.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final ScoringService scoringService;

  @PostMapping("/results")
  public ResponseEntity<Void> submitResults(@RequestBody ResultSubmissionRequest request) {
    scoringService.processAndScoreRace(request.getRaceId(), request.getResults());
    return ResponseEntity.ok().build();
  }
}
