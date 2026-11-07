// Requisito 3: molde da InvoiceGenerationFactory.
// Ausência ou "json" devolve JSON; "csv" devolve CSV; outro valor lança Invalid format
// antes de o fechamento apagar ou gravar qualquer fatura.
import PresenterFactoryPort from "../../application/presenter/PresenterFactory";
import Presenter from "../../application/presenter/Presenter";
import CsvPresenter from "./CsvPresenter";
import JsonPresenter from "./JsonPresenter";

export default class PresenterFactory implements PresenterFactoryPort {

	create (format?: string): Presenter {
		if (format === undefined || format === "json") {
			return new JsonPresenter();
		}
		if (format === "csv") {
			return new CsvPresenter();
		}
		throw new Error("Invalid format");
	}
}
