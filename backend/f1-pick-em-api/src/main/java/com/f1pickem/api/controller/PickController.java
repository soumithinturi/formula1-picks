package com.f1pickem.api.controller;

import com.f1pickem.api.dto.PickSubmissionRequest;
import com.f1pickem.api.model.Pick;
import com.f1pickem.api.service.PickService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/picks")
@RequiredArgsConstructor
public class PickController {

  private final PickService pickService;

  @PostMapping
  public ResponseEntity<Pick> submitPicks(@RequestBody PickSubmissionRequest request) {
    Pick savedPick = pickService.submitPick(request);
    return new ResponseEntity<>(savedPick, HttpStatus.CREATED);
  }
}
