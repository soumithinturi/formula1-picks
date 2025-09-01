package com.f1pickem.api.service;

import com.f1pickem.api.dto.LeaderboardEntryDto;
import com.f1pickem.api.repository.PickRepository;
import com.f1pickem.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

  private final UserRepository userRepository;
  private final PickRepository pickRepository;

  public List<LeaderboardEntryDto> getLeaderboard() {
    return userRepository.findAll().stream()
        .map(user -> {
          int totalPoints = pickRepository.findAllByUser(user).stream()
              .mapToInt(pick -> pick.getTotalPoints() != null ? pick.getTotalPoints() : 0)
              .sum();
          return new LeaderboardEntryDto(user.getUsername(), totalPoints);
        })
        .sorted(Comparator.comparingInt(LeaderboardEntryDto::getTotalPoints).reversed())
        .collect(Collectors.toList());
  }
}
