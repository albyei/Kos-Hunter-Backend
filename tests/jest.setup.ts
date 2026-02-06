import { PrismaClient } from "@prisma/client";

// Mock Prisma Client
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    user: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: 1, name: "Test User", email: "test@example.com" },
        ]),
      findUnique: jest
        .fn()
        .mockResolvedValue({
          id: 1,
          name: "Test User",
          email: "test@example.com",
        }),
      create: jest
        .fn()
        .mockResolvedValue({
          id: 1,
          name: "New User",
          email: "new@example.com",
        }),
      update: jest
        .fn()
        .mockResolvedValue({
          id: 1,
          name: "Updated User",
          email: "test@example.com",
        }),
      deleteMany: jest.fn().mockResolvedValue({}), // Tambahkan untuk mencegah error
    },
    // Tambahkan model lain jika ada
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

let prisma: any; // Gunakan 'any' karena ini mock

beforeAll(() => {
  prisma = new PrismaClient(); // Inisialisasi mock
});

afterEach(() => {
  // Tidak perlu deleteMany karena data mock
  jest.clearAllMocks(); // Bersihkan mock setelah setiap tes
});

afterAll(() => {
  // Tidak perlu $disconnect untuk mock
});

// Mock middleware dan logger
jest.mock("../src/middlewares/errorHandler", () => ({
  errorHandler: (err: any, req: any, res: any, next: any) => {
    res
      .status(500)
      .json({ status: false, message: "Mocked Internal Server Error" });
  },
}));

jest.mock("../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
