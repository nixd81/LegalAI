import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = "", 
  delay = 0, 
  hover = true,
  icon,
  title,
  glow = false 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.25, delay }
    },
    hover: hover ? {
      y: -2,
      transition: { duration: 0.15 }
    } : {}
  };

  const iconVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, delay: delay + 0.1 } },
    hover: {}
  };

  const titleVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, delay: delay + 0.15 } }
  };

  return (
    <motion.div
      className={`legal-card-hover ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      {icon && title && (
        <motion.div 
          className="flex items-center mb-6"
          variants={titleVariants}
        >
          <motion.div
            className="w-10 h-10 bg-slate-900 text-white rounded-md flex items-center justify-center mr-3 shadow-sm"
            variants={iconVariants}
          >
            {icon}
          </motion.div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </motion.div>
      )}
      
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.2, delay: delay + 0.2 } }
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedCard;


