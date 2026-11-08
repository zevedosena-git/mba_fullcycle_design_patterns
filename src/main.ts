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
const invoiceRepository = new InvoiceDatabaseRepository(connection);
const mediator = new Mediator();
const sendEmail = new SendEmail();
mediator.on("InvoicesGenerated", async function (data: any) {
	await sendEmail.execute(data);
});
mediator.on("InvoicesClosed", async function (data: any) {
	await sendEmail.execute(data);
});
const presenterFactory = new PresenterFactory();
const generateInvoices = new LoggerDecorator(new GenerateInvoices(contractRepository, presenterFactory, mediator));
const closeInvoicing = new LoggerDecorator(new CloseInvoicing(contractRepository, invoiceRepository, presenterFactory, mediator));
const getInvoices = new GetInvoices(invoiceRepository, presenterFactory);
const httpServer = new ExpressAdapter();
new MainController(httpServer, generateInvoices);
new CloseInvoicingController(httpServer, closeInvoicing);
new GetInvoicesController(httpServer, getInvoices);
httpServer.listen(3000);
