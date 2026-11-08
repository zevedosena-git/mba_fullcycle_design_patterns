import PresenterFactory from "../src/infra/presenter/PresenterFactory";
import CsvPresenter from "../src/infra/presenter/CsvPresenter";
import JsonPresenter from "../src/infra/presenter/JsonPresenter";

test("Deve resolver json, ausência de format e csv", function () {
	const factory = new PresenterFactory();
	const output = [{ date: new Date("2022-01-01T13:00:00.000Z"), amount: 500 }];
	expect(factory.create("json")).toBeInstanceOf(JsonPresenter);
	expect(factory.create()).toBeInstanceOf(JsonPresenter);
	expect(factory.create("csv")).toBeInstanceOf(CsvPresenter);
	expect(factory.create().present(output)).toEqual(output);
	expect(factory.create("json").present(output)).toEqual(factory.create().present(output));
	expect(factory.create("csv").present(output)).toBe("2022-01-01;500");
});

test("Deve lançar Invalid format para formato desconhecido", function () {
	const factory = new PresenterFactory();
	expect(() => factory.create("xml")).toThrow("Invalid format");
});
