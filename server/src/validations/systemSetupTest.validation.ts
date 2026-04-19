import Joi from 'joi';

export const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).required(),
});

export const generatePdfSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  schoolName: Joi.string().min(1).max(255).required(),
});

export const sendEmailSchema = Joi.object({
  recipientEmail: Joi.string().email().required(),
  subject: Joi.string().min(1).max(255).required(),
});

export const sendEmailWithAttachmentSchema = Joi.object({
  recipientEmail: Joi.string().email().required(),
});

export const joiTestSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(1).max(120).required(),
  role: Joi.string().valid('admin', 'user', 'guest').required(),
});

export const queueTestSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).required(),
});
