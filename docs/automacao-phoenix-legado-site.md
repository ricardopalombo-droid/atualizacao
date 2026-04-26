# Usar o Script Legado com Dados do Site

Este fluxo reaproveita o `cadastros_final.py` original e troca apenas a origem dos dados.

Em vez de:

- ler `Cadastros.xlsx`

ele passa a usar:

- o funcionario finalizado do site PalSys

## Ideia principal

O script legado continua pensando em colunas como:

- `A`
- `B`
- `C`
- `D`
- ...

Mas essas colunas deixam de vir da planilha.

Agora elas sao montadas a partir do cadastro do site.

## Regra de mapeamento

A regra oficial passa a ser:

- olhar o titulo da coluna na linha 4 da planilha original
- procurar no nosso sistema o campo equivalente
- alimentar essa coluna com esse campo

Exemplo:

- `B4 = Nome` -> usar `nome_completo`
- `D4 = Telefone` -> usar `telefone`
- `F4 = Nome da Mãe` -> usar `nome_mae`
- `Y4 = Sindicato Representante` -> usar `sindicato`

## Exemplos do mapeamento

- `B` = `nome_completo`
- `D` = `nome_mae`
- `E` = `nome_pai`
- `H` = `email`
- `I` = `data_nascimento`
- `J` = `pais_origem`
- `K` = `naturalidade`
- `U` = `data_admissao`
- `Y` = `sindicato`
- `AA` = `tipo_contrato`
- `AB` = `salario`
- `AC` = `cargo`
- `AF` = `horario`
- `AQ` = `cpf`
- `DN` = `grau_risco`
- `DO` = `vinculo_empregaticio`
- `DP` = `indicativo_admissao`
- `DQ` = `caged`

## Script

Arquivo:

- `automacao-phoenix/phoenix_legacy_site_runner.py`

## Teste recomendado primeiro

Dentro da pasta `automacao-phoenix`:

```powershell
python .\phoenix_legacy_site_runner.py `
  --base-url https://www.palsys.com.br `
  --email "LOGIN_DO_CLIENTE" `
  --password "SENHA_DO_CLIENTE" `
  --employee-id "UUID_DO_FUNCIONARIO" `
  --legacy-script "C:\Ricardo\Recibos\programas\Planilha funcionarios\Import1\cadastros_final.py" `
  --preview-only `
  --dump-legacy-json .\legacy-columns.json
```

Isso:

- faz login no site
- busca o funcionario finalizado
- monta o dicionario legado
- mostra um preview no terminal
- salva um JSON local para conferencia
- nao dispara o Phoenix

## Execucao real

Depois do preview:

```powershell
python .\phoenix_legacy_site_runner.py `
  --base-url https://www.palsys.com.br `
  --email "LOGIN_DO_CLIENTE" `
  --password "SENHA_DO_CLIENTE" `
  --employee-id "UUID_DO_FUNCIONARIO" `
  --legacy-script "C:\Ricardo\Recibos\programas\Planilha funcionarios\Import1\cadastros_final.py"
```

## Diferenca em relacao ao bridge anterior

Esta versao:

- deixa explicitamente claro o mapeamento `campo do site -> coluna legado`
- remove a configuracao de hotkeys do legado nessa ponte
- ajuda a validar primeiro se as colunas estao corretas antes de disparar a automacao
