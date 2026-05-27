package com.eva.controleencomendas.controller;

import com.eva.controleencomendas.model.Encomenda;
import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.model.Atividade;
import com.eva.controleencomendas.model.EncomendaObservacaoAuditoria;
import com.eva.controleencomendas.repository.EncomendaRepository;
import com.eva.controleencomendas.repository.ClienteRepository;
import com.eva.controleencomendas.repository.AtividadeRepository;
import com.eva.controleencomendas.repository.UsuarioRepository;
import com.eva.controleencomendas.service.WhatsAppService;
import com.eva.controleencomendas.dto.DashboardDTO;
import com.eva.controleencomendas.dto.EncomendaObservacaoAuditoriaDTO;
import com.eva.controleencomendas.dto.EncomendaResponseDTO;
import com.eva.controleencomendas.dto.UsuarioResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/encomendas")
public class EncomendaController {

    private static final String STATUS_ENTREGUE = "Entregue";
    private static final String STATUS_ENVIADO = "Enviado";
    private static final String STATUS_PENDENTE = "Pendente";
    private static final String ACAO_OBSERVACAO_CRIADA = "OBSERVACAO_CRIADA";
    private static final String ACAO_OBSERVACAO_ALTERADA = "OBSERVACAO_ALTERADA";
    private static final String USUARIO_NAO_IDENTIFICADO = "Usuario nao identificado";
    private static final ZoneId ZONA_SISTEMA = ZoneId.of("America/Sao_Paulo");
    private static final long MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "text/plain"
    );

    @Autowired
    private EncomendaRepository encomendaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AtividadeRepository atividadeRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private WhatsAppService whatsAppService;

    @GetMapping
    public List<EncomendaResponseDTO> listarTodas(
            @RequestParam(value = "usuario", required = false) String usuario,
            @RequestParam(value = "usuarioId", required = false) String usuarioId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "role", required = false) String role) {
        boolean podeVerAuditoria = podeAcessarAuditoriaObservacoes(usuario, usuarioId, username, role);
        return encomendaRepository.findAll().stream()
                .map(encomenda -> EncomendaResponseDTO.from(encomenda, podeVerAuditoria))
                .toList();
    }

    // Endpoint para buscar as atividades do log
    @GetMapping("/atividades")
    public List<Atividade> listarAtividades() {
        return atividadeRepository.findTop10ByOrderByDataHoraDesc();
    }

    @PostMapping
    public EncomendaResponseDTO salvarEncomenda(
            @RequestParam("clienteId") Long clienteId,
            @RequestParam("descricao") String descricao,
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(value = "recebidoPor", required = false) String recebidoPor) throws IOException {

        String descricaoValida = validarTextoObrigatorio(descricao, "descricao", 500);
        String recebidoPorValido = normalizarTextoOpcional(recebidoPor, 120);
        validarArquivo(arquivo);

        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado"));

        String nomeArquivo = criarNomeSeguro(arquivo.getOriginalFilename());
        Path uploadsDir = Paths.get("./uploads").toAbsolutePath().normalize();
        Path caminho = uploadsDir.resolve(nomeArquivo).normalize();

        if (!caminho.startsWith(uploadsDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de arquivo invalido.");
        }

        if (!Files.exists(caminho.getParent())) {
            Files.createDirectories(caminho.getParent());
        }

        Files.copy(arquivo.getInputStream(), caminho, StandardCopyOption.REPLACE_EXISTING);

        Encomenda encomenda = new Encomenda();
        encomenda.setCliente(cliente);
        encomenda.setDescricao(descricaoValida);
        encomenda.setUrlFoto("/uploads/" + nomeArquivo);
        encomenda.setStatus(STATUS_PENDENTE);
        encomenda.setRecebidoPor(recebidoPorValido);
        encomenda.setMarcadoEnviadoPor(null);
        encomenda.setObservacao(null);
        encomenda.setObservacaoAtualizadaPor(null);
        encomenda.setObservacaoAtualizadaEm(null);

        Encomenda salva = encomendaRepository.save(encomenda);

        // REGISTRA NO LOG: Nova encomenda
        atividadeRepository.save(new Atividade("Nova encomenda recebida - " + cliente.getCompanyName(), "INFO"));

        if (cliente.getWhatsapp() != null && !cliente.getWhatsapp().isEmpty()) {
            String link = whatsAppService.gerarLinkWhatsApp(cliente.getWhatsapp(), cliente.getCompanyName());
            salva.setLinkWhatsapp(link);
        }

        return EncomendaResponseDTO.from(salva, podeAcessarAuditoriaObservacoes(recebidoPorValido, null, null, null));
    }

    @GetMapping("/dashboard")
    public DashboardDTO buscarResumo() {
        long total = encomendaRepository.count();
        long pendentes = encomendaRepository.countByStatus("Pendente");
        long entregues = encomendaRepository.countByStatus("Entregue") + encomendaRepository.countByStatus("Enviado");

        return new DashboardDTO(total, pendentes, entregues);
    }

    @PatchMapping("/{id}/status")
    public EncomendaResponseDTO atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Corpo da requisicao e obrigatorio.");
        }

        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda nao encontrada"));

        String novoStatus = body.get("status");
        if (novoStatus != null) {
            String statusValido = validarStatus(novoStatus);
            encomenda.setStatus(statusValido);
            preencherDataEntregaSeNecessario(encomenda, statusValido);

            // REGISTRA NO LOG: Mudança de status
            String mensagemLog = "Encomenda " + statusValido.toLowerCase() + " - " + encomenda.getCliente().getCompanyName();
            atividadeRepository.save(new Atividade(mensagemLog, "SUCESSO"));
        }

        return EncomendaResponseDTO.from(encomendaRepository.save(encomenda), false);
    }

    @PatchMapping("/{id}/entregar")
    public EncomendaResponseDTO entregar(
            @PathVariable Long id,
            @RequestParam(value = "marcadoEnviadoPor", required = false) String marcadoEnviadoPor) {
        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda nao encontrada"));
        encomenda.setStatus(STATUS_ENTREGUE);
        preencherDataEntregaSeNecessario(encomenda, STATUS_ENTREGUE);
        String marcadoEnviadoPorValido = normalizarTextoOpcional(marcadoEnviadoPor, 120);
        if (marcadoEnviadoPorValido != null) {
            encomenda.setMarcadoEnviadoPor(marcadoEnviadoPorValido);
        }

        // REGISTRA NO LOG: Entrega
        atividadeRepository.save(new Atividade("Encomenda entregue - " + encomenda.getCliente().getCompanyName(), "SUCESSO"));

        return EncomendaResponseDTO.from(
                encomendaRepository.save(encomenda),
                podeAcessarAuditoriaObservacoes(marcadoEnviadoPorValido, null, null, null)
        );
    }

    @PatchMapping("/{id}/observacao")
    public EncomendaResponseDTO atualizarObservacao(@PathVariable Long id, @RequestBody Map<String, String> body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Corpo da requisicao e obrigatorio.");
        }

        Encomenda encomenda = encomendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda nao encontrada"));

        String observacao = body.get("observacao");
        String novaObservacao = normalizarTextoOpcional(observacao, 1000);
        String observacaoAtual = encomenda.getObservacao();

        if (Objects.equals(observacaoAtual, novaObservacao)) {
            return EncomendaResponseDTO.from(
                    encomenda,
                    podeAcessarAuditoriaObservacoes(body)
            );
        }

        String usuario = resolverUsuarioAuditoria(body);
        LocalDateTime dataHora = LocalDateTime.now(ZONA_SISTEMA);
        String acao = observacaoAtual == null ? ACAO_OBSERVACAO_CRIADA : ACAO_OBSERVACAO_ALTERADA;

        encomenda.setObservacao(novaObservacao);
        encomenda.setObservacaoAtualizadaPor(usuario);
        encomenda.setObservacaoAtualizadaEm(dataHora);
        encomenda.getAuditoriaObservacoes().add(0, new EncomendaObservacaoAuditoria(
                encomenda,
                usuario,
                observacaoAtual,
                novaObservacao,
                dataHora,
                acao
        ));

        return EncomendaResponseDTO.from(
                encomendaRepository.save(encomenda),
                podeAcessarAuditoriaObservacoes(body)
        );
    }

    // Busca e histórico 100%
    @GetMapping("/{id}/observacoes/auditoria")
    public List<EncomendaObservacaoAuditoriaDTO> buscarAuditoriaObservacoes(
            @PathVariable Long id,
            @RequestParam(value = "usuario", required = false) String usuario,
            @RequestParam(value = "usuarioId", required = false) String usuarioId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "role", required = false) String role) {
        if (!podeAcessarAuditoriaObservacoes(usuario, usuarioId, username, role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sem permissao para acessar auditoria de observacoes.");
        }

        return encomendaRepository.findWithAuditoriaObservacoesById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encomenda nao encontrada"))
                .getAuditoriaObservacoes()
                .stream()
                .map(EncomendaObservacaoAuditoriaDTO::from)
                .toList();
    }

    private void preencherDataEntregaSeNecessario(Encomenda encomenda, String status) {
        if (status == null || encomenda.getDataEntrega() != null) {
            return;
        }

        if (STATUS_ENTREGUE.equalsIgnoreCase(status) || STATUS_ENVIADO.equalsIgnoreCase(status)) {
            encomenda.setDataEntrega(LocalDateTime.now());
        }
    }

    @GetMapping("/buscar")
    public List<EncomendaResponseDTO> buscarEncomendas(
            @RequestParam(value = "termo", required = false) String termo,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "funcionario", required = false) String funcionario,
            @RequestParam(value = "usuario", required = false) String usuario,
            @RequestParam(value = "usuarioId", required = false) String usuarioId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "dataInicial", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataInicial,
            @RequestParam(value = "dataFinal", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dataFinal) {

        // Converte as datas (Exemplo: dataInicial começa 00:00:00 e dataFinal vai até 23:59:59)
        LocalDateTime inicio = (dataInicial != null) ? dataInicial.atStartOfDay() : null;
        LocalDateTime fim = (dataFinal != null) ? dataFinal.atTime(23, 59, 59) : null;

        if (inicio != null && fim != null && inicio.isAfter(fim)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataInicial nao pode ser maior que dataFinal.");
        }

        boolean podeVerAuditoria = podeAcessarAuditoriaObservacoes(usuario, usuarioId, username, role);

        return encomendaRepository.buscarHistorico(
                normalizarTextoOpcional(termo, 100),
                normalizarTextoOpcional(status, 50),
                normalizarTextoOpcional(funcionario, 120),
                inicio,
                fim
        ).stream()
                .map(encomenda -> EncomendaResponseDTO.from(encomenda, podeVerAuditoria))
                .toList();
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

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "arquivo e obrigatorio.");
        }

        if (arquivo.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "arquivo deve ter ate 5MB.");
        }

        String contentType = arquivo.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo de arquivo nao permitido.");
        }
    }

    private String criarNomeSeguro(String originalFilename) {
        String filename = originalFilename == null ? "arquivo" : Paths.get(originalFilename).getFileName().toString();
        String extensao = "";
        int dotIndex = filename.lastIndexOf('.');

        if (dotIndex >= 0 && dotIndex < filename.length() - 1) {
            extensao = filename.substring(dotIndex).replaceAll("[^A-Za-z0-9.]", "");
        }

        return UUID.randomUUID() + extensao;
    }

    private String validarTextoObrigatorio(String value, String fieldName, int maxLength) {
        String trimmed = normalizarTextoOpcional(value, maxLength);
        if (trimmed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " e obrigatorio.");
        }

        return trimmed;
    }

    private String normalizarTextoOpcional(String value, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Texto deve ter ate " + maxLength + " caracteres.");
        }

        return trimmed;
    }

    private String resolverUsuarioAuditoria(Map<String, String> body) {
        String usuarioInformado = normalizarTextoOpcional(body.get("usuario"), 120);
        String usuarioId = normalizarTextoOpcional(body.get("usuarioId"), 30);
        String username = normalizarTextoOpcional(body.get("username"), 120);

        if (username != null) {
            return usuarioRepository.findByUsername(username)
                    .map(usuario -> normalizarTextoOpcional(usuario.getNome(), 120))
                    .orElse(usuarioInformado != null ? usuarioInformado : USUARIO_NAO_IDENTIFICADO);
        }

        if (usuarioId != null) {
            try {
                Long id = Long.valueOf(usuarioId);
                return usuarioRepository.findById(id)
                        .map(usuario -> normalizarTextoOpcional(usuario.getNome(), 120))
                        .orElse(usuarioInformado != null ? usuarioInformado : USUARIO_NAO_IDENTIFICADO);
            } catch (NumberFormatException ignored) {
                return usuarioInformado != null ? usuarioInformado : USUARIO_NAO_IDENTIFICADO;
            }
        }

        if (usuarioInformado != null) {
            return usuarioInformado;
        }

        return USUARIO_NAO_IDENTIFICADO;
    }

    private boolean podeAcessarAuditoriaObservacoes(Map<String, String> body) {
        return podeAcessarAuditoriaObservacoes(
                body.get("usuario"),
                body.get("usuarioId"),
                body.get("username"),
                body.get("role")
        );
    }

    private boolean podeAcessarAuditoriaObservacoes(String usuario, String usuarioId, String username, String role) {
        String usernameValido = normalizarTextoOpcional(username, 120);

        if (usernameValido != null) {
            return usuarioRepository.findByUsername(usernameValido)
                    .map(usuarioEncontrado -> UsuarioResponseDTO.podeVerHistoricoObservacoes(
                            usuarioEncontrado.getRole()
                    ))
                    .orElse(UsuarioResponseDTO.podeVerHistoricoObservacoes(role));
        }

        String usuarioIdValido = normalizarTextoOpcional(usuarioId, 30);

        if (usuarioIdValido != null) {
            try {
                Long id = Long.valueOf(usuarioIdValido);
                return usuarioRepository.findById(id)
                        .map(usuarioEncontrado -> UsuarioResponseDTO.podeVerHistoricoObservacoes(
                                usuarioEncontrado.getRole()
                        ))
                        .orElse(UsuarioResponseDTO.podeVerHistoricoObservacoes(role));
            } catch (NumberFormatException ignored) {
                return UsuarioResponseDTO.podeVerHistoricoObservacoes(role);
            }
        }

        return UsuarioResponseDTO.podeVerHistoricoObservacoes(role);
    }

    private String validarStatus(String status) {
        String trimmed = validarTextoObrigatorio(status, "status", 50);
        if (STATUS_PENDENTE.equalsIgnoreCase(trimmed)) {
            return STATUS_PENDENTE;
        }
        if (STATUS_ENTREGUE.equalsIgnoreCase(trimmed)) {
            return STATUS_ENTREGUE;
        }
        if (STATUS_ENVIADO.equalsIgnoreCase(trimmed)) {
            return STATUS_ENVIADO;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status invalido.");
    }
}
