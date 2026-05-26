const Joi = require('joi');

const guardedObject = Joi.object()
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
        if (current.length > 5000) return helpers.error('string.max');
        continue;
      }

      if (Array.isArray(current)) {
        if (current.length > 200) return helpers.error('array.max');
        current.forEach((item) => stack.push(item));
        continue;
      }

      if (current && typeof current === 'object') {
        Object.values(current).forEach((item) => stack.push(item));
      }
    }

    return value;
  }, 'AI payload guard')
  .required();

const resumeDataSchema = guardedObject;

const suggestSkillsSchema = Joi.object({
  resumeData: guardedObject,
  existingSkills: Joi.array().max(100).items(Joi.string().trim().max(120)).optional().default([])
});

const optimizeSchema = Joi.object({
  resumeData: guardedObject,
  jobDescription: Joi.alternatives().try(Joi.string().trim().max(20000), guardedObject).optional()
});

module.exports = { resumeDataSchema, suggestSkillsSchema, optimizeSchema };
