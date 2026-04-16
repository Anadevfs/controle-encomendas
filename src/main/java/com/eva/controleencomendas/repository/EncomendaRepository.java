package com.eva.controleencomendas.repository;

import com.eva.controleencomendas.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {

    // Spring cria o contador automaticamente baseado no nome do método
    long countByStatus(String status);

    // BUSCADOR: Procura por nome do cliente ou nome da empresa
    @Query("SELECT e FROM Encomenda e WHERE " +
            "LOWER(e.cliente.clientName) LIKE LOWER(concat('%', :termo, '%')) OR " +
            "LOWER(e.cliente.companyName) LIKE LOWER(concat('%', :termo, '%'))")
    List<Encomenda> buscarPorClienteOuEmpresa(@Param("termo") String termo);
}