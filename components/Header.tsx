import React, { useState, useEffect } from 'react';
import { Camera, User, Download, Share, X, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function Header({ isDarkMode, toggleTheme }: HeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Android/Chrome install handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
              <User size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block transition-colors">
              الاستوديو الذكي للتصوير
            </h1>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight sm:hidden transition-colors">
              الاستوديو الذكي
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                aria-label="تبديل الثيم"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {(isInstallable || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-primary-200 dark:border-primary-800"
              >
                <Download size={16} />
                <span>تثبيت</span>
              </button>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block transition-colors">
              مدعوم بواسطة Gemini AI
            </div>
          </div>
        </div>
      </header>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 transition-colors">
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                 <img src="/icon.svg" className="w-10 h-10" alt="App Icon" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">تثبيت التطبيق على الآيفون</h3>
              
              <div className="space-y-4 text-right text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full font-bold text-xs shrink-0 dark:text-white">1</span>
                  <p>اضغط على زر <span className="font-bold text-blue-600 dark:text-blue-400 inline-flex items-center mx-1"><Share size={14} className="ml-1"/> مشاركة</span> في أسفل المتصفح</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full font-bold text-xs shrink-0 dark:text-white">2</span>
                  <p>اختر <span className="font-bold text-gray-800 dark:text-gray-200">إضافة إلى الصفحة الرئيسية</span> (Add to Home Screen)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full font-bold text-xs shrink-0 dark:text-white">3</span>
                  <p>اضغط على <span className="font-bold">إضافة</span> في الزاوية العلوية</p>
                </div>
              </div>

              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}