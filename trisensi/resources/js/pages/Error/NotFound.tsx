// Create this file at: resources/js/pages/Error/NotFound.tsx

import { Head } from '@inertiajs/react';

interface Props {
  message?: string;
}

export default function NotFound({ message = 'Not Found' }: Props) {
  return (
    <>
      <Head title="Not Found" />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white shadow-lg rounded-lg">
          <h1 className="text-3xl font-bold text-red-600 mb-4">404</h1>
          <p className="text-gray-700">{message}</p>
          <div className="mt-6">
            <a 
              href="/student/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );
}