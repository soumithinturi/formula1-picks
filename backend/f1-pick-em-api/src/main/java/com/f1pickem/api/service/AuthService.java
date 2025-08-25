package com.f1pickem.api.service;

import com.f1pickem.api.dto.RegisterRequest;
import com.f1pickem.api.model.User;
import com.f1pickem.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Autowired
  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public User registerUser(RegisterRequest registerRequest) {
    // Add logic here to check if the username already exists
    User user = new User();
    user.setUsername(registerRequest.getUsername());
    user.setPassword(passwordEncoder.encode(registerRequest.getPassword())); // Hash the password!
    return userRepository.save(user);
  }
}
