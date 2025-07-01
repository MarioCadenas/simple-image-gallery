
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type DeleteImageInput, type UploadImageInput } from '../schema';
import { deleteImage } from '../handlers/delete_image';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Test input for creating an image
const testImageInput: UploadImageInput = {
  filename: 'test-image.jpg',
  original_name: 'original-test.jpg',
  file_path: '/tmp/test-uploads/test-image.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  width: 800,
  height: 600
};

describe('deleteImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an image and return success response', async () => {
    // Create test image record
    const insertResult = await db.insert(imagesTable)
      .values({
        filename: testImageInput.filename,
        original_name: testImageInput.original_name,
        file_path: testImageInput.file_path,
        file_size: testImageInput.file_size,
        mime_type: testImageInput.mime_type,
        width: testImageInput.width,
        height: testImageInput.height
      })
      .returning()
      .execute();

    const createdImage = insertResult[0];

    // Create physical test file
    await mkdir('/tmp/test-uploads', { recursive: true });
    await writeFile(testImageInput.file_path, 'test image content');

    const deleteInput: DeleteImageInput = { id: createdImage.id };
    const result = await deleteImage(deleteInput);

    // Verify response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Image with ID ${createdImage.id} deleted successfully`);

    // Verify image is deleted from database
    const remainingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, createdImage.id))
      .execute();

    expect(remainingImages).toHaveLength(0);

    // Verify physical file is deleted
    expect(existsSync(testImageInput.file_path)).toBe(false);
  });

  it('should throw error when image does not exist', async () => {
    const deleteInput: DeleteImageInput = { id: 999 };

    await expect(deleteImage(deleteInput)).rejects.toThrow(/Image with ID 999 not found/i);
  });

  it('should delete database record even if physical file deletion fails', async () => {
    // Create test image record with non-existent file path
    const insertResult = await db.insert(imagesTable)
      .values({
        filename: testImageInput.filename,
        original_name: testImageInput.original_name,
        file_path: '/nonexistent/path/test-image.jpg',
        file_size: testImageInput.file_size,
        mime_type: testImageInput.mime_type,
        width: testImageInput.width,
        height: testImageInput.height
      })
      .returning()
      .execute();

    const createdImage = insertResult[0];
    const deleteInput: DeleteImageInput = { id: createdImage.id };

    // Should not throw error even though file doesn't exist
    const result = await deleteImage(deleteInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Image with ID ${createdImage.id} deleted successfully`);

    // Verify image is still deleted from database
    const remainingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, createdImage.id))
      .execute();

    expect(remainingImages).toHaveLength(0);
  });

  it('should handle multiple image deletions correctly', async () => {
    // Create two test images
    const insertResult = await db.insert(imagesTable)
      .values([
        {
          filename: 'image1.jpg',
          original_name: 'original1.jpg',
          file_path: '/tmp/test-uploads/image1.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          width: 800,
          height: 600
        },
        {
          filename: 'image2.png',
          original_name: 'original2.png',
          file_path: '/tmp/test-uploads/image2.png',
          file_size: 2048,
          mime_type: 'image/png',
          width: 1024,
          height: 768
        }
      ])
      .returning()
      .execute();

    const [image1, image2] = insertResult;

    // Create physical test files
    await mkdir('/tmp/test-uploads', { recursive: true });
    await writeFile('/tmp/test-uploads/image1.jpg', 'test image 1 content');
    await writeFile('/tmp/test-uploads/image2.png', 'test image 2 content');

    // Delete first image
    await deleteImage({ id: image1.id });

    // Verify first image is deleted
    const remainingAfterFirst = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, image1.id))
      .execute();
    expect(remainingAfterFirst).toHaveLength(0);
    expect(existsSync('/tmp/test-uploads/image1.jpg')).toBe(false);

    // Verify second image still exists
    const secondImageExists = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, image2.id))
      .execute();
    expect(secondImageExists).toHaveLength(1);
    expect(existsSync('/tmp/test-uploads/image2.png')).toBe(true);

    // Delete second image
    await deleteImage({ id: image2.id });

    // Verify second image is also deleted
    const remainingAfterSecond = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, image2.id))
      .execute();
    expect(remainingAfterSecond).toHaveLength(0);
    expect(existsSync('/tmp/test-uploads/image2.png')).toBe(false);
  });
});
