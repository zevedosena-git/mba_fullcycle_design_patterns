// Requisito 3: o tipo passou a viver na porta. O present continua devolvendo o array, sem envelope.
import Presenter, { Output } from "../../application/presenter/Presenter";

export default class JsonPresenter implements Presenter {

	present(output: Output[]): any {
		return output;
	}

}
