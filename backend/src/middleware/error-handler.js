const { ZodError } = require('zod');

const notFoundHandler = (_req, res, _next) => {
  res.status(404).json({ message: 'Route not found' });
};

const errorHandler = (error, _req, res, _next) => {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return res.status(error.status || 422).json({
      message: 'Validation failed',
      issues: error.errors
    });
  }

  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(status).json({ message });
};

module.exports = { errorHandler, notFoundHandler };
