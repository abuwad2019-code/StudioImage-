
import React from 'react';
import { User, Download, Moon, Sun, Key } from 'lucide-react';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  isInstallable: boolean;
  onInstallClick: () => void;
  onOpenSettings: () => void;
  hasCustomKey: boolean;
}

export default function Header({ isDarkMode, toggleTheme, isInstallable, onInstallClick, onOpenSettings, hasCustomKey }: HeaderProps) {
  return (
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
        
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Settings / API Key Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              hasCustomKey 
                ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
                : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title="إعدادات المفتاح"
          >
            <Key size={16} className={hasCustomKey ? "fill-amber-500 text-amber-600" : ""} />
            <span className="hidden sm:inline">{hasCustomKey ? 'وضع خاص' : 'مجاني'}</span>
          </button>

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

          {/* Smart Install Button */}
          {isInstallable && (
            <button
              onClick={onInstallClick}
              className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-primary-200 dark:border-primary-800 animate-in fade-in"
            >
              <Download size={16} />
              <span className="hidden sm:inline">تثبيت</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
