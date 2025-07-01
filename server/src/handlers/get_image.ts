
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type GetImageInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

export const getImage = async (input: GetImageInput): Promise<Image> => {
  try {
    // Query the images table for the specific image ID
    const results = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, input.id))
      .execute();

    // Check if image was found
    if (results.length === 0) {
      throw new Error(`Image with ID ${input.id} not found`);
    }

    // Return the image record (no numeric conversions needed for this schema)
    return results[0];
  } catch (error) {
    console.error('Get image failed:', error);
    throw error;
  }
};
