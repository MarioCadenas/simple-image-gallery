
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type Image } from '../schema';
import { desc } from 'drizzle-orm';

export const getImages = async (): Promise<Image[]> => {
  try {
    const results = await db.select()
      .from(imagesTable)
      .orderBy(desc(imagesTable.uploaded_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch images:', error);
    throw error;
  }
};
