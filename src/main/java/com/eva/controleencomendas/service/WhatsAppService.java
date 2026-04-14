package com.eva.controleencomendas.service;

import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class WhatsAppService {

    public String gerarLinkWhatsApp(String telefone, String nomeEmpresa) {
        // Limpa o telefone deixando só os números
        String numeroLimpo = telefone.replaceAll("[^0-9]", "");

        // Lógica (número gringo e brasileiro)
        String numeroFinal;
        if (numeroLimpo.length() <= 11) {
            numeroFinal = "55" + numeroLimpo; // Brasil (sem DDI)
        } else {
            numeroFinal = numeroLimpo; // Gringo ou número que já veio com DDI
        }

        // Mensagem profissional para o escritório virtual
        String mensagem = "Olá, " + nomeEmpresa + "! Uma nova correspondência/encomenda foi recebida em seu Escritório Virtual. Por favor, nos responda para mais detalhes.";

        // Codifica a mensagem para formato de link de internet
        String textoCodificado = URLEncoder.encode(mensagem, StandardCharsets.UTF_8);

        // Retorna o link inteligente
        return "https://wa.me/" + numeroFinal + "?text=" + textoCodificado;
    }
}