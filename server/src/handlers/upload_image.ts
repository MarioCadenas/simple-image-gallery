
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type UploadImageInput, type Image } from '../schema';

export const uploadImage = async (input: UploadImageInput): Promise<Image> => {
  try {
    // Insert image metadata into the database
    const result = await db.insert(imagesTable)
      .values({
        filename: input.filename,
        original_name: input.original_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        width: input.width,
        height: input.height
      })
      .returning()
      .execute();

    // Return the created image record
    return result[0];
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};
