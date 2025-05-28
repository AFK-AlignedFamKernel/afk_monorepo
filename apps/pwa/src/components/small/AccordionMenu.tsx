'use client';

import React, { useState } from 'react';

type AccordionProps = {
  title?: string
  content?: React.ReactNode;
  icon?: React.ReactNode;
  items: {
    title?: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  isOpenProps?: boolean;
};

const AccordionMenu: React.FC<AccordionProps> = ({ items, title, isOpenProps = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenProps);
  return (
    <div className="w-full flex-start">
      {items.map((item, index) => (
        <div key={index} className="group">
          <div className="flex items-center cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {item?.icon && item?.icon}
            {item.title && (
              <label className="flex justify-between items-center p-4 w-full cursor-pointer text-sm">
                <p style={{ fontSize: '12px' }}>{item.title}</p>
                <span 
                  className="transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </span>
              </label>
            )}
          </div>
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isOpen ? '1000px' : '0',
              opacity: isOpen ? 1 : 0,
              animation: isOpen ? 'slideDown 0.3s ease-in-out' : 'slideUp 0.3s ease-in-out',
            }}
          >
            <div className="p-4">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccordionMenu;
