package com.eva.controleencomendas;

import com.eva.controleencomendas.model.Cliente;
import com.eva.controleencomendas.model.Usuario;
import com.eva.controleencomendas.repository.ClienteRepository;
import com.eva.controleencomendas.repository.UsuarioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.InputStream;
import java.util.List;

@SpringBootApplication
public class ControleEncomendasApplication {

	public static void main(String[] args) {
		SpringApplication.run(ControleEncomendasApplication.class, args);
	}

	@Bean
	CommandLineRunner runner(ClienteRepository clienteRepo, UsuarioRepository usuarioRepo) {
		return args -> {
			// 1 Criar usuário admin para o login se a tabela estiver vazia
			if (usuarioRepo.count() == 0) {
				Usuario admin = new Usuario();
				admin.setNome("Porteiro Padrão");
				admin.setUsername("admin");
				admin.setSenha("123");
				usuarioRepo.save(admin);
				System.out.println("USUÁRIO ADMIN CRIADO (user: admin / senha: 123)");
			}

			// 2 Importar clientes do JSON se a tabela estiver vazia
			if (clienteRepo.count() == 0) {
				ObjectMapper mapper = new ObjectMapper();
				TypeReference<List<Cliente>> typeReference = new TypeReference<List<Cliente>>(){};
				InputStream inputStream = TypeReference.class.getResourceAsStream("/clientes.json");
				try {
					List<Cliente> clientes = mapper.readValue(inputStream, typeReference);
					clienteRepo.saveAll(clientes);
					System.out.println("SUCESSO: Clientes importados com êxito!");
				} catch (Exception e) {
					System.out.println("ERRO: Não foi possível importar os clientes: " + e.getMessage());
				}
			} else {
				System.out.println("INFO: Clientes já existem no banco, pulando importação.");
			}
		};
	}
}