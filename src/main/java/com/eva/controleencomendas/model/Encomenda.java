package com.eva.controleencomendas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // Muitas encomendas para o mesmo cliente
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    private String descricao;
    private String status;
    private LocalDateTime dataRecebimento;
    private LocalDateTime dataEntrega;
    private String urlFoto;
    private String recebidoPor;
    private String marcadoEnviadoPor;
    private String observacao;

    // maquininha de Bip
    private String codigoRastreio;

    @Transient
    private String linkWhatsapp;

    public Encomenda() {
        this.dataRecebimento = LocalDateTime.now();
        this.status = "Pendente";
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getDataRecebimento() { return dataRecebimento; }
    public void setDataRecebimento(LocalDateTime dataRecebimento) { this.dataRecebimento = dataRecebimento; }
    public LocalDateTime getDataEntrega() { return dataEntrega; }
    public void setDataEntrega(LocalDateTime dataEntrega) { this.dataEntrega = dataEntrega; }
    public String getUrlFoto() { return urlFoto; }
    public void setUrlFoto(String urlFoto) { this.urlFoto = urlFoto; }
    public String getRecebidoPor() { return recebidoPor; }
    public void setRecebidoPor(String recebidoPor) { this.recebidoPor = recebidoPor; }
    public String getMarcadoEnviadoPor() { return marcadoEnviadoPor; }
    public void setMarcadoEnviadoPor(String marcadoEnviadoPor) { this.marcadoEnviadoPor = marcadoEnviadoPor; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public String getLinkWhatsapp() { return linkWhatsapp; }
    public void setLinkWhatsapp(String linkWhatsapp) { this.linkWhatsapp = linkWhatsapp; }
    public String getCodigoRastreio() { return codigoRastreio; }
    public void setCodigoRastreio(String codigoRastreio) { this.codigoRastreio = codigoRastreio; }
}
