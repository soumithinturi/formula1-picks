package com.f1pickem.api.controller;

import com.f1pickem.api.dto.RegisterRequest;
import com.f1pickem.api.model.User;
import com.f1pickem.api.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
public class AuthControllerIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private ObjectMapper objectMapper;

  @BeforeEach
  void cleanUp() {
    userRepository.deleteAll();
  }

  @Test
  void register_ShouldCreateUserAndReturnToken_WhenUsernameIsAvailable() throws Exception {
    // Arrange
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setUsername("testUser");
    registerRequest.setPassword("password123");

    // Act & Assert
    mockMvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty());

    // We can also assert directly against the database
    User savedUser = userRepository.findByUsername("testUser").orElseThrow();
    assertThat(savedUser).isNotNull();
    assertThat(savedUser.getUsername()).isEqualTo("testUser");
  }

  @Test
  void register_ShouldReturnError_WhenUsernameIsTaken() throws Exception {
    // Arrange - First, create a user that already exists
    User existingUser = User.builder().username("existingUser").password("password").build();
    userRepository.save(existingUser);

    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setUsername("existingUser");
    registerRequest.setPassword("password123");

    // Act & Assert
    mockMvc.perform(post("/api/v1/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isInternalServerError());
  }
}
