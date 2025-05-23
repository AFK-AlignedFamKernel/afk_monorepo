import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';

interface LinkAccountModalProps {
    platform: string;
    onClose: () => void;
    onSubmit: (handle: string) => void;
}

export default function LinkAccountModal({ platform, onClose, onSubmit }: LinkAccountModalProps) {
    const [handle, setHandle] = useState('');
    const { showToast } = useUIStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!handle) {
            showToast({ message: 'Please enter a handle', type: 'error' });
            return;
        }
        onSubmit(handle);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Link {platform} Account</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            {platform} Handle
                        </label>
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder={`Enter your ${platform} handle`}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Generate Verification Code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 