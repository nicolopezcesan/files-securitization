import * as Joi from 'joi';

export default Joi.object({
  PORT: Joi.number().required(),
  ENVIRONMENT: Joi.string().required(),
  BLOCKCHAIN_URL: Joi.string().required(),
});
