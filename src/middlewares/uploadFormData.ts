import multer from "multer";

// Konfigurasi multer untuk menangani multipart/form-data tanpa file
const uploadFormData = multer({
  storage: multer.memoryStorage(), // Tidak menyimpan file
  limits: {
    fields: 10, // Batas jumlah field non-file
    fieldSize: 1024 * 1024, // Batas ukuran field (1MB)
  },
}).none(); // Hanya memproses field non-file

export default uploadFormData;
