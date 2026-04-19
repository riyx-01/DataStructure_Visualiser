import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Code,
  Trophy,
  TrendingUp,
  Play,
  BookOpen
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Data Structure Visualizers',
      description: 'Interactive visualizations for Arrays, Stacks, Queues, Trees, Graphs, and more',
      icon: LayoutGrid,
      color: '#10b981',
      path: '/visualizer/array',
      stats: '8 Visualizers'
    },
    {
      title: 'Code Visualizer',
      description: 'Step-through execution of JavaScript code with real-time memory visualization',
      icon: Code,
      color: '#39ff14',
      path: '/code-visualizer',
      stats: 'Live Execution'
    },
    {
      title: 'Quiz Challenges',
      description: 'Test your knowledge with interactive quizzes on data structures and algorithms',
      icon: Trophy,
      color: '#f59e0b',
      path: '/quiz',
      stats: '5 Quizzes'
    }
  ];

  const recentActivity = [
    { action: 'Completed Array Quiz', score: '85%', time: '2 hours ago' },
    { action: 'Visualized Binary Tree', score: '-', time: '5 hours ago' },
    { action: 'Code Execution: Sorting', score: '100%', time: '1 day ago' },
  ];

  return (
    <div className="dashboard-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header"
      >
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
          <p>Continue your learning journey</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <TrendingUp size={20} color="#10b981" />
            <div>
              <span className="stat-value">12</span>
              <span className="stat-label">Visualizations</span>
            </div>
          </div>
          <div className="stat-card">
            <Trophy size={20} color="#f59e0b" />
            <div>
              <span className="stat-value">85%</span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="feature-card"
          >
            <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
              <feature.icon size={28} />
            </div>
            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-footer">
                <span className="feature-stats">{feature.stats}</span>
                <button
                  className="feature-btn"
                  style={{ color: feature.color }}
                  onClick={() => navigate(feature.path)}
                  aria-label={`Open ${feature.title}`}
                >
                  <Play size={16} /> Start
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-sections">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="section-card quick-access"
        >
          <h2>
            <BookOpen size={20} />
            Quick Access
          </h2>
          <div className="quick-links">
            {['Array', 'Stack', 'Queue', 'Linked List'].map((ds) => (
              <button
                key={ds}
                className="quick-link"
                onClick={() => navigate(`/visualizer/${ds.toLowerCase().replace(' ', '')}`)}
              >
                {ds}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="section-card activity"
        >
          <h2>
            <TrendingUp size={20} />
            Recent Activity
          </h2>
          <div className="activity-list">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <span className="activity-action">{activity.action}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
                {activity.score !== '-' && (
                  <span className="activity-score">{activity.score}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;