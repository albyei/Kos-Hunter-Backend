// import { Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";
// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import fs from "fs";
// import logger from "../utils/logger";
// import { BASE_URL } from "../global";

// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: number;
//     name: string;
//     email: string;
//     role: string;
//     iat?: number;
//     exp?: number;
//   };
// }

// const prisma = new PrismaClient({ errorFormat: "pretty" });

// export const createKos = async (
//   request: AuthenticatedRequest,
//   response: Response
// ) => {
//   try {
//     const { name, address, description, pricePerMonth, gender } = request.body;
//     const ownerId = request.user?.id;
//     if (!ownerId) {
//       return response
//         .status(401)
//         .json({ status: false, message: "Unauthorized: No user ID provided" });
//     }

//     const newKos = await prisma.kos.create({
//       data: {
//         uuid: uuidv4(),
//         name: name.trim(),
//         address: address.trim(),
//         description: description ? description.trim() : null,
//         pricePerMonth: parseInt(pricePerMonth),
//         gender,
//         ownerId,
//       },
//     });

//     logger.info(`Kos created: ${name} by user ID ${ownerId}`);
//     return response.status(201).json({
//       status: true,
//       data: newKos,
//       message: "Kos has been created",
//     });
//   } catch (error: unknown) {
//     const message =
//       error instanceof Error ? error.message : "Unknown error occurred";
//     logger.error(`Failed to create kos: ${message}`);
//     return response.status(400).json({
//       status: false,
//       message: `Failed to create kos: ${message}`,
//     });
//   }
// };

// export const getAllKos = async (request: Request, response: Response) => {
//   try {
//     const { search, minPrice, maxPrice, gender, facilities } = request.query;
//     const where: any = {};

//     if (search) {
//       where.name = { contains: search.toString().toLowerCase() }; // Ubah ke huruf kecil
//     }
//     if (minPrice && !isNaN(parseInt(minPrice.toString()))) {
//       where.pricePerMonth = { gte: parseInt(minPrice.toString()) };
//     }
//     if (maxPrice && !isNaN(parseInt(maxPrice.toString()))) {
//       where.pricePerMonth = {
//         ...where.pricePerMonth,
//         lte: parseInt(maxPrice.toString()),
//       };
//     }
//     if (gender && ["MALE", "FEMALE", "ALL"].includes(gender.toString())) {
//       where.gender = gender.toString();
//     }
//     if (facilities) {
//       where.facilities = {
//         some: {
//           facility: { in: (facilities as string).split(",") },
//         },
//       };
//     }

//     const kosList = await prisma.kos.findMany({
//       where,
//       include: {
//         images: true,
//         facilities: true,
//         reviews: true,
//       },
//     });

//     logger.info(`Kos list retrieved: ${JSON.stringify(kosList)}`);
//     return response.status(200).json({
//       status: true,
//       data: kosList,
//       message: "Kos list retrieved successfully",
//     });
//   } catch (error: unknown) {
//     const message =
//       error instanceof Error ? error.message : "Unknown error occurred";
//     logger.error(`Failed to retrieve kos list: ${message}`);
//     return response.status(400).json({
//       status: false,
//       message: `Failed to retrieve kos list: ${message}`,
//     });
//   }
// };

// export const getKosById = async (request: Request, response: Response) => {
//   try {
//     const { id } = request.params; // Ambil ID dari parameter URL

//     // Validasi ID
//     if (!id) {
//       return response
//         .status(400)
//         .json({ status: false, message: "Kos ID is required" });
//     }

//     const parsedId = parseInt(id); // Konversi ID ke number
//     if (isNaN(parsedId)) {
//       return response
//         .status(400)
//         .json({ status: false, message: "Invalid Kos ID format" });
//     }

//     // Cari kos berdasarkan ID
//     const kos = await prisma.kos.findUnique({
//       where: { id: parsedId },
//       include: {
//         images: true,
//         facilities: true,
//         reviews: true,
//       },
//     });

//     // Jika kos tidak ditemukan
//     if (!kos) {
//       return response
//         .status(404)
//         .json({ status: false, message: "Kos not found" });
//     }

//     logger.info(`Kos retrieved: ID ${parsedId}`);
//     return response.status(200).json({
//       status: true,
//       data: kos,
//       message: "Kos retrieved successfully",
//     });
//   } catch (error: unknown) {
//     const message =
//       error instanceof Error ? error.message : "Unknown error occurred";
//     logger.error(`Failed to retrieve kos: ${message}`);
//     return response.status(400).json({
//       status: false,
//       message: `Failed to retrieve kos: ${message}`,
//     });
//   }
// };

// export const updateKos = async (
//   request: AuthenticatedRequest,
//   response: Response
// ) => {
//   try {
//     const { id } = request.params;
//     const { name, address, description, pricePerMonth, gender } = request.body;
//     const ownerId = request.user?.id;

//     // Validasi dasar
//     if (!id) {
//       return response
//         .status(400)
//         .json({ status: false, message: "Kos ID is required" });
//     }

//     if (!ownerId) {
//       return response
//         .status(401)
//         .json({ status: false, message: "Unauthorized: No user ID provided" });
//     }

//     // Cek apakah kos ada dan milik user
//     const kos = await prisma.kos.findUnique({
//       where: { id: parseInt(id) },
//     });

//     if (!kos) {
//       return response
//         .status(404)
//         .json({ status: false, message: "Kos not found" });
//     }

//     if (kos.ownerId !== ownerId) {
//       return response.status(403).json({
//         status: false,
//         message: "Forbidden: You are not the owner of this kos",
//       });
//     }

//     // Data yang akan diupdate
//     const updateData: any = {};
//     if (name) updateData.name = name.trim();
//     if (address) updateData.address = address.trim();
//     if (description !== undefined)
//       updateData.description = description ? description.trim() : null;
//     if (pricePerMonth !== undefined)
//       updateData.pricePerMonth = parseInt(pricePerMonth);
//     if (gender) updateData.gender = gender;

//     // Update kos
//     const updatedKos = await prisma.kos.update({
//       where: { id: parseInt(id) },
//       data: updateData,
//       include: {
//         images: true,
//         facilities: true,
//         reviews: true,
//       },
//     });

//     logger.info(`Kos updated: ID ${id} by user ID ${ownerId}`);
//     return response.status(200).json({
//       status: true,
//       data: updatedKos,
//       message: "Kos has been updated successfully",
//     });
//   } catch (error: unknown) {
//     const message =
//       error instanceof Error ? error.message : "Unknown error occurred";
//     logger.error(`Failed to update kos: ${message}`);
//     return response.status(400).json({
//       status: false,
//       message: `Failed to update kos: ${message}`,
//     });
//   }
// };

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

    const newKos = await prisma.kos.create({
      data: {
        uuid: uuidv4(),
        name: name.trim(),
        address: address.trim(),
        description: description ? description.trim() : null,
        pricePerMonth: parseInt(pricePerMonth),
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
    const { search, minPrice, maxPrice, gender, facilities } = request.query;
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
    if (gender && ["MALE", "FEMALE", "ALL"].includes(gender.toString())) {
      where.gender = gender.toString();
    }
    if (facilities) {
      where.facilities = {
        some: {
          facility: { in: (facilities as string).split(",") },
        },
      };
    }

    const kosList = await prisma.kos.findMany({
      where,
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

    // Pastikan reviews selalu array dan user memiliki default
    const formattedKosList = kosList.map((kos) => ({
      ...kos,
      reviews: kos.reviews.map((review) => ({
        ...review,
        user: review.user || { name: "Pengguna Anonim" },
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
