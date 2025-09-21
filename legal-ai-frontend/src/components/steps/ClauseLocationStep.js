import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../WizardContext';
import { 
  semanticMatcher, 
  analyzeQuery, 
  semanticSearch, 
  getConfidenceStyling, 
  formatConfidenceScore,
  generateSuggestions,
  isSemanticMatchingAvailable 
} from '../../utils/semanticMatcher';
import AnimatedCard from '../AnimatedCard';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const ClauseLocationStep = () => {
  const { 
    file, 
    query, 
    clauses, 
    flaggedClauses, 
    goToNext 
  } = useWizard();

  const [highlightingQuery, setHighlightingQuery] = useState(query);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightedPDF, setHighlightedPDF] = useState(null);
  const [semanticMatches, setSemanticMatches] = useState([]);
  const [queryAnalysis, setQueryAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [semanticAvailable, setSemanticAvailable] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check if semantic matching is available on component mount
  useEffect(() => {
    const checkSemanticAvailability = async () => {
      const available = await isSemanticMatchingAvailable();
      setSemanticAvailable(available);
    };
    checkSemanticAvailability();
  }, []);

  // Analyze query when it changes
  useEffect(() => {
    if (highlightingQuery && highlightingQuery.length > 3) {
      const analyzeQueryDebounced = async () => {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeQuery(highlightingQuery);
          setQueryAnalysis(analysis);
          
          // Perform semantic search if we have clauses
          if (clauses && clauses.length > 0) {
            const searchResults = await semanticSearch(highlightingQuery, clauses);
            setSemanticMatches(searchResults.matches);
          }
        } catch (error) {
          console.error('Error analyzing query:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };

      const timeoutId = setTimeout(analyzeQueryDebounced, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [highlightingQuery, clauses]);

  const handleHighlightPDF = async () => {
    if (!file || !highlightingQuery) {
      alert("Please upload a file and enter a query to highlight!");
      return;
    }
    
    setIsHighlighting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", highlightingQuery);

    try {
      const res = await fetch(`${API_BASE_URL}/highlight_pdf/`, {
        method: "POST",
        body: formData,
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      setHighlightedPDF(url);
      setIsHighlighting(false);
    } catch (error) {
      console.error('Highlighting error:', error);
      setIsHighlighting(false);
      alert("Error highlighting PDF. Please try again.");
    }
  };

  const downloadHighlightedPDF = () => {
    if (highlightedPDF) {
      const link = document.createElement("a");
      link.href = highlightedPDF;
      link.setAttribute("download", "highlighted_clause.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const suggestedQueries = [
    "Who has custody of the children?",
    "Where does it discuss payment terms?",
    "What about ending the contract?",
    "Show me the liability section",
    "Where is the confidentiality clause?",
    "What does it say about intellectual property?",
    "How can I terminate this agreement?",
    "Where are the dispute resolution procedures?"
  ];

  const flaggedClauseQueries = Array.from(flaggedClauses).map(idx => 
    clauses[idx]?.title || `Clause ${idx + 1}`
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Find Clauses in Your Document
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Ask questions in natural language and find relevant clauses using AI-powered semantic search. 
          Download highlighted PDFs showing exactly where the information appears.
        </p>
        {semanticAvailable && (
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            AI Semantic Search Enabled
          </div>
        )}
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gray-800/50 rounded-lg p-8 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Search for Clauses</h2>
        
        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What are you looking for?
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 'Who has custody of the children?', 'Where are the payment terms?', 'What about termination?'"
                value={highlightingQuery}
                onChange={(e) => setHighlightingQuery(e.target.value)}
              />
              {isAnalyzing && (
                <div className="absolute right-3 top-3">
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Ask questions in natural language or use specific keywords
            </p>
          </div>

          {/* Query Analysis Display */}
          {queryAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Query Analysis</h3>
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400">Keywords:</span>
                  {queryAnalysis.keywords.map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Intent: <span className="text-white">{queryAnalysis.intent}</span></span>
                  {queryAnalysis.legal_entities.length > 0 && (
                    <span>Entities: <span className="text-white">{queryAnalysis.legal_entities.join(', ')}</span></span>
                  )}
                </div>
              </div>

              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-gray-600"
                >
                  <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
                  <ul className="space-y-1">
                    {generateSuggestions(queryAnalysis).map((suggestion, index) => (
                      <li key={index} className="text-xs text-gray-300">• {suggestion}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Suggested Queries */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => setHighlightingQuery(suggestion)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md text-sm transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Flagged Clauses */}
          {flaggedClauseQueries.length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-3">From your flagged clauses:</p>
              <div className="flex flex-wrap gap-2">
                {flaggedClauseQueries.map((clauseTitle, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setHighlightingQuery(clauseTitle)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full text-sm transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {clauseTitle}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <motion.button
            onClick={handleHighlightPDF}
            disabled={!file || !highlightingQuery || isHighlighting}
            className="btn-primary w-full sm:w-auto"
            whileHover={!isHighlighting ? { scale: 1.02 } : {}}
            whileTap={!isHighlighting ? { scale: 0.98 } : {}}
          >
            {isHighlighting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                Highlighting...
              </div>
            ) : (
              "Highlight in PDF"
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Semantic Matches Display */}
      {semanticMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gray-800/50 rounded-lg p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">AI Found These Matches</h2>
          
          <div className="space-y-4">
            {semanticMatches.map((match, index) => {
              const confidenceStyle = getConfidenceStyling(match.confidence);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${confidenceStyle.borderColor} ${confidenceStyle.bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${confidenceStyle.color}`}>
                        {confidenceStyle.icon}
                      </span>
                      <h3 className="text-lg font-medium text-white">{match.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceStyle.color} ${confidenceStyle.bgColor}`}>
                        {confidenceStyle.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatConfidenceScore(match.score)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    {match.text.length > 200 ? `${match.text.substring(0, 200)}...` : match.text}
                  </p>
                  
                  {match.matched_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-400">Matched:</span>
                      {match.matched_keywords.map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {match.suggestions.length > 0 && (
                    <div className="text-xs text-gray-400">
                      <span className="font-medium">Suggestions:</span> {match.suggestions.join(', ')}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Results Section */}
      {highlightedPDF && (
        <AnimatedCard
          delay={0.4}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Highlighted Document"
          className="mb-8"
        >
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-400 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Document highlighted successfully!</span>
              </div>
              <p className="text-white/80 text-sm">
                Your document has been processed and the search terms have been highlighted. 
                Download the PDF to see the results.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={downloadHighlightedPDF}
                className="btn-primary flex-1 sm:flex-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Download Highlighted PDF
              </motion.button>
              
              <motion.button
                onClick={() => window.open(highlightedPDF, '_blank')}
                className="btn-secondary flex-1 sm:flex-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Preview in New Tab
              </motion.button>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white/5 rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-3">How it works:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-400/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium text-white">Search</p>
              <p>Enter keywords or phrases you want to find</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-400/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium text-white">Highlight</p>
              <p>AI finds and highlights matching text</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-400/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium text-white">Download</p>
              <p>Get your highlighted PDF document</p>
            </div>
          </div>
        </div>
      </motion.div>

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
          Continue to AI Chat
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ClauseLocationStep;
