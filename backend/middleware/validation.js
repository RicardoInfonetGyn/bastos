// ======================================================
// middleware/validation.js
// ======================================================
const Joi = require('joi');

// 🔧 Schema de validação do login com campo "idioma"
const loginSchema = Joi.object({
  login: Joi.string().alphanum().min(3).max(50).required(),
  password: Joi.string().min(4).required(),
   idioma: Joi.string().valid('pt-BR', 'en-US', 'es-ES', 'fr-FR').required()
});

const companyUnitSchema = Joi.object({
  companyId: Joi.number().integer().positive().required(),
  unitId: Joi.number().integer().positive().required()
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details[0].message
    });
  }

  next();
};

const validateCompanyUnit = (req, res, next) => {
  const { error } = companyUnitSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.details[0].message
    });
  }

  next();
};

module.exports = { validateLogin, validateCompanyUnit };
