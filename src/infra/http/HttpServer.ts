export default interface HttpServer {
	// Requisito 4: a query string é o quarto argumento, para o GET /invoices
	// ler month, year, type e format sem o Express sair da infraestrutura.
	// callback(params, body, headers, query)
	on (method: string, url: string, callback: Function): void;
	listen (port: number): void;
}
