import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import Controls from './components/Controls';
import Preview from './components/Preview';
import InfoTicker from './components/InfoTicker';
import { AppState, AspectRatio, GenerationConfig, MilitaryOptions } from './types';
import { transformImage } from './services/geminiService';
import { AlertCircle, RefreshCw, WifiOff, Wifi, ExternalLink, MessageCircle, Download, Share, X } from 'lucide-react';

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  const [state, setState] = useState<AppState>({
    isLoading: false,
    loadingMessage: undefined,
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

  // Handle Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      setIsDarkMode(isNight);
    }
  }, []);

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

  // PWA Installation Logic
  useEffect(() => {
    // 1. Check iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 2. Check Standalone (Is already installed?)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) {
      setShowInstallButton(false);
      return; 
    }

    // 3. Handle Android/Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
      console.log('App successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show button for iOS if not standalone (iOS doesn't fire beforeinstallprompt)
    if (isIosDevice && !isStandalone) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      setDeferredPrompt(null);
    }
  };

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
      const newConfig = { ...prev.config, [key]: value };

      if (key === 'gender') {
        if (newConfig.category === 'civilian') {
          newConfig.style = value === 'male' ? 'civilian_suit_black' : 'women_abaya_black';
        }
      }

      if (key === 'category') {
        if (value === 'civilian') {
           newConfig.style = newConfig.gender === 'male' ? 'civilian_suit_black' : 'women_abaya_black';
        } else if (value === 'military') {
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
      loadingMessage: undefined,
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

    setState(prev => ({ ...prev, isLoading: true, error: null, loadingMessage: undefined }));

    try {
      const generatedImage = await transformImage(
        state.image.original,
        state.config,
        (msg) => setState(prev => ({ ...prev, loadingMessage: msg }))
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingMessage: undefined,
        image: {
          original: prev.image!.original,
          generated: generatedImage
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingMessage: undefined,
        error: error.message || "حدث خطأ غير متوقع"
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6 flex flex-col transition-colors duration-200">
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        isInstallable={showInstallButton}
        onInstallClick={handleInstallClick}
      />
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
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
             <Controls 
                config={state.config}
                onConfigChange={handleConfigChange}
                onMilitaryOptionChange={handleMilitaryOptionChange}
                onGenerate={handleGenerate}
                isLoading={state.isLoading}
                loadingMessage={state.loadingMessage}
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
          
          {/* Prominent Footer Install Button */}
          {showInstallButton && (
            <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700">
               <button 
                 onClick={handleInstallClick}
                 className="w-full bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 p-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group"
               >
                 <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors">
                    <Download size={28} />
                 </div>
                 <div className="text-right">
                    <div className="text-sm opacity-80 font-medium">تجربة أفضل بدون إنترنت</div>
                    <div className="text-xl font-bold">تثبيت التطبيق على جهازك</div>
                 </div>
               </button>
            </div>
          )}

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
    </div>
  );
};

export default App;