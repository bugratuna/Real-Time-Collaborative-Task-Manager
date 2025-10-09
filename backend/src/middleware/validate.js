const { ZodError } = require('zod');

const validate = (schema) => (req, _res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      error.status = 422;
    }
    next(error);
  }
};

module.exports = { validate };
