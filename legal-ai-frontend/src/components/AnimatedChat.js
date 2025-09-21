import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const AnimatedChat = ({ chatHistory, onSendMessage, loading = false }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              ref={inputRef}
              type="text"
              className="legal-input w-full pr-12"
              placeholder="Ask a question about your document"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              whileFocus={{}}
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
  );
};

export default AnimatedChat;


