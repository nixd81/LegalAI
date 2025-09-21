import React from 'react';
import { motion } from 'framer-motion';
import { useWizard } from './WizardContext';

const ProgressIndicator = () => {
  const { currentStep, steps } = useWizard();

  return (
    <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Legal AI Assistant</h1>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-1">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-gray-700 text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive || isCompleted
                      ? 'bg-white/20'
                      : 'bg-gray-600'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden flex-1 ml-4">
            <div className="flex items-center space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
