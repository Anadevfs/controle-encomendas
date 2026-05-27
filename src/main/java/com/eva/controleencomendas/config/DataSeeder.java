package com.eva.controleencomendas.config;

import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.UsuarioRepository;
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
        ensureAdminAna();
        ensureFuncionario("vitor@eva.com", "1958", "Vitor");
    }

    private void ensureFuncionario(String username, String senhaInicial, String nome) {
        Usuario usuario = usuarioRepository.findByUsername(username).orElseGet(Usuario::new);
        usuario.setUsername(username);
        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            usuario.setSenha(senhaInicial);
        }
        usuario.setNome(nome);
        usuario.setRole("ROLE_FUNCIONARIO");
        usuarioRepository.save(usuario);
        System.out.println("USUARIO DE ACESSO GARANTIDO: " + username);
    }

    private void ensureAdminAna() {
        Usuario usuario = usuarioRepository.findByUsername("ana@eva.com").orElseGet(Usuario::new);
        usuario.setUsername("ana@eva.com");
        usuario.setSenha("1520");
        usuario.setNome("Ana");
        usuario.setRole("ROLE_ADMIN");
        usuarioRepository.save(usuario);
        System.out.println("USUARIO ADMIN GARANTIDO: ana@eva.com");
    }
}
