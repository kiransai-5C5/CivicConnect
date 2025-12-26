import React, { useEffect, useRef, useState } from 'react';
import './NotificationDropdown.css';

const defaultNotifications = [
  {
    id: 1,
    title: 'New petition needs review',
    description: '“Clean Water Initiative” was submitted in your district.',
    time: '5m ago',
    isRead: false
  },
  {
    id: 2,
    title: 'Poll feedback received',
    description: 'Citizens shared feedback on “Public Transport Routes”.',
    time: '30m ago',
    isRead: false
  },
  {
    id: 3,
    title: 'System update',
    description: 'Reports export was successfully generated.',
    time: '1h ago',
    isRead: true
  }
];

const NotificationDropdown = ({ notifications: initialNotifications }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(
    initialNotifications && initialNotifications.length > 0
      ? initialNotifications
      : defaultNotifications
  );
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleOpen = () => setOpen((prev) => !prev);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notif-dropdown" ref={dropdownRef}>
      <button className="notification-btn" onClick={toggleOpen}>
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <div>
              <h4>Notifications</h4>
              <p className="notif-subtitle">
                {unreadCount} unread • Tap to mark read
              </p>
            </div>
            <button className="notif-mark-read" onClick={markAllAsRead}>
              Mark all as read
            </button>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-desc">{n.description}</div>
                  <div className="notif-item-meta">{n.time}</div>
                  {!n.isRead && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

