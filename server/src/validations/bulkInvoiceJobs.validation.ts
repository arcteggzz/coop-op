import Joi from "joi";

export const createBulkInvoiceJobSchema = Joi.object({
  schoolId: Joi.string().uuid().required().messages({
    "string.guid": "schoolId must be a valid UUID",
    "any.required": "schoolId is required",
  }),
  classId: Joi.string().uuid().required().messages({
    "string.guid": "classId must be a valid UUID",
    "any.required": "classId is required",
  }),
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        itemName: Joi.string().min(1).max(255).required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().required(),
      }),
    )
    .required()
    .messages({
      "array.min": "At least one invoice item is required",
      "any.required": "items is required",
    }),
  discount: Joi.number().min(0).optional().default(0),
  remarks: Joi.string().min(1).optional().allow(""),
});
