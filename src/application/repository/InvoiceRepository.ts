// Requisito 1: porta das faturas. idContract viaja aqui porque o Invoice de domínio
// não guarda o contrato; o pareamento é feito no caso de uso, contrato a contrato.
// replacePeriod substitui o período e o regime por inteiro (requisito 2).
// listByPeriod alimenta o GET /invoices (requisito 4).
export type InvoiceEntry = {
	idContract: string,
	date: Date,
	amount: number
}

export type InvoiceView = {
	date: Date,
	amount: number
}

export default interface InvoiceRepository {
	replacePeriod (month: number, year: number, type: string, invoices: InvoiceEntry[]): Promise<void>;
	listByPeriod (month: number, year: number, type: string): Promise<InvoiceView[]>;
}
