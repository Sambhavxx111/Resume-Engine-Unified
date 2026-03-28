const Joi = require('joi');

const resumeSchema = Joi.object()
  .min(1)
  .max(200)
  .custom((value, helpers) => {
    const stack = [value];
    let nodeCount = 0;

    while (stack.length) {
      const current = stack.pop();
      nodeCount += 1;

      if (nodeCount > 5000) {
        return helpers.error('any.invalid');
      }

      if (typeof current === 'string') {
        if (current.length > 5000) {
          return helpers.error('string.max');
        }
        continue;
      }

      if (Array.isArray(current)) {
        if (current.length > 200) {
          return helpers.error('array.max');
        }
        current.forEach((item) => stack.push(item));
        continue;
      }

      if (current && typeof current === 'object') {
        Object.values(current).forEach((item) => stack.push(item));
      }
    }

    return value;
  }, 'resume structure guard')
  .required()
  .messages({
    'any.invalid': 'Resume payload is too large or deeply nested.',
    'string.max': 'Resume text fields must be 5000 characters or fewer.',
    'array.max': 'Resume arrays must contain 200 items or fewer.',
  });

module.exports = { resumeSchema };
