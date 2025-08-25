package com.f1pickem.api.controller;

import com.f1pickem.api.model.Race;
import com.f1pickem.api.service.RaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/races")
public class RaceController {

  private final RaceService raceService;

  @Autowired
  public RaceController(RaceService raceService) {
    this.raceService = raceService;
  }

  @GetMapping
  public List<Race> listAllRaces() {
    return raceService.getAllRaces();
  }
}
