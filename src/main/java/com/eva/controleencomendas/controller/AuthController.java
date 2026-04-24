package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public Usuario login(@RequestBody Usuario usuario) {
        if (usuario == null || isBlank(usuario.getUsername()) || isBlank(usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario e senha sao obrigatorios.");
        }

        return usuarioRepository.findByUsernameAndSenha(usuario.getUsername(), usuario.getSenha())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos!"));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
