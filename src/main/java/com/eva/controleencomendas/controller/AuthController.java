package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.UsuarioRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody Usuario usuario) {
        Usuario autenticado = usuarioRepository.findByUsernameAndSenha(normalizeUsername(usuario.getUsername()), usuario.getSenha())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario ou senha invalidos!"));

        return LoginResponse.from(autenticado);
    }

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim().toLowerCase();
    }

    public record LoginResponse(
            Long id,
            String username,
            String nome,
            String role,
            @JsonProperty("isAdmin") boolean isAdmin,
            @JsonProperty("canViewHistory") boolean canViewHistory
    ) {
        public static LoginResponse from(Usuario usuario) {
            boolean admin = "ROLE_ADMIN".equals(usuario.getRole());
            return new LoginResponse(
                    usuario.getId(),
                    usuario.getUsername(),
                    usuario.getNome(),
                    usuario.getRole(),
                    admin,
                    admin
            );
        }
    }
}
