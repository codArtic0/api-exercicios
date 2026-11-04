export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const body = (code, message, details = null) => ({ error: { code, message, details } });

export const notFound = (req, res) => {
  res.status(404).json(body('NOT_FOUND', 'Rota não encontrada'));
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json(body(err.code, err.message, err.details));
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(body('INVALID_JSON', 'JSON inválido no corpo da requisição'));
  }

  console.error(err);

  const isProduction = process.env.NODE_ENV === 'production';
  return res
    .status(500)
    .json(body('INTERNAL_ERROR', 'Erro interno do servidor', isProduction ? null : err.stack));
};
