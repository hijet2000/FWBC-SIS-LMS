import React from 'react';

interface DynamicWatermarkProps {
  text: string;
  children: React.ReactNode;
}

const DynamicWatermark: React.FC<DynamicWatermarkProps> = ({ text, children }) => {
  return (
    <div className="relative w-full h-full">
      {children}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <span className="text-white/20 text-4xl md:text-6xl font-bold select-none transform -rotate-12">
          {text}
        </span>
      </div>
    </div>
  );
};

export default DynamicWatermark;
