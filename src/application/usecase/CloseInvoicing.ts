// Requisito 1: orquestra o fechamento e reusa contract.generateInvoices.
// A resposta é o lote desta execução, não uma releitura do banco.
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
		// Requisito 3: format inválido lança Invalid format aqui, antes de qualquer escrita.
		const presenter = this.presenterFactory.create(input.format);
		const output: Output[] = [];
		const invoices: InvoiceEntry[] = [];
		const contracts = await this.contractRepository.list();
		for (const contract of contracts) {
			const generated = contract.generateInvoices(input.month, input.year, input.type);
			for (const invoice of generated) {
				output.push({ date: invoice.date, amount: invoice.amount });
				// Requisito 1: o vínculo com o contrato segue até a porta; o domínio permanece igual.
				invoices.push({ idContract: contract.idContract, date: invoice.date, amount: invoice.amount });
			}
		}
		// Requisito 2: a substituição atômica fica no repositório, não neste caso de uso.
		await this.invoiceRepository.replacePeriod(input.month, input.year, input.type, invoices);
		const total = output.reduce((sum, invoice) => sum + invoice.amount, 0);
		// Requisito 5: resumo do fechamento. invoices é a quantidade e total é a soma.
		// O SendEmail registrado no main.ts imprime este objeto a cada fechamento.
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
