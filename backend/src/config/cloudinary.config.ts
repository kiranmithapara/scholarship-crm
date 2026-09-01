import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.config";
import { logger } from "./logger.config";

/**
 * Cloudinary configuration - used for storing all uploaded images (documents, avatars, logos).
 * We NEVER store uploaded files locally or in PostgreSQL - only the secure URL returned by Cloudinary
 * gets saved in the database (documents.file_url, users.photo_url, settings.logo_url, etc).
 */
console.log( env.cloudinary.cloudName);
cloudinary.config({
    
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

logger.info("Cloudinary configured successfully.");

export { cloudinary };