"use client"

import { useUIStore } from '@/store/uiStore'
import { supabase } from '@/lib/supabase'

export default function OAuthPage() {
    const { showToast } = useUIStore()
    async function signInWithTwitter() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'twitter',
                // options: {
                //     redirectTo: 'http://localhost:3000/login/oauth/callback/google',
                // },
            })
            if (error) {
                showToast({
                    message: error.message,
                    type: 'error',
                })
            } else {
                showToast({
                    message: 'Signed in with Twitter',
                    type: 'success',
                })
            }
        } catch (error) {
            showToast({
                message: error.message,
                type: 'error',
            })
        }
    }
    async function signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                // options: {
                //     redirectTo: 'http://localhost:3000/login/oauth/callback/google',
                // },
            })
            if (error) {
                showToast({
                    message: error.message,
                    type: 'error',
                })
            } else {
                showToast({
                    message: 'Signed in with Google',
                    type: 'success',
                })
            }
        } catch (error) {
            showToast({
                message: error.message,
                type: 'error',
            })
        }
    }

    return (
        <div>
            <h1>OAuth</h1>

            <div className="flex flex-col gap-4">
                {/* <button onClick={signInWithTwitter}>Sign in with Twitter</button> */}
                <button onClick={signInWithGoogle}>Sign in with Google</button>
            </div>
        </div>
    );
}