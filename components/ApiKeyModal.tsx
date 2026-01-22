
import React, { useState, useEffect } from 'react';
import { Key, Save, ShieldCheck, X, Zap } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, currentKey, onSave }) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  
  useEffect(() => {
    setKeyInput(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keyInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Key size={24} className="text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold">إعدادات المفتاح (API Key)</h2>
          </div>
          <p className="text-primary-100 text-sm">تحكم في سرعة وأداء التطبيق</p>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            <div className="flex gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-500 transition-colors" onClick={() => setKeyInput('')}>
              <div className="mt-1">
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${keyInput === '' ? 'border-primary-500' : 'border-gray-400'}`}>
                    {keyInput === '' && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                 </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">الوضع المجاني (الافتراضي)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">يعمل بشكل جيد ولكن قد يتأخر قليلاً أحياناً بسبب الضغط على الخوادم.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
               <div className="flex gap-4">
                <div className="mt-1">
                   <Zap size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    الوضع السريع (مفتاح خاص)
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">نصح به</span>
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 mb-3">
                    استخدم مفتاح Gemini الخاص بك للحصول على سرعة فائقة وبدون رسالة "الخادم مشغول".
                  </p>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="ضع مفتاح API هنا (AIza...)"
                    className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none font-mono dir-ltr text-left"
                    dir="ltr"
                  />
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
                    احصل على مفتاح مجاني من Google →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <ShieldCheck size={14} />
            <span>يتم حفظ المفتاح في متصفحك فقط ولا يرسل لأي طرف ثالث.</span>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
