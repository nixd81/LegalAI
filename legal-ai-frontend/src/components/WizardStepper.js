import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardContext } from './WizardContext';
import ProgressIndicator from './ProgressIndicator';
import NavigationControls from './NavigationControls';
import WelcomeStep from './steps/WelcomeStep';
import UploadStep from './steps/UploadStep';
import AnalysisStep from './steps/AnalysisStep';
import ClauseBreakdownStep from './steps/ClauseBreakdownStep';
import ClauseLocationStep from './steps/ClauseLocationStep';
import ChatStep from './steps/ChatStep';

const WizardStepper = () => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepHistory, setStepHistory] = useState([0]);
  
  // Document analysis state
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [risk, setRisk] = useState("green");
  const [clauses, setClauses] = useState([]);
  const [query, setQuery] = useState("");
  const [explanations, setExplanations] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flaggedClauses, setFlaggedClauses] = useState(new Set());

  // Step definitions
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome',
      component: WelcomeStep,
      description: 'Overview of features and process'
    },
    {
      id: 'upload',
      title: 'Upload Document',
      component: UploadStep,
      description: 'Upload your legal document'
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      component: AnalysisStep,
      description: 'AI summary and risk assessment'
    },
    {
      id: 'clauses',
      title: 'Clause Breakdown',
      component: ClauseBreakdownStep,
      description: 'Detailed clause-by-clause analysis'
    },
    {
      id: 'location',
      title: 'Clause Location',
      component: ClauseLocationStep,
      description: 'Find and highlight clauses in document'
    },
    {
      id: 'chat',
      title: 'AI Assistant',
      component: ChatStep,
      description: 'Ask questions about your document'
    }
  ];

  // Navigation functions
  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setStepHistory(prev => [...prev, nextStep]);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setStepHistory(prev => [...prev, prevStep]);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    setStepHistory(prev => [...prev, stepIndex]);
  };

  const skipToEnd = () => {
    const lastStep = steps.length - 1;
    setCurrentStep(lastStep);
    setStepHistory(prev => [...prev, lastStep]);
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setStepHistory([0]);
    setFile(null);
    setText("");
    setSummary("");
    setRisk("green");
    setClauses([]);
    setQuery("");
    setExplanations({});
    setChatHistory([]);
    setLoading(false);
    setFlaggedClauses(new Set());
  };


  // Context value
  const contextValue = {
    // Current state
    currentStep,
    stepHistory,
    steps,
    
    // Document state
    file,
    setFile,
    text,
    setText,
    summary,
    setSummary,
    risk,
    setRisk,
    clauses,
    setClauses,
    query,
    setQuery,
    explanations,
    setExplanations,
    chatHistory,
    setChatHistory,
    loading,
    setLoading,
    flaggedClauses,
    setFlaggedClauses,
    
    // Navigation
    goToNext,
    goToPrevious,
    goToStep,
    skipToEnd,
    resetWizard
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-900">
        {/* Progress Indicator */}
        <ProgressIndicator />
        
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentStepComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <NavigationControls />
      </div>
    </WizardContext.Provider>
  );
};

export default WizardStepper;
