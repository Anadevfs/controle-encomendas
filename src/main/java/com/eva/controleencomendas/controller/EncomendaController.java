package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Encomenda;
import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.model.Atividade;
import com.eva.controleencomendas.repository.EncomendaRepository;
import com.eva.controleencomendas.repository.ClienteRepository;
import com.eva.controleencomendas.repository.AtividadeRepository;
import com.eva.controleencomendas.service.WhatsAppService;
import com.eva.controleencomendas.dto.DashboardDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/encomendas")
@CrossOrigin(origins = "*")
public class EncomendaController {

    @Autowired
    private EncomendaRepository encomendaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private WhatsAppService whatsAppService;

    @GetMapping
    public List<Encomenda> listarTodas() {
        return encomendaRepository.findAll();
    }

    // Endpoint para buscar as atividades do log
    @GetMapping("/atividades")
    public List<Atividade> listarAtividades() {
        return atividadeRepository.findTop10ByOrderByDataHoraDesc();
    }

    @PostMapping
    public Encomenda salvarEncomenda(
            @RequestParam("clienteId") Long clienteId,
            @RequestParam("descricao") String descricao,
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(value = "recebidoPor", required = false) String recebidoPor) throws IOException {

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        String nomeArquivo = System.currentTimeMillis() + "_" + arquivo.getOriginalFilename();
        Path caminho = Paths.get("./uploads/" + nomeArquivo);

        if (!Files.exists(caminho.getParent())) {
            Files.createDirectories(caminho.getParent());
        }

        Files.copy(arquivo.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

        Encomenda encomenda = new Encomenda();
        encomenda.setCliente(cliente);
        encomenda.setDescricao(descricao);
        encomenda.setUrlFoto("/uploads/" + nomeArquivo);
        encomenda.setStatus("Pendente");
        encomenda.setRecebidoPor(recebidoPor);
        encomenda.setMarcadoEnviadoPor(null);

        Encomenda salva = encomendaRepository.save(encomenda);

        // REGISTRA NO LOG: Nova encomenda
        atividadeRepository.save(new Atividade("Nova encomenda recebida - " + cliente.getCompanyName(), "INFO"));

        if (cliente.getWhatsapp() != null && !cliente.getWhatsapp().isEmpty()) {
            String link = whatsAppService.gerarLinkWhatsApp(cliente.getWhatsapp(), cliente.getCompanyName());
            salva.setLinkWhatsapp(link);
        }

        return salva;
    }

    @GetMapping("/dashboard")
    public DashboardDTO buscarResumo() {
        long total = encomendaRepository.count();
        long pendentes = encomendaRepository.countByStatus("Pendente");
        long entregues = encomendaRepository.countByStatus("Entregue") + encomendaRepository.countByStatus("Enviado");

        return new DashboardDTO(total, pendentes, entregues);
    }

    @PatchMapping("/{id}/status")
    public Encomenda atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encomenda não encontrada"));

        String novoStatus = body.get("status");
        if (novoStatus != null) {
            encomenda.setStatus(novoStatus);

            // REGISTRA NO LOG: Mudança de status
            String mensagemLog = "Encomenda " + novoStatus.toLowerCase() + " - " + encomenda.getCliente().getCompanyName();
            atividadeRepository.save(new Atividade(mensagemLog, "SUCESSO"));
        }

        return encomendaRepository.save(encomenda);
    }

    @PatchMapping("/{id}/entregar")
    public Encomenda entregar(
            @PathVariable Long id,
            @RequestParam(value = "marcadoEnviadoPor", required = false) String marcadoEnviadoPor) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encomenda não encontrada"));
        encomenda.setStatus("Entregue");
        if (marcadoEnviadoPor != null && !marcadoEnviadoPor.isBlank()) {
            encomenda.setMarcadoEnviadoPor(marcadoEnviadoPor);
        }

        // REGISTRA NO LOG: Entrega
        atividadeRepository.save(new Atividade("Encomenda entregue - " + encomenda.getCliente().getCompanyName(), "SUCESSO"));

        return encomendaRepository.save(encomenda);
    }
}
