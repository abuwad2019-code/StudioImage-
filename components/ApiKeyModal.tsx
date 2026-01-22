
import React, { useState, useEffect } from 'react';
import { Key, Save, ShieldCheck, X, Zap, Server, CreditCard, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, currentKey, onSave }) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [mode, setMode] = useState<'free' | 'pro'>(currentKey ? 'pro' : 'free');
  
  useEffect(() => {
    setKeyInput(currentKey);
    setMode(currentKey ? 'pro' : 'free');
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (mode === 'free') {
      onSave('');
    } else {
      onSave(keyInput);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 p-2 rounded-lg">
              <Server size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">إعدادات الخادم والأداء</h2>
          </div>
          <p className="text-gray-400 text-sm">اختر طريقة الاتصال المناسبة لاحتياجاتك</p>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Option 1: Free Shared */}
          <div 
            onClick={() => { setMode('free'); setKeyInput(''); }}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              mode === 'free' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${mode === 'free' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                   <div className="w-3 h-3 bg-current rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">الخادم العام (مجاني)</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-medium">مشترك</span>
                    <span>سرعة عادية</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-9">
              يستخدم هذا الخيار مفتاح نظام مشترك بين جميع الزوار. قد تظهر رسالة "الخادم مشغول" (Error 429) في أوقات الذروة.
            </p>
          </div>

          {/* Option 2: Pro/Private */}
          <div 
            onClick={() => setMode('pro')}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              mode === 'pro' 
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${mode === 'pro' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                   <Zap size={12} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    خادم خاص / مدفوع (PRO)
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                     <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 dark:border-amber-700">أداء عالي</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-9 mb-4">
              استخدم مفتاحك الخاص. لتجنب أي توقف، ننصح باستخدام مفتاح مربوط بحساب <span className="font-bold text-gray-700 dark:text-gray-300">مدفوع (Pay-as-you-go)</span>.
            </p>

            {mode === 'pro' && (
              <div className="mr-8 animate-in slide-in-from-top-2 fade-in">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="لصق مفتاح API الخاص بك هنا (AIza...)"
                  className="w-full text-sm p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none font-mono dir-ltr text-left shadow-inner"
                  dir="ltr"
                  autoFocus
                />
                
                <div className="mt-3 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>
                    ملاحظة: المفاتيح الشخصية <b>المجانية</b> (Free Tier) لها حدود أيضاً وقد تتوقف مؤقتاً. للحصول على خدمة مستمرة، يجب تفعيل الفوترة (Billing) في Google Cloud.
                  </p>
                </div>

                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline mt-3 font-medium">
                  <CreditCard size={12} />
                  <span>انقر هنا لإدارة مفاتيحك وتفعيل الدفع في Google</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-2">
            <ShieldCheck size={14} />
            <span>يتم حفظ المفتاح في جهازك محلياً ومشفر ولا يشارك مع أحد.</span>
          </div>

          <button 
            onClick={handleSave}
            disabled={mode === 'pro' && keyInput.length < 10}
            className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              mode === 'pro' && keyInput.length < 10
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30'
            }`}
          >
            <Save size={18} />
            <span>{mode === 'pro' ? 'حفظ وتفعيل الوضع الخاص' : 'استخدام الخادم العام'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
