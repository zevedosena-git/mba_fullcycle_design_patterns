// Requisito 3: o Output saiu de GenerateInvoices para esta porta servir
// simulação, fechamento e consulta com o mesmo contrato { date, amount }.
export type Output = {
	date: Date,
	amount: number
}

export default interface Presenter {
	present (output: Output[]): any;
}
