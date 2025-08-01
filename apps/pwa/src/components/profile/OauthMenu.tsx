import { useUIStore } from "@/store/uiStore"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useAppStore } from "@/store/app";
export const OauthMenu = () => {
    const { user, session, setUser, setSession, isInitialFetchUser, setIsInitialFetchUser } = useAppStore();
    const { showToast } = useUIStore();
    const [isLoading, setIsLoading] = useState(true);
    const [provider, setProvider] = useState<string>(user?.app_metadata.provider || "");
    useEffect(() => {
        const fetchSession = async () => {
            const { data: session } = await supabase.auth.getSession();
            const { data: user } = await supabase.auth.getUser();
            setSession(session?.session);
            setUser(user?.user);
            setIsLoading(false);
            setIsInitialFetchUser(true);
            setProvider(user?.user?.app_metadata.provider || "");
        }
        if (!isInitialFetchUser && !user && !session) {
            fetchSession();
        }
    }, [isInitialFetchUser, user, session]);


    const handleLogin = async () => {
        const res = await supabase.auth.signInWithOAuth({
            provider:"google"
        })

        if(!res) {
            return showToast({
                message:"Error",
                type:"error"
            })
        }

        return showToast({
            message:"Login successfuly",
            type:"success"
        })
    }
    const handleLogout = async () => {
        const res = await supabase.auth.signOut()

        if (!res) {
            showToast({
                message: "Logout successfully",
                type: "error"
            })
        }
    }
    return (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
            <div className="flex flex-col items-center space-y-4">
                {user?.app_metadata.provider && (
                    <div className="flex flex-col items-center space-y-2">
                        <Image 
                            unoptimized
                            src={user?.user_metadata.avatar_url} 
                            alt={user?.app_metadata.provider} 
                            width={80} 
                            height={80}
                            className="rounded-full border-2 border-gray-200"
                        />
                        <p className="text-sm font-medium">{user?.email}</p>
                    </div>
                )}
            </div>

            {user?.identities && user.identities.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Connected Accounts</h3>
                    <div className="grid gap-3">
                        {user.identities.map((identity) => (
                            <div 
                                key={identity.id} 
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="capitalize font-medium">{identity.provider}</span>
                                    <span className="text-sm text-gray-600">{identity?.identity_data?.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center">
                {!user ? (
                    <button
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                        onClick={handleLogin}
                    >
                        Sign in with Google
                    </button>
                ) : (
                    <button
                        className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition-colors"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    )
}