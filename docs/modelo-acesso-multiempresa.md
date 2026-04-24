# Modelo de Acesso Multiempresa

## Objetivo

Organizar a plataforma para que a PalSys alugue o sistema para um assinante, e esse assinante cadastre os próprios clientes sem misturar dados entre empresas.

## Estrutura

### 1. PalSys

- dona da plataforma
- gerencia planos, limites e suporte
- por padrão **não deve acessar dados pessoais de funcionários**
- pode operar com visão administrativa e financeira

### 2. Assinante

Exemplo: `Escritório X`

- compra o acesso da PalSys
- recebe um limite de clientes (`max_clients`)
- pode ver apenas os clientes e funcionários vinculados ao próprio `subscriber_id`

### 3. Cliente do assinante

Exemplo: os `10 clientes` do Escritório X

- cada cliente pertence a um assinante
- cada cliente possui login próprio
- cada cliente vê apenas os próprios funcionários

### 4. Funcionário

- recebe o link público de preenchimento
- não ganha acesso administrativo ao painel
- preenche apenas o próprio cadastro básico

## Tabelas

### `subscribers`

Representa o assinante que alugou o sistema.

Campos principais:
- `id`
- `name`
- `email`
- `max_clients`
- `max_employees`

### `clients`

Representa as empresas do assinante.

Campos principais:
- `id`
- `subscriber_id`
- `name`
- `email`
- `cnpj`
- `max_employees`

### `app_users`

Representa os usuários com login administrativo.

Papéis:
- `palsys_admin`
- `subscriber_admin`
- `client_user`

Regras:
- `palsys_admin`: sem `subscriber_id` e sem `client_id`
- `subscriber_admin`: com `subscriber_id` e sem `client_id`
- `client_user`: com `subscriber_id` e com `client_id`

Campos importantes:
- `email`
- `full_name`
- `role`
- `subscriber_id`
- `client_id`
- `can_view_personal_data`
- `is_active`

### `employees`

Representa os funcionários.

Vínculo:
- cada funcionário pertence a um `subscriber_id`
- cada funcionário pertence a um `client_id`

### `dependents`

Representa dependentes vinculados ao funcionário.

## Regras de visibilidade

### PalSys

Por padrão:
- vê assinantes, clientes, limites, volume de uso e status operacionais
- não vê CPF, endereço, documentos e dados sensíveis

Exceção:
- acesso excepcional somente com base legal, auditoria e trilha de acesso

### Assinante

- vê todos os clientes vinculados ao próprio `subscriber_id`
- vê todos os funcionários dos próprios clientes

### Cliente

- vê apenas o próprio registro de empresa
- vê apenas funcionários com o mesmo `client_id`

## Exemplo prático

### Cenário

- PalSys aluga o sistema para `Escritório X`
- `Escritório X` pode cadastrar `10 clientes`
- cada cliente terá seus próprios funcionários

### Fluxo

1. A PalSys cria o assinante `Escritório X`.
2. O assinante recebe `max_clients = 10`.
3. O assinante cadastra os 10 clientes.
4. Para cada cliente, é criado ao menos um `client_user`.
5. Cada `client_user` cadastra funcionários da própria empresa.
6. Cada funcionário salvo fica vinculado a:
   - `subscriber_id` do Escritório X
   - `client_id` do cliente correto

## Próximas telas recomendadas

1. Cadastro de assinantes
2. Cadastro de clientes do assinante
3. Gestão de usuários por cliente
4. Lista filtrada de funcionários por cliente
5. Painel administrativo da PalSys com visão sem dados sensíveis
