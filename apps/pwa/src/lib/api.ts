import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            throw new Error('No session token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Try to refresh the session
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !newSession) {
                // If refresh fails, redirect to login
                window.location.href = '/login';
                throw new Error('Session expired');
            }

            // Retry the request with the new token
            // return fetchWithAuth(endpoint, options);
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.log("errorData", errorData)
            // return errorData
            throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('API request failed:', error);
        return {
            error: error
        }
        throw error;
    }
}

// Example API methods
export const api = {
    content_creator: {
        my_profile: () => fetchWithAuth('/content-creator/my-profile'),
    },
    // Shop endpoints
    shops: {
        getAll: () => fetchWithAuth('/shops'),
        getById: (id: string) => fetchWithAuth(`/shops/${id}`),
        create: (data: any) => fetchWithAuth('/shops/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchWithAuth(`/shops/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchWithAuth(`/shops/${id}`, {
            method: 'DELETE',
        }),
    },
    // Add other API endpoints as needed
}; 