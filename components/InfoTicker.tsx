import React from 'react';
import { Sparkles } from 'lucide-react';

const InfoTicker: React.FC = () => {
  // Define content once to reuse
  const TickerContent = () => (
    <>
      <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
        🌸 🌺 المطور يتبرأ إلى الله من أي استخدام سيء للتطبيق
      </span>
      <span className="flex items-center gap-2 font-bold text-yellow-300">
         <Sparkles size={14} />
         مرحباً بك في استوديو الصور الذكي!
      </span>
      <span>📸 للحصول على أفضل نتيجة: استخدم صورة واضحة بإضاءة جيدة، ويفضل أن يكون الوجه مواجهاً للكاميرا.</span>
      <span>👔 يمكنك الاختيار بين الزي المدني (رسمي/شبابي) أو الزي العسكري (مع إضافة الرتب).</span>
      <span>⚡ تتم المعالجة باستخدام الذكاء الاصطناعي وقد تستغرق بضع ثوانٍ.</span>
      <span>🖼️ سيقوم التطبيق بإزالة الخلفية تلقائياً وتوحيدها باللون الأبيض.</span>
      <span>✨ تأكد من الاتصال بالإنترنت لضمان عمل المعالجة.</span>
    </>
  );

  return (
    <div className="bg-gradient-to-r from-primary-700 to-primary-600 dark:from-primary-900 dark:to-primary-800 text-white overflow-hidden py-2 relative z-40 border-b border-primary-500 dark:border-primary-700 shadow-sm ticker-container">
      {/* 
        Force LTR direction for the scrolling container to ensure translateX(-100%) works as expected (moving left).
        This fixes the gap issue in RTL mode where the transform origin might be misinterpreted or start/end points misaligned.
        The text inside retains RTL directionality naturally.
      */}
      <div className="flex w-full overflow-hidden select-none" dir="ltr">
         <div className="animate-ticker flex items-center gap-12 px-6 font-medium text-sm tracking-wide shrink-0 whitespace-nowrap min-w-full justify-around">
            <TickerContent />
         </div>
         <div className="animate-ticker flex items-center gap-12 px-6 font-medium text-sm tracking-wide shrink-0 whitespace-nowrap min-w-full justify-around">
            <TickerContent />
         </div>
      </div>
    </div>
  );
};

export default InfoTicker;