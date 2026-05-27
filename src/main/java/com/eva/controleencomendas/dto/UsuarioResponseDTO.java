package com.eva.controleencomendas.dto;

import com.eva.controleencomendas.model.Usuario;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

public record UsuarioResponseDTO(
        Long id,
        String username,
        String nome,
        String role,
        boolean canViewObservationHistory
) {
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_FUNCIONARIO = "ROLE_FUNCIONARIO";
    private static final Set<String> USUARIOS_AUTORIZADOS_HISTORICO_OBSERVACOES = Set.of("veronica");

    public static UsuarioResponseDTO from(Usuario usuario) {
        String role = normalizarRole(usuario.getRole());
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNome(),
                role,
                podeVerHistoricoObservacoes(usuario.getNome(), role)
        );
    }

    public static boolean podeVerHistoricoObservacoes(String nome, String role) {
        if (ROLE_ADMIN.equals(normalizarRole(role))) {
            return true;
        }

        return USUARIOS_AUTORIZADOS_HISTORICO_OBSERVACOES.contains(primeiroNomeNormalizado(nome));
    }

    public static String normalizarRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return ROLE_FUNCIONARIO;
        }

        return role.trim().toUpperCase(Locale.ROOT);
    }

    private static String primeiroNomeNormalizado(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            return "";
        }

        String primeiroNome = nome.trim().split("\\s+")[0];
        return Normalizer.normalize(primeiroNome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
