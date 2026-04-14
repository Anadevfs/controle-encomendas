package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public Usuario login(@RequestBody Usuario usuario) {
        return usuarioRepository.findByUsernameAndSenha(usuario.getUsername(), usuario.getSenha())
                .orElseThrow(() -> new RuntimeException("Usuário ou senha inválidos!"));
    }
}