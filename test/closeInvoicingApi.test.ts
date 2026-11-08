import axios from "axios";

test("Deve fechar a competência pela api e consultar em seguida", async function () {
	const input = {
		month: 1,
		year: 2022,
		type: "accrual"
	}
	const expected = [{ date: "2022-01-01T13:00:00.000Z", amount: 500 }];
	const closeResponse = await axios.post("http://localhost:3000/close_invoicing", input);
	expect(closeResponse.data).toEqual(expected);
	const queryResponse = await axios.get("http://localhost:3000/invoices", { params: input });
	expect(queryResponse.data).toEqual(expected);
	await axios.post("http://localhost:3000/close_invoicing", input);
	const reprocessedResponse = await axios.get("http://localhost:3000/invoices", { params: input });
	expect(reprocessedResponse.data).toEqual(expected);
});

test("Deve fechar o caixa em csv pela api e consultar em csv", async function () {
	const input = {
		month: 1,
		year: 2022,
		type: "cash",
		format: "csv"
	}
	const closeResponse = await axios.post("http://localhost:3000/close_invoicing", input);
	expect(closeResponse.data).toBe("2022-01-05;6000");
	const queryResponse = await axios.get("http://localhost:3000/invoices", { params: input });
	expect(queryResponse.data).toBe("2022-01-05;6000");
});
