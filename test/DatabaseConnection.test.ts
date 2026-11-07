// Requisito 2: falha no meio da transaction desfaz o insert.
import PgPromiseAdapter from "../src/infra/database/PgPromiseAdapter";

test("Deve desfazer a inserção quando a transação lança no meio", async function () {
	const connection = new PgPromiseAdapter();
	const month = 8;
	const year = 2099;
	const type = "probe";
	await connection.query("delete from branas.invoice where month = $1 and year = $2 and type = $3", [month, year, type]);
	await expect(connection.transaction(async (tx) => {
		await tx.query(
			"insert into branas.invoice (id_contract, month, year, type, date, amount) values ($1, $2, $3, $4, $5, $6)",
			["4224a279-c162-4283-86f5-1095f559b08c", month, year, type, new Date("2099-08-01T13:00:00Z"), 500]
		);
		throw new Error("fail");
	})).rejects.toThrow("fail");
	const rows = await connection.query("select * from branas.invoice where month = $1 and year = $2 and type = $3", [month, year, type]);
	expect(rows).toHaveLength(0);
	await connection.close();
});
