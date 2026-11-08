import ContractRepository from "../repository/ContractRepository";
import Mediator from "../mediator/Mediator";
import PresenterFactory from "../presenter/PresenterFactory";
import { Output } from "../presenter/Presenter";
import Usecase from "./Usecase";

export type { Output };

export default class GenerateInvoices implements Usecase {

	constructor (
		readonly contractRepository: ContractRepository,
		readonly presenterFactory: PresenterFactory,
		readonly mediator: Mediator
	) {
	}

	async execute (input: Input): Promise<any> {
		const presenter = this.presenterFactory.create(input.format);
		const output: Output[] = [];
		const contracts = await this.contractRepository.list();
		for (const contract of contracts) {
			const invoices = contract.generateInvoices(input.month, input.year, input.type);
			for (const invoice of invoices) {
				output.push({ date: invoice.date, amount: invoice.amount });
			}
		}
		await this.mediator.publish("InvoicesGenerated", output);
		return presenter.present(output);
	}
}

type Input = {
	month: number,
	year: number,
	type: string,
	format?: string
}
