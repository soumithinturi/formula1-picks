package com.f1pickem.api.service;

import com.f1pickem.api.model.PickSelections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
public class ScoringServiceTest {

  @InjectMocks
  private ScoringService scoringService;

  private PickSelections userPicks;
  private PickSelections officialResults;

  @BeforeEach
  void setUp() {
    userPicks = new PickSelections();
    officialResults = new PickSelections();
  }

  @Test
  void calculatePointsForPick_ShouldReturnCorrectScore_WhenSomePicksAreCorrect() {
    // Test Data
    // Correct Picks: Race P1, Fastest Lap, First DNF
    userPicks.setRaceP1("PIA");
    userPicks.setFastestLap("VER");
    userPicks.setFirstDnf("GAS");
    // Incorrect Pick
    userPicks.setRaceP2("SAI");

    officialResults.setRaceP1("PIA");
    officialResults.setRaceP2("HAM");
    officialResults.setFastestLap("VER");
    officialResults.setFirstDnf("GAS");

    int score = scoringService.calculatePointsForPick(userPicks, officialResults);

    assertThat(score).isEqualTo(8);
  }

  @Test
  void calculatePointsForPick_ShouldReturnZero_WhenNoPicksAreCorrect() {
    userPicks.setRaceP1("HAM");
    userPicks.setRaceP2("VER");
    officialResults.setRaceP1("VER");
    officialResults.setRaceP2("NOR");

    int score = scoringService.calculatePointsForPick(userPicks, officialResults);

    assertThat(score).isZero();
  }

  @Test
  void calculatePointsForPick_ShouldScoreSprintAndRaceCorrectly() {
    userPicks.setSprintP1("PIA");
    userPicks.setRaceP2("NOR");
    officialResults.setSprintP1("PIA");
    officialResults.setRaceP2("NOR");

    int score = scoringService.calculatePointsForPick(userPicks, officialResults);

    assertThat(score).isEqualTo(8);
  }
}
