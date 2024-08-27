import './NotificationPanel.css';

import React, {useEffect, useState} from 'react';

const NotificationPanel = ({message, animationDuration = 3000}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [message, animationDuration]);

  return (
    <div className={`notification-panel ${isVisible ? 'slide-in' : 'slide-out'}`}>
      <p className="Text__medium notification-panel__text">{message}</p>
      <p className="Button__close ExpandedTab__close" onClick={() => setIsVisible(false)}>
        X
      </p>
    </div>
  );
};

export default NotificationPanel;
