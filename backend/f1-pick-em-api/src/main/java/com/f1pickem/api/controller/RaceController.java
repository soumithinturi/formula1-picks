package com.f1pickem.api.controller;

import com.f1pickem.api.model.Race;
import com.f1pickem.api.service.RaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/races")
@RequiredArgsConstructor
public class RaceController {

  private final RaceService raceService;

  @GetMapping
  public List<Race> listAllRaces() {
    return raceService.getAllRaces();
  }
}
