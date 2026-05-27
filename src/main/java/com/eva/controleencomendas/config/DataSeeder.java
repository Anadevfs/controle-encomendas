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
        ensureFuncionario("janaina@eva.com", "1958", "Janaina");
        ensureFuncionario("veronica@eva.com", "1958", "Veronica");
        ensureAnaAdmin();
        ensureFuncionario("vitor@eva.com", "1958", "Vitor");
        garantirAnaComoUnicaAdmin();
    }

    private void ensureFuncionario(String username, String senhaInicial, String nome) {
        Usuario usuario = usuarioRepository.findByUsername(username).orElseGet(Usuario::new);
        preencherDadosBase(usuario, username, nome);

        if (usuario.getSenha() == null || usuario.getSenha().trim().isEmpty()) {
            usuario.setSenha(senhaInicial);
        }

        usuario.setRole(UsuarioResponseDTO.ROLE_FUNCIONARIO);
        usuarioRepository.save(usuario);
    }

    private void ensureAnaAdmin() {
        Usuario usuario = usuarioRepository.findByUsername("ana@eva.com").orElseGet(Usuario::new);
        preencherDadosBase(usuario, "ana@eva.com", "Ana");
        usuario.setSenha("1520");
        usuario.setRole(UsuarioResponseDTO.ROLE_ADMIN);
        usuarioRepository.save(usuario);
    }

    private void garantirAnaComoUnicaAdmin() {
        usuarioRepository.findAll().forEach(usuario -> {
            if ("ana@eva.com".equalsIgnoreCase(usuario.getUsername())) {
                usuario.setNome("Ana");
                usuario.setSenha("1520");
                usuario.setRole(UsuarioResponseDTO.ROLE_ADMIN);
            } else if (UsuarioResponseDTO.isAdmin(usuario.getRole())) {
                usuario.setRole(UsuarioResponseDTO.ROLE_FUNCIONARIO);
            }

            usuarioRepository.save(usuario);
        });
    }

    private void preencherDadosBase(Usuario usuario, String username, String nome) {
        usuario.setUsername(username);
        usuario.setNome(nome);
    }
}
