package com.f1pickem.api.controller;

import com.f1pickem.api.dto.PickSubmissionRequest;
import com.f1pickem.api.model.Pick;
import com.f1pickem.api.service.PickService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/picks")
@RequiredArgsConstructor
public class PickController {

  private final PickService pickService;

  @GetMapping("/race/{raceId}")
  public ResponseEntity<Pick> getPickForRace(@PathVariable Long raceId) {
    return pickService.getPickForRace(raceId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<Pick> submitPicks(@RequestBody PickSubmissionRequest request) {
    Pick savedPick = pickService.submitPick(request);
    return new ResponseEntity<>(savedPick, HttpStatus.CREATED);
  }
}
