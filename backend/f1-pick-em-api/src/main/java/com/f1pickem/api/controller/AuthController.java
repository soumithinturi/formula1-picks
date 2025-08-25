package com.f1pickem.api.controller;

import com.f1pickem.api.dto.RegisterRequest;
import com.f1pickem.api.model.User;
import com.f1pickem.api.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  private final AuthService authService;

  @Autowired
  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<User> register(@RequestBody RegisterRequest registerRequest) {
    User registeredUser = authService.registerUser(registerRequest);
    return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
  }
}
