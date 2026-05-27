package com.eva.controleencomendas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "encomenda_observacao_auditoria")
public class EncomendaObservacaoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "encomenda_id", nullable = false)
    @JsonIgnore
    private Encomenda encomenda;

    @Column(nullable = false, length = 120)
    private String usuario;

    @Column(length = 1000)
    private String valorAntigo;

    @Column(length = 1000)
    private String valorNovo;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false, length = 40)
    private String acao;

    public EncomendaObservacaoAuditoria() {
    }

    public EncomendaObservacaoAuditoria(
            Encomenda encomenda,
            String usuario,
            String valorAntigo,
            String valorNovo,
            LocalDateTime dataHora,
            String acao) {
        this.encomenda = encomenda;
        this.usuario = usuario;
        this.valorAntigo = valorAntigo;
        this.valorNovo = valorNovo;
        this.dataHora = dataHora;
        this.acao = acao;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Encomenda getEncomenda() { return encomenda; }
    public void setEncomenda(Encomenda encomenda) { this.encomenda = encomenda; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public String getValorAntigo() { return valorAntigo; }
    public void setValorAntigo(String valorAntigo) { this.valorAntigo = valorAntigo; }
    public String getValorNovo() { return valorNovo; }
    public void setValorNovo(String valorNovo) { this.valorNovo = valorNovo; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }
}
