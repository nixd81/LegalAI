import React from 'react';
import { motion } from 'framer-motion';
import { useWizard } from './WizardContext';

const NavigationControls = () => {
  const { 
    currentStep, 
    steps, 
    goToNext, 
    goToPrevious, 
    resetWizard 
  } = useWizard();

  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = currentStep < steps.length - 1;
  const canGoPrevious = currentStep > 0;

  return (
    <div className="sticky bottom-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and Reset */}
          <div className="flex items-center space-x-3">
            {canGoPrevious && (
              <motion.button
                onClick={goToPrevious}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            )}

            <motion.button
              onClick={resetWizard}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Reset</span>
            </motion.button>
          </div>

          {/* Right side - Next button */}
          <div className="flex items-center">
            {canGoNext && (
              <motion.button
                onClick={goToNext}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            )}

            {isLastStep && (
              <motion.div
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Complete</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationControls;
