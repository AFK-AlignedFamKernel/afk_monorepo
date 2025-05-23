'use client';

import React, { useState } from 'react';

type AccordionProps = {
  title?: string
  content: React.ReactNode;
  icon?: React.ReactNode;
  items: {
    title?: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
   
  }[];
  isOpenProps?: boolean;
};

const AccordionListMenu: React.FC<AccordionProps> = ({ items, title, isOpenProps = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenProps);
  console.log('isOpen', isOpen);
  return (
    <div className="w-full flex-start">
      {/* <div>
        {title && <p className="text-1xl font-bold">{title}</p>}
      </div> */}
      {items.map((item, index) => (
        <div key={index} className="group cursor-pointer"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <>
            <div className="flex items-center cursor-pointer"
              onClick={() => {
                setIsOpen(!isOpen);
              }}
            >
              {item?.icon && item?.icon}
              {item.title &&
                <label
                  // htmlFor={`accordion-${index}`}
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
            {isOpen && (
              <div className="p-4">
                {item.content}
              </div>
            )}
          </>
        </div>
      ))}
    </div>
  );
};

export default AccordionListMenu;
