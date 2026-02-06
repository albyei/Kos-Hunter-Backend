import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const updateDataSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(), // Ensure valid email for updates
  password: Joi.string().min(7).alphanum().optional(),
  phone: Joi.number().optional().min(10).messages({
    "string.integer": "Informasi kontak harus berupa angka",
    "string.max": "Informasi kontak harus melebihi 10 karakter",
  }),
  role: Joi.string().valid("OWNER", "SOCIETY").optional(),
  profile_picture: Joi.allow().optional(),
  user: Joi.optional(),
});

const authSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(7).alphanum().required(),
});

const addDataSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(), // Add email validation
  password: Joi.string().min(7).required(), // Enforce minimum length for consistency
  phone: Joi.number().required().min(10).messages({
    "string.integer": "Informasi kontak harus berupa angka",
    "string.empty": "Informasi kontak wajib diisi",
    "string.max": "Informasi kontak harus melebihi 10 karakter",
    "any.required": "Informasi kontak wajib diisi",
  }),
  role: Joi.string().valid("OWNER", "SOCIETY").required(),
  profile_picture: Joi.allow().optional(),
  user: Joi.optional(),
});

export const verifyUpdateUser = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { error } = updateDataSchema.validate(request.body, {
    abortEarly: false,
  });

  if (error) {
    return response.status(200).json({
      status: false,
      message: error.details.map((it) => it.message).join(),
    });
  }
  return next();
};

export const verifyAuthentification = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { error } = authSchema.validate(request.body, { abortEarly: false });

  if (error) {
    return response.status(200).json({
      status: false,
      message: error.details.map((it) => it.message).join(),
    });
  }
  return next();
};

export const verifyAddUser = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { error } = addDataSchema.validate(request.body, { abortEarly: false });

  if (error) {
    // Check specifically for email validation error
    const emailError = error.details.find((err) =>
      err.message.includes('"email" must be a valid email')
    );
    if (emailError) {
      return response.status(400).json({
        status: false,
        message: '"email" must be a valid email',
      });
    }
    return response.status(400).json({
      status: false,
      message: error.details.map((it) => it.message).join(", "),
    });
  }
  return next();
};
