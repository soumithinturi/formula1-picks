package com.f1pickem.api.service;

import com.f1pickem.api.dto.PickSubmissionRequest;
import com.f1pickem.api.model.Pick;
import com.f1pickem.api.model.PickSelections;
import com.f1pickem.api.model.Race;
import com.f1pickem.api.model.User;
import com.f1pickem.api.repository.PickRepository;
import com.f1pickem.api.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PickService {

  private final PickRepository pickRepository;
  private final RaceRepository raceRepository;

  public Pick submitPick(PickSubmissionRequest request) {
    User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    Race race = raceRepository.findById(request.getRaceId())
        .orElseThrow(() -> new IllegalArgumentException("Race not found with ID: " + request.getRaceId()));

    LocalDateTime now = LocalDateTime.now();
    PickSelections newSelections = request.getSelections();

    // Check if any sprint-related picks are being submitted
    if (newSelections.getSprintQualifyingP1() != null || newSelections.getSprintP1() != null || newSelections.getSprintP2() != null || newSelections.getSprintP3() != null) {
      if (race.getSprintDeadline() != null && now.isAfter(race.getSprintDeadline())) {
        throw new IllegalStateException("The deadline for sprint picks has passed.");
      }
    }

    // Check if any race-related picks are being submitted
    if (newSelections.getRaceQualifyingP1() != null || newSelections.getRaceP1() != null || newSelections.getRaceP2() != null || newSelections.getRaceP3() != null || newSelections.getFastestLap() != null || newSelections.getFirstDnf() != null) {
      if (race.getRaceDeadline() != null && now.isAfter(race.getRaceDeadline())) {
        throw new IllegalStateException("The deadline for race picks has passed.");
      }
    }

    // Find existing pick or create a new one
    Pick pick = pickRepository.findByUserAndRace(currentUser, race)
        .orElse(new Pick());
    // If it's a new pick, set the initial user and race
    if (pick.getId() == null) {
      pick.setUser(currentUser);
      pick.setRace(race);
      pick.setTotalPoints(0);
    }

    pick.setSelections(newSelections);
    pick.setSubmittedAt(now);

    return pickRepository.save(pick);
  }
}
