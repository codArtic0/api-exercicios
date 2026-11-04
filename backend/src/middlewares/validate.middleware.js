import { AppError } from './error.middleware.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    params: req.params,
    body: req.body,
    query: req.query,
  });

  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', result.error.issues);
  }

  // req.query é somente leitura no Express 5, por isso só body e params são substituídos.
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.params !== undefined) req.params = result.data.params;

  next();
};
