
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { uploadImage } from '../handlers/upload_image';
import { eq } from 'drizzle-orm';

// Test input for image upload
const testInput: UploadImageInput = {
  filename: 'test-image.jpg',
  original_name: 'Test Image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  width: 1920,
  height: 1080
};

describe('uploadImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload image metadata', async () => {
    const result = await uploadImage(testInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('Test Image.jpg');
    expect(result.file_path).toEqual('/uploads/test-image.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.width).toEqual(1920);
    expect(result.height).toEqual(1080);
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should save image metadata to database', async () => {
    const result = await uploadImage(testInput);

    // Query the database to verify the record was saved
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].filename).toEqual('test-image.jpg');
    expect(images[0].original_name).toEqual('Test Image.jpg');
    expect(images[0].file_path).toEqual('/uploads/test-image.jpg');
    expect(images[0].file_size).toEqual(1024000);
    expect(images[0].mime_type).toEqual('image/jpeg');
    expect(images[0].width).toEqual(1920);
    expect(images[0].height).toEqual(1080);
    expect(images[0].uploaded_at).toBeInstanceOf(Date);
  });

  it('should handle nullable width and height', async () => {
    const inputWithNullDimensions: UploadImageInput = {
      ...testInput,
      width: null,
      height: null
    };

    const result = await uploadImage(inputWithNullDimensions);

    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.id).toBeDefined();

    // Verify in database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, result.id))
      .execute();

    expect(images[0].width).toBeNull();
    expect(images[0].height).toBeNull();
  });

  it('should handle different mime types', async () => {
    const pngInput: UploadImageInput = {
      ...testInput,
      filename: 'test-image.png',
      mime_type: 'image/png'
    };

    const result = await uploadImage(pngInput);

    expect(result.mime_type).toEqual('image/png');
    expect(result.filename).toEqual('test-image.png');

    // Verify in database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, result.id))
      .execute();

    expect(images[0].mime_type).toEqual('image/png');
  });
});
