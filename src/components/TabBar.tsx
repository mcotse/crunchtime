import React from 'react';
import { HomeIcon, ClockIcon, BarChart3Icon, ListChecksIcon } from 'lucide-react';
import { motion } from 'framer-motion';
interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
  {
    id: 'home',
    icon: HomeIcon,
    label: 'Home'
  },
  {
    id: 'activity',
    icon: ClockIcon,
    label: 'Activity'
  },
  {
    id: 'analytics',
    icon: BarChart3Icon,
    label: 'Analytics'
  },
  {
    id: 'polls',
    icon: ListChecksIcon,
    label: 'Polls'
  }];

  return (
    <div className="tab-bar fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-4 z-40">
      <div className="max-w-md mx-auto flex justify-between items-center h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className="relative flex flex-col items-center justify-center w-12 h-full space-y-1">

              <div
                className={`relative p-2 rounded-xl transition-colors duration-200 ${isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>

                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive &&
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-1/2 w-1 h-1 bg-black dark:bg-white rounded-full"
                  style={{
                    translateX: '-50%'
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30
                  }} />

                }
              </div>
            </button>);

        })}
      </div>
    </div>);

}