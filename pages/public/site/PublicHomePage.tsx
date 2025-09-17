
import React from 'react';

const PublicHomePage: React.FC = () => {
    return (
        <div>
            <div className="bg-indigo-700 text-white text-center py-20">
                <h1 className="text-5xl font-bold">Welcome to FWBC</h1>
                <p className="mt-4 text-xl">A Tradition of Excellence</p>
            </div>
            <div className="max-w-4xl mx-auto py-12 px-4">
                <h2 className="text-3xl font-bold text-center">Latest News</h2>
                {/* News items would be fetched and rendered here */}
            </div>
        </div>
    );
};

export default PublicHomePage;
