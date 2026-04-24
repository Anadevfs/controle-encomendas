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
        ensureUser("janaina@eva.com", "1958", "Janaina");
        ensureUser("veronica@eva.com", "1958", "Veronica");
        ensureUser("ana@eva.com", "1958", "Ana");
        ensureUser("vitor@eva.com", "1958", "Vitor");
    }

    private void ensureUser(String username, String senha, String nome) {
        Usuario usuario = usuarioRepository.findByUsername(username).orElseGet(Usuario::new);
        usuario.setUsername(username);
        usuario.setSenha(senha);
        usuario.setNome(nome);
        usuarioRepository.save(usuario);
    }
}
