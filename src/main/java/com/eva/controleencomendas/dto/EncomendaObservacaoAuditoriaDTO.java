package com.eva.controleencomendas.dto;

import com.eva.controleencomendas.model.EncomendaObservacaoAuditoria;

import java.time.LocalDateTime;

public record EncomendaObservacaoAuditoriaDTO(
        Long id,
        String usuario,
        String valorAntigo,
        String valorNovo,
        LocalDateTime dataHora,
        String acao
) {
    public static EncomendaObservacaoAuditoriaDTO from(EncomendaObservacaoAuditoria auditoria) {
        return new EncomendaObservacaoAuditoriaDTO(
                auditoria.getId(),
                auditoria.getUsuario(),
                auditoria.getValorAntigo(),
                auditoria.getValorNovo(),
                auditoria.getDataHora(),
                auditoria.getAcao()
        );
    }
}
