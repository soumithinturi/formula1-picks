package com.f1pickem.api.repository;

import com.f1pickem.api.model.Pick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PickRepository extends JpaRepository<Pick, Long> {

}