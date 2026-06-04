package com.eva.controleencomendas.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;
    private String nome;
    private String role;
    @Column(name = "can_view_observation_history")
    private boolean canViewObservationHistory;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isCanViewObservationHistory() { return canViewObservationHistory; }
    public void setCanViewObservationHistory(boolean canViewObservationHistory) { this.canViewObservationHistory = canViewObservationHistory; }
}
