const Joi = require('joi');

const resumeDataSchema = Joi.object().required(); // allow flexible resume JSON but must be object

const suggestSkillsSchema = Joi.object({
  existingSkills: Joi.array().items(Joi.string()).min(1).required()
});

const optimizeSchema = Joi.object({
  resumeData: Joi.object().required(),
  jobDescription: Joi.alternatives().try(Joi.string(), Joi.object()).optional()
});

module.exports = { resumeDataSchema, suggestSkillsSchema, optimizeSchema };
