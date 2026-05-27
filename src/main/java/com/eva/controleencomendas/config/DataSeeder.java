package com.eva.controleencomendas.config;

import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.UsuarioRepository;
import com.eva.controleencomendas.dto.UsuarioResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void run(String... args) {
        ensureUser("janaina@eva.com", "1958", "Janaina", UsuarioResponseDTO.ROLE_FUNCIONARIO);
        ensureUser("veronica@eva.com", "1958", "Veronica", UsuarioResponseDTO.ROLE_FUNCIONARIO);
        ensureUser("ana@eva.com", "1520", "Ana", UsuarioResponseDTO.ROLE_ADMIN);
        ensureUser("vitor@eva.com", "1958", "Vitor", UsuarioResponseDTO.ROLE_FUNCIONARIO);
    }

    private void ensureUser(String username, String senha, String nome, String role) {
        Usuario usuario = usuarioRepository.findByUsername(username).orElseGet(Usuario::new);
        usuario.setUsername(username);
        usuario.setSenha(senha);
        usuario.setNome(nome);
        usuario.setRole(role);
        usuarioRepository.save(usuario);
    }
}
