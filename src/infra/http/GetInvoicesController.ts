import Usecase from "../../application/usecase/Usecase";
import HttpServer from "./HttpServer";

export default class GetInvoicesController {

	constructor (readonly httpServer: HttpServer, readonly usecase: Usecase) {
		// Requisito 4: month, year, type e format opcional chegam na query string.
		httpServer.on("get", "/invoices", async function (params: any, body: any, headers: any, query: any) {
			const output = await usecase.execute(query);
			return output;
		});
	}
}