import React from 'react';
import { motion } from 'framer-motion';

const FuturisticHeader = () => {
  return (
    <div className="py-6 header-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md logo-badge flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3l6 3v5c0 4-4 7-6 10-2-3-6-6-6-10V6l6-3z" fill="#BE9A60"/>
              <path d="M12 6l3 1.5V11c0 2.5-2 4.2-3 6-1-1.8-3-3.5-3-6V7.5L12 6z" fill="#FFE0E9"/>
              <path d="M7 12h10" stroke="#434343" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">ClauseMate</h1>
          </div>
        </div>
        <div />
      </div>
    </div>
  );
};

export default FuturisticHeader;


