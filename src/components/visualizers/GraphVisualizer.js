import React from 'react';
import { motion } from 'framer-motion';

const GraphVisualizer = ({ data, foundIndex }) => {
  // Fixed positions for 4 nodes (diamond shape)
  const positions = [
    { x: 200, y: 50 },   // 0 - top
    { x: 350, y: 150 },  // 1 - right
    { x: 200, y: 250 },  // 2 - bottom
    { x: 50, y: 150 },   // 3 - left
  ];

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Outer square
    [0, 2], [1, 3] // Diagonals
  ];

  return (
    <div style={{
      position: 'relative',
      width: '400px',
      height: '350px',
    }}>
      {/* Edges */}
      <svg style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}>
        {connections.map(([from, to], idx) => (
          <motion.line
            key={`edge-${idx}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            x1={positions[from].x} 
            y1={positions[from].y} 
            x2={positions[to].x} 
            y2={positions[to].y}
            stroke="#10b981"
            strokeWidth="3"
          />
        ))}
      </svg>

      {/* Nodes */}
      {data.slice(0, 4).map((item, index) => {
        const pos = positions[index];
        const isFound = foundIndex === index;
        
        return (
          <motion.div
            key={`node-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isFound ? 1.3 : 1, 
              opacity: 1 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: index * 0.15
            }}
            style={{
              position: 'absolute',
              left: pos.x - 40,
              top: pos.y - 40,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: isFound
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800',
              color: 'white',
              boxShadow: isFound
                ? '0 0 40px rgba(16, 185, 129, 0.7)'
                : '0 0 30px rgba(139, 92, 246, 0.4)',
              border: isFound 
                ? '4px solid #34d399'
                : '3px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
          >
            {item}
          </motion.div>
        );
      })}
    </div>
  );
};

export default GraphVisualizer;