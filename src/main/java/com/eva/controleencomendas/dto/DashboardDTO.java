package com.eva.controleencomendas.dto;

public class DashboardDTO {
    private long total;
    private long pendentes;
    private long entregues;

    public DashboardDTO(long total, long pendentes, long entregues) {
        this.total = total;
        this.pendentes = pendentes;
        this.entregues = entregues;
    }
    // Getters
    public long getTotal() { return total; }
    public long getPendentes() { return pendentes; }
    public long getEntregues() { return entregues; }
}