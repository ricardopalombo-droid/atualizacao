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
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## Fluxo interno adicionado

- `Entrar` na home leva para `/acesso`
- login válido redireciona para `/painel`
- o painel libera as funções internas
- o módulo de cadastro fica em `/painel/cadastros`
- o link público do funcionário fica em `/cadastro/funcionario`

## Persistência preparada

- `supabase/schema.sql` cria as tabelas `subscribers`, `clients`, `app_users`, `employees` e `dependents`
- `POST /api/cadastros` grava o fluxo do cadastro no Supabase
- o formulário está pronto para enviar rascunho, convite, retorno do funcionário e finalização

## Modelo multiempresa

- `subscribers` representa quem alugou o sistema
- `clients` representa as empresas cadastradas por cada assinante
- `employees` fica vinculado a `subscriber_id` e `client_id`
- `app_users` define os acessos administrativos de assinante e cliente
- por LGPD, a recomendação é que a PalSys não tenha acesso padrão aos dados pessoais dos funcionários

Veja o desenho em `docs/modelo-acesso-multiempresa.md`.
