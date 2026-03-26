const Joi = require('joi');

const resumeSchema = Joi.object().min(1).required();

module.exports = { resumeSchema };
