package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
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
        String termo = validarTexto(nome, "nome", 100);
        return clienteRepository.findByClientNameContainingIgnoreCase(termo);
    }

    private String validarTexto(String value, String fieldName, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " e obrigatorio.");
        }

        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " deve ter ate " + maxLength + " caracteres.");
        }

        return trimmed;
    }
}
