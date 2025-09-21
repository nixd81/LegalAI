import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import AnimatedCard from '../AnimatedCard';
import { useWizard } from '../WizardContext';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const ChatStep = () => {
  const { 
    text, 
    clauses, 
    chatHistory, 
    setChatHistory, 
    loading, 
    setLoading, 
    flaggedClauses,
    resetWizard 
  } = useWizard();

  const [input, setInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What are the main risks in this contract?",
    "Can you explain the termination clause?",
    "What are my payment obligations?",
    "Are there any hidden fees or charges?",
    "What happens if I breach this agreement?",
    "Can I terminate this contract early?"
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleChatSend = async (message) => {
    if (!message.trim()) return;
    setChatHistory((prev) => [...prev, { role: "user", text: message }]);

    const formData = new FormData();
    formData.append("document", text);
    formData.append("question", message);
    formData.append("clauses", JSON.stringify(clauses));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/chat/`, {
      method: "POST",
      body: formData,
});

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: data.answer || data.error || "Error fetching answer." },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I encountered an error. Please try again." },
      ]);
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !loading) {
      handleChatSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  const handleFlaggedClauseQuestion = (clauseIndex) => {
    const clause = clauses[clauseIndex];
    const question = `Can you explain this clause: "${clause.title || `Clause ${clauseIndex + 1}`}"`;
    setInput(question);
  };

  const MessageBubble = ({ message, index }) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        <motion.div
          className={`flex items-start max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          whileHover={{ scale: 1.02 }}
        >
          {/* Avatar */}
          <motion.div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg ${
              isUser 
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white ml-3' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white mr-3'
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
          >
            {isUser ? 'U' : 'AI'}
          </motion.div>
          
          {/* Message Bubble */}
          <motion.div
            className={`px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm ${
              isUser 
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' 
                : 'bg-white/10 border border-white/20 text-white'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: isUser 
                ? '0 10px 30px rgba(34, 211, 238, 0.3)' 
                : '0 10px 30px rgba(255, 255, 255, 0.1)'
            }}
          >
            {isUser ? (
              <p className="font-medium">{message.text}</p>
            ) : (
              <div className="prose prose-sm max-w-none text-white">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
          </motion.div>
        </motion.div>
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
          AI Legal Assistant
        </h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Ask any questions about your document. I can explain clauses, identify risks, 
          and help you understand the legal implications.
        </p>
      </motion.div>

      {/* Quick Access to Flagged Clauses */}
      {flaggedClauses.size > 0 && (
        <AnimatedCard
          delay={0.2}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          }
          title="Your Flagged Clauses"
          className="mb-8"
        >
          <div className="space-y-3">
            <p className="text-white/80 text-sm">
              Quick access to clauses you flagged for review:
            </p>
            <div className="flex flex-wrap gap-2" data-onboarding="flagged-clauses">
              {Array.from(flaggedClauses).map((clauseIndex) => {
                const clause = clauses[clauseIndex];
                return (
                  <motion.button
                    key={clauseIndex}
                    onClick={() => handleFlaggedClauseQuestion(clauseIndex)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all duration-200 border border-red-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {clause.title || `Clause ${clauseIndex + 1}`}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Suggested Questions */}
      <AnimatedCard
        delay={0.3}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Suggested Questions"
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedQuestions.map((question, index) => (
            <motion.button
              key={index}
              onClick={() => handleSuggestedQuestion(question)}
              className="text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-white text-sm">{question}</p>
            </motion.button>
          ))}
        </div>
      </AnimatedCard>

      {/* Chat Interface */}
      <AnimatedCard
        delay={0.4}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        title="Chat with AI Assistant"
        className="mb-8"
      >
        <div className="h-96 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <AnimatePresence>
              {chatHistory.length === 0 ? (
                <motion.div
                  className="flex items-center justify-center h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                      animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          '0 0 20px rgba(34, 211, 238, 0.3)',
                          '0 0 40px rgba(168, 85, 247, 0.5)',
                          '0 0 20px rgba(34, 211, 238, 0.3)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">Start a conversation</h3>
                    <p className="text-white/70">Ask questions about your legal document</p>
                  </div>
                </motion.div>
              ) : (
                chatHistory.map((message, index) => (
                  <MessageBubble key={index} message={message} index={index} />
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <motion.div
            className="p-6 border-t border-slate-600 bg-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <motion.input
                  type="text"
                  className="legal-input w-full pr-12"
                  placeholder="Ask a question about your document"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  whileFocus={{}}
                  data-onboarding="chat-input"
                />
                
                {/* Typing Indicator */}
                {loading && (
                  <motion.div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-slate-600 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
              
              <motion.button
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                whileHover={{}}
                whileTap={{}}
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        </div>
      </AnimatedCard>

      {/* Completion Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Analysis Complete!</h3>
          <p className="text-white/80 mb-4">
            You've successfully analyzed your legal document. You can continue asking questions 
            or start over with a new document.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={resetWizard}
              className="btn-secondary px-6 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Analyze Another Document
            </motion.button>
            <motion.button
              onClick={() => {/* Download functionality */}}
              className="btn-primary px-6 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-onboarding="download-button"
            >
              Download Analysis Report
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatStep;
