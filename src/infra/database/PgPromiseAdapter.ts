import DatabaseConnection from "./DatabaseConnection";
import pgp from "pg-promise";

export default class PgPromiseAdapter implements DatabaseConnection {
	connection: any;

	constructor () {
		this.connection = pgp()("postgres://postgres:123456@localhost:5432/app");
	}

	query(statement: string, params: any): Promise<any> {
		return this.connection.query(statement, params);
	}

	transaction<T>(work: (connection: DatabaseConnection) => Promise<T>): Promise<T> {
		return this.connection.tx(async (t: any) => {
			const transactionalConnection: DatabaseConnection = {
				query (statement: string, params: any): Promise<any> {
					return t.query(statement, params);
				},
				close (): Promise<void> {
					return Promise.resolve();
				},
				// A conexão do tx também cumpre a porta, sem abrir outra transação.
				transaction <R>(inner: (connection: DatabaseConnection) => Promise<R>): Promise<R> {
					return inner(transactionalConnection);
				}
			};
			return work(transactionalConnection);
		});
	}

	close(): Promise<void> {
		return this.connection.$pool.end();
	}

}