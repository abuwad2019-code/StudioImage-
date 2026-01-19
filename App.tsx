import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import Controls from './components/Controls';
import Preview from './components/Preview';
import InfoTicker from './components/InfoTicker';
import { AppState, AspectRatio, GenerationConfig, MilitaryOptions } from './types';
import { transformImage } from './services/geminiService';
import { AlertCircle, RefreshCw, WifiOff, Wifi, ExternalLink, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [state, setState] = useState<AppState>({
    isLoading: false,
    error: null,
    image: null,
    config: {
      gender: 'male',
      ratio: AspectRatio.PORTRAIT,
      category: 'civilian',
      style: 'civilian_suit_black',
      promptModifier: '',
      militaryOptions: {
        country: 'generic',
        hasBeret: false,
        beretImage: null,
        hasRank: false,
        rankImage: null
      }
    },
  });

  // Handle Theme Logic (Time based + Persistence)
  useEffect(() => {
    // 1. Check Local Storage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // 2. Check Time (6 PM to 6 AM is Night)
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      setIsDarkMode(isNight);
    }
  }, []);

  // Apply Theme Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImageSelect = (base64: string) => {
    setState(prev => ({
      ...prev,
      error: null,
      image: {
        original: base64,
        generated: null
      }
    }));
  };

  const handleConfigChange = (key: keyof GenerationConfig, value: any) => {
    setState(prev => {
      // Create a copy of the config with the new value applied
      const newConfig = { ...prev.config, [key]: value };

      // Handle dependent logic

      // 1. If Gender changes
      if (key === 'gender') {
        // If in civilian mode, switch style to the default for that gender
        if (newConfig.category === 'civilian') {
          newConfig.style = value === 'male' ? 'civilian_suit_black' : 'women_abaya_black';
        }
        // Military styles are currently unisex/shared in the UI logic, so we keep the current style
      }

      // 2. If Category changes
      if (key === 'category') {
        if (value === 'civilian') {
           // Switch to default civilian style for the current gender
           newConfig.style = newConfig.gender === 'male' ? 'civilian_suit_black' : 'women_abaya_black';
        } else if (value === 'military') {
           // Switch to default military style
           newConfig.style = 'military_camouflage';
        }
      }

      return {
        ...prev,
        config: newConfig
      };
    });
  };

  const handleMilitaryOptionChange = (key: keyof MilitaryOptions, value: any) => {
    setState(prev => ({
      ...prev,
      config: { 
        ...prev.config, 
        militaryOptions: {
          ...prev.config.militaryOptions,
          [key]: value
        }
      }
    }));
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      image: null,
    }));
  };

  const handleGenerate = async () => {
    if (!isOnline) {
      setState(prev => ({
        ...prev,
        error: "لا يوجد اتصال بالإنترنت. تتطلب معالجة الصور بالذكاء الاصطناعي اتصالاً نشطاً."
      }));
      return;
    }

    if (!state.image?.original) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const generatedImage = await transformImage(
        state.image.original,
        state.config
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        image: {
          original: prev.image!.original,
          generated: generatedImage
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "حدث خطأ غير متوقع"
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6 flex flex-col transition-colors duration-200">
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <InfoTicker />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>أنت الآن غير متصل بالإنترنت. يمكنك تصفح التطبيق، لكن المعالجة تتطلب اتصالاً.</span>
        </div>
      )}
      {isOnline && state.error === "لا يوجد اتصال بالإنترنت. تتطلب معالجة الصور بالذكاء الاصطناعي اتصالاً نشطاً." && (
         <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top flex items-center justify-center gap-2">
          <Wifi size={16} />
          <span>عاد الاتصال بالإنترنت! يمكنك المحاولة الآن.</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow w-full">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">
            استوديو الصور الشخصية الاحترافي
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
            حوّل أي صورة عادية إلى صورة رسمية عالية الجودة. يدعم الآن العبايات، البدلات الملونة، والزي العسكري لمختلف الدول.
          </p>
        </div>

        {state.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 rounded-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 w-full">
              <AlertCircle size={24} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold mb-1">تنبيه</p>
                <p className="text-sm opacity-90 break-words leading-relaxed whitespace-pre-wrap">{state.error}</p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="shrink-0 flex items-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
            >
              <RefreshCw size={16} />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Controls & Upload - on Desktop) */}
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
             <Controls 
                config={state.config}
                onConfigChange={handleConfigChange}
                onMilitaryOptionChange={handleMilitaryOptionChange}
                onGenerate={handleGenerate}
                isLoading={state.isLoading}
                hasImage={!!state.image}
             />
             
             <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 transition-colors">
               <h4 className="font-bold mb-2">تعليمات هامة</h4>
               <ul className="list-disc list-inside space-y-2 opacity-80">
                 <li>للصور <strong>العسكرية</strong>: اختر الدولة ليتم تطبيق التمويه وشعار البريه (القبعة) المناسب.</li>
                 <li>في حال كان شعار البريه غير دقيق، يمكنك الآن <strong>رفع صورة البريه</strong> يدوياً.</li>
                 <li>عند رفع <strong>الرتبة</strong>: تأكد أن صورة الرتبة واضحة ومقصوصة بشكل جيد للحصول على أفضل دمج.</li>
               </ul>
             </div>
          </div>

          {/* Right Column (Preview/Result) */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] transition-colors">
              {!state.image ? (
                 <ImageUpload onImageSelected={handleImageSelect} />
              ) : (
                 <Preview 
                   data={state.image} 
                   onReset={handleReset} 
                 />
              )}
            </div>
          </div>

        </div>
      </main>

      <footer className="mt-12 py-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-8 text-center">
          
          <div className="flex flex-col items-center gap-3">
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">تم تطوير هذا الوكيل الذكي بواسطة</p>
             <a 
              href="https://www.facebook.com/mushir.almahsani?mibextid=ZbWKwL" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-gray-800 dark:text-gray-200 font-bold hover:text-blue-700 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-700 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm"
            >
              <span>المهندس/ مشير المحسني</span>
              <ExternalLink size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </a>
          </div>

          <a 
            href="https://wa.me/967781836277" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba56] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-1 group"
          >
            <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
              <MessageCircle size={24} fill="white" className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-[11px] opacity-90 font-normal">تواصل لطلب تطبيقك الخاص</div>
              <div className="text-lg leading-none font-bold font-sans mt-0.5" dir="ltr">+967 781 836 277</div>
            </div>
          </a>
          
          <p className="text-xs text-gray-400 dark:text-gray-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;