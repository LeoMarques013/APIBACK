# Biblioteca JWT API

API do trabalho integrador de biblioteca. Projeto independente do front-end, baseado no exemplo [ADS-Unipar/jwt-api](https://github.com/ADS-Unipar/jwt-api).

## Instalação

Requisitos: Node.js 20 ou superior e pnpm. Na pasta deste repositório:

```bash
corepack enable
pnpm install
cp .envex .env
pnpm start
```

No Windows, use `Copy-Item .envex .env`. Edite o `.env` antes de iniciar, especialmente `JWT_SECRET`, `JWT_REFRESH_SECRET` e `ADMIN_PASSWORD`. O primeiro início cria um administrador com o e-mail de `ADMIN_EMAIL` e a senha de `ADMIN_PASSWORD`. O valor padrão de e-mail é `admin@biblioteca.local`. A senha não fica no repositório.

| Variável | Uso |
| --- | --- |
| `PORT` | Porta da API, padrão 3000 |
| `FRONT_URL` | Origem autorizada pelo CORS, padrão `http://localhost:3001` |
| `JWT_SECRET` | Assinatura do access token |
| `JWT_REFRESH_SECRET` | Segredo separado exigido na inicialização |
| `ACCESS_TOKEN_TTL` | Validade do access token, padrão `15m` |
| `ADMIN_EMAIL` | E-mail do administrador inicial |
| `ADMIN_PASSWORD` | Senha do administrador inicial |
| `DB_FILE` | Caminho do SQLite, padrão `database.sqlite` |

O arquivo `.env` e o banco SQLite estão ignorados pelo Git. O banco de exemplo do projeto original foi retirado para evitar dados antigos.

## Rotas

Documentação Swagger: [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs). A especificação OpenAPI está em `/v1/openapi.json`. A coleção importável no Postman está em [biblioteca.postman_collection.json](biblioteca.postman_collection.json). O login da coleção salva automaticamente o access token na variável `accessToken`; o Postman mantém o cookie de refresh no seu cookie jar.

O fluxo de autenticação usa `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout` e `GET /v1/auth/me`. Login e refresh devolvem `accessToken` e `user`; o refresh token fica em cookie httpOnly. Envie o access token em `Authorization: Bearer <token>`. O refresh token é aleatório, dura sete dias, fica salvo como HMAC SHA-256 com `JWT_REFRESH_SECRET` e é rotacionado em cada renovação. Reutilizar um refresh revogado encerra as sessões do usuário. Logout revoga o refresh token. O access token não usa blacklist: é stateless e expira em 15 minutos. Desativar um usuário impede novas requisições autenticadas.

Administradores gerenciam atendentes, categorias, autores, livros e relatórios. Atendentes consultam o acervo e gerenciam leitores, empréstimos e reservas. A API responde 401 para falta ou expiração do access token e 403 para acesso sem perfil.

As listagens aceitam `page` e `limit` (máximo 100) e retornam `{ data, total, page, pages }`. Livros aceitam `title`, `categoryId`, `authorId` e `available=true`. Empréstimos aceitam `status=ATIVO|ATRASADO|DEVOLVIDO`.

## Regras de negócio

- Empréstimo dura sete dias, diminui o estoque e usa transação Sequelize.
- Cada leitor pode ter até três empréstimos em aberto e nenhum atrasado.
- A devolução usa transação, aumenta o estoque e registra R$ 1,00 por dia de atraso.
- O estado ATRASADO é calculado pela data de vencimento para não depender de tarefa agendada.
- Reservas entram em fila por data e ID quando não há exemplares. Na devolução, a primeira fica PRONTA; apenas esse leitor pode pegar o exemplar. A reserva pode ser cancelada.
- A exclusão de categorias e autores vinculados e de livros com histórico ou reserva ativa responde 409.
- Os dados de entrada são validados com Zod.

## Testes e apresentação

```bash
node --test test/integration.test.js
```

O teste de integração usa SQLite em memória e cobre login, permissões, cadastros, filtros, empréstimo, devolução, multa, reserva e rotação do refresh.

Para mostrar a renovação no vídeo, ajuste `ACCESS_TOKEN_TTL=30s` só durante a gravação. Entre, abra o painel, espere 30 segundos e faça outra consulta; o front renova e repete a chamada. Depois mostre empréstimo, devolução com multa e um atendente recebendo 403 em uma rota de administrador. Restaure `15m` após a demonstração.
