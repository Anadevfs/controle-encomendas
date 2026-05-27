package com.eva.controleencomendas.repository;

import com.eva.controleencomendas.model.EncomendaObservacaoAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EncomendaObservacaoAuditoriaRepository extends JpaRepository<EncomendaObservacaoAuditoria, Long> {
    List<EncomendaObservacaoAuditoria> findByEncomendaIdOrderByDataHoraAsc(Long encomendaId);
}
