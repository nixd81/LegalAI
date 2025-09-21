import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useWizard } from '../WizardContext';

const AnalysisStep = () => {
  const { 
    summary, 
    risk, 
    loading, 
    goToNext 
  } = useWizard();

  const getRiskColor = (risk) => {
    switch (risk) {
      case "red":
        return "bg-red-500";
      case "yellow":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getRiskText = (risk) => {
    switch (risk) {
      case "red":
        return "High Risk";
      case "yellow":
        return "Medium Risk";
      default:
        return "Low Risk";
    }
  };

  const getRiskDescription = (risk) => {
    switch (risk) {
      case "red":
        return "This document contains potentially problematic clauses that require careful review";
      case "yellow":
        return "This document has some areas of concern that should be reviewed";
      default:
        return "This document appears to be relatively standard with low risk factors";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          AI Analysis Complete
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Your document has been analyzed. Review the summary and risk assessment below.
        </p>
      </motion.div>

      {/* Risk Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gray-800/50 rounded-lg p-8 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Risk Assessment</h2>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Risk Indicator */}
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full ${getRiskColor(risk)} flex items-center justify-center text-white`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {getRiskText(risk)}
              </h3>
              <p className="text-gray-300">
                {getRiskDescription(risk)}
              </p>
            </div>
          </div>

          {/* Risk Bar */}
          <div className="flex-1">
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <motion.div
                className={`h-3 rounded-full ${getRiskColor(risk)}`}
                initial={{ width: 0 }}
                animate={{ 
                  width: risk === "red" ? "90%" : risk === "yellow" ? "60%" : "30%"
                }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gray-800/50 rounded-lg p-8 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-6">AI Summary</h2>
        <div className="bg-gray-700/50 rounded-lg p-6 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Analyzing document...</p>
              </div>
            </div>
          ) : summary ? (
            <div className="text-white leading-relaxed">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>No analysis available. Please upload a document first.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center"
      >
        <motion.button
          onClick={goToNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue to Clause Breakdown
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AnalysisStep;
