
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import path from "path";
import fs from "fs";
import AuthenticatedRequest from "../types/express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
  files?: { [fieldname: string]: Express.Multer.File[] };
}

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const createKos = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { name, address, description, pricePerMonth, gender } = request.body;
    const ownerId = request.user?.id;
    if (!ownerId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    if (!name || !address || !pricePerMonth || !gender) {
      return response
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    const price = parseInt(pricePerMonth);
    if (isNaN(price) || price <= 0) {
      return response.status(400).json({
        status: false,
        message: "Price per month must be a positive number",
      });
    }

    if (!["MALE", "FEMALE", "ALL"].includes(gender)) {
      return response
        .status(400)
        .json({ status: false, message: "Invalid gender value" });
    }

    const newKos = await prisma.kos.create({
      data: {
        uuid: uuidv4(),
        name: name.trim(),
        address: address.trim(),
        description: description ? description.trim() : null,
        pricePerMonth: price,
        gender,
        ownerId,
      },
    });

    logger.info(`Kos created: ${name} by user ID ${ownerId}`);
    return response.status(201).json({
      status: true,
      data: newKos,
      message: "Kos has been created",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to create kos: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to create kos: ${message}`,
    });
  }
};
export const getAllKos = async (request: Request, response: Response) => {
  try {
    const { search, minPrice, maxPrice, gender, facilities, address, rating } =
      request.query;
    const where: any = {};

    if (search) {
      where.name = { contains: search.toString().toLowerCase() };
    }
    if (minPrice && !isNaN(parseInt(minPrice.toString()))) {
      where.pricePerMonth = { gte: parseInt(minPrice.toString()) };
    }
    if (maxPrice && !isNaN(parseInt(maxPrice.toString()))) {
      where.pricePerMonth = {
        ...where.pricePerMonth,
        lte: parseInt(maxPrice.toString()),
      };
    }
    if (gender) {
      const validGenders = ["MALE", "FEMALE", "ALL"];
      const genderArray = gender.toString().toUpperCase().split(","); // Pisah berdasarkan koma
      const filteredGenders = genderArray.filter((g) =>
        validGenders.includes(g)
      );

      if (filteredGenders.length > 0) {
        where.gender = { in: filteredGenders }; // Gunakan operator in untuk multiple values
      } else {
        logger.warn(`Nilai gender tidak valid: ${gender}`);
        return response.status(400).json({
          status: false,
          message: "Nilai gender tidak valid",
        });
      }
    }
    if (address) {
      where.address = { contains: address.toString().toLowerCase() };
    }

    let kosList = await prisma.kos.findMany({
      where,
      include: {
        images: true,
        facilities: true,
        reviews: {
          include: {
            user: true, // Sertakan relasi user
            repliedBy: true, // Sertakan data owner yang membalas (pastikan relasi ini ada di Prisma schema)
          },
        },
      },
    });

    if (facilities) {
      const facilityInputs = (facilities as string)
        .split(",")
        .map((f) => f.trim().toLowerCase())
        .filter((f) => f.length > 0); // Hapus input kosong

      if (facilityInputs.length === 0) {
        return response.status(400).json({
          status: false,
          message: "Daftar fasilitas tidak valid",
        });
      }
      kosList = kosList.filter((kos) =>
        kos.facilities.some((facility) =>
          facilityInputs.some((input) =>
            facility.facility.toLowerCase().includes(input)
          )
        )
      );
    }

    if (rating && !isNaN(parseFloat(rating.toString()))) {
      const minRatingValue = parseFloat(rating.toString());
      if (minRatingValue < 0 || minRatingValue > 5) {
        return response.status(400).json({
          status: false,
          message: "Nilai minRating harus antara 0 dan 5",
        });
      }
      kosList = kosList.filter((kos) => {
        if (kos.reviews.length === 0) return false; // Kos tanpa review diabaikan jika ada minRating
        const avgRating =
          kos.reviews.reduce((sum, review) => sum + review.rating, 0) /
          kos.reviews.length;
        return avgRating >= minRatingValue;
      });
    }

    // Pastikan reviews selalu array dan user memiliki default
    const formattedKosList = kosList.map((kos) => ({
      ...kos,
      reviews: kos.reviews.map((review) => ({
        ...review,
        user: review.user || { name: "Pengguna Anonim" },
        repliedBy: review.repliedBy
          ? {
              id: review.repliedBy.id,
              name: review.repliedBy.name,
              role: review.repliedBy.role,
            }
          : null,
      })),
    }));

    logger.info(`Kos list retrieved: ${JSON.stringify(formattedKosList)}`);
    return response.status(200).json({
      status: true,
      data: formattedKosList,
      message: "Kos list retrieved successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve kos list: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve kos list: ${message}`,
    });
  }
};

