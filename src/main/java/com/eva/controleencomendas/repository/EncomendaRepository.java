package com.eva.controleencomendas.repository;

import com.eva.controleencomendas.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {
    // Spring cria o contador automaticamente baseado no nome do método
    long countByStatus(String status);
}