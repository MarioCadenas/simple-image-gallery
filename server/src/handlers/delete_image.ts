
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type DeleteImageInput, type SuccessResponse } from '../schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';

export const deleteImage = async (input: DeleteImageInput): Promise<SuccessResponse> => {
  try {
    // First, find the image record to get the file path
    const imageRecords = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, input.id))
      .execute();

    if (imageRecords.length === 0) {
      throw new Error(`Image with ID ${input.id} not found`);
    }

    const image = imageRecords[0];

    // Delete the physical file from the filesystem
    try {
      await unlink(image.file_path);
    } catch (fileError) {
      // Log the file deletion error but continue with database cleanup
      console.error('Failed to delete physical file:', fileError);
    }

    // Delete the image record from the database
    await db.delete(imagesTable)
      .where(eq(imagesTable.id, input.id))
      .execute();

    return {
      success: true,
      message: `Image with ID ${input.id} deleted successfully`
    };
  } catch (error) {
    console.error('Image deletion failed:', error);
    throw error;
  }
};
