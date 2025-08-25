package com.f1pickem.api.repository;

import com.f1pickem.api.model.Race;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RaceRepository extends JpaRepository<Race, Long> {

}