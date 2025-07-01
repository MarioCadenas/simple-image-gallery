
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Image, UploadImageInput } from '../../server/src/schema';

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Load images on component mount
  const loadImages = useCallback(async () => {
    try {
      const result = await trpc.getImages.query();
      setImages(result);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('❌ Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setIsLoading(true);
    setUploadStatus('📤 Uploading image...');

    try {
      // In a real app, you'd upload the file to a server first
      // For this demo, we'll simulate the file path and dimensions
      const imageDimensions = await getImageDimensions(file);
      
      const uploadData: UploadImageInput = {
        filename: `${Date.now()}_${file.name}`,
        original_name: file.name,
        file_path: `/uploads/${Date.now()}_${file.name}`,
        file_size: file.size,
        mime_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        width: imageDimensions.width,
        height: imageDimensions.height
      };

      const newImage = await trpc.uploadImage.mutate(uploadData);
      setImages((prev: Image[]) => [newImage, ...prev]);
      setUploadStatus('✅ Image uploaded successfully!');
      
      // Clear the input
      event.target.value = '';
      
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadStatus('❌ Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  // Get image dimensions from file
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: number) => {
    try {
      await trpc.deleteImage.mutate({ id: imageId });
      setImages((prev: Image[]) => prev.filter((img: Image) => img.id !== imageId));
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📸 Picture Gallery</h1>
          <p className="text-gray-600">Upload and manage your beautiful images</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">🖼️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Images</h3>
              <p className="text-gray-500 mb-4">Support for JPEG, PNG, GIF, and WebP files</p>
            </div>
            
            <Input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="max-w-md mx-auto mb-4"
            />
            
            {uploadStatus && (
              <div className="mt-4">
                <Badge variant={uploadStatus.includes('❌') ? 'destructive' : 'default'}>
                  {uploadStatus}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        {images.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Yet</h3>
            <p className="text-gray-500">Upload your first image to get started!</p>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Your Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image: Image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div 
                    className="aspect-square bg-gray-100 flex items-center justify-center relative group"
                    onClick={() => setSelectedImage(image)}
                  >
                    {/* Since this is a demo with stub data, we'll show a placeholder */}
                    <div className="text-4xl">🖼️</div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary">Click to view</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm truncate mb-1" title={image.original_name}>
                      {image.original_name}
                    </h3>
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(image.file_size)}</span>
                      {image.width && image.height && (
                        <span>{image.width} × {image.height}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {image.uploaded_at.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <AlertDialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center justify-between">
                  <span className="truncate mr-4">{selectedImage.original_name}</span>
                  <Badge variant="outline">{selectedImage.mime_type}</Badge>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>File Size:</strong> {formatFileSize(selectedImage.file_size)}
                    </div>
                    <div>
                      <strong>Uploaded:</strong> {selectedImage.uploaded_at.toLocaleDateString()}
                    </div>
                    {selectedImage.width && selectedImage.height && (
                      <>
                        <div>
                          <strong>Dimensions:</strong> {selectedImage.width} × {selectedImage.height}
                        </div>
                        <div>
                          <strong>Aspect Ratio:</strong> {(selectedImage.width / selectedImage.height).toFixed(2)}:1
                        </div>
                      </>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-8 my-4">
                {/* Placeholder for actual image - in real app, this would be an img tag */}
                <div className="text-center">
                  <div className="text-8xl mb-4">🖼️</div>
                  <p className="text-gray-500">Image preview would appear here</p>
                  <p className="text-xs text-gray-400 mt-2">Path: {selectedImage.file_path}</p>
                </div>
              </div>

              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>Close</AlertDialogCancel>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">🗑️ Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Image</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedImage.original_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteImage(selectedImage.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default App;
