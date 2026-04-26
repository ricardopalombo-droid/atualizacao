# Proxima Estrategia do Phoenix

Coordenadas absolutas nao sao robustas o suficiente porque:

- resolucoes mudam
- o usuario pode mover a janela
- o RDP pode alterar escala

## Caminho recomendado

Tentar primeiro a automacao nativa do Windows:

- `UI Automation (uia)`
- `Win32`

Se o Phoenix expuser os campos na arvore de controles, conseguiremos preencher por:

- nome do campo
- tipo de controle
- ordem real de filhos
- automacao do proprio Windows

Isso e muito melhor do que clicar em pixels.

## Script de diagnostico

Arquivo:

- `automacao-phoenix/phoenix_uia_probe.py`

Ele gera um JSON com a arvore de controles da janela do Phoenix.

## Como testar

Dentro da pasta `automacao-phoenix`:

```powershell
python .\phoenix_uia_probe.py --backend uia --list-windows
```

Depois teste tambem:

```powershell
python .\phoenix_uia_probe.py --backend win32 --list-windows
```

Depois de descobrir o titulo correto, rode por exemplo:

```powershell
python .\phoenix_uia_probe.py --window-title "Cadastro de Funcionários" --backend uia --output .\phoenix-uia-snapshot.json
```

E tambem:

```powershell
python .\phoenix_uia_probe.py --window-title "Cadastro de Funcionários" --backend win32 --output .\phoenix-win32-snapshot.json
```

## O que procurar no JSON

- nomes como `Nome Mãe`, `Nome Pai`, `CEP`, `Sindicato`
- controles do tipo `Edit`, `ComboBox`, `Button`, `Pane`
- `automation_id`
- `class_name`

## Proximo passo

Se o Phoenix expuser bem os campos:

- reescrevemos o robô para preencher pelos controles do Windows

Se expuser parcialmente:

- usamos abordagem hibrida
- controles acessiveis por UI Automation
- e imagem/teclado apenas nos pontos especiais
