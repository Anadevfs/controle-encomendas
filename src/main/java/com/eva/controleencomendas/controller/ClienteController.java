package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(originPatterns = "http://localhost:*")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @GetMapping
    public List<Cliente> buscarTodos() {
        return clienteRepository.findAll();
    }

    // Busca por nome
    @GetMapping("/buscar")
    public List<Cliente> buscarPorNome(@RequestParam String nome) {
        return clienteRepository.findByClientNameContainingIgnoreCase(nome);
    }
}
