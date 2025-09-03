import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";
import { BASE_URL } from "../global";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const getAllImages = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const images = await prisma.kosImage.findMany({
      include: {
        kos: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    const imagesWithUrl = images.map((image) => ({
      ...image,
      image: `${BASE_URL}/kos_images/${image.image}`,
    }));

    logger.info("Retrieved all kos images");
    return response.status(200).json({
      status: true,
      data: imagesWithUrl,
      message: "Successfully retrieved all images",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve images: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve images: ${message}`,
    });
  }
};

export const getImageById = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;

    const image = await prisma.kosImage.findFirst({
      where: { id: Number(id) },
      include: {
        kos: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!image) {
      return response
        .status(404)
        .json({ status: false, message: "Image not found" });
    }

    const imageWithUrl = {
      ...image,
      image: `${BASE_URL}/kos_images/${image.image}`,
    };

    logger.info(`Retrieved image with ID ${id}`);
    return response.status(200).json({
      status: true,
      data: imageWithUrl,
      message: "Successfully retrieved image",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to retrieve image: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to retrieve image: ${message}`,
    });
  }
};

export const createKosImage = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { kosId } = request.body;
    const filename = request.file ? path.basename(request.file.path) : "";

    const newImage = await prisma.kosImage.create({
      data: {
        uuid: uuidv4(),
        kosId: parseInt(kosId),
        image: filename,
      },
    });

    logger.info(`Kos image added for kos ID ${kosId}`);
    return response.status(201).json({
      status: true,
      data: newImage,
      message: "Kos image has been added",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to add kos image: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to add kos image: ${message}`,
    });
  }
};

export const updateKosImage = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const { kosId, image } = request.body;

    const existingImage = await prisma.kosImage.findFirst({
      where: { id: Number(id) },
    });

    if (!existingImage) {
      return response
        .status(404)
        .json({ status: false, message: "Image not found" });
    }

    const updatedImage = await prisma.kosImage.update({
      where: { id: Number(id) },
      data: {
        kosId: parseInt(kosId),
        image: image,
      },
    });

    logger.info(`Kos image updated for kos ID ${kosId}`);
    return response.status(200).json({
      status: true,
      data: updatedImage,
      message: "Kos image has been updated",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error(`Failed to update kos image: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to update kos image: ${message}`,
    });
  }
};

export const deleteKosImage = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const { id } = request.params;
    const image = await prisma.kosImage.findFirst({
      where: { id: Number(id) },
    });
    if (!image) {
      return response
        .status(404)
        .json({ status: false, message: "Image not found" });
    }
    const imageName = image.image;

    await prisma.kosImage.delete({ where: { id: Number(id) } });

    const oldFilePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "kos_images",
      imageName
    );
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    return response
      .status(200)
      .json({ status: true, message: "Image has been deleted" });
  } catch (error: any) {
    logger.error(`Failed to delete image: ${error.message}`);
    return response.status(400).json({
      status: false,
      message: `Failed to delete image: ${error.message}`,
    });
  }
};
