package com.f1pickem.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name="Users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_name", nullable = false)
  private String username;

  @Column(name = "password", nullable = false)
  private String password;

  @Column(name = "total_points")
  private Long points;
}
