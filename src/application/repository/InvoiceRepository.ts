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
