export type Output = {
	date: Date,
	amount: number
}

export default interface Presenter {
	present (output: Output[]): any;
}
