import axios from "axios";
import ExpressAdapter from "../src/infra/http/ExpressAdapter";

test("Deve devolver texto puro e a query string", async function () {
	const httpServer = new ExpressAdapter();
	httpServer.on("post", "/csv", async function () {
		return "2022-01-05;6000";
	});
	httpServer.on("get", "/json", async function () {
		return [{ amount: 6000 }];
	});
	httpServer.on("get", "/query", async function (params: any, body: any, headers: any, query: any) {
		return query;
	});
	const server = httpServer.app.listen(0);
	const address = server.address();
	const port = typeof address === "object" && address ? address.port : 0;
	try {
		const csv = await axios.post(`http://127.0.0.1:${port}/csv`);
		expect(csv.data).toBe("2022-01-05;6000");
		expect(String(csv.headers["content-type"])).toContain("text/plain");
		const json = await axios.get(`http://127.0.0.1:${port}/json`);
		expect(json.data).toEqual([{ amount: 6000 }]);
		const query = await axios.get(`http://127.0.0.1:${port}/query`, { params: { month: 1, year: 2022, type: "accrual" } });
		expect(query.data).toMatchObject({ month: "1", year: "2022", type: "accrual" });
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error: Error | undefined) => error ? reject(error) : resolve());
		});
	}
});
