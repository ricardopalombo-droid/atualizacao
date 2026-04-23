# PalSys

Projeto Next.js do site da PalSys.

## Como rodar

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

Crie um arquivo `.env.local` com:

```bash
APP_LOGIN_EMAIL=admin@palsys.com.br
APP_LOGIN_PASSWORD=troque-esta-senha
```

## Fluxo interno adicionado

- `Entrar` na home leva para `/acesso`
- login válido redireciona para `/painel`
- o painel libera as funções internas
- o módulo de cadastro fica em `/painel/cadastros`
