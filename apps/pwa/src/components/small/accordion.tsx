'use client';

import React from 'react';

type AccordionProps = {
  title?: string
  items: {
    title?: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  isOpen?: boolean;
};

const Accordion: React.FC<AccordionProps> = ({ items, title, isOpen = false }) => {
  return (
    <div className="w-full flex-start">
      {/* <div>
        {title && <p className="text-1xl font-bold">{title}</p>}
      </div> */}
      {items.map((item, index) => (
        <div key={index} className="group">
          {/* Using hidden checkbox to toggle content visibility */}
          <input
            type="checkbox"
            id={`accordion-${index}`}
            className="absolute opacity-0 peer"
            // checked={isOpen}
          />

          <div className="flex items-center">
            {item?.icon && item?.icon}
            {item.title &&
              <label
                htmlFor={`accordion-${index}`}
                className="flex justify-between items-center p-4 w-full cursor-pointer text-sm"
              >
                <p 
                // className="font-size-8"
                
                style={{
                  fontSize: '12px',
                }}
                >{item.title}</p>
                <span className="transition-transform duration-200 group-[.peer:checked+&]:rotate-180">▼</span>
              </label>
            }
          </div>

          <div className="max-h-0 overflow-hidden transition-all duration-200 peer-checked:max-h-screen">
            <div className="p-4">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
