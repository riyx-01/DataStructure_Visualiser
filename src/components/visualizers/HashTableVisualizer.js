import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const HashTableVisualizer = ({ data, searchIndex, isSearching, foundIndex, xRayMode, memoryModel, ghostData, ghostSearchIndex }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '40px',
      maxWidth: '600px',
      width: '100%',
    }}>
      {data.map((item, index) => {
        const isChecking = isSearching && searchIndex === index && foundIndex === null;
        const isFound = foundIndex === index;
        const wasChecked = isSearching && searchIndex !== null && index < searchIndex;

        return (
          <motion.div
            key={`hash-${item.key}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              scale: isFound ? 1.05 : isChecking ? 1.02 : 1
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: index * 0.1
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            {/* Key */}
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '16px',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: 'white',
              boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}>
              {item.key}
            </div>

            {/* Arrow */}
            <ArrowRight size={32} color={isChecking || wasChecked ? '#f59e0b' : '#10b981'} />

            {/* Value */}
            <div style={{
              width: '100px',
              height: '70px',
              borderRadius: '16px',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : isChecking
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : wasChecked
                    ? 'linear-gradient(135deg, #4b5563, #374151)'
                    : 'linear-gradient(135deg, #14b8a6, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isFound
                ? '0 0 25px rgba(16, 185, 129, 0.5)'
                : isChecking
                  ? '0 0 20px rgba(245, 158, 11, 0.4)'
                  : '0 4px 15px rgba(20, 184, 166, 0.3)',
              border: isFound
                ? '2px solid #34d399'
                : isChecking
                  ? '2px solid #fbbf24'
                  : '2px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            }}>
              {item.value}
            </div>

            {xRayMode && memoryModel?.cells?.[index] && (
              <div style={{ fontSize: '10px', color: '#86efac' }}>{memoryModel.cells[index].address}</div>
            )}

            {ghostSearchIndex === index && !isChecking && (
              <div style={{ fontSize: '10px', color: '#cbd5e1' }}>ghost pointer</div>
            )}
          </motion.div>
        );
      })}

      {!!ghostData?.length && (
        <div style={{ fontSize: '11px', opacity: 0.45, color: '#e2e8f0' }}>
          ghost buckets: {ghostData.length}
        </div>
      )}
    </div>
  );
};

export default HashTableVisualizer;