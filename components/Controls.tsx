import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio, ClothingStyle, ClothingCategory, MilitaryOptions, Gender, Country } from '../types';
import { Wand2, Check, Upload, Trash2, Shield, User, WifiOff, CheckCircle2, Loader2, HardHat } from 'lucide-react';

interface ControlsProps {
  config: {
    gender: Gender;
    ratio: AspectRatio;
    category: ClothingCategory;
    style: ClothingStyle;
    militaryOptions: MilitaryOptions;
  };
  onConfigChange: (key: any, value: any) => void;
  onMilitaryOptionChange: (key: keyof MilitaryOptions, value: any) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasImage: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  config,
  onConfigChange,
  onMilitaryOptionChange,
  onGenerate,
  isLoading,
  hasImage
}) => {
  const rankInputRef = useRef<HTMLInputElement>(null);
  const beretInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);
  
  const ratios = [
    { value: AspectRatio.PORTRAIT, label: '4x6', sub: 'رأسي' },
    { value: AspectRatio.SQUARE, label: 'مربع', sub: '1:1' },
    { value: AspectRatio.LANDSCAPE, label: 'أفقي', sub: 'مشهد' },
  ];

  // Define styles based on Gender
  const civilianStylesMen = [
    { id: 'civilian_suit_black', label: 'بدلة سوداء', color: 'bg-gray-900' },
    { id: 'civilian_suit_blue', label: 'بدلة كحلي', color: 'bg-blue-900' },
    { id: 'civilian_suit_grey', label: 'بدلة رمادي', color: 'bg-gray-500' },
    { id: 'civilian_traditional', label: 'زي شعبي', color: 'bg-amber-700' },
  ];

  const civilianStylesWomen = [
    { id: 'women_abaya_black', label: 'عباية سوداء', color: 'bg-black' },
    { id: 'women_abaya_colored', label: 'عباية ملونة', color: 'bg-[#d2b48c]' },
    { id: 'women_formal_hijab', label: 'رسمي مع حجاب', color: 'bg-slate-600' },
  ];

  const militaryStyles = [
    { id: 'military_camouflage', label: 'تمويه عسكري', color: 'bg-green-700' },
    { id: 'military_formal', label: 'تشريفات رسمي', color: 'bg-blue-800' },
    { id: 'military_special_forces', label: 'قوات خاصة', color: 'bg-gray-900' },
    { id: 'military_airforce', label: 'قوات جوية', color: 'bg-sky-700' },
  ];

  const countries: {id: Country, label: string, emoji: string}[] = [
    { id: 'yemen', label: 'اليمن', emoji: '🇾🇪' },
    { id: 'saudi', label: 'السعودية', emoji: '🇸🇦' },
    { id: 'egypt', label: 'مصر', emoji: '🇪🇬' },
    { id: 'usa', label: 'أمريكا', emoji: '🇺🇸' },
    { id: 'uae', label: 'الإمارات', emoji: '🇦🇪' },
    { id: 'jordan', label: 'الأردن', emoji: '🇯🇴' },
    { id: 'generic', label: 'عام', emoji: '🌍' },
  ];

  const currentStyles = config.category === 'military' 
    ? militaryStyles 
    : (config.gender === 'male' ? civilianStylesMen : civilianStylesWomen);

  const handleRankUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onMilitaryOptionChange('rankImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBeretUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onMilitaryOptionChange('beretImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isGenerateDisabled = !hasImage || isLoading || (config.category === 'military' && config.militaryOptions.hasRank && !config.militaryOptions.rankImage) || !isOnline;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8 transition-colors">
      
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
         <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
         <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">إعدادات الصورة</h3>
      </div>
      
      {/* Gender Selection - Segmented Control */}
      <div>
         <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">الجنس</label>
         <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
           <button
             onClick={() => onConfigChange('gender', 'male')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
               config.gender === 'male' 
                 ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                 : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
             }`}
           >
             <span>رجل</span>
           </button>
           <button
             onClick={() => onConfigChange('gender', 'female')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
               config.gender === 'female' 
                 ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-300 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                 : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
             }`}
           >
             <span>امرأة</span>
           </button>
         </div>
      </div>

      {/* Category Tabs - Segmented Control */}
      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">نوع الزي</label>
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onConfigChange('category', 'civilian');
            }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              config.category === 'civilian' 
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
            }`}
          >
            <User size={18} />
            <span>مدني</span>
          </button>
          <button
            onClick={() => {
              onConfigChange('category', 'military');
            }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              config.category === 'military' 
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
            }`}
          >
            <Shield size={18} />
            <span>عسكري</span>
          </button>
        </div>
      </div>

      {/* Styles Grid - Improved Selection */}
      <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">
          الموديل واللون
        </label>
        <div className="space-y-2.5">
          {currentStyles.map((style) => {
            const isSelected = config.style === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onConfigChange('style', style.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full shadow-inner ${style.color} border-2 ${isSelected ? 'border-primary-200 dark:border-primary-700' : 'border-gray-100 dark:border-gray-600'}`}></div>
                  <span className={`text-sm font-bold ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {style.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Military Country Selection - Improved Grid */}
      {config.category === 'military' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
           <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">دولة الزي العسكري</label>
           <div className="grid grid-cols-2 gap-2.5">
             {countries.map((c) => {
               const isSelected = config.militaryOptions.country === c.id;
               return (
                 <button
                   key={c.id}
                   onClick={() => onMilitaryOptionChange('country', c.id)}
                   className={`relative flex items-center gap-3 p-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                     isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 text-primary-900 dark:text-white ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-800 z-10'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                   }`}
                 >
                   <span className="text-2xl">{c.emoji}</span>
                   <span>{c.label}</span>
                   {isSelected && (
                     <CheckCircle2 size={16} className="absolute top-2 left-2 text-primary-600 dark:text-primary-400" />
                   )}
                 </button>
               );
             })}
           </div>
        </div>
      )}

      {/* Military Specific Options */}
      {config.category === 'military' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in">
          
          {/* Beret Section */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.militaryOptions.hasBeret ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                 {config.militaryOptions.hasBeret && <Check size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                checked={config.militaryOptions.hasBeret}
                onChange={(e) => onMilitaryOptionChange('hasBeret', e.target.checked)}
                className="hidden"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                 إضافة بريه (قبعة مع شعار {countries.find(c => c.id === config.militaryOptions.country)?.label})
              </span>
            </label>

            {/* Beret Upload (Optional) */}
            {config.militaryOptions.hasBeret && (
              <div className="mt-3 ml-8 animate-in slide-in-from-top-2">
                 {!config.militaryOptions.beretImage ? (
                   <button 
                     onClick={() => beretInputRef.current?.click()}
                     className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                   >
                     <Upload size={12} />
                     <span>(اختياري) رفع صورة بريه مخصصة</span>
                   </button>
                 ) : (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 w-fit">
                       <img src={config.militaryOptions.beretImage} alt="Beret" className="w-8 h-8 rounded object-contain bg-gray-50 dark:bg-gray-800" />
                       <span className="text-xs text-green-600 dark:text-green-400 font-medium">صورة البريه جاهزة</span>
                       <button onClick={() => onMilitaryOptionChange('beretImage', null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                         <Trash2 size={14} />
                       </button>
                    </div>
                 )}
                 <input 
                    ref={beretInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleBeretUpload}
                  />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer mb-3 group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.militaryOptions.hasRank ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                 {config.militaryOptions.hasRank && <Check size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                checked={config.militaryOptions.hasRank}
                onChange={(e) => onMilitaryOptionChange('hasRank', e.target.checked)}
                className="hidden"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">إضافة رتبة عسكرية</span>
            </label>

            {config.militaryOptions.hasRank && (
              <div className="mt-2 animate-in slide-in-from-top-2">
                {!config.militaryOptions.rankImage ? (
                  <div 
                    onClick={() => rankInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-white dark:hover:bg-gray-700 transition-all group"
                  >
                    <div className="bg-white dark:bg-gray-700 p-2 rounded-full w-10 h-10 mx-auto mb-2 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                        <Upload className="h-5 w-5 text-gray-400 group-hover:text-primary-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block">اضغط لرفع صورة الرتبة</span>
                    <input 
                      ref={rankInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleRankUpload}
                    />
                  </div>
                ) : (
                  <div className="relative border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-white dark:bg-gray-700 flex items-center gap-3 shadow-sm">
                    <img 
                      src={config.militaryOptions.rankImage} 
                      alt="Rank" 
                      className="w-12 h-12 object-contain rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">تم رفع الرتبة</p>
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                         <CheckCircle2 size={12} />
                         <span>جاهزة للدمج</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onMilitaryOptionChange('rankImage', null)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Aspect Ratio */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">
          أبعاد الصورة
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ratios.map((item) => {
            const isSelected = config.ratio === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onConfigChange('ratio', item.value)}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[10px] opacity-75">{item.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg transition-all shadow-lg ${
            isGenerateDisabled
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed shadow-none opacity-70'
              : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>جاري المعالجة...</span>
            </>
          ) : !isOnline ? (
             <>
               <WifiOff size={24} />
               <span>في انتظار الاتصال...</span>
             </>
          ) : (
            <>
              <Wand2 size={24} />
              <span>تحويل الصورة الآن</span>
            </>
          )}
        </button>
        {config.category === 'military' && config.militaryOptions.hasRank && !config.militaryOptions.rankImage && hasImage && isOnline && (
             <p className="text-xs text-red-500 mt-3 text-center font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">يرجى رفع صورة الرتبة للمتابعة</p>
        )}
      </div>
    </div>
  );
};

export default Controls;