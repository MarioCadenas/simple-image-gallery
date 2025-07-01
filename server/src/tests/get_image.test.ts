
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type GetImageInput, type UploadImageInput } from '../schema';
import { getImage } from '../handlers/get_image';

// Test input for getting an image
const testGetInput: GetImageInput = {
  id: 1
};

// Test input for creating prerequisite image data
const testImageInput: UploadImageInput = {
  filename: 'test-image.jpg',
  original_name: 'original-test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 2048,
  mime_type: 'image/jpeg',
  width: 1024,
  height: 768
};

describe('getImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an image by ID', async () => {
    // Create prerequisite image data
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

    // Get the image
    const result = await getImage({ id: createdImage.id });

    // Validate the result
    expect(result.id).toEqual(createdImage.id);
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('original-test-image.jpg');
    expect(result.file_path).toEqual('/uploads/test-image.jpg');
    expect(result.file_size).toEqual(2048);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.width).toEqual(1024);
    expect(result.height).toEqual(768);
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should throw error when image not found', async () => {
    // Try to get non-existent image
    await expect(getImage({ id: 999 })).rejects.toThrow(/Image with ID 999 not found/i);
  });

  it('should handle image with null dimensions', async () => {
    // Create image with null width and height
    const insertResult = await db.insert(imagesTable)
      .values({
        filename: 'no-dimensions.jpg',
        original_name: 'no-dimensions.jpg',
        file_path: '/uploads/no-dimensions.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        width: null,
        height: null
      })
      .returning()
      .execute();

    const createdImage = insertResult[0];

    // Get the image
    const result = await getImage({ id: createdImage.id });

    // Validate the result
    expect(result.id).toEqual(createdImage.id);
    expect(result.filename).toEqual('no-dimensions.jpg');
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });
});
