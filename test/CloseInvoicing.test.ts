// Requisito 6: persistência, reprocessamento sem duplicar, CSV do fechamento,
// format inválido antes da escrita, e rollback com o fechamento anterior intacto.
import CloseInvoicing from "../src/application/usecase/CloseInvoicing";
import GenerateInvoices from "../src/application/usecase/GenerateInvoices";
import GetInvoices from "../src/application/usecase/GetInvoices";
import ContractRepository from "../src/application/repository/ContractRepository";
import InvoiceRepository from "../src/application/repository/InvoiceRepository";
import DatabaseConnection from "../src/infra/database/DatabaseConnection";
import PgPromiseAdapter from "../src/infra/database/PgPromiseAdapter";
import ContractDatabaseRepository from "../src/infra/repository/ContractDatabaseRepository";
import InvoiceDatabaseRepository from "../src/infra/repository/InvoiceDatabaseRepository";
import Mediator from "../src/infra/mediator/Mediator";
import PresenterFactory from "../src/infra/presenter/PresenterFactory";

const contractId = "4224a279-c162-4283-86f5-1095f559b08c";

let connection: DatabaseConnection;
let contractRepository: ContractRepository;
let invoiceRepository: InvoiceRepository;
let closeInvoicing: CloseInvoicing;
let getInvoices: GetInvoices;
let mediator: Mediator;
let closed: any[];

beforeEach(() => {
	connection = new PgPromiseAdapter();
	contractRepository = new ContractDatabaseRepository(connection);
	invoiceRepository = new InvoiceDatabaseRepository(connection);
	mediator = new Mediator();
	closed = [];
	mediator.on("InvoicesClosed", async (data: any) => {
		closed.push(data);
	});
	const presenterFactory = new PresenterFactory();
	closeInvoicing = new CloseInvoicing(contractRepository, invoiceRepository, presenterFactory, mediator);
	getInvoices = new GetInvoices(invoiceRepository, presenterFactory);
});

afterEach(async () => {
	await connection.close();
});

test("Deve fechar a competência de janeiro de 2022", async function () {
	const output = await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	expect(output).toEqual([{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }]);
	const rows = await connection.query("select id_contract, amount from branas.invoice where month = 1 and year = 2022 and type = 'accrual'", []);
	expect(rows).toHaveLength(1);
	expect(rows[0].id_contract).toBe(contractId);
	expect(parseFloat(rows[0].amount)).toBe(500);
	expect(closed).toEqual([{ month: 1, year: 2022, type: "accrual", invoices: 1, total: 500 }]);
});

test("Deve fechar o caixa de janeiro de 2022", async function () {
	const output = await closeInvoicing.execute({ month: 1, year: 2022, type: "cash" });
	expect(output).toEqual([{ date: new Date("2022-01-05T13:00:00.000Z"), amount: 6000 }]);
});

test("Deve fechar período sem faturas", async function () {
	const output = await closeInvoicing.execute({ month: 3, year: 2023, type: "cash" });
	expect(output).toEqual([]);
	expect(await invoiceRepository.listByPeriod(3, 2023, "cash")).toEqual([]);
	expect(closed).toEqual([{ month: 3, year: 2023, type: "cash", invoices: 0, total: 0 }]);
});

test("Deve lançar Invalid type sem apagar o fechamento anterior", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	closed = [];
	await expect(closeInvoicing.execute({ month: 1, year: 2022, type: "weekly" })).rejects.toThrow("Invalid type");
	const stored = await invoiceRepository.listByPeriod(1, 2022, "accrual");
	expect(stored).toEqual([{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }]);
	expect(closed).toHaveLength(0);
});

test("Deve lançar Invalid format antes de alterar o período", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	closed = [];
	await expect(closeInvoicing.execute({ month: 1, year: 2022, type: "accrual", format: "xml" })).rejects.toThrow("Invalid format");
	const stored = await invoiceRepository.listByPeriod(1, 2022, "accrual");
	expect(stored).toEqual([{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }]);
	expect(closed).toHaveLength(0);
});

test("Deve responder csv no fechamento", async function () {
	const output = await closeInvoicing.execute({ month: 1, year: 2022, type: "cash", format: "csv" });
	expect(output).toBe("2022-01-05;6000");
});

test("Deve responder json explícito como o formato ausente", async function () {
	const plain = await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	const json = await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual", format: "json" });
	expect(json).toEqual(plain);
});

test("Deve substituir o fechamento ao reprocessar", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	const stored = await invoiceRepository.listByPeriod(1, 2022, "accrual");
	expect(stored).toHaveLength(1);
	expect(stored[0].amount).toBe(500);
});

test("Deve manter caixa e competência do mesmo mês", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	await closeInvoicing.execute({ month: 1, year: 2022, type: "cash" });
	const accrual = await invoiceRepository.listByPeriod(1, 2022, "accrual");
	const cash = await invoiceRepository.listByPeriod(1, 2022, "cash");
	expect(accrual).toHaveLength(1);
	expect(accrual[0].amount).toBe(500);
	expect(cash).toHaveLength(1);
	expect(cash[0].amount).toBe(6000);
});

test("Deve desfazer o lote quando a segunda fatura viola a FK", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	await expect(invoiceRepository.replacePeriod(1, 2022, "accrual", [
		{ idContract: contractId, date: new Date("2022-01-02T13:00:00Z"), amount: 1 },
		{ idContract: "00000000-0000-0000-0000-000000000000", date: new Date("2022-01-03T13:00:00Z"), amount: 2 }
	])).rejects.toThrow();
	const stored = await invoiceRepository.listByPeriod(1, 2022, "accrual");
	expect(stored).toEqual([{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }]);
});

test("Deve consultar o período fechado e um período vazio", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	const output = await getInvoices.execute({ month: "1", year: "2022", type: "accrual" });
	expect(output).toEqual([{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }]);
	const empty = await getInvoices.execute({ month: "3", year: "2023", type: "cash" });
	expect(empty).toEqual([]);
});

test("Deve consultar o caixa fechado em csv", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "cash" });
	const output = await getInvoices.execute({ month: "1", year: "2022", type: "cash", format: "csv" });
	expect(output).toBe("2022-01-05;6000");
});

test("Simulação csv não persiste", async function () {
	await closeInvoicing.execute({ month: 1, year: 2022, type: "accrual" });
	const generateInvoices = new GenerateInvoices(contractRepository, new PresenterFactory(), new Mediator());
	const output = await generateInvoices.execute({ month: 1, year: 2022, type: "accrual", format: "csv" });
	expect(output).toBe("2022-01-01;500");
	expect(await invoiceRepository.listByPeriod(1, 2022, "accrual")).toHaveLength(1);
});
