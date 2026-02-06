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
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
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
    const ownerId = request.user?.id;
    if (!ownerId) {
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: No user ID provided" });
    }

    if (!kosId) {
      return response
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    const kos = await prisma.kos.findUnique({ where: { id: parseInt(kosId) } });
    if (!kos || kos.ownerId !== ownerId) {
      return response.status(403).json({
        status: false,
        message: "Forbidden: Invalid kos or not owner",
      });
    }

    if (!request.files || request.files.length === 0) {
      return response
        .status(400)
        .json({ status: false, message: "No images uploaded" });
    }

    // Pastikan request.files adalah array File[]
    const files: Express.Multer.File[] = Array.isArray(request.files)
      ? request.files
      : (Object.values(request.files).flat() as Express.Multer.File[]);
    if (files.length === 0) {
      return response
        .status(400)
        .json({ status: false, message: "No images uploaded" });
    }

    const imageRecords = files.map((file: Express.Multer.File) => ({
      uuid: uuidv4(),
      kosId: parseInt(kosId),
      image: path.basename(file.path),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const newImages = await prisma.kosImage.createMany({
      data: imageRecords,
    });

    logger.info(`Kos images added for kos ID ${kosId}`);
    return response.status(201).json({
      status: true,
      data: newImages,
      message: "Kos images have been added",
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
    const { kosId } = request.body;

    // Log untuk debugging
    logger.info(`Request body: ${JSON.stringify(request.body)}`);
    logger.info(`Request file: ${JSON.stringify(request.file)}`);

    // Validasi user
    const ownerId = request.user?.id;
    logger.info("Validasi user dimulai");
    if (!ownerId) {
      logger.info("Validasi user gagal: Tidak ada ID pengguna");
      return response
        .status(401)
        .json({ status: false, message: "Unauthorized: Tidak ada ID pengguna" });
    }
    logger.info("Validasi user selesai");

    // Validasi kosId
    logger.info("Validasi kosId dimulai");
    if (!kosId || isNaN(parseInt(kosId))) {
      logger.info("Validasi kosId gagal: kosId tidak valid");
      return response
        .status(400)
        .json({ status: false, message: "kosId harus berupa angka valid" });
    }
    const kosIdNumber = parseInt(kosId);
    logger.info("Validasi kosId selesai");

    // Periksa apakah kosId valid dan dimiliki oleh user
    logger.info("Pengecekan kos dimulai");
    const kos = await prisma.kos.findUnique({
      where: { id: kosIdNumber },
    });
    if (!kos) {
      logger.info(`Pengecekan kos gagal: Kos dengan ID ${kosIdNumber} tidak ditemukan`);
      return response
        .status(404)
        .json({ status: false, message: "Kos tidak ditemukan" });
    }
    if (kos.ownerId !== ownerId) {
      logger.info(`Pengecekan kos gagal: Kos ID ${kosIdNumber} bukan milik owner ID ${ownerId}`);
      return response.status(403).json({
        status: false,
        message: "Forbidden: Anda bukan pemilik kos ini",
      });
    }
    logger.info("Pengecekan kos selesai");

    // Periksa apakah image yang akan diperbarui ada
    logger.info("Pengecekan existingImage dimulai");
    const existingImage = await prisma.kosImage.findFirst({
      where: { id: Number(id) },
      include: { kos: true },
    });
    if (!existingImage) {
      logger.info(`Pengecekan existingImage gagal: Image dengan ID ${id} tidak ditemukan`);
      return response
        .status(404)
        .json({ status: false, message: "Gambar tidak ditemukan" });
    }
    logger.info("Pengecekan existingImage selesai");

    // Penanganan file upload
    logger.info("Penanganan file dimulai");
    let imagePath = existingImage.image; // Default ke gambar lama
    if (request.file) {
      if (!request.file.mimetype.startsWith("image/")) {
        logger.info("Penanganan file gagal: Tipe file tidak valid");
        return response
          .status(400)
          .json({ status: false, message: "File harus berupa gambar" });
      }
      imagePath = path.basename(request.file.path);

      // Hapus file lama jika ada dan berbeda
      if (existingImage.image && imagePath !== existingImage.image) {
        const oldImagePath = path.resolve(
          process.cwd(),
          "public",
          "kos_images",
          existingImage.image
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          logger.info(`File lama dihapus: ${oldImagePath}`);
        }
      }
    } else {
      logger.info("Penanganan file gagal: Tidak ada file diunggah");
      return response
        .status(400)
        .json({ status: false, message: "File gambar harus diunggah" });
    }
    logger.info("Penanganan file selesai");

    // Update kosImage
    logger.info("Update Prisma dimulai");
    const updatedImage = await prisma.kosImage.update({
      where: { id: Number(id) },
      data: {
        kosId: kosIdNumber,
        image: imagePath,
      },
    });
    logger.info("Update Prisma selesai");

    // Tambahkan BASE_URL ke image
    const updatedImageWithUrl = {
      ...updatedImage,
      image: `${BASE_URL}/kos_images/${updatedImage.image}`,
    };

    logger.info(`Kos image diperbarui untuk kos ID ${kosId}`);
    return response.status(200).json({
      status: true,
      data: updatedImageWithUrl,
      message: "Kos image telah diperbarui",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui";
    logger.error(`Gagal memperbarui kos image: ${message}`);
    return response.status(400).json({
      status: false,
      message: `Gagal memperbarui kos image: ${message}`,
    });
  }
};

// Di dalam fungsi deleteKosImage
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

    const basePath = path.resolve(
      process.cwd(),
      "public",
      "kos_images",
      imageName
    );
    if (fs.existsSync(basePath)) {
      fs.unlinkSync(basePath);
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
