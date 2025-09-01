package com.f1pickem.api.repository;

import com.f1pickem.api.model.Pick;
import com.f1pickem.api.model.Race;
import com.f1pickem.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickRepository extends JpaRepository<Pick, Long> {
  Optional<Pick> findByUserAndRace(User user, Race race);
  List<Pick> findAllByRace(Race race);
  List<Pick> findAllByUser(User user);
}