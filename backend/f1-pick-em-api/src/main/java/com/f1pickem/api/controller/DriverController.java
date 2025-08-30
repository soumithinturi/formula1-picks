package com.f1pickem.api.controller;

import com.f1pickem.api.model.Driver;
import com.f1pickem.api.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

  private final DriverService driverService;

  public ResponseEntity<List<Driver>> listAllDrivers() {
    return ResponseEntity.ok(driverService.getAllDrivers());
  }
}
