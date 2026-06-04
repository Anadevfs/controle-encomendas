package com.eva.controleencomendas.dto;

import com.eva.controleencomendas.model.Usuario;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Locale;

public record UsuarioResponseDTO(
        Long id,
        String username,
        String nome,
        String role,
        @JsonProperty("isAdmin") boolean isAdmin,
        @JsonProperty("canViewHistory") boolean canViewHistory,
        @JsonProperty("canViewObservationHistory") boolean canViewObservationHistory
) {
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_FUNCIONARIO = "ROLE_FUNCIONARIO";
    private static final String ANA_USERNAME = "ana@eva.com";

    public static UsuarioResponseDTO from(Usuario usuario) {
        String role = normalizarRole(usuario.getRole());
        boolean admin = isAdmin(role);
        boolean podeVerHistoricoObservacoes = podeVerHistoricoObservacoes(usuario);
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNome(),
                role,
                admin,
                admin,
                podeVerHistoricoObservacoes
        );
    }

    public static boolean podeVerHistoricoObservacoes(Usuario usuario) {
        if (usuario == null) {
            return false;
        }

        if (isAdmin(usuario.getRole())) {
            return true;
        }

        return usuario.isCanViewObservationHistory();
    }

    public static boolean podeVerHistoricoObservacoes(String role) {
        return isAdmin(role);
    }

    public static boolean isAna(String username) {
        return username != null && ANA_USERNAME.equalsIgnoreCase(username.trim());
    }

    public static boolean isAdmin(String role) {
        return ROLE_ADMIN.equals(normalizarRole(role));
    }

    public static String normalizarRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return ROLE_FUNCIONARIO;
        }

        return role.trim().toUpperCase(Locale.ROOT);
    }
}
