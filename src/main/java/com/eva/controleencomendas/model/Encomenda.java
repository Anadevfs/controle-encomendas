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
    private String urlFoto;

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
    public String getUrlFoto() { return urlFoto; }
    public void setUrlFoto(String urlFoto) { this.urlFoto = urlFoto; }
    public String getLinkWhatsapp() { return linkWhatsapp; }
    public void setLinkWhatsapp(String linkWhatsapp) { this.linkWhatsapp = linkWhatsapp; }
}