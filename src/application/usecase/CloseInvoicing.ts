import Mediator from "../mediator/Mediator";
import PresenterFactory from "../presenter/PresenterFactory";
import { Output } from "../presenter/Presenter";
import ContractRepository from "../repository/ContractRepository";
import InvoiceRepository, { InvoiceEntry } from "../repository/InvoiceRepository";
import Usecase from "./Usecase";

export default class CloseInvoicing implements Usecase {

	constructor (
		readonly contractRepository: ContractRepository,
		readonly invoiceRepository: InvoiceRepository,
		readonly presenterFactory: PresenterFactory,
		readonly mediator: Mediator
	) {
	}

	async execute (input: Input): Promise<any> {
		const presenter = this.presenterFactory.create(input.format);
		const output: Output[] = [];
		const invoices: InvoiceEntry[] = [];
		const contracts = await this.contractRepository.list();
		for (const contract of contracts) {
			const generated = contract.generateInvoices(input.month, input.year, input.type);
			for (const invoice of generated) {
				output.push({ date: invoice.date, amount: invoice.amount });
				invoices.push({ idContract: contract.idContract, date: invoice.date, amount: invoice.amount });
			}
		}
		await this.invoiceRepository.replacePeriod(input.month, input.year, input.type, invoices);
		const total = output.reduce((sum, invoice) => sum + invoice.amount, 0);
		await this.mediator.publish("InvoicesClosed", {
			month: input.month,
			year: input.year,
			type: input.type,
			invoices: output.length,
			total
		});
		return presenter.present(output);
	}
}

type Input = {
	month: number,
	year: number,
	type: string,
	format?: string
}
