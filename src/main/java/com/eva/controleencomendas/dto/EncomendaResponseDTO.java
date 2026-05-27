package com.eva.controleencomendas.dto;

import com.eva.controleencomendas.model.Encomenda;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

public record EncomendaResponseDTO(
        Long id,
        ClienteResumoDTO cliente,
        String descricao,
        String status,
        LocalDateTime dataRecebimento,
        LocalDateTime dataEntrega,
        String urlFoto,
        String recebidoPor,
        String marcadoEnviadoPor,
        String observacao,
        String observacaoAtualizadaPor,
        LocalDateTime observacaoAtualizadaEm,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<EncomendaObservacaoAuditoriaDTO> auditoriaObservacoes,
        String codigoRastreio,
        String linkWhatsapp
) {
    public static EncomendaResponseDTO from(Encomenda encomenda, boolean podeVerAuditoria) {
        List<EncomendaObservacaoAuditoriaDTO> auditoria = podeVerAuditoria
                ? encomenda.getAuditoriaObservacoes().stream()
                        .map(EncomendaObservacaoAuditoriaDTO::from)
                        .toList()
                : List.of();

        return new EncomendaResponseDTO(
                encomenda.getId(),
                ClienteResumoDTO.from(encomenda.getCliente()),
                encomenda.getDescricao(),
                encomenda.getStatus(),
                encomenda.getDataRecebimento(),
                encomenda.getDataEntrega(),
                encomenda.getUrlFoto(),
                encomenda.getRecebidoPor(),
                encomenda.getMarcadoEnviadoPor(),
                encomenda.getObservacao(),
                encomenda.getObservacaoAtualizadaPor(),
                encomenda.getObservacaoAtualizadaEm(),
                auditoria,
                encomenda.getCodigoRastreio(),
                encomenda.getLinkWhatsapp()
        );
    }
}
