package com.f1pickem.api.service;

import com.f1pickem.api.dto.LoginRequest;
import com.f1pickem.api.dto.RegisterRequest;
import com.f1pickem.api.model.User;
import com.f1pickem.api.repository.UserRepository;
import com.f1pickem.api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;

  public User registerUser(RegisterRequest registerRequest) {
    // Check if the username already exists
    if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
      throw new IllegalStateException("Username is already taken");
    }
    User user = new User();
    user.setUsername(registerRequest.getUsername());
    user.setPassword(passwordEncoder.encode(registerRequest.getPassword())); // Hash the password!
    return userRepository.save(user);
  }

  public String loginUser(LoginRequest loginRequest) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            loginRequest.getUsername(),
            loginRequest.getPassword()
        )
    );
    UserDetails user = (UserDetails) userRepository.findByUsername(loginRequest.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("Invalid username: " + loginRequest.getUsername()));
  return jwtUtil.generateToken(user);
  }
}
