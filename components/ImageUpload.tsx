import React, { useCallback } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageSelected(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);

  return (
    <div className="w-full">
      <label 
        htmlFor="image-upload" 
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group animate-pulse-hover"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 text-primary-500 dark:text-primary-400" />
          </div>
          <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">اضغط لرفع صورة</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG أو JPEG</p>
        </div>
        <input 
          id="image-upload" 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
      
      <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-2">
            <ImageIcon size={16} />
            <span>يفضل صورة واضحة الوجه</span>
        </div>
        <div className="flex items-center gap-2">
            <ImageIcon size={16} />
            <span>إضاءة جيدة</span>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;