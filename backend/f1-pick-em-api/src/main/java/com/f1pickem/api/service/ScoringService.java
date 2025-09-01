package com.f1pickem.api.service;

import com.f1pickem.api.model.*;
import com.f1pickem.api.repository.PickRepository;
import com.f1pickem.api.repository.RaceRepository;
import com.f1pickem.api.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ScoringService {

  private final RaceRepository raceRepository;
  private final RaceResultRepository raceResultRepository;
  private final PickRepository pickRepository;

  @Transactional
  public void processAndScoreRace(Long raceId, PickSelections results) {
    Race race = raceRepository.findById(raceId)
        .orElseThrow(() -> new IllegalArgumentException("Race not found with ID: " + raceId));

    // 1. Save the official results
    RaceResult raceResult = new RaceResult();
    raceResult.setRace(race);
    raceResult.setResults(results);
    raceResultRepository.save(raceResult);

    // 2. Find all picks for this race
    // TODO: Add pagination
    pickRepository.findAllByRace(race).forEach(pick -> {
      int totalPoints = calculatePointsForPick(pick.getSelections(), results);
      pick.setTotalPoints(totalPoints);
      pickRepository.save(pick);
    });

    // 3. Mark race as completed
    race.setStatus("COMPLETED");
    raceRepository.save(race);
  }

  private int calculatePointsForPick(PickSelections userPick, PickSelections officialResults ) {
    int score = 0;

    // Sprint Results
    if (Objects.equals(userPick.getSprintQualifyingP1(), officialResults.getSprintQualifyingP1())) score += 1;
    if (Objects.equals(userPick.getSprintP1(), officialResults.getSprintP1())) score += 5;
    if (Objects.equals(userPick.getSprintP2(), officialResults.getSprintP2())) score += 3;
    if (Objects.equals(userPick.getSprintP3(), officialResults.getSprintP3())) score += 1;
    // Race Points
    if (Objects.equals(userPick.getRaceQualifyingP1(), officialResults.getRaceQualifyingP1())) score += 1;
    if (Objects.equals(userPick.getRaceP1(), officialResults.getRaceP1())) score += 5;
    if (Objects.equals(userPick.getRaceP2(), officialResults.getRaceP2())) score += 3;
    if (Objects.equals(userPick.getRaceP3(), officialResults.getRaceP3())) score += 1;
    if (Objects.equals(userPick.getFastestLap(), officialResults.getFastestLap())) score += 1;
    if (Objects.equals(userPick.getFirstDnf(), officialResults.getFirstDnf())) score += 2;

    return score;
  }
}
