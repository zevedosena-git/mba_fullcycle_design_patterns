export default interface DatabaseConnection {
	query (statement: string, params: any): Promise<any>;
	close (): Promise<void>;
	// Requisito 2: Unit of Work. O caso de uso não vê esta porta;
	// o repositório de faturas troca o período inteiro dentro de transaction.
	transaction <T>(work: (connection: DatabaseConnection) => Promise<T>): Promise<T>;
}
