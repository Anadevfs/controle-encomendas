package com.eva.controleencomendas.dto;

import com.eva.controleencomendas.model.Cliente;

public record ClienteResumoDTO(
        Long id,
        String clientName,
        String companyName,
        String mailboxNumber,
        String whatsapp
) {
    public static ClienteResumoDTO from(Cliente cliente) {
        if (cliente == null) {
            return null;
        }

        return new ClienteResumoDTO(
                cliente.getId(),
                cliente.getClientName(),
                cliente.getCompanyName(),
                cliente.getMailboxNumber(),
                cliente.getWhatsapp()
        );
    }
}
