import { ZodError } from 'zod';

/**
 * Middleware factory for validating request data with a Zod schema
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [source='body']
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        const details = parsed.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: details[0]?.message || 'Validation failed',
          details,
        });
      }

      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
