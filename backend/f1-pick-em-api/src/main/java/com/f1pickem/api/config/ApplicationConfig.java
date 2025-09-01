package com.f1pickem.api.config;

import com.f1pickem.api.model.Role;
import com.f1pickem.api.model.User;
import com.f1pickem.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

  private final UserRepository userRepository;

  @Value("${admin.password}")
  private String adminPassword;

  @Bean
  public UserDetailsService userDetailsService() {
    return username -> (org.springframework.security.core.userdetails.UserDetails) userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService());
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public WebClient webClient() {
    return WebClient.builder().build();
  }

  @Bean
  public CommandLineRunner seedAdminUser() {
    return args -> {
      if (userRepository.findByUsername("admin").isEmpty()) {
        System.out.println("Seeding admin user");
        User adminUser = User.builder()
            .username("admin")
            .password(passwordEncoder().encode(adminPassword))
            .role(Role.ADMIN)
            .build();
        userRepository.save(adminUser);
        System.out.println("Admin user seeded");
      } else {
        System.out.println("Admin user already exists. Skipping seed.");
      }
    };
  }
}
