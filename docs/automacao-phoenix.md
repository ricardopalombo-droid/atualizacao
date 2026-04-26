# Automacao Phoenix

Esta ponte reaproveita o `cadastros_final.py` que ja funciona no Phoenix, mas troca a origem dos dados:

- antes: planilha Excel
- agora: cadastro finalizado no site

## Como funciona

1. O cliente finaliza o cadastro do funcionario no site.
2. O runner local faz login no site com o usuario `client_user`.
3. O runner chama `GET /api/cadastros/phoenix?id=<employeeId>`.
4. O site devolve um payload estruturado e um dicionario `legacyColumns`.
5. O runner importa o `cadastros_final.py` existente e chama:
   - `ativar_janela_contmatic()`
   - `abrir_rotina_uma_vez()`
   - `preencher_sistema(legacyColumns, empresa_habilitada, empresa_rateio)`

## Endpoint novo

`GET /api/cadastros/phoenix?id=<employeeId>`

Regras:

- exige login
- exige `client_user`
- exige que o cadastro esteja `finalizado` ou `exportado`
- respeita o `client_id` do usuario logado

## Runner local

Arquivo:

- `automacao-phoenix/phoenix_bridge_runner.py`

Dependencia:

- `requests`

Instalacao:

```bash
pip install -r automacao-phoenix/requirements.txt
```

Exemplo de uso:

```bash
python automacao-phoenix/phoenix_bridge_runner.py ^
  --base-url https://www.palsys.com.br ^
  --email cliente@empresa.com.br ^
  --password SUA_SENHA ^
  --employee-id UUID_DO_FUNCIONARIO ^
  --legacy-script "C:\Ricardo\Recibos\programas\Planilha funcionarios\Import1\cadastros_final.py" ^
  --empresa-habilitada S ^
  --empresa-rateio N ^
  --overrides-file automacao-phoenix/sample-overrides.json
```

## Campos com maior chance de override por empresa

Os campos abaixo ja foram deixados como `override` opcional porque tendem a ser mais ligados ao ambiente/configuracao da empresa do que ao funcionario:

- `DG`
- `DI`
- `DJ`
- `DK`
- `DH`

Se o seu `cadastros_final.py` depender de valores fixos para esses pontos, preencha o JSON de overrides.

## O que esta pronto nesta primeira ponte

- autenticacao no site
- busca de cadastro finalizado
- conversao para o formato legado esperado pelo robô
- reuso do `preencher_sistema(...)`

## O que provavelmente ainda vamos calibrar

- alguns codigos especificos de lookup no Phoenix
- cliques especiais com `Ctrl + Enter`
- campos que no seu ambiente dependem de sequencia diferente
- possiveis overrides por cliente/empresa

## Proximo passo recomendado

Fazer um teste com 1 funcionario finalizado e comparar:

- o payload vindo do endpoint
- o que o `cadastros_final.py` espera nas colunas legadas
- os pontos de clique e listas do Phoenix no seu ambiente atual
