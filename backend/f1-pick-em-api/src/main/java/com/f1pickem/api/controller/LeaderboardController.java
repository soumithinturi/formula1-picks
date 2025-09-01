package com.f1pickem.api.controller;

import com.f1pickem.api.dto.LeaderboardEntryDto;
import com.f1pickem.api.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

  private final LeaderboardService leaderboardService;

  @GetMapping
  public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard() {
    return ResponseEntity.ok(leaderboardService.getLeaderboard());
  }
}
