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
        <div className="flex flex-col justify-center items-center py-2 px-2">
            <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-10 flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-primary">Welcome to AFK</h1>
                <p className="text-base sm:text-lg text-center mb-6">Get started by telling us how you want to use the platform.</p>

                {/* Step label */}
                {/* <div className="w-full flex justify-center mb-4">
                    <span className="text-xs font-medium rounded-full px-3 py-1">Step 1 of 2</span>
                </div> */}

                {/* Selection Step */}
                {!selectedType && (
                    <div className="flex flex-col sm:flex-row gap-6 justify-center w-full">
                        <button
                            className="flex-1 min-w-[160px] h-[140px] sm:h-[180px] rounded-xl border-2 border-blue-500 transition-all duration-200 flex flex-col items-center justify-center p-4 shadow-sm group focus:ring-2 focus:ring-blue-300"
                            onClick={() => { handleSelection('user'); logClickedEvent('onboarding_user', 'user', 'onboarding', 1); }}
                        >
                            <Icon name="UserIcon" size={36} className="mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold mb-1">User</span>
                            <span className="text-xs text-center">I want to explore and interact with content</span>
                        </button>
                        <button
                            className="flex-1 min-w-[160px] h-[140px] sm:h-[180px] rounded-xl border-2 border-purple-500 transition-all duration-200 flex flex-col items-center justify-center p-4 shadow-sm group focus:ring-2 focus:ring-purple-300"
                            onClick={() => { handleSelection('creator'); logClickedEvent('onboarding_creator', 'creator', 'onboarding', 1); }}
                        >
                            <Icon name="EditIcon" size={36} className="mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold mb-1">Creator</span>
                            <span className="text-xs text-center">I want to create and manage content</span>
                        </button>
                        <button
                            className="flex-1 min-w-[160px] h-[140px] sm:h-[180px] rounded-xl border-2 border-green-500 transition-all duration-200 flex flex-col items-center justify-center p-4 shadow-sm group focus:ring-2 focus:ring-green-300"
                            onClick={() => { handleSelection('brand'); logClickedEvent('onboarding_brand', 'brand', 'onboarding', 1); }}
                        >
                            <Icon name="BrandIcon" size={36} className="mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold mb-1">Brand</span>
                            <span className="text-xs text-center">Manage brand and create contests</span>
                        </button>

                    </div>
                )}

                {/* Step Content */}
                {selectedType && (
                    <div className="w-full mt-2">
                        <div className="flex items-center mb-4">
                            <button onClick={handleBack} className="flex items-center gap-1 text-sm hover:text-primary focus:outline-none">
                                <Icon name="BackIcon" size={18} className="w-4 h-4" />
                                Back
                            </button>
                            <span className="ml-auto text-xs font-medium bg-muted rounded-full px-3 py-1">Step 2 of 2</span>
                        </div>
                        {selectedType === 'brand' && <Brand />}
                        {selectedType === 'user' && <User />}
                        {selectedType === 'creator' && <Creator />}
                    </div>
                )}

                {/* Skip link */}
                <div className='mt-8 flex justify-center items-center w-full'>
                    <button
                        className='text-sm italic hover:text-primary transition underline underline-offset-2'
                        onClick={() => { router.push('/discover'); }}>
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
}
