import React from 'react';
import { motion } from 'framer-motion';

const ArrayVisualizer = ({ data, searchIndex, isSearching, foundIndex, xRayMode, memoryModel, ghostData, ghostSearchIndex }) => {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      justifyContent: 'center',
      alignItems: 'flex-end',
      padding: '40px',
      maxWidth: '900px',
    }}>
      {data.map((item, index) => {
        // Determine state: default, checking, or found
        const isChecking = isSearching && searchIndex === index && foundIndex === null;
        const isFound = foundIndex === index;
        const wasChecked = isSearching && searchIndex !== null && index < searchIndex && !isFound;

        return (
          <motion.div
            key={`array-${index}`}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{
              scale: isFound ? 1.15 : isChecking ? 1.1 : 1,
              opacity: 1,
              y: 0
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: index * 0.05
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '16px',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)' // Green for found
                : isChecking
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)' // Orange for checking
                  : wasChecked
                    ? 'linear-gradient(135deg, #4b5563, #374151)' // Gray for checked
                    : 'linear-gradient(135deg, #059669, #047857)', // Purple default
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isFound
                ? '0 0 30px rgba(16, 185, 129, 0.6)'
                : isChecking
                  ? '0 0 25px rgba(245, 158, 11, 0.5)'
                  : '0 4px 15px rgba(124, 58, 237, 0.3)',
              border: isFound
                ? '3px solid #34d399'
                : isChecking
                  ? '3px solid #fbbf24'
                  : '2px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            }}>
              {item}
            </div>
            <span style={{
              fontSize: '14px',
              color: isFound ? '#10b981' : isChecking ? '#f59e0b' : '#9ca3af',
              fontWeight: '700',
              transition: 'color 0.3s',
            }}>
              [{index}]
            </span>
            {ghostSearchIndex === index && !isChecking && (
              <span style={{ fontSize: '11px', color: '#cbd5e1', opacity: 0.8 }}>ghost pointer</span>
            )}
            {xRayMode && memoryModel?.cells?.[index] && (
              <span style={{ fontSize: '10px', color: '#86efac' }}>{memoryModel.cells[index].address}</span>
            )}
          </motion.div>
        );
      })}

      {!!ghostData?.length && (
        <div style={{
          width: '100%',
          display: 'flex',
          gap: '8px',
          marginTop: '14px',
          justifyContent: 'center',
          opacity: 0.45,
          flexWrap: 'wrap'
        }}>
          {ghostData.slice(0, 10).map((item, idx) => (
            <div key={`array-ghost-${idx}`} style={{
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(148, 163, 184, 0.18)',
              color: '#e2e8f0',
              fontSize: '11px'
            }}>
              {typeof item === 'object' ? item.value : item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArrayVisualizer;
