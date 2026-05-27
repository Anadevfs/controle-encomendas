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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente cadastrar(@RequestBody Cliente cliente) {
        validarCliente(cliente);
        cliente.setId(null);
        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Long id, @RequestBody Cliente clienteAtualizado) {
        validarCliente(clienteAtualizado);

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));

        cliente.setClientName(clienteAtualizado.getClientName().trim());
        cliente.setCompanyName(clienteAtualizado.getCompanyName().trim());
        cliente.setMailboxNumber(clienteAtualizado.getMailboxNumber().trim());
        cliente.setWhatsapp(normalizarTextoOpcional(clienteAtualizado.getWhatsapp(), 30, "whatsapp"));

        return clienteRepository.save(cliente);
    }

    private void validarCliente(Cliente cliente) {
        if (cliente == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cliente e obrigatorio.");
        }

        cliente.setClientName(validarTexto(cliente.getClientName(), "nome do cliente", 100));
        cliente.setCompanyName(validarTexto(cliente.getCompanyName(), "empresa", 100));
        cliente.setMailboxNumber(validarTexto(cliente.getMailboxNumber(), "caixa postal", 50));
        cliente.setWhatsapp(normalizarTextoOpcional(cliente.getWhatsapp(), 30, "whatsapp"));
    }

    private String normalizarTextoOpcional(String value, int maxLength, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " deve ter ate " + maxLength + " caracteres.");
        }

        return trimmed;
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
