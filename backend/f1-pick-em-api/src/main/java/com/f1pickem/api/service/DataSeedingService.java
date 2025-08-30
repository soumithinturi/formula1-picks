package com.f1pickem.api.service;

import com.f1pickem.api.dto.DriverApiResponse;
import com.f1pickem.api.dto.RaceApiResponse;
import com.f1pickem.api.model.Driver;
import com.f1pickem.api.model.Race;
import com.f1pickem.api.repository.DriverRepository;
import com.f1pickem.api.repository.RaceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DataSeedingService {
  private static final Set<String> SPRINT_RACE_KEYWORDS = Set.of(
      "Chinese", "Miami", "Austrian", "United States GP", "São Paulo", "Qatar"
  );

  private final DriverRepository driverRepository;
  private final RaceRepository raceRepository;
  private final WebClient webClient;

  // Securely inject your API key from application.properties
  @Value("${rapidapi.key}")
  private String rapidApiKey;

  @PostConstruct
  @Transactional
  public void seedDatabase() {
    seedRaces();
    seedDrivers();
  }

  private void seedRaces() {
    // Only seed data if the races table is empty
    if (raceRepository.count() == 0) {
      System.out.println("Seeding race data...");
      String url = "https://f1-motorsport-data.p.rapidapi.com/schedule?year=2025";

      Map<String, List<RaceApiResponse>> response = webClient.get()
          .uri(url)
          .header("x-rapidapi-key", rapidApiKey)
          .header("x-rapidapi-host", "f1-motorsport-data.p.rapidapi.com")
          .retrieve()
          .bodyToMono(new ParameterizedTypeReference<Map<String, List<RaceApiResponse>>>() {})
          .block();

      if (response != null) {
        response.values().stream()
            .flatMap(List::stream)
            .forEach(raceDto -> {
              Race race = new Race();
              race.setName(raceDto.getName());
              // Basic parsing, assuming ZonedDateTime format
              LocalDate raceDate = LocalDate.parse(raceDto.getStartDate(), DateTimeFormatter.ISO_ZONED_DATE_TIME);
              race.setDate(raceDate.atStartOfDay());
              // Set placeholder deadlines - you might adjust these based on real session times
              race.setRaceDeadline(raceDate.atTime(12, 0));
              race.setStatus("UPCOMING");

              // Determine if the race has a sprint based on its name
              boolean hasSprint = SPRINT_RACE_KEYWORDS.stream()
                  .anyMatch(keyword -> raceDto.getName().contains(keyword));
              race.setHasSprint(hasSprint);

              if (hasSprint) {
                // Set a placeholder sprint deadline, e.g., one day before the race
                race.setSprintDeadline(raceDate.atTime(12, 0).minusDays(1));
              }

              race.setHasSprint(false);
              raceRepository.save(race);
            });
        System.out.println("Finished seeding race data.");
      }
    } else {
      System.out.println("Race data already exists. Skipping seed.");
    }
  }

  private void seedDrivers() {
    // Only seed data if the drivers table is empty
    if (driverRepository.count() == 0) {
      System.out.println("Seeding driver data...");
      String url = "https://f1-live-pulse.p.rapidapi.com/driverList";

      List<DriverApiResponse> response = webClient.get()
          .uri(url)
          .header("x-rapidapi-key", rapidApiKey)
          .header("x-rapidapi-host", "f1-live-pulse.p.rapidapi.com")
          .retrieve()
          .bodyToFlux(DriverApiResponse.class)
          .collectList()
          .block();

      if (response != null) {
        response.forEach(driverDto -> {
          Driver driver = new Driver();
          driver.setFullName(driverDto.getFullName());
          driver.setRacingNumber(driverDto.getRacingNumber());
          driver.setTeamName(driverDto.getTeamName());
          driver.setTla(driverDto.getTla());
          driverRepository.save(driver);
        });
        System.out.println("Finished seeding driver data.");
      }
    } else {
      System.out.println("Driver data already exists. Skipping seed.");
    }
  }
}
