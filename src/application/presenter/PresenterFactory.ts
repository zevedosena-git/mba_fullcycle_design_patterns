// Requisito 3: o caso de uso pede o presenter pelo format e não escolhe a classe concreta.
// Um formato novo entra na implementação, sem alterar os casos de uso.
import Presenter from "./Presenter";

export default interface PresenterFactory {
	create (format?: string): Presenter;
}
