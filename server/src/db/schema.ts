
import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const imagesTable = pgTable('images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Image = typeof imagesTable.$inferSelect; // For SELECT operations
export type NewImage = typeof imagesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { images: imagesTable };
