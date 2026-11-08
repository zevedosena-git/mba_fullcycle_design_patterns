# Fechamento de faturamento

O `POST /generate_invoices` continua sendo a simulação: calcula as faturas e não grava. O `POST /close_invoicing` calcula o mesmo período e grava em `branas.invoice`. O `GET /invoices` lê o que foi fechado.

A transação do fechamento vive em `InvoiceDatabaseRepository.replacePeriod`. Esse método abre uma única `transaction` na porta `DatabaseConnection`, implementada com `tx` do pg-promise: apaga as faturas daquele mês, ano e regime e insere as novas. Commit no fim; qualquer erro desfaz o lote inteiro. O teste `Deve desfazer o lote quando a segunda fatura viola a FK` (em `test/CloseInvoicing.test.ts`) fecha a competência de janeiro de 2022 e, em seguida, executa o `CloseInvoicing` com um repositório de contratos falso que devolve o contrato do seed e um contrato inexistente: a primeira inserção do lote passa e a segunda quebra a chave estrangeira. A fatura de 500 do fechamento anterior permanece, nenhuma linha do lote que falhou fica no banco e o evento `InvoicesClosed` não é publicado.

O fechamento de ponta a ponta via HTTP está em `test/closeInvoicingApi.test.ts` e, como o `api.test.ts`, exige a API no ar. A suíte roda com `maxWorkers: 1` (em `jest.config.js`) porque vários testes fecham o mesmo período no mesmo banco.

Se recriar o schema com a API no ar, reinicie a API antes de continuar. Um pool aberto antes do reseed pode pendurar as requisições.

## Banco

PostgreSQL local, usuário `postgres`, senha `123456`, banco `app`. A connection string está em `src/infra/database/PgPromiseAdapter.ts`. A criação da extensão `uuid-ossp` exige superusuário.

```bash
psql -U postgres -c "drop database if exists app;"
psql -U postgres -c "create database app;"
psql -U postgres -d app -v ON_ERROR_STOP=1 -f create.sql
```

`DROP` e `CREATE DATABASE` vão em comandos separados. Rodar o `create.sql` de novo também termina sem erro.

## API e testes

```bash
npm install
TZ=America/Sao_Paulo npx ts-node src/main.ts
```

A API sobe na porta 3000. Em outro terminal, com a API no ar:

```bash
TZ=America/Sao_Paulo npx jest
```

As datas da suíte e das respostas HTTP assumem `TZ=America/Sao_Paulo`.

## Roteiro

```bash
curl -s -X POST http://localhost:3000/close_invoicing -H 'Content-Type: application/json' -d '{"month":1,"year":2022,"type":"accrual"}'
curl -s "http://localhost:3000/invoices?month=1&year=2022&type=accrual"
curl -s -X POST http://localhost:3000/close_invoicing -H 'Content-Type: application/json' -d '{"month":1,"year":2022,"type":"cash","format":"csv"}'
curl -s "http://localhost:3000/invoices?month=1&year=2022&type=cash&format=csv"
curl -s "http://localhost:3000/invoices?month=3&year=2023&type=cash"
curl -s -X POST http://localhost:3000/generate_invoices -H 'Content-Type: application/json' -d '{"month":1,"year":2022,"type":"accrual","format":"csv"}'
```

No terminal da API, cada fechamento imprime o resumo `{ month, year, type, invoices, total }` pelo `SendEmail`.
