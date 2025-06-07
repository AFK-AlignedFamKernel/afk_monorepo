'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from './Brand';
import User from './User';
import Creator from './Creator';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '../small/icon-component';

type UserType = 'user' | 'brand' | 'creator';

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
                {/* <h1 className="text-2xl sm:text-3xl font-bold text-center">
                    Welcome to Our Platform
                </h1> */}


                {!selectedType &&
                    <p className="text-base sm:text-lg text-center">
                        Please select how you want to use our platform
                    </p>
                }

                {selectedType && (
                    <div>

                        <div className='flex justify-between w-full'>
                            <button onClick={handleBack}><Icon name="BackIcon" size={20} className='w-4 h-4' />Back</button>
                        </div>

                        {selectedType === 'brand' && <Brand />}
                        {selectedType === 'user' && <User />}
                        {selectedType === 'creator' && <Creator />}
                    </div>
                )}

                {!selectedType && (
                    <>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-2xl">
                            <button
                                className={`w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-4
              ${selectedType === 'user'
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'text-blue-500 border-blue-500 '}`}
                                onClick={() => {
                                    handleSelection('user')
                                    logClickedEvent('onboarding_user', 'user', 'onboarding', 1)
                                }}
                            >
                                <span className="text-xl font-semibold mb-2">User</span>
                                <span className="text-sm text-center">
                                    I want to explore and interact with content
                                </span>
                            </button>

                            <button
                                className={`w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-4
                                  ${selectedType === 'brand'
                                        ? 'bg-green-500 border-green-500'
                                        : 'text-green-500 border-green-500'}`}
                                onClick={() => {
                                    handleSelection('brand')
                                    logClickedEvent('onboarding_brand', 'brand', 'onboarding', 1)
                                }}
                            >
                                <span className="text-xl font-semibold mb-2">Brand</span>
                                <span className="text-sm text-center">
                                    Manage brand and create contests
                                </span>
                            </button>


                            <button
                                className={`w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-4
                                  ${selectedType === 'brand'
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'text-purple-500 border-purple-500'}`}
                                onClick={() => {
                                    handleSelection('creator')
                                    logClickedEvent('onboarding_creator', 'creator', 'onboarding', 1)
                                }}
                            >
                                <span className="text-xl font-semibold mb-2">Creator</span>
                                <span className="text-sm text-center">
                                    I want to create and manage content
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>


            <div className='my-4 flex justify-center items-center w-full'>

                <button

                    className='text-sm italic shadow'
                    onClick={() => {
                        router.push('/discover');
                    }}>
                    Skip
                </button>
            </div>

        </div>
    );
}
