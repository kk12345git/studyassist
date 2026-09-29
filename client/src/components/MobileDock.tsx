import React from 'react';
import { LayoutDashboard, BookOpen, Calendar, FileText, Target, Sparkles } from 'lucide-react';

interface MobileDockProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'subjects', label: 'Units', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'exam', label: 'Exam', icon: Target },
    { id: 'ai', label: 'AI Tutor', icon: Sparkles, isAi: true }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 backdrop-blur-2xl px-1.5 py-1.5 safe-area-pb shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all active:scale-95 min-w-[50px] ${
                isActive
                  ? tab.isAi
                    ? 'text-pink-400 font-bold'
                    : 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? tab.isAi
                      ? 'bg-pink-500/20 shadow-sm shadow-pink-500/30'
                      : 'bg-indigo-500/20 shadow-sm shadow-indigo-500/30'
                    : ''
                }`}
              >
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${tab.isAi && !isActive ? 'text-indigo-400' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
