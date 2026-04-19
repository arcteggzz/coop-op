import Joi from "joi";

export const createCooperativeSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
});

export const updateCooperativeSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
});

export const createCooperativeWalletSchema = Joi.object({
  walletName: Joi.string().min(1).max(255).required(),
});
