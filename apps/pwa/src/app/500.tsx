import { NextPage } from 'next';

const Custom500: NextPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">500 - Server Error</h1>
        <p className="text-gray-600 mb-6">
          Something went wrong on our end. Please try again later.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Go back home
        </button>
      </div>
    </div>
  );
};

export default Custom500; 