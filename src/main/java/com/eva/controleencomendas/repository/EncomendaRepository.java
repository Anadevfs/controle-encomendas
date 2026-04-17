package com.eva.controleencomendas.repository;

import com.eva.controleencomendas.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {

    // Spring cria o contador automaticamente baseado no nome do método
    long countByStatus(String status);

    // BUSCA 100% (Termo, Status, Funcionario, Data Inicial e Final)
    @Query("SELECT e FROM Encomenda e WHERE " +
            "(:termo IS NULL OR :termo = '' OR " +
            "LOWER(e.cliente.clientName) LIKE LOWER(concat('%', :termo, '%')) OR " +
            "LOWER(e.cliente.companyName) LIKE LOWER(concat('%', :termo, '%')) OR " +
            "LOWER(e.cliente.mailboxNumber) LIKE LOWER(concat('%', :termo, '%')) OR " +
            "LOWER(e.codigoRastreio) LIKE LOWER(concat('%', :termo, '%'))) " +
            "AND (:status IS NULL OR :status = '' OR e.status = :status) " +
            "AND (:funcionario IS NULL OR :funcionario = '' OR " +
            "LOWER(e.recebidoPor) LIKE LOWER(concat('%', :funcionario, '%')) OR " +
            "LOWER(e.marcadoEnviadoPor) LIKE LOWER(concat('%', :funcionario, '%'))) " +
            "AND (cast(:dataInicial as timestamp) IS NULL OR e.dataRecebimento >= :dataInicial) " +
            "AND (cast(:dataFinal as timestamp) IS NULL OR e.dataRecebimento <= :dataFinal) " +
            "ORDER BY e.dataRecebimento DESC")
    List<Encomenda> buscarHistorico(
            @Param("termo") String termo,
            @Param("status") String status,
            @Param("funcionario") String funcionario,
            @Param("dataInicial") LocalDateTime dataInicial,
            @Param("dataFinal") LocalDateTime dataFinal
    );
}