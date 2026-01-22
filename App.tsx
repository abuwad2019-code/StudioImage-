
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import Controls from './components/Controls';
import Preview from './components/Preview';
import InfoTicker from './components/InfoTicker';
import ApiKeyModal from './components/ApiKeyModal'; // New Import
import { AppState, AspectRatio, GenerationConfig, MilitaryOptions } from './types';
import { transformImage } from './services/geminiService';
import { AlertCircle, RefreshCw, WifiOff, ExternalLink, MessageCircle, Share, X, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    settings: {
      useCustomKey: false,
      customApiKey: ''
    }
  });

  // Load Settings from LocalStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('user_api_key');
    if (savedKey) {
      setState(prev => ({
        ...prev,
        settings: { useCustomKey: true, customApiKey: savedKey }
      }));
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    else setIsDarkMode(new Date().getHours() >= 18 || new Date().getHours() < 6);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (isIOS && !(window.navigator as any).standalone) setShowInstallButton(true);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isIOS]);

  const handleInstallClick = async () => {
    if (isIOS) { setShowIOSInstructions(true); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallButton(false);
      setDeferredPrompt(null);
    }
  };

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('user_api_key', key.trim());
      setState(prev => ({ ...prev, settings: { useCustomKey: true, customApiKey: key.trim() } }));
    } else {
      localStorage.removeItem('user_api_key');
      setState(prev => ({ ...prev, settings: { useCustomKey: false, customApiKey: '' } }));
    }
  };

  const handleImageSelect = (base64: string) => {
    setState(prev => ({ ...prev, error: null, image: { original: base64, generated: null } }));
  };

  const handleConfigChange = (key: keyof GenerationConfig, value: any) => {
    setState(prev => {
      const newConfig = { ...prev.config, [key]: value };
      if (key === 'gender') newConfig.style = value === 'male' ? 'civilian_suit_black' : 'women_abaya_black';
      if (key === 'category') newConfig.style = value === 'civilian' ? (newConfig.gender === 'male' ? 'civilian_suit_black' : 'women_abaya_black') : 'military_camouflage';
      return { ...prev, config: newConfig };
    });
  };

  const handleMilitaryOptionChange = (key: keyof MilitaryOptions, value: any) => {
    setState(prev => ({ ...prev, config: { ...prev.config, militaryOptions: { ...prev.config.militaryOptions, [key]: value } } }));
  };

  const handleReset = () => {
    setState(prev => ({ ...prev, isLoading: false, loadingMessage: undefined, error: null, image: null }));
  };

  const handleGenerate = async () => {
    if (!isOnline) {
      setState(prev => ({ ...prev, error: "لا يوجد اتصال بالإنترنت حالياً." }));
      return;
    }
    if (!state.image?.original) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Pass the custom key logic to the service
      const activeKey = state.settings.useCustomKey ? state.settings.customApiKey : null;
      
      const generatedImage = await transformImage(
        state.image.original,
        state.config,
        activeKey,
        (msg) => setState(prev => ({ ...prev, loadingMessage: msg }))
      );
      
      setState(prev => ({ ...prev, isLoading: false, image: { original: prev.image!.original, generated: generatedImage } }));
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message || "حدث خطأ أثناء الاتصال بالخادم" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6 flex flex-col transition-colors duration-200">
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
        isInstallable={showInstallButton} 
        onInstallClick={handleInstallClick}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasCustomKey={state.settings.useCustomKey}
      />
      
      <InfoTicker />

      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff size={16} /> <span>أنت تعمل الآن في وضع عدم الاتصال.</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">استوديو الصور الذكي</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">حوّل صورك العادية إلى رسمية باحترافية تامة باستخدام أحدث تقنيات Gemini AI.</p>
        </div>

        {state.error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3 overflow-hidden">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0">
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-sm mb-0.5">عذراً، حدث خطأ</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed break-words whitespace-normal">
                    {state.error}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleGenerate} 
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <RefreshCw size={16} />
                <span>محاولة مرة أخرى</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
             <Controls config={state.config} onConfigChange={handleConfigChange} onMilitaryOptionChange={handleMilitaryOptionChange} onGenerate={handleGenerate} isLoading={state.isLoading} loadingMessage={state.loadingMessage} hasImage={!!state.image} />
             
             <div 
               onClick={() => setIsSettingsOpen(true)}
               className={`p-5 rounded-xl border text-sm cursor-pointer transition-colors ${
                 state.settings.useCustomKey 
                 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 text-amber-800 dark:text-amber-200'
                 : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 text-blue-800 dark:text-blue-200'
               }`}
             >
               <h4 className="font-bold mb-2 flex items-center gap-2">
                 {state.settings.useCustomKey ? <Zap size={16} className="text-amber-500"/> : "💡 ملاحظة تقنية"}
                 {state.settings.useCustomKey ? "وضع الأداء العالي مفعل" : "نصيحة للأداء"}
               </h4>
               <p className="opacity-80">
                 {state.settings.useCustomKey 
                   ? "أنت تستخدم مفتاحك الخاص. السرعة الآن قصوى ولا يوجد حدود للانتظار."
                   : "أنت تستخدم الوضع المجاني. إذا واجهت رسالة 'الخادم مشغول'، يمكنك إضافة مفتاحك الخاص مجاناً للحصول على سرعة فائقة."
                 }
               </p>
             </div>
          </div>
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px]">
              {!state.image ? <ImageUpload onImageSelected={handleImageSelect} /> : <Preview data={state.image} onReset={handleReset} />}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
             <p className="text-gray-500 text-sm">تم التطوير بواسطة</p>
             <a href="https://www.facebook.com/mushir.almahsani" target="_blank" className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-bold bg-gray-50 dark:bg-gray-700 px-5 py-2.5 rounded-full border border-gray-200 shadow-sm">
              <span>المهندس/ مشير المحسني</span> <ExternalLink size={16} />
            </a>
          </div>
          <a href="https://wa.me/967781836277" target="_blank" className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold shadow-md">
            <MessageCircle size={24} fill="white" />
            <div className="text-right">
              <div className="text-[11px] font-normal">تواصل لطلب تطبيقك الخاص</div>
              <div className="text-lg leading-none" dir="ltr">+967 781 836 277</div>
            </div>
          </a>
        </div>
      </footer>

      {/* Settings Modal */}
      <ApiKeyModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentKey={state.settings.customApiKey}
        onSave={handleSaveApiKey}
      />

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 relative">
            <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 left-4 text-gray-400"><X size={24} /></button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl mx-auto flex items-center justify-center"><img src="/icon.svg" className="w-10" /></div>
              <h3 className="text-lg font-bold">تثبيت على الآيفون</h3>
              <div className="space-y-4 text-right text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                <p>1. اضغط على زر <Share size={14} className="inline"/> مشاركة</p>
                <p>2. اختر إضافة إلى الصفحة الرئيسية</p>
                <p>3. اضغط إضافة</p>
              </div>
              <button onClick={() => setShowIOSInstructions(false)} className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl">فهمت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
