import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const createKosSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required and must be a non-empty string",
    "any.required": "Name is required",
  }),
  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required and must be a non-empty string",
    "any.required": "Address is required",
  }),
  description: Joi.string().trim().allow("").optional().messages({
    "string.base": "Description must be a string",
  }),
  pricePerMonth: Joi.number().integer().positive().required().messages({
    "number.base": "Price per month is required and must be a valid number",
    "number.integer": "Price per month must be an integer",
    "number.positive": "Price per month must be a positive number",
    "any.required": "Price per month is required",
  }),
  gender: Joi.string().valid("MALE", "FEMALE", "ALL").required().messages({
    "any.only": "Gender must be MALE, FEMALE, or ALL",
    "any.required": "Gender is required",
  }),
});

const updateKosSchema = Joi.object({
  name: Joi.string().trim().min(3).max(255).optional().messages({
    "string.empty": "Name must be a non-empty string",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must not exceed 255 characters",
  }),
  address: Joi.string().trim().min(5).optional().messages({
    "string.empty": "Address must be a non-empty string",
    "string.min": "Address must be at least 5 characters long",
  }),
  description: Joi.string().trim().allow("").optional().messages({
    "string.base": "Description must be a string",
  }),
  pricePerMonth: Joi.number().integer().positive().optional().messages({
    "number.base": "Price per month must be a valid number",
    "number.integer": "Price per month must be an integer",
    "number.positive": "Price per month must be a positive number",
  }),
  gender: Joi.string().valid("MALE", "FEMALE", "ALL").optional().messages({
    "any.only": "Gender must be MALE, FEMALE, or ALL",
  }),
});

export const verifyCreateKos = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createKosSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};

export const verifyUpdateKos = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateKosSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};
