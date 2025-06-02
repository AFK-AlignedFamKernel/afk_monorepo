'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from './Brand';

type UserType = 'user' | 'brand';

export default function Onboarding() {
    const [selectedType, setSelectedType] = useState<UserType | null>(null);
    const router = useRouter();

    const handleSelection = (type: UserType) => {
        setSelectedType(type);
        // // Store the selection in localStorage
        // localStorage.setItem('userType', type);
        // // Navigate to the next step
        // router.push(`/onboarding/${type}`);
    };

    const handleBack = () => {
        setSelectedType(null);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-10">
            <div className="flex flex-col items-center space-y-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-center">
                    Welcome to Our Platform
                </h1>
                <p className="text-base sm:text-lg text-center">
                    Please select how you want to use our platform
                </p>

                {selectedType && (
                    <>
                        <button onClick={handleBack}>Back</button>
                        <Brand />
                    </>
                )}

                {!selectedType && (
                    <>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-2xl">
                            <button
                                className={`w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-4
              ${selectedType === 'user'
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'text-blue-500 border-blue-500 '}`}
                                onClick={() => handleSelection('user')}
                            >
                                <span className="text-xl font-semibold mb-2">User</span>
                                <span className="text-sm text-center">
                                    I want to explore and interact with content
                                </span>
                            </button>

                            <button
                                className={`w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-4
              ${selectedType === 'brand'
                                    ? 'bg-purple-500 border-purple-500'
                                    : 'text-purple-500 border-purple-500'}`}
                                onClick={() => handleSelection('brand')}
                            >
                                <span className="text-xl font-semibold mb-2">Brand</span>
                                <span className="text-sm text-center">
                                    I want to create and manage content
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
