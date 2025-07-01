
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { getImages } from '../handlers/get_images';

// Test image data
const testImage1: UploadImageInput = {
  filename: 'test1.jpg',
  original_name: 'Test Image 1.jpg',
  file_path: '/uploads/test1.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  width: 800,
  height: 600
};

const testImage2: UploadImageInput = {
  filename: 'test2.png',
  original_name: 'Test Image 2.png',
  file_path: '/uploads/test2.png',
  file_size: 2048,
  mime_type: 'image/png',
  width: 1200,
  height: 900
};

describe('getImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no images exist', async () => {
    const result = await getImages();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all images', async () => {
    // Insert test images
    await db.insert(imagesTable)
      .values([testImage1, testImage2])
      .execute();

    const result = await getImages();

    expect(result).toHaveLength(2);
    expect(result[0].filename).toEqual(expect.any(String));
    expect(result[0].original_name).toEqual(expect.any(String));
    expect(result[0].file_path).toEqual(expect.any(String));
    expect(result[0].file_size).toEqual(expect.any(Number));
    expect(result[0].mime_type).toEqual(expect.any(String));
    expect(result[0].uploaded_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return images ordered by uploaded_at descending', async () => {
    // Insert first image
    const firstImage = await db.insert(imagesTable)
      .values(testImage1)
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second image
    const secondImage = await db.insert(imagesTable)
      .values(testImage2)
      .returning()
      .execute();

    const result = await getImages();

    expect(result).toHaveLength(2);
    // Newest first (second image should be first)
    expect(result[0].id).toEqual(secondImage[0].id);
    expect(result[1].id).toEqual(firstImage[0].id);
    expect(result[0].uploaded_at >= result[1].uploaded_at).toBe(true);
  });

  it('should include all required fields', async () => {
    await db.insert(imagesTable)
      .values(testImage1)
      .execute();

    const result = await getImages();

    expect(result).toHaveLength(1);
    const image = result[0];
    
    expect(image.id).toEqual(expect.any(Number));
    expect(image.filename).toEqual('test1.jpg');
    expect(image.original_name).toEqual('Test Image 1.jpg');
    expect(image.file_path).toEqual('/uploads/test1.jpg');
    expect(image.file_size).toEqual(1024);
    expect(image.mime_type).toEqual('image/jpeg');
    expect(image.width).toEqual(800);
    expect(image.height).toEqual(600);
    expect(image.uploaded_at).toBeInstanceOf(Date);
  });
});
