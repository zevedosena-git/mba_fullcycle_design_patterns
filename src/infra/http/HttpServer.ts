export default interface HttpServer {
	// callback(params, body, headers, query): a query string chega como quarto argumento.
	on (method: string, url: string, callback: Function): void;
	listen (port: number): void;
}
