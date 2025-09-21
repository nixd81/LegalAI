// src/components/ExpandableClause.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const ExpandableClause = ({ clause, index, onExplain, explanation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      layout
      className="bg-white/10 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/20"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-left w-full text-white font-semibold text-lg"
      >
        {clause.title || `Clause ${index + 1}`}
      </button>
      {expanded && (
        <div className="pt-4 text-white/90">
          <ReactMarkdown>{clause.text}</ReactMarkdown>
          <button
            className="mt-4 text-xs px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => onExplain(clause.text, index)}
          >
            Why?
          </button>
          <AnimatePresence>
            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 bg-indigo-900/60 p-4 rounded text-white"
              >
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default ExpandableClause;
