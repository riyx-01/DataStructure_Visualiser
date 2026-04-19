import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StackVisualizer = ({ data, searchIndex, isSearching, foundIndex, xRayMode, memoryModel, ghostData, ghostSearchIndex }) => {
  // Reverse data for stack visualization (top at top)
  const displayData = [...data].reverse();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#10b981',
        marginBottom: '20px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        Top
      </div>

      <AnimatePresence mode='popLayout'>
        {displayData.map((item, index) => {
          const actualIndex = data.length - 1 - index;
          const isChecking = isSearching && searchIndex === actualIndex && foundIndex === null;
          const isFound = foundIndex === actualIndex;

          return (
            <motion.div
              key={`stack-${actualIndex}`}
              layout
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: isFound ? 1.05 : isChecking ? 1.02 : 1,
              }}
              exit={{ y: 50, opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              style={{
                width: '280px',
                height: '70px',
                marginBottom: '10px',
                borderRadius: '16px',
                background: isFound
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : isChecking
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : index === 0
                      ? 'linear-gradient(90deg, #0ea5e9, #0284c7)'
                      : 'linear-gradient(90deg, #0369a1, #075985)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '800',
                color: 'white',
                boxShadow: isFound
                  ? '0 0 25px rgba(16, 185, 129, 0.5)'
                  : isChecking
                    ? '0 0 20px rgba(245, 158, 11, 0.4)'
                    : index === 0
                      ? '0 0 25px rgba(14, 165, 233, 0.4)'
                      : '0 4px 10px rgba(3, 105, 161, 0.3)',
                border: isFound
                  ? '2px solid #34d399'
                  : isChecking
                    ? '2px solid #fbbf24'
                    : '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {item}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {xRayMode && memoryModel?.cells?.length > 0 && (
        <div style={{ fontSize: '10px', color: '#86efac', marginBottom: '8px' }}>
          top addr: {memoryModel.cells[memoryModel.cells.length - 1]?.address}
          {ghostSearchIndex !== null ? ` | ghost pointer: ${ghostSearchIndex}` : ''}
        </div>
      )}

      {!!ghostData?.length && (
        <div style={{ fontSize: '11px', opacity: 0.45, color: '#e2e8f0', marginBottom: '6px' }}>
          ghost depth: {ghostData.length}
        </div>
      )}

      {/* Base */}
      <div style={{
        width: '320px',
        height: '8px',
        background: 'linear-gradient(90deg, #0ea5e9, #39ff14)',
        borderRadius: '4px',
        marginTop: '10px',
        boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)',
      }} />

      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#6b7280',
        marginTop: '20px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        Bottom
      </div>
    </div>
  );
};

export default StackVisualizer;