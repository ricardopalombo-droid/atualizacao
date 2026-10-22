# Criador de eventos Contmatic no site

O módulo fica em `/painel/eventos` e, nesta primeira integração, exige uma sessão de administrador PalSys. A liberação para assinantes deve ser ligada posteriormente à regra comercial do produto. O catálogo técnico e as fórmulas de referência ficam em `lib/contmatic-events/data`, importados apenas por módulos de servidor. Eles não são servidos pela pasta `public` nem retornados pelas APIs.

## Variáveis de ambiente

- `OPENAI_API_KEY`: chave da API usada somente no servidor.
- `OPENAI_MODEL`: modelo compatível com Responses API e Structured Outputs.
- `EVENTOS_PROPOSAL_SECRET`: segredo longo e aleatório usado para criptografar e autenticar o estado da proposta. É obrigatório em produção.
- `APP_SESSION_SECRET`: segredo longo e aleatório que assina os cookies de sessão do site. Se omitido, o servidor usa `APP_LOGIN_PASSWORD` como compatibilidade; prefira configurar um valor próprio.

Depois de configurar as variáveis na hospedagem, faça um novo deploy.
Sessões criadas antes desta atualização deixam de ser aceitas e o usuário precisa entrar novamente.

## Fluxo

1. O usuário autenticado descreve o evento.
2. O servidor recupera internamente até oito referências e chama a Responses API.
3. O navegador recebe somente o evento novo, avisos, pendências e um token criptografado.
4. Alterações no JSON são revalidadas no servidor. Pendências não podem ser removidas alterando a resposta no navegador.
5. A exportação gera um único objeto JSON com os 39 campos observados, sem metadados.

O módulo valida estrutura e tipos, mas não executa a linguagem de fórmulas do Phoenix. A importação e os cálculos ainda precisam ser conferidos em um ambiente de teste da versão instalada da Contmatic.
