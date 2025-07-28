import React from 'react';
import { useRelayAuthInit } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';

interface RelayAuthInitializerProps {
  children: React.ReactNode;
  showStatus?: boolean;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
}

export const RelayAuthInitializer: React.FC<RelayAuthInitializerProps> = ({
  children,
  showStatus = false,
  onAuthSuccess,
  onAuthError,
}) => {
  const {
    authStatus,
    initializeAuth,
    checkAuthStatus,
    isAuthenticated,
    isInitializing,
    hasError,
    errorMessage,
    authenticatedRelays,
    failedRelays,
  } = useRelayAuthInit();

  const { showToast } = useUIStore();

  // Handle auth success
  React.useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      onAuthSuccess();
      if (showStatus) {
        showToast({
          message: 'Successfully authenticated with relays',
          description: `Connected to ${authenticatedRelays.length} relay(s)`,
          type: 'success',
        });
      }
    }
  }, [isAuthenticated, authenticatedRelays.length, onAuthSuccess, showStatus, showToast]);

  // Handle auth error
  React.useEffect(() => {
    if (hasError && errorMessage && onAuthError) {
      onAuthError(errorMessage);
      if (showStatus) {
        showToast({
          message: 'Authentication failed',
          description: errorMessage,
          type: 'error',
        });
      }
    }
  }, [hasError, errorMessage, onAuthError, showStatus, showToast]);

  const handleManualInit = async () => {
    try {
      await initializeAuth();
    } catch (error) {
      console.error('Manual auth init failed:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await checkAuthStatus();
      if (!isAuthenticated) {
        await initializeAuth();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  if (showStatus) {
    return (
      <div className="space-y-4">
        {/* Status Display */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Relay Authentication Status</h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : isInitializing ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isInitializing ? 'Initializing...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>

            {authenticatedRelays.length > 0 && (
              <div className="text-sm text-green-600">
                ✅ Connected to: {authenticatedRelays.join(', ')}
              </div>
            )}

            {failedRelays.length > 0 && (
              <div className="text-sm text-red-600">
                ❌ Failed: {failedRelays.join(', ')}
              </div>
            )}

            {errorMessage && (
              <div className="text-sm text-red-600">
                Error: {errorMessage}
              </div>
            )}
          </div>

          <div className="mt-4 space-x-2">
            <button
              onClick={handleManualInit}
              disabled={isInitializing}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Auth'}
            </button>

            <button
              onClick={handleRetry}
              disabled={isInitializing}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {children}
        </div>
      </div>
    );
  }

  // If not showing status, just render children
  return <>{children}</>;
}; 