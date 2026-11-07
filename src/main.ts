import CloseInvoicing from "./application/usecase/CloseInvoicing";
import GenerateInvoices from "./application/usecase/GenerateInvoices";
import GetInvoices from "./application/usecase/GetInvoices";
import LoggerDecorator from "./application/decorator/LoggerDecorator";
import SendEmail from "./application/usecase/SendEmail";
import PgPromiseAdapter from "./infra/database/PgPromiseAdapter";
import CloseInvoicingController from "./infra/http/CloseInvoicingController";
import ExpressAdapter from "./infra/http/ExpressAdapter";
import GetInvoicesController from "./infra/http/GetInvoicesController";
import MainController from "./infra/http/MainController";
import Mediator from "./infra/mediator/Mediator";
import PresenterFactory from "./infra/presenter/PresenterFactory";
import ContractDatabaseRepository from "./infra/repository/ContractDatabaseRepository";
import InvoiceDatabaseRepository from "./infra/repository/InvoiceDatabaseRepository";

const connection = new PgPromiseAdapter();
const contractRepository = new ContractDatabaseRepository(connection);
// Requisito 1: o repositório de faturas usa a mesma connection dos contratos.
const invoiceRepository = new InvoiceDatabaseRepository(connection);
const mediator = new Mediator();
const sendEmail = new SendEmail();
mediator.on("InvoicesGenerated", async function (data: any) {
	await sendEmail.execute(data);
});
// Requisito 5: o fechamento usa o mesmo stub de console já registrado em InvoicesGenerated.
mediator.on("InvoicesClosed", async function (data: any) {
	await sendEmail.execute(data);
});
// Requisito 3: uma factory para simulação, fechamento e consulta.
const presenterFactory = new PresenterFactory();
const generateInvoices = new LoggerDecorator(new GenerateInvoices(contractRepository, presenterFactory, mediator));
// Requisito 1: o fechamento entra no composition root com LoggerDecorator, como a simulação.
const closeInvoicing = new LoggerDecorator(new CloseInvoicing(contractRepository, invoiceRepository, presenterFactory, mediator));
const getInvoices = new GetInvoices(invoiceRepository, presenterFactory);
const httpServer = new ExpressAdapter();
new MainController(httpServer, generateInvoices);
// Requisito 1 e 4: POST /close_invoicing e GET /invoices.
new CloseInvoicingController(httpServer, closeInvoicing);
new GetInvoicesController(httpServer, getInvoices);
httpServer.listen(3000);
