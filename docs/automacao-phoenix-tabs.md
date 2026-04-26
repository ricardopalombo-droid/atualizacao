# Automacao Phoenix por Abas

Esta versao foi reconstruida olhando as telas reais do cadastro de funcionarios do Phoenix.

## Objetivo

Substituir a heranca da planilha por um fluxo novo, orientado por abas:

1. `Dados Cadastrais`
2. `Dados Contratuais`
3. `Dados Oficiais`
4. `Dados Complementares`
5. `Outros`

## Script

Arquivo:

- `automacao-phoenix/phoenix_tabs_runner.py`
- `automacao-phoenix/phoenix-layout.sample.json`

## Como funciona

- faz login no site da PalSys
- busca o funcionario finalizado via `/api/cadastros/phoenix?id=...`
- ativa a janela do Phoenix
- executa a automacao por abas
- usa clique por coordenadas nos campos mais sensiveis do inicio:
  - `CEP`
  - botao `Buscar`
  - `Numero`
  - `Nome Mae`
  - `Nome Pai`
- para em pontos especiais que ainda dependem de ajuste fino manual:
  - historico salarial / forma de pagamento
  - historico de cargos
  - historico de horarios
  - historico de sindicato
  - historico de grau de risco

## Campos especiais mapeados

- `Cidade`, `Naturalidade`, `Pais` e `Pais origem`: pesquisa digitavel
- `Sindicato`: historico com `Ctrl + Enter`
- `Cargo`: historico proprio
- `Horario`: historico proprio
- `Forma de pagamento`: historico salarial
- `Grau de risco`: historico via campo `Ocorrencia`
- `Regime Jornada`, `Tipo Contrato`, `Vinculo Empregaticio`, `Indicativo Admissao` e `CAGED`: lista/combo

## Comando base

Se estiver dentro da pasta `automacao-phoenix`:

```powershell
python .\phoenix_tabs_runner.py `
  --base-url https://www.palsys.com.br `
  --email "LOGIN_DO_CLIENTE" `
  --password "SENHA_DO_CLIENTE" `
  --employee-id "UUID_DO_FUNCIONARIO" `
  --layout-file .\phoenix-layout.sample.json `
  --focus-grace 5

Modo mais simples:

```powershell
python .\phoenix_tabs_runner.py `
  --base-url https://www.palsys.com.br `
  --email "LOGIN_DO_CLIENTE" `
  --password "SENHA_DO_CLIENTE" `
  --employee-id "UUID_DO_FUNCIONARIO" `
  --layout-file .\phoenix-layout.sample.json `
  --startup-delay 5 `
  --focus-grace 5
```

Nesse modo:

- o script nao procura nenhuma janela
- voce abre o cadastro do funcionario
- posiciona o foco no campo `Codigo`
- roda o comando
- ele espera 5 segundos e comeca

Se quiser que ele parta da tela principal do Contmatic, clicando em `Funcionário` e depois em `Inserir`:

```powershell
python .\phoenix_tabs_runner.py `
  --base-url https://www.palsys.com.br `
  --email "LOGIN_DO_CLIENTE" `
  --password "SENHA_DO_CLIENTE" `
  --employee-id "UUID_DO_FUNCIONARIO" `
  --layout-file .\phoenix-layout.sample.json `
  --bootstrap-start `
  --focus-grace 5
```
```

## Observacao importante

Esta primeira versao e propositalmente mais conservadora:

- preenche o que ja tem mapeamento claro
- usa `Tab` para passar por campos sem valor
- para em pontos mais sensiveis para voce validar

O proximo ajuste fino deve transformar os pontos manuais em rotinas automaticas, um a um.

## Folga de foco

Sempre que o script pedir `ENTER` no terminal, ele espera alguns segundos antes de agir no Phoenix.

Padrao:

- `--focus-grace 5`

Assim voce consegue voltar o foco para a tela do cadastro antes da proxima acao automatica.

## Foco da janela

Agora o padrao e:

- o script **nao** ativa a janela do Phoenix sozinho
- voce mesmo deixa a tela posicionada e focada

Se quiser voltar ao comportamento antigo, use:

```powershell
--activate-window --window-hint "phoenix"
```

## Layout de coordenadas

O arquivo `phoenix-layout.sample.json` guarda coordenadas relativas da janela do Phoenix.

Se algum clique cair alguns pixels fora, ajuste so esse JSON, sem mexer no script.

Quando voce usar o modo sem `--activate-window`, o layout precisa ter:

```json
"windowOrigin": {
  "x": 0,
  "y": 0
}
```

Esses valores representam o canto superior esquerdo da janela do Phoenix na sua tela.

Entao:

- `windowOrigin.x` = posicao horizontal da janela
- `windowOrigin.y` = posicao vertical da janela

Os `targets` continuam sendo relativos a esse canto.

Tambem existem targets para o inicio do fluxo:

- `botao_funcionario`
- `botao_inserir`
