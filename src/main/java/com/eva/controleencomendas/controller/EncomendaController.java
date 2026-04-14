package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Encomenda;
import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.repository.EncomendaRepository;
import com.eva.controleencomendas.repository.ClienteRepository;
import com.eva.controleencomendas.service.WhatsAppService;
import com.eva.controleencomendas.dto.DashboardDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@RestController
@RequestMapping("/api/encomendas")
@CrossOrigin(origins = "*")
public class EncomendaController {

    @Autowired
    private EncomendaRepository encomendaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private WhatsAppService whatsAppService;

    @GetMapping
    public List<Encomenda> listarTodas() {
        return encomendaRepository.findAll();
    }

    @PostMapping
    public Encomenda salvarEncomenda(
            @RequestParam("clienteId") Long clienteId,
            @RequestParam("descricao") String descricao,
            @RequestParam("arquivo") MultipartFile arquivo) throws IOException {

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        String nomeArquivo = System.currentTimeMillis() + "_" + arquivo.getOriginalFilename();
        Path caminho = Paths.get("./uploads/" + nomeArquivo);
        Files.copy(arquivo.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

        // Criando a encomenda
        Encomenda encomenda = new Encomenda();
        encomenda.setCliente(cliente);
        encomenda.setDescricao(descricao);
        encomenda.setUrlFoto("/uploads/" + nomeArquivo);

        Encomenda salva = encomendaRepository.save(encomenda);

        // Link do WhatsApp
        if (cliente.getWhatsapp() != null && !cliente.getWhatsapp().isEmpty()) {
            // Usa o nome da empresa (companyName) para gerar o link
            String link = whatsAppService.gerarLinkWhatsApp(cliente.getWhatsapp(), cliente.getCompanyName());
            salva.setLinkWhatsapp(link); // Anexa o link no JSON de resposta
        }

        return salva;
    }

    // Endpoint dashboard
    @GetMapping("/dashboard")
    public DashboardDTO buscarResumo() {
        long total = encomendaRepository.count();
        long pendentes = encomendaRepository.countByStatus("Pendente");
        long entregues = encomendaRepository.countByStatus("Entregue");

        return new DashboardDTO(total, pendentes, entregues);
    }

    // Endpoint pra dar baixa
    @PatchMapping("/{id}/entregar")
    public Encomenda entregar(@PathVariable Long id) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encomenda não encontrada"));
        encomenda.setStatus("Entregue");
        return encomendaRepository.save(encomenda);
    }
}