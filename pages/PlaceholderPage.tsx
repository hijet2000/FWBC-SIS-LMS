
import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <p className="mt-2 text-gray-500">This page is under construction.</p>
      <p className="mt-1 text-sm text-gray-400">Functionality for this section will be added in a future update.</p>
    </div>
  );
};

export default PlaceholderPage;
