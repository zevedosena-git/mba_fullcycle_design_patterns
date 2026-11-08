import InvoiceDatabaseRepository from "../src/infra/repository/InvoiceDatabaseRepository";
import PgPromiseAdapter from "../src/infra/database/PgPromiseAdapter";

const contractId = "4224a279-c162-4283-86f5-1095f559b08c";

test("Deve listar por data e substituir o período", async function () {
	const connection = new PgPromiseAdapter();
	const repository = new InvoiceDatabaseRepository(connection);
	const month = 7;
	const year = 2030;
	const type = "accrual";
	await repository.replacePeriod(month, year, type, [
		{ idContract: contractId, date: new Date("2030-07-10T12:00:00Z"), amount: 20 },
		{ idContract: contractId, date: new Date("2030-07-01T12:00:00Z"), amount: 10 }
	]);
	const listed = await repository.listByPeriod(month, year, type);
	expect(listed.map((invoice) => invoice.amount)).toEqual([10, 20]);
	expect(typeof listed[0].amount).toBe("number");
	await repository.replacePeriod(month, year, type, [
		{ idContract: contractId, date: new Date("2030-07-01T12:00:00Z"), amount: 10 }
	]);
	const replaced = await repository.listByPeriod(month, year, type);
	expect(replaced).toHaveLength(1);
	expect(replaced[0].amount).toBe(10);
	await connection.close();
});
