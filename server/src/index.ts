
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  uploadImageInputSchema, 
  getImageInputSchema, 
  deleteImageInputSchema 
} from './schema';
import { uploadImage } from './handlers/upload_image';
import { getImages } from './handlers/get_images';
import { getImage } from './handlers/get_image';
import { deleteImage } from './handlers/delete_image';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Upload image metadata after file upload
  uploadImage: publicProcedure
    .input(uploadImageInputSchema)
    .mutation(({ input }) => uploadImage(input)),
  
  // Get all images for gallery view
  getImages: publicProcedure
    .query(() => getImages()),
  
  // Get single image by ID
  getImage: publicProcedure
    .input(getImageInputSchema)
    .query(({ input }) => getImage(input)),
  
  // Delete image by ID
  deleteImage: publicProcedure
    .input(deleteImageInputSchema)
    .mutation(({ input }) => deleteImage(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
