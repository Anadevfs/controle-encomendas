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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/encomendas")
public class EncomendaController {

    private static final String STATUS_ENTREGUE = "Entregue";
    private static final String STATUS_ENVIADO = "Enviado";

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
            preencherDataEntregaSeNecessario(encomenda, novoStatus);

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
        encomenda.setStatus(STATUS_ENTREGUE);
        preencherDataEntregaSeNecessario(encomenda, STATUS_ENTREGUE);
        if (marcadoEnviadoPor != null && !marcadoEnviadoPor.isBlank()) {
            encomenda.setMarcadoEnviadoPor(marcadoEnviadoPor);
        }

        // REGISTRA NO LOG: Entrega
        atividadeRepository.save(new Atividade("Encomenda entregue - " + encomenda.getCliente().getCompanyName(), "SUCESSO"));

        return encomendaRepository.save(encomenda);
    }

    // Busca e histórico 100%
    private void preencherDataEntregaSeNecessario(Encomenda encomenda, String status) {
        if (status == null || encomenda.getDataEntrega() != null) {
            return;
        }

        if (STATUS_ENTREGUE.equalsIgnoreCase(status) || STATUS_ENVIADO.equalsIgnoreCase(status)) {
            encomenda.setDataEntrega(LocalDateTime.now());
        }
    }

    @GetMapping("/buscar")
    public List<Encomenda> buscarEncomendas(
            @RequestParam(value = "termo", required = false) String termo,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "funcionario", required = false) String funcionario,
            @RequestParam(value = "dataInicial", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataInicial,
            @RequestParam(value = "dataFinal", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataFinal) {

        // Converte as datas (Exemplo: dataInicial começa 00:00:00 e dataFinal vai até 23:59:59)
        LocalDateTime inicio = (dataInicial != null) ? dataInicial.atStartOfDay() : null;
        LocalDateTime fim = (dataFinal != null) ? dataFinal.atTime(23, 59, 59) : null;

        return encomendaRepository.buscarHistorico(termo, status, funcionario, inicio, fim);
    }

    // Rota para deletar uma encomenda pelo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarEncomenda(@PathVariable Long id) {
        if (!encomendaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        encomendaRepository.deleteById(id);

        // Registra no log que algo foi deletado (maior segurança)
        atividadeRepository.save(new Atividade("Uma encomenda foi excluída do sistema (ID: " + id + ")", "AVISO"));

        return ResponseEntity.noContent().build();
    }
}
