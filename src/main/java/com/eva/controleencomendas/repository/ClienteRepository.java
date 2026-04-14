package com.eva.controleencomendas.repository;

import com.eva.controleencomendas.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    // Salvar, Deletar, Buscar todos, Buscar por ID.

    // Busca por nome
    List<Cliente> findByClientNameContainingIgnoreCase(String nome);
}