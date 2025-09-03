import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const createKosFacilitySchema = Joi.object({
  kosId: Joi.number().integer().positive().required().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
    "any.required": "Kos ID is required",
  }),
  facility: Joi.string().trim().required().messages({
    "string.empty": "Facility is required and must be a non-empty string",
    "any.required": "Facility is required",
  }),
});

const updateKosFacilitySchema = Joi.object({
  kosId: Joi.number().integer().positive().optional().messages({
    "number.base": "Kos ID is required and must be a valid number",
    "number.integer": "Kos ID must be an integer",
    "number.positive": "Kos ID must be a positive number",
  }),
  facility: Joi.string().trim().optional().messages({
    "string.base": "Facility must be a string",
  }),
});

export const verifyCreateKosFacility = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createKosFacilitySchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyUpdateKosFacility = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateKosFacilitySchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};
