const security = [{ bearerAuth: [] }];
const response = { '200': { description: 'Operação concluída' }, '400': { description: 'Dados inválidos' }, '401': { description: 'Não autenticado' }, '403': { description: 'Sem permissão' }, '409': { description: 'Conflito' } };
const body = schema => ({ required: true, content: { 'application/json': { schema } } });
const object = properties => ({ type: 'object', required: Object.keys(properties), properties });
const text = { type: 'string' };
const integer = { type: 'integer' };
const schemas = {
  Login: object({ email: { type: 'string', format: 'email' }, password: text }),
  User: object({ name: text, username: text, email: { type: 'string', format: 'email' }, password: text }),
  Category: object({ name: text, description: text }),
  Author: object({ name: text, nationality: text, birthDate: { type: 'string', format: 'date' } }),
  Book: object({ title: text, isbn: text, year: integer, totalCopies: integer, categoryId: integer, authorIds: { type: 'array', items: integer } }),
  Reader: object({ name: text, cpf: text, email: text, phone: text }),
  Loan: object({ bookId: integer, readerId: integer }),
  Reservation: object({ bookId: integer, readerId: integer })
};
const paths = {
  '/auth/login': { post: { tags: ['Autenticação'], summary: 'Entrar', requestBody: body(schemas.Login), responses: response } },
  '/auth/refresh': { post: { tags: ['Autenticação'], summary: 'Renovar e rotacionar refresh token em cookie httpOnly', responses: response } },
  '/auth/logout': { post: { tags: ['Autenticação'], summary: 'Revogar refresh token', security, responses: response } },
  '/auth/me': { get: { tags: ['Autenticação'], summary: 'Usuário autenticado', security, responses: response } },
  '/reports/dashboard': { get: { tags: ['Relatórios'], summary: 'Indicadores do administrador', security, responses: response } },
  '/readers/{id}/loans': { get: { tags: ['Leitores'], summary: 'Histórico do leitor', security, parameters: [{ name: 'id', in: 'path', required: true, schema: integer }], responses: response } },
  '/loans/{id}/return': { patch: { tags: ['Empréstimos'], summary: 'Registrar devolução e multa', security, parameters: [{ name: 'id', in: 'path', required: true, schema: integer }], responses: response } },
  '/reservations/{id}/cancel': { patch: { tags: ['Reservas'], summary: 'Cancelar reserva', security, parameters: [{ name: 'id', in: 'path', required: true, schema: integer }], responses: response } },
  '/user/{id}/active': { patch: { tags: ['Atendentes'], summary: 'Ativar ou desativar atendente', security, parameters: [{ name: 'id', in: 'path', required: true, schema: integer }], requestBody: body(object({ active: { type: 'boolean' } })), responses: response } }
};
for (const [route, tag, schema, methods] of [
  ['user', 'Atendentes', 'User', ['get', 'post', 'put']],
  ['categories', 'Categorias', 'Category', ['get', 'post', 'put', 'delete']],
  ['authors', 'Autores', 'Author', ['get', 'post', 'put', 'delete']],
  ['books', 'Livros', 'Book', ['get', 'post', 'put', 'delete']],
  ['readers', 'Leitores', 'Reader', ['get', 'post', 'put', 'delete']],
  ['loans', 'Empréstimos', 'Loan', ['get', 'post']],
  ['reservations', 'Reservas', 'Reservation', ['get', 'post']]
]) {
  paths['/' + route] = {};
  paths['/' + route + '/{id}'] = {};
  for (const method of methods) {
    const target = method === 'put' || method === 'delete' ? paths['/' + route + '/{id}'] : paths['/' + route];
    target[method] = { tags: [tag], summary: method.toUpperCase() + ' ' + route, security, responses: response };
    if (method === 'post' || method === 'put') target[method].requestBody = body(schemas[schema]);
    if (method === 'put' || method === 'delete') target[method].parameters = [{ name: 'id', in: 'path', required: true, schema: integer }];
    if (method === 'get' && target === paths['/' + route]) target[method].parameters = [{ name: 'page', in: 'query', schema: integer }, { name: 'limit', in: 'query', schema: integer }];
  }
  if (['categories', 'authors', 'books', 'readers'].includes(route)) paths['/' + route + '/{id}'].get = { tags: [tag], summary: 'Consultar ' + route + ' por ID', security, parameters: [{ name: 'id', in: 'path', required: true, schema: integer }], responses: response };
  if (!Object.keys(paths['/' + route + '/{id}']).length) delete paths['/' + route + '/{id}'];
}
paths['/books'].get.parameters.push(...['title', 'categoryId', 'authorId', 'available'].map(name => ({ name, in: 'query', schema: text })));
paths['/loans'].get.parameters.push({ name: 'status', in: 'query', schema: { type: 'string', enum: ['ATIVO', 'ATRASADO', 'DEVOLVIDO'] } });
const spec = { openapi: '3.0.3', info: { title: 'Biblioteca API', version: '1.0.0', description: 'Sistema de biblioteca com JWT, refresh token, reservas e paginação' }, servers: [{ url: 'http://localhost:3000/v1' }], components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas }, paths };
module.exports = { spec };
