"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Image as ImageIcon, Upload, X } from "lucide-react"

import { 
    type OrderImage as ApiOrderImage, 
    getOrderImages, 
    uploadOrderImage, 
    deleteOrderImage 
} from '@/lib/crm'; 

type OrderImage = ApiOrderImage & {
    public_id: string; 
};

interface ImageManagerProps {
    order: { id: number; [key: string]: any };
    onClose: () => void;
}

export const OrderImageManagerDialog: React.FC<ImageManagerProps> = ({ order, onClose }) => {
    const[images, setImages] = useState<OrderImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadDescription, setUploadDescription] = useState('');

    const orderId = order.id;

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedImages = await getOrderImages(orderId); 
            setImages(fetchedImages as OrderImage[]); 
        } catch (err) {
            setError(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleUpload = async () => {
        if (!uploadFile) {
            setError('Please select an image file.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            const newImage = await uploadOrderImage(orderId, uploadFile, uploadDescription); 
            setImages(prev =>[...prev, newImage as OrderImage]); 
            setUploadFile(null);
            setUploadDescription('');
            const fileInput = (document.getElementById('image-file-input') as HTMLInputElement);
            if (fileInput) fileInput.value = ''; 
        } catch (err) {
            setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (imageToDelete: OrderImage) => {
        setIsLoading(true); 
        setError('');
        try {
            await deleteOrderImage(imageToDelete.id, imageToDelete.public_id); 
            setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
        } catch (err) {
            setError(`Deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
            fetchImages(); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> 
                        Images for Order #{orderId}
                    </DialogTitle>
                </DialogHeader>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                
                {/* Image Upload Section */}
                <div className="border p-4 rounded-lg mb-4 bg-gray-50/80">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wider">Upload New Image</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input 
                            id="image-file-input"
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                            className="flex-1 bg-white"
                            disabled={isUploading}
                        />
                        <Input 
                            placeholder="Optional Description (e.g., 'Site Photo')"
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            className="flex-1 bg-white"
                            disabled={isUploading}
                        />
                        <Button onClick={handleUpload} disabled={isUploading || !uploadFile} className="sm:w-auto bg-blue-600 hover:bg-blue-700">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>

                {/* Image Gallery Section */}
                <div className="mt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wider">Existing Images ({images.length})</h4>

                    {isLoading && images.length === 0 ? ( 
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                            <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No images attached to this order yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="relative group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                    <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
                                        <img src={img.image_url} alt={img.description || `Order Image ${img.id}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-3 text-sm border-t">
                                        <p className="font-medium text-gray-900 truncate">{img.description || 'No Description'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md" disabled={isLoading}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to remove this image permanently?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(img)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 mt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isLoading || isUploading}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};