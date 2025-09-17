package com.f1pickem.api.config;

import com.f1pickem.api.model.Race;
import com.f1pickem.api.repository.RaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

  private final RaceRepository raceRepository;

  @Autowired
  public DataSeeder(RaceRepository raceRepository) {
    this.raceRepository = raceRepository;
  }

  @Override
  public void run(String ...args) throws Exception {
    if (raceRepository.count() == 0) {
      Race bahrain = new Race();
      bahrain.setName("Bahrain Grand Prix");
      bahrain.setDate(LocalDate.of(2024, 3, 2).atStartOfDay());
      bahrain.setStatus("COMPLETED");
      raceRepository.save(bahrain);

      Race saudi = new Race();
      saudi.setName("Saudi Arabian Grand Prix");
      saudi.setDate(LocalDate.of(2024, 3, 9).atStartOfDay());
      saudi.setStatus("COMPLETED");
      raceRepository.save(saudi);
    }
  }
}
