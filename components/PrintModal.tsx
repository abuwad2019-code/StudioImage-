import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, FileDown, Image as ImageIcon, Loader2, LayoutGrid, Settings2, Maximize2, Minimize2, ZoomIn } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PrintModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
}

const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (ورق عادي)', desc: '210 × 297 مم' },
  '4x6_inch': { width: 102, height: 152, label: '4x6 (ورق صور)', desc: '10 × 15 سم' },
  '5x7_inch': { width: 127, height: 178, label: '5x7 (وسط)', desc: '13 × 18 سم' },
};

const PHOTO_SIZES = {
  '4x6_cm': { width: 40, height: 60, label: '4 × 6 سم', desc: 'قياسي للمعاملات' },
  '3.5x4.5_cm': { width: 35, height: 45, label: '3.5 × 4.5 سم', desc: 'جواز سفر' },
  '2x2_inch': { width: 51, height: 51, label: '5 × 5 سم', desc: 'تأشيرة أمريكية' },
  '3x4_cm': { width: 30, height: 40, label: '3 × 4 سم', desc: 'صغير' },
};

const PrintModal: React.FC<PrintModalProps> = ({ imageSrc, isOpen, onClose }) => {
  const [paper, setPaper] = useState<keyof typeof PAPER_SIZES>('A4');
  const [photoSize, setPhotoSize] = useState<keyof typeof PHOTO_SIZES>('4x6_cm');
  const [margin, setMargin] = useState(5); // mm
  const [gap, setGap] = useState(2); // mm
  const [count, setCount] = useState(1);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'pdf' | 'img' | null>(null);

  // Ref for the hidden element used for generation
  const captureRef = useRef<HTMLDivElement>(null);

  const calculateLayout = () => {
    const pW = orientation === 'portrait' ? PAPER_SIZES[paper].width : PAPER_SIZES[paper].height;
    const pH = orientation === 'portrait' ? PAPER_SIZES[paper].height : PAPER_SIZES[paper].width;
    const iW = PHOTO_SIZES[photoSize].width;
    const iH = PHOTO_SIZES[photoSize].height;

    const availW = pW - (margin * 2);
    const availH = pH - (margin * 2);

    if (availW < iW || availH < iH) return { cols: 0, rows: 0, max: 0 };

    const cols = Math.floor((availW + gap) / (iW + gap));
    const rows = Math.floor((availH + gap) / (iH + gap));
    const max = cols * rows;

    return { cols, rows, max };
  };

  const layout = calculateLayout();

  useEffect(() => {
    if (layout.max > 0) {
      // Auto-fill max if it was previously maxed or if count is 1
      if (count === 1 || count > layout.max) {
         setCount(layout.max);
      }
    }
  }, [paper, photoSize, margin, gap, orientation]);
  
  // Ensure count doesn't exceed new max when layout changes
  useEffect(() => {
     if (count > layout.max && layout.max > 0) {
         setCount(layout.max);
     }
  }, [layout.max]);

  const currentPaper = PAPER_SIZES[paper];
  const currentPhoto = PHOTO_SIZES[photoSize];
  
  const paperWidthMM = orientation === 'portrait' ? currentPaper.width : currentPaper.height;
  const paperHeightMM = orientation === 'portrait' ? currentPaper.height : currentPaper.width;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!captureRef.current) return;
    setIsProcessing(true);
    setProcessingType('pdf');

    try {
      // Wait for a frame to ensure render
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // High resolution (approx 192dpi)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [currentPaper.width, currentPaper.height]
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, paperWidthMM, paperHeightMM);
      pdf.save(`print-layout-${photoSize}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("حدث خطأ أثناء إنشاء ملف PDF");
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    setIsProcessing(true);
    setProcessingType('img');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(captureRef.current, {
        scale: 3, // Very High resolution (approx 300dpi)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `print-sheet-${photoSize}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Image Generation failed", err);
      alert("حدث خطأ أثناء إنشاء الصورة");
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  if (!isOpen) return null;

  const PaperContent = () => (
    <div 
      style={{
        width: `${paperWidthMM}mm`,
        height: `${paperHeightMM}mm`,
        padding: `${margin}mm`,
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.cols}, ${currentPhoto.width}mm)`,
        gridTemplateRows: `repeat(${layout.rows}, ${currentPhoto.height}mm)`,
        gap: `${gap}mm`,
        alignContent: 'start',
        justifyContent: 'start',
        backgroundColor: 'white',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden' // Ensure content doesn't bleed
      }}
    >
      {Array.from({ length: Math.min(count, layout.max) }).map((_, i) => (
        <div key={i} style={{ 
            width: `${currentPhoto.width}mm`, 
            height: `${currentPhoto.height}mm`, 
            position: 'relative',
            backgroundColor: '#f9fafb',
            outline: '1px dashed #d1d5db', // Light outline for cutting
            // Use background-image for robust aspect ratio handling without stretching
            backgroundImage: `url(${imageSrc})`,
            backgroundPosition: 'center',
            backgroundSize: fitMode, // 'cover' or 'contain'
            backgroundRepeat: 'no-repeat',
            WebkitPrintColorAdjust: 'exact', // Force print background
            printColorAdjust: 'exact'
          }}>
          {/* Professional Crop Marks (Visual Aid) */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-gray-400 opacity-40"></div>
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-gray-400 opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-gray-400 opacity-40"></div>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-gray-400 opacity-40"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-gray-800 md:rounded-2xl w-full max-w-7xl h-full md:h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Sidebar (Settings) */}
        <div className="w-full md:w-96 bg-gray-50 dark:bg-gray-900 flex flex-col border-l border-gray-200 dark:border-gray-700 h-[40%] md:h-full order-2 md:order-1">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
             <div>
               <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <Settings2 className="text-primary-600" size={20} />
                 إعدادات التجهيز
               </h2>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors md:hidden"><X /></button>
          </div>

          {/* Scrollable Settings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* Section 1: Paper & Photo Size */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <LayoutGrid size={14} />
                  <span>الورق والمقاسات</span>
               </div>
               
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                 <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">نوع الورقة</label>
                    <select 
                      value={paper} 
                      onChange={(e) => setPaper(e.target.value as any)}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(PAPER_SIZES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label} ({val.desc})</option>
                      ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">مقاس الصورة</label>
                    <select 
                      value={photoSize} 
                      onChange={(e) => setPhotoSize(e.target.value as any)}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(PHOTO_SIZES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label} - {val.desc}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                     <button 
                       onClick={() => setOrientation('portrait')}
                       className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${orientation === 'portrait' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                     >
                       طولي (Portrait)
                     </button>
                     <button 
                       onClick={() => setOrientation('landscape')}
                       className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${orientation === 'landscape' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                     >
                       عرضي (Landscape)
                     </button>
                 </div>
               </div>
            </div>

            {/* Section 2: Image Fit (CRITICAL FOR ASPECT RATIO) */}
             <div className="space-y-3">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <ZoomIn size={14} />
                  <span>وضع الصورة (Fit)</span>
               </div>
               <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex">
                   <button 
                     onClick={() => setFitMode('cover')}
                     className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${fitMode === 'cover' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     title="يملأ الإطار بالكامل (قد يقص الأطراف للحفاظ على الأبعاد)"
                   >
                     <Maximize2 size={16} />
                     <span>ملء الإطار (Cover)</span>
                   </button>
                   <button 
                     onClick={() => setFitMode('contain')}
                     className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${fitMode === 'contain' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     title="يظهر الصورة بالكامل (قد تظهر هوامش بيضاء)"
                   >
                     <Minimize2 size={16} />
                     <span>كامل الصورة (Contain)</span>
                   </button>
               </div>
            </div>

            {/* Section 3: Distribution */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <LayoutGrid size={14} />
                  <span>التوزيع</span>
               </div>
               
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">عدد الصور</span>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setCount(Math.max(1, count - 1))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center text-lg font-bold">-</button>
                       <input 
                          type="number" 
                          value={count} 
                          onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 text-center bg-transparent font-bold"
                       />
                       <button onClick={() => setCount(Math.min(layout.max, count + 1))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center text-lg font-bold">+</button>
                    </div>
                 </div>
                 <button 
                    onClick={() => setCount(layout.max)}
                    className="w-full py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                 >
                    ملء الصفحة بالكامل ({layout.max} صورة)
                 </button>

                 <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-500">الهامش: {margin} مم</span>
                      <span className="text-xs text-gray-500">التباعد: {gap} مم</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" 
                      value={margin} onChange={(e) => setMargin(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3 shrink-0">
             
             <button
                onClick={handleDownloadPDF}
                disabled={isProcessing}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
             >
                {isProcessing && processingType === 'pdf' ? (
                   <Loader2 size={20} className="animate-spin" />
                ) : (
                   <FileDown size={20} />
                )}
                <span>تحميل ملف الطباعة (PDF)</span>
             </button>

             <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={handleDownloadImage}
                  disabled={isProcessing}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
               >
                  {isProcessing && processingType === 'img' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  <span>صورة (JPG)</span>
               </button>
               <button
                  onClick={handleBrowserPrint}
                  disabled={isProcessing}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
               >
                  <Printer size={16} />
                  <span>طباعة مباشرة</span>
               </button>
             </div>
          </div>
        </div>

        {/* Right: Preview Area (The "Preview Page") */}
        <div className="w-full md:flex-1 bg-gray-200/50 dark:bg-gray-950 relative overflow-hidden flex flex-col h-[60%] md:h-full order-1 md:order-2">
           {/* Toolbar */}
           <div className="absolute top-0 left-0 w-full z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
              <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                معاينة مباشرة
              </span>
              <button 
                onClick={onClose}
                className="pointer-events-auto bg-white/90 dark:bg-gray-800/90 hover:bg-red-500 hover:text-white p-2 rounded-full text-gray-700 dark:text-white backdrop-blur-sm transition-all shadow-sm hidden md:flex"
              >
                <X size={24} />
              </button>
           </div>

           {/* Canvas Container */}
           <div className="flex-1 overflow-auto flex items-center justify-center p-8">
              <div 
                 className="bg-white shadow-2xl transition-all duration-300 origin-center select-none scale-[0.4] md:scale-[0.6]"
                 style={{
                   width: `${paperWidthMM}mm`,
                   height: `${paperHeightMM}mm`,
                   // Transform handled by className above to allow media queries
                 }}
              >
                 <PaperContent />
              </div>
           </div>
           
           <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md py-2 px-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
             تأكد من اختيار وضع "ملء الإطار" لقص الزوائد، أو "كامل الصورة" لمنع القص.
           </div>
        </div>
      </div>

      {/* Hidden Render Area for Capture */}
      <div 
        ref={captureRef}
        style={{
           position: 'fixed',
           left: '-9999px',
           top: '-9999px',
           width: `${paperWidthMM}mm`,
           height: `${paperHeightMM}mm`,
           backgroundColor: 'white',
           zIndex: -50,
        }}
      >
        <PaperContent />
      </div>

      {/* Browser Print Portal */}
      {ReactDOM.createPortal(
        <PaperContent />,
        document.getElementById('print-mount')!
      )}
    </div>
  );
};

export default PrintModal;