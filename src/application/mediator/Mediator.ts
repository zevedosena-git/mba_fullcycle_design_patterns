// Requisito 5: os casos de uso dependem desta porta, só com publish.
// O concreto e o registro dos listeners ficam na infraestrutura, injetados no main.ts.
export default interface Mediator {
	publish (event: string, data: any): Promise<void>;
}
