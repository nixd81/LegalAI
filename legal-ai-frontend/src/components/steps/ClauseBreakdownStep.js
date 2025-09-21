import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import AnimatedCard from '../AnimatedCard';
import { useWizard } from '../WizardContext';

const ClauseBreakdownStep = () => {
  const { 
    clauses, 
    explanations, 
    setExplanations, 
    flaggedClauses, 
    setFlaggedClauses,
    goToNext 
  } = useWizard();

  const [expandedClause, setExpandedClause] = useState(null);

  const explainClause = async (clauseText, idx) => {
    const formData = new FormData();
    formData.append("clause", clauseText);
    
    try {
      const res = await fetch("http://localhost:8000/explain/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setExplanations((prev) => ({
        ...prev,
        [idx]: data.explanation || "Error explaining clause.",
      }));
    } catch (error) {
      console.error('Explanation error:', error);
      setExplanations((prev) => ({
        ...prev,
        [idx]: "Error explaining clause.",
      }));
    }
  };

  const toggleFlagClause = (idx) => {
    const newFlagged = new Set(flaggedClauses);
    if (newFlagged.has(idx)) {
      newFlagged.delete(idx);
    } else {
      newFlagged.add(idx);
    }
    setFlaggedClauses(newFlagged);
  };

  const ClauseItem = ({ clause, index }) => {
    const isExpanded = expandedClause === index;
    const isFlagged = flaggedClauses.has(index);
    const hasExplanation = explanations[index];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
      >
        {/* Clause Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              {clause.title || `Clause ${index + 1}`}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <span>Clause {index + 1}</span>
              {isFlagged && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                  Flagged
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => toggleFlagClause(index)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isFlagged 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isFlagged ? "Remove flag" : "Flag for review"}
              data-onboarding="flag-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </motion.button>
            
            <motion.button
              onClick={() => setExpandedClause(isExpanded ? null : index)}
              className="p-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Clause Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="prose prose-sm max-w-none text-white">
                  <ReactMarkdown>{clause.text}</ReactMarkdown>
                </div>
              </div>

              {/* Explanation Section */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => explainClause(clause.text, index)}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {hasExplanation ? "Update Explanation" : "Explain This Clause"}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {hasExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20"
                    >
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2">AI Explanation:</h4>
                      <div className="prose prose-sm max-w-none text-white">
                        <ReactMarkdown>{explanations[index]}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Clause-by-Clause Analysis
        </h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Review each clause in detail. Click to expand, flag important clauses, 
          and get AI explanations for anything you don't understand.
        </p>
      </motion.div>

      {/* Flagged Clauses Summary */}
      {flaggedClauses.size > 0 && (
        <AnimatedCard
          delay={0.2}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          }
          title="Flagged Clauses"
          className="mb-8"
        >
          <div className="flex items-center space-x-2 text-white">
            <span className="text-2xl font-bold text-red-400">{flaggedClauses.size}</span>
            <span>clause{flaggedClauses.size !== 1 ? 's' : ''} flagged for review</span>
          </div>
          <p className="text-white/70 text-sm mt-2">
            These clauses will be easily accessible in the chat assistant
          </p>
        </AnimatedCard>
      )}

      {/* Clauses List */}
      {clauses.length > 0 ? (
        <div className="space-y-6" data-onboarding="clause-list">
          {clauses.map((clause, index) => (
            <ClauseItem key={index} clause={clause} index={index} />
          ))}
        </div>
      ) : (
        <AnimatedCard
          delay={0.3}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="No Clauses Found"
          className="mb-8"
        >
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-white/70">
              No clauses were extracted from your document. Please try uploading a different document.
            </p>
          </div>
        </AnimatedCard>
      )}

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center"
      >
        <motion.button
          onClick={goToNext}
          className="btn-primary px-8 py-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue to Clause Location
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ClauseBreakdownStep;
