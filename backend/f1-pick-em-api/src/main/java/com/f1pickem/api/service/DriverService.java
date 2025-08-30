package com.f1pickem.api.service;

import com.f1pickem.api.model.Driver;
import com.f1pickem.api.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

  private final DriverRepository driverRepository;

  public List<Driver> getAllDrivers() {
    return driverRepository.findAll();
  }
}
