import React, { useState } from 'react';
import { Download, RefreshCw, X, Printer } from 'lucide-react';
import { ProcessedImage } from '../types';
import PrintModal from './PrintModal';

interface PreviewProps {
  data: ProcessedImage;
  onReset: () => void;
}

const Preview: React.FC<PreviewProps> = ({ data, onReset }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleDownload = () => {
    if (data.generated) {
      const link = document.createElement('a');
      link.href = data.generated;
      link.download = 'formal-photo-gemini.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">الصورة الأصلية</h3>
            </div>
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              <img 
                src={data.original} 
                alt="Original" 
                className="w-full h-full object-cover animate-fade-in"
              />
            </div>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-primary-700 dark:text-primary-300">النتيجة الرسمية</h3>
              {data.generated && (
                 <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                   تم بنجاح
                 </span>
              )}
            </div>
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border-2 border-primary-100 dark:border-primary-900 shadow-inner">
               {data.generated ? (
                  <img 
                    src={data.generated} 
                    alt="Generated" 
                    className="w-full h-full object-cover animate-fade-in"
                  />
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse mb-2"></div>
                      <p className="text-sm">في انتظار المعالجة...</p>
                  </div>
               )}
            </div>
          </div>
        </div>

        {data.generated && (
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 fade-in duration-500">
             
             <button 
               onClick={() => setIsPrintModalOpen(true)}
               className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-md hover:shadow-lg mb-2"
             >
               <Printer size={22} />
               <span>تجهيز للطباعة</span>
             </button>

             <div className="flex flex-col sm:flex-row gap-3">
               <button 
                 onClick={handleDownload}
                 className="flex-1 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
               >
                 <Download size={20} />
                 <span>تحميل</span>
               </button>
               
               <button 
                 onClick={onReset}
                 className="flex-1 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
               >
                 <RefreshCw size={20} />
                 <span>جديد</span>
               </button>
             </div>
          </div>
        )}
        
        {!data.generated && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                 <button 
                  onClick={onReset}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center gap-1 mx-auto"
                >
                  <X size={16} />
                  <span>إلغاء الصورة الحالية</span>
                </button>
            </div>
        )}
      </div>

      {/* Print Modal */}
      {data.generated && (
        <PrintModal 
          isOpen={isPrintModalOpen} 
          onClose={() => setIsPrintModalOpen(false)} 
          imageSrc={data.generated} 
        />
      )}
    </>
  );
};

export default Preview;