export const getKosById = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;

    if (!id) {
      return response
        .status(400)
        .json({ status: false, message: "Kos ID is required" });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return response
        .status(400)
        .json({ status: false, message: "Invalid Kos ID format" });
    }

    const kos = await prisma.kos.findUnique({
      where: { id: parsedId },
      include: {
        images: true,
        facilities: true,
        reviews: {
          include: {
            user: true, // Sertakan relasi user
          },
        },
      },
    });

    if (!kos) {
      return response
        .status(404)
        .json({ status: false, message: "Kos not found" });
    }

    // Pastikan reviews selalu array dan user memiliki default
    const formattedKos = {
      ...kos,
      reviews: kos.reviews.map((review) => ({
        ...review,
        user: review.user || { name: "Pengguna Anonim" },
      })),
    };

    logger.info(`Kos retrieved: ID ${parsedId}`);
    return response.status(200).json({
      status: true,
      data: formattedKos,
      message: "Kos retrieved successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve kos: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve kos: ${message}`,
    });
  }
};

export const updateKos = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { name, address, description, pricePerMonth, gender } = request.body;
    const ownerId = request.user?.id;

    if (!id) {
      return response
        .status(400)
        .json({ status: false, message: "Kos ID is required" });
    }

    if (!ownerId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const kos = await prisma.kos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kos) {
      return response
        .status(404)
        .json({ status: false, message: "Kos not found" });
    }

    if (kos.ownerId !== ownerId) {
      return response.status(403).json({
        status: false,
        message: "Forbidden: You are not the owner of this kos",
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (address) updateData.address = address.trim();
    if (description !== undefined)
      updateData.description = description ? description.trim() : null;
    if (pricePerMonth !== undefined)
      updateData.pricePerMonth = parseInt(pricePerMonth);
    if (gender) updateData.gender = gender;

    const updatedKos = await prisma.kos.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        images: true,
        facilities: true,
        reviews: {
          include: {
            user: true,
          },
        },
      },
    });

    // Pastikan reviews selalu array dan user memiliki default
    const formattedKos = {
      ...updatedKos,
      reviews: updatedKos.reviews.map((review) => ({
        ...review,
        user: review.user || { name: "Pengguna Anonim" },
      })),
    };

    logger.info(`Kos updated: ID ${id} by user ID ${ownerId}`);
    return response.status(200).json({
      status: true,
      data: formattedKos,
      message: "Kos has been updated successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to update kos: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to update kos: ${message}`,
    });
  }
};

export const deleteKos = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const ownerId = request.user?.id;

    if (!id) {
      return response
        .status(400)
        .json({ status: false, message: "Kos ID is required" });
    }

    if (!ownerId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return response
        .status(400)
        .json({ status: false, message: "Invalid Kos ID format" });
    }

    const kos = await prisma.kos.findUnique({
      where: { id: parsedId },
    });

    if (!kos) {
      return response
        .status(404)
        .json({ status: false, message: "Kos not found" });
    }

    if (kos.ownerId !== ownerId) {
      return response.status(403).json({
        status: false,
        message: "Forbidden: You are not the owner of this kos",
      });
    }

    // Ambil daftar gambar terkait kos
    const images = await prisma.kosImage.findMany({
      where: { kosId: parsedId },
    });

    // Hapus file gambar dari folder public/kos_images/
    for (const image of images) {
      const filePath = path.join("public/kos_images/", image.image);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Hapus file secara sinkronus
          logger.info(`Image deleted: ${filePath}`);
        } else {
          logger.warn(`Image not found: ${filePath}`);
        }
      } catch (error: unknown) {
        logger.error(
          `Failed to delete image ${filePath}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Hapus kos dari database
    await prisma.kos.delete({
      where: { id: parsedId },
    });

    logger.info(`Kos deleted: ID ${parsedId} by user ID ${ownerId}`);
    return response.status(200).json({
      status: true,
      message: "Kos has been deleted successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to delete kos: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to delete kos: ${message}`,
    });
  }
};
