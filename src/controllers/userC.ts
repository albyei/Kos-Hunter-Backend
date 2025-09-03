import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL } from "../global";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import logger from "../utils/logger";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const createUser = async (request: Request, response: Response) => {
  try {
    const { name, email, password,phone, role } = request.body;
    const uuid = uuidv4();
    let filename = request.file ? path.basename(request.file.path) : "";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        uuid,
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        profile_picture: filename,
      },
    });

    logger.info(`User created: ${email} by ${request.body.user?.email || "unknown"}`);
    return response
      .json({
        status: true,
        data: newUser,
        message: `New User has created`,
      })
      .status(201)
      .on("finish", () => {
        logger.info(`Response sent: POST /user/create/, status: 201`);
      });
  } catch (error: any) {
    logger.error(`Failed to create user: ${error.message}`);
    const statusCode = error.code === "P2002" ? 409 : 500;
    return response
      .status(statusCode)
      .json({
        status: false,
        message: error.code === "P2002" ? `Email already used` : `Failed to create user: ${error.message}`,
      })
      .on("finish", () => {
        logger.info(`Response sent: POST /user/create/, status: ${statusCode}`);
      });
  }
};

export const updateUser = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { name, email, password,phone, role } = request.body;

    const findUser = await prisma.user.findFirst({
      where: { id: Number(id) },
    });
    if (!findUser)
      return response
        .status(404)
        .json({ status: false, message: `User is not found` });

    let filename = findUser.profile_picture || "";
    if (request.file) {
      filename = path.basename(request.file.path);
      if (findUser.profile_picture) {
        // Hanya hapus file jika profile_picture tidak null
        const oldFilePath = path.join(__dirname, "..", "..", "public", "profile_picture", findUser.profile_picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : findUser.password;

    const updateUser = await prisma.user.update({
      data: {
        name: name || findUser.name,
        email: email || findUser.email,
        password: hashedPassword,
        phone: phone || findUser.phone,
        role: role || findUser.role,
        profile_picture: filename,
      },
      where: { id: Number(id) },
    });

    logger.info(`Response sent: PUT /user/${id}, status: 200`);
    return response
      .json({
        status: true,
        data: updateUser,
        message: `User has updated`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to update user: ${error.message}`);
    const statusCode = error.code === "P2002" ? 409 : 400;
    return response
      .json({
        status: false,
        message: error.code === "P2002" ? `Email already used` : `Failed to update user: ${error.message}`,
      })
      .status(statusCode);
  }
};

export const authentication = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return response
        .status(401)
        .json({ status: false, logged: false, message: `Invalid credentials` });
    }

    const data = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      logger.error("JWT_SECRET is not defined in environment variables");
      return response
        .status(500)
        .json({ status: false, message: `Server configuration error: JWT_SECRET not defined` });
    }

    const token = sign(data, secretKey, { expiresIn: "1h" });

    logger.info(`User logged in: ${email}`);
    return response
      .json({
        status: true,
        logged: true,
        message: `Login Success`,
        data,
        token,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to login: ${error.message}`);
    return response
      .json({
        status: false,
        message: `Failed to login: ${error.message}`,
      })
      .status(500);
  }
};

export const changeProfile = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const findUser = await prisma.user.findFirst({ where: { id: Number(id) } });
    if (!findUser)
      return response
        .status(404)
        .json({ status: false, message: `User with id ${id} is not found` });

    let filename = findUser.profile_picture || "";
    if (request.file) {
      filename = path.basename(request.file.path);
      if (findUser.profile_picture) {
        // Hanya hapus file jika profile_picture tidak null
        const oldFilePath = path.join(__dirname, "..", "..", "public", "profile_picture", findUser.profile_picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const updateProfile = await prisma.user.update({
      data: { profile_picture: filename },
      where: { id: Number(id) },
    });
    return response
      .json({
        status: true,
        data: updateProfile,
        message: `Picture has changed`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to change profile: ${error.message}`);
    return response
      .json({
        status: false,
        message: `There is an error: ${error.message}`,
      })
      .status(400);
  }
};

export const deleteUser = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const findUser = await prisma.user.findFirst({ where: { id: Number(id) } });
    if (!findUser)
      return response
        .status(404)
        .json({ status: false, message: `User with id ${id} not found` });

    if (findUser.profile_picture) {
      // Hanya hapus file jika profile_picture tidak null
      const oldFilePath = path.join(__dirname, "..", "..", "public", "profile_picture", findUser.profile_picture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const result = await prisma.user.delete({
      where: { id: Number(id) },
    });
    return response
      .json({
        status: true,
        data: result,
        message: `User with id ${id} has been deleted`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to delete user: ${error.message}`);
    return response
      .json({
        status: false,
        message: `There is an error: ${error.message}`,
      })
      .status(400);
  }
};

export const getAlluser = async (request: Request, response: Response) => {
  try {
    const { search } = request.query;
    const allUser = await prisma.user.findMany({
      where: { name: { contains: search?.toString() || "" } },
    });
    return response
      .json({
        status: true,
        data: allUser,
        message: `User has retrieved`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to retrieve users: ${error.message}`);
    return response
      .json({
        status: false,
        message: `There is an error: ${error.message}`,
      })
      .status(400);
  }
};

export const getProfile = async (request: Request, response: Response) => {
  try {
    const userBody = request.body.user;
    const getProfile = await prisma.user.findFirst({
      where: {
        id: userBody.id,
      },
    });

    return response
      .json({
        status: true,
        data: getProfile,
        message: `User berhasil ditampilkan`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to get profile: ${error.message}`);
    return response
      .json({
        status: false,
        message: `Terjadi sebuah kesalahan: ${error.message}`,
      })
      .status(400);
  }
};

 export const getUserbyId = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const getUser = await prisma.user.findFirst({ where: { id: Number(id) } });
    return response
      .json({
        status: true,
        data: getUser,
        message: `User with id ${id} has been retrieved`,
      })
      .status(200);
  } catch (error: any) {
    logger.error(`Failed to retrieve user: ${error.message}`);
    return response
      .json({
        status: false,
        message: `There is an error: ${error.message}`,
      })
      .status(400);
  }
};