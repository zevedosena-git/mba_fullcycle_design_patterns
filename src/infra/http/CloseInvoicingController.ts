import Usecase from "../../application/usecase/Usecase";
import HttpServer from "./HttpServer";

export default class CloseInvoicingController {

	constructor (readonly httpServer: HttpServer, readonly usecase: Usecase) {
		// Requisito 1: o body traz month, year, type e format opcional.
		// A resposta é a lista gravada naquele fechamento.
		httpServer.on("post", "/close_invoicing", async function (params: any, body: any, headers: any) {
			const input = body;
			body.userAgent = headers["user-agent"];
			body.host = headers.host;
			const output = await usecase.execute(input);
			return output;
		});
	}
}
