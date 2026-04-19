import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const LinkedListVisualizer = ({ data, searchIndex, isSearching, foundIndex, xRayMode, memoryModel, ghostData, ghostSearchIndex }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: '40px',
      maxWidth: '1000px',
    }}>
      {data.map((item, index) => {
        const isChecking = isSearching && searchIndex === index && foundIndex === null;
        const isFound = foundIndex === index;
        const wasChecked = isSearching && searchIndex !== null && index < searchIndex;

        return (
          <React.Fragment key={`node-${index}`}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isFound ? 1.15 : isChecking ? 1.1 : 1,
                opacity: 1
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.1
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '20px',
                background: isFound
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : isChecking
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : wasChecked
                      ? 'linear-gradient(135deg, #4b5563, #374151)'
                      : index === data.length - 1
                        ? 'linear-gradient(135deg, #f472b6, #ec4899)'
                        : 'linear-gradient(135deg, #be185d, #9d174d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '800',
                color: 'white',
                boxShadow: isFound
                  ? '0 0 30px rgba(16, 185, 129, 0.6)'
                  : isChecking
                    ? '0 0 25px rgba(245, 158, 11, 0.5)'
                    : '0 4px 15px rgba(190, 24, 93, 0.3)',
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
                fontSize: '13px',
                color: isFound ? '#10b981' : isChecking ? '#f59e0b' : '#9ca3af',
                fontWeight: '700',
              }}>
                Node {index}
              </span>
              {ghostSearchIndex === index && !isChecking && (
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>ghost pointer</span>
              )}
              {xRayMode && memoryModel?.cells?.[index] && (
                <span style={{ fontSize: '10px', color: '#86efac' }}>{memoryModel.cells[index].address}</span>
              )}
            </motion.div>

            {index < data.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                style={{
                  color: wasChecked ? '#f59e0b' : '#34d399',
                  marginTop: '-20px',
                  transition: 'color 0.3s',
                }}
              >
                <ArrowRight size={28} />
              </motion.div>
            )}
          </React.Fragment>
        );
      })}

      {!!ghostData?.length && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.4, marginTop: '10px' }}>
          <span style={{ fontSize: '11px', color: '#e2e8f0' }}>ghost nodes: {ghostData.length}</span>
        </div>
      )}
    </div>
  );
};

export default LinkedListVisualizer;