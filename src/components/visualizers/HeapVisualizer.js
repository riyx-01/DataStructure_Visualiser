import React from 'react';
import { motion } from 'framer-motion';

const HeapVisualizer = ({ data, foundIndex, xRayMode, memoryModel, ghostData }) => {
  // Max heap visualization (same layout as tree)
  const levels = [];
  let index = 0;
  let levelSize = 1;

  while (index < data.length) {
    const level = [];
    for (let i = 0; i < levelSize && index < data.length; i++) {
      level.push({ value: data[index], index });
      index++;
    }
    levels.push(level);
    levelSize *= 2;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px',
      padding: '40px',
    }}>
      {xRayMode && (
        <div style={{ fontSize: '11px', color: '#86efac' }}>
          heap root addr: {memoryModel?.cells?.[0]?.address || 'n/a'}
        </div>
      )}
      {levels.map((level, levelIndex) => (
        <div
          key={levelIndex}
          style={{
            display: 'flex',
            gap: levelIndex === 0 ? '0' : levelIndex === 1 ? '80px' : '40px',
            justifyContent: 'center',
          }}
        >
          {level.map((item, idx) => {
            const isFound = foundIndex === item.index;
            const isRoot = item.index === 0;

            return (
              <motion.div
                key={`heap-${item.index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isFound ? 1.2 : 1,
                  opacity: 1
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: item.index * 0.1
                }}
                style={{
                  width: levelIndex === 0 ? '90px' : levelIndex === 1 ? '80px' : '70px',
                  height: levelIndex === 0 ? '90px' : levelIndex === 1 ? '80px' : '70px',
                  borderRadius: '50%',
                  background: isFound
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isRoot
                      ? 'linear-gradient(135deg, #f87171, #dc2626)'
                      : 'linear-gradient(135deg, #b91c1c, #991b1b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: levelIndex === 0 ? '28px' : levelIndex === 1 ? '24px' : '20px',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: isFound
                    ? '0 0 30px rgba(16, 185, 129, 0.6)'
                    : isRoot
                      ? '0 0 30px rgba(248, 113, 113, 0.4)'
                      : '0 4px 15px rgba(185, 28, 28, 0.3)',
                  border: isFound
                    ? '3px solid #34d399'
                    : '3px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                }}
              >
                {item.value}
              </motion.div>
            );
          })}
        </div>
      ))}

      {!!ghostData?.length && (
        <div style={{ fontSize: '11px', opacity: 0.45, color: '#e2e8f0' }}>
          ghost heap size: {ghostData.length}
        </div>
      )}
    </div>
  );
};

export default HeapVisualizer;