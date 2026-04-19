import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Code,
  Trophy,
  User,
  LogOut,
  Database,
  Menu,
  X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, setUser, isOpen, onToggle, onClose }) => {
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/code-visualizer', icon: Code, label: 'Code Visualizer' },
    { path: '/quiz', icon: Trophy, label: 'Quiz' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const dataStructures = [
    { path: '/visualizer/array', label: 'Array' },
    { path: '/visualizer/stack', label: 'Stack' },
    { path: '/visualizer/queue', label: 'Queue' },
    { path: '/visualizer/linkedlist', label: 'Linked List' },
    { path: '/visualizer/tree', label: 'Tree' },
    { path: '/visualizer/graph', label: 'Graph' },
    { path: '/visualizer/hashtable', label: 'Hash Table' },
    { path: '/visualizer/heap', label: 'Heap' },
  ];

  return (
    <>
      <button
        className="mobile-menu-toggle"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={onToggle}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        className={`sidebar ${isOpen ? 'open' : ''}`}
      >
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">DS</div>
            <div className="logo-text">
              <span className="brand">DataStruct</span>
              <span className="tagline">Learn Visually</span>
            </div>
          </div>
        </div>

        <div className="user-profile-mini">
          <div className="avatar">{user?.name?.[0] || 'U'}</div>
          <div className="user-info">
            <span className="name">{user?.name || 'User'}</span>
            <span className="email">{user?.email || 'user@example.com'}</span>
          </div>
        </div>

        <nav className="main-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ds-section">
          <h3>Data Structures</h3>
          <div className="ds-list">
            {dataStructures.map((ds) => (
              <NavLink
                key={ds.path}
                to={ds.path}
                onClick={onClose}
                className={({ isActive }) => `ds-item ${isActive ? 'active' : ''}`}
              >
                <Database size={16} aria-hidden="true" />
                <span>{ds.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            onClick={() => {
              onClose();
              setUser(null);
            }}
            className="logout-btn"
            aria-label="Sign out"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;