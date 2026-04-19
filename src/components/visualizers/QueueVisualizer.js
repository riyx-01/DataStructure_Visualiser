import React from 'react';
import { motion } from 'framer-motion';

const QueueVisualizer = ({ data, searchIndex, isSearching, foundIndex, xRayMode, memoryModel, ghostData, ghostSearchIndex }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      padding: '40px',
    }}>
      {/* Front Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#10b981',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>Front</span>
        <div style={{
          width: '40px',
          height: '3px',
          background: '#10b981',
        }} />
        <span style={{ fontSize: '24px', color: '#10b981' }}>→</span>
      </div>

      {/* Queue Items */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {data.map((item, index) => {
          const isChecking = isSearching && searchIndex === index && foundIndex === null;
          const isFound = foundIndex === index;
          const wasChecked = isSearching && searchIndex !== null && index < searchIndex;

          return (
            <motion.div
              key={`queue-${index}`}
              initial={{ scale: 0, opacity: 0, x: -20 }}
              animate={{
                scale: isFound ? 1.15 : isChecking ? 1.1 : 1,
                opacity: 1,
                x: 0
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.08
              }}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '16px',
                background: isFound
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : isChecking
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : wasChecked
                      ? 'linear-gradient(135deg, #4b5563, #374151)'
                      : index === data.length - 1
                        ? 'linear-gradient(135deg, #34d399, #059669)'
                        : 'linear-gradient(135deg, #059669, #047857)',
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
                    : index === data.length - 1
                      ? '0 0 25px rgba(52, 211, 153, 0.4)'
                      : '0 4px 15px rgba(5, 150, 105, 0.3)',
                border: isFound
                  ? '3px solid #34d399'
                  : isChecking
                    ? '3px solid #fbbf24'
                    : '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {item}
            </motion.div>
          );
        })}
      </div>

      {xRayMode && (
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#86efac' }}>
          {memoryModel?.cells?.slice(0, 4).map((cell) => `${cell.address}`).join('  ')}
          {ghostSearchIndex !== null ? ` | ghost pointer: ${ghostSearchIndex}` : ''}
        </div>
      )}

      {!!ghostData?.length && (
        <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.45, color: '#e2e8f0' }}>
          ghost queue length: {ghostData.length}
        </div>
      )}

      {/* Rear Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '24px',
      }}>
        <span style={{ fontSize: '24px', color: '#10b981' }}>←</span>
        <div style={{
          width: '40px',
          height: '3px',
          background: '#10b981',
        }} />
        <span style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#10b981',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>Rear</span>
      </div>
    </div>
  );
};

export default QueueVisualizer;