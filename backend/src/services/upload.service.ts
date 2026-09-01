import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { cloudinary } from "@/config/cloudinary.config";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/config/logger.config";
import { env } from "@/config/env.config";

/**
 * Upload service - handles Cloudinary upload with automatic local disk storage fallback.
 * Every caller gets back a secure URL or local static URL, which is what actually gets saved
 * in Postgres (documents.file_url, payments.receipt_url, users.photo_url, settings.logo_url).
 */
export const uploadService = {
  uploadFile: async (
    fileBuffer: Buffer,
    originalName: string,
    _mimeType: string,
    folder: "documents" | "receipts" | "avatars" | "logos"
  ): Promise<{ url: string; fileName: string }> => {
    const extension = originalName.split(".").pop() || "png";
    const publicId = `${uuidv4()}.${extension}`;

    // 1. Try Cloudinary upload first
    try {
      const cloudinaryFolder = `${env.cloudinary.folder}/${folder}`;

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            public_id: publicId,
            resource_type: "auto",
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(fileBuffer);
      });

      return {
        url: result.secure_url,
        fileName: result.public_id,
      };
    } catch (error) {
      logger.warn("Cloudinary upload failed/rejected, falling back to local disk storage:", error);

      // 2. Fallback to local storage if Cloudinary fails (e.g. 403, 401, network issue)
      try {
        const uploadsDir = path.join(process.cwd(), "uploads", folder);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const localFileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(uploadsDir, localFileName);
        fs.writeFileSync(filePath, fileBuffer);

        const relativeUrl = `/uploads/${folder}/${localFileName}`;

        return {
          url: relativeUrl,
          fileName: `uploads/${folder}/${localFileName}`,
        };
      } catch (localError) {
        logger.error("Local file storage fallback failed:", localError);
        // @ts-ignore
        const details = localError?.message || "Unknown error";
        throw ApiError.internal(`File upload failed: ${details}`);
      }
    }
  },

  deleteFile: async (fileName: string): Promise<void> => {
    try {
      if (fileName.startsWith("uploads/")) {
        const filePath = path.join(process.cwd(), fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        await cloudinary.uploader.destroy(fileName);
      }
    } catch (error) {
      logger.error(`Failed to delete file ${fileName}:`, error);
    }
  },
};