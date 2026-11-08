import PresenterFactory from "../presenter/PresenterFactory";
import InvoiceRepository from "../repository/InvoiceRepository";
import Usecase from "./Usecase";

export default class GetInvoices implements Usecase {

	constructor (
		readonly invoiceRepository: InvoiceRepository,
		readonly presenterFactory: PresenterFactory
	) {
	}

	async execute (input: Input): Promise<any> {
		const presenter = this.presenterFactory.create(input.format);
		// A query string entrega month e year como texto.
		const month = Number(input.month);
		const year = Number(input.year);
		const invoices = await this.invoiceRepository.listByPeriod(month, year, input.type);
		return presenter.present(invoices);
	}
}

type Input = {
	month: number | string,
	year: number | string,
	type: string,
	format?: string
}
