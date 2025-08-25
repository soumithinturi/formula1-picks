package com.f1pickem.api.service;

import com.f1pickem.api.model.Race;
import com.f1pickem.api.repository.RaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RaceService {

  private final RaceRepository raceRepository;

  @Autowired
  public RaceService(RaceRepository raceRepository) {
    this.raceRepository = raceRepository;
  }

  public List<Race> getAllRaces() {
    return raceRepository.findAll();
  }
}
