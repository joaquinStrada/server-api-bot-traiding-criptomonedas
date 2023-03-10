import Joi from 'joi'

export const SchemaRegister = Joi.object({
	fullName: Joi.string().min(6).max(255).required(),
	email: Joi.string().min(6).max(400).required().email(),
	password: Joi.string().min(8).max(20).required(),
	role: Joi.string().min(4).max(10).pattern(/^(user|admin)$/).required()
})