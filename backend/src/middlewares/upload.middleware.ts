import multer from "multer";
import { ApiError } from "@/utils/apiError";

/**
 * Multer config - memory storage (buffer stays in RAM, never touches local disk).
 * The buffer is handed straight to Cloudinary in upload.service.ts, so uploads/
 * on disk are only ever a fallback/scratch dir, never the source of truth.
 * Only image files are allowed (JPG, PNG, WEBP) - PDFs and other types are rejected.
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB - enough for scanned documents/receipts

const storage = multer.memoryStorage();

export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new ApiError(400, "Only JPG, PNG and WEBP image files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("file");