import { useUIStore } from "@/store/uiStore"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";
import { Provider, User } from "@supabase/supabase-js";
import { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useAppStore } from "@/store/app";
import CryptoLoading from "../small/crypto-loading";
import { logClickedEvent } from "@/lib/analytics";
export const Oauth = () => {
    const { user, session, setUser, setSession, isInitialFetchUser, setIsInitialFetchUser } = useAppStore();
    const { showToast } = useUIStore();
    const [isLoading, setIsLoading] = useState(true);
    const [provider, setProvider] = useState<string>(user?.app_metadata.provider || "");
    const [isFirstInit, setIsFirstInit] = useState(false);
    useEffect(() => {
        const fetchSession = async () => {
            const { data: session } = await supabase.auth.getSession();
            const { data: user } = await supabase.auth.getUser();
            // console.log("user", user);
            setSession(session?.session);
            setUser(user?.user);
            setIsLoading(false);
            setIsFirstInit(true);
            setIsInitialFetchUser(true);
            setProvider(user?.user?.app_metadata.provider || "");
        }
        if (!isInitialFetchUser && !user && !session) {
            fetchSession();
        }
    }, [isInitialFetchUser, user, session]);


    const handleLogin = async (provider: Provider) => {
        logClickedEvent(`login_oauth_${  provider}`, 'Interaction', 'Button Click', 1);
        const res = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window?.location?.origin ?? process.env.NEXT_PUBLIC_APP_URL}/profile`
            }
        })

        if (!res) {
            return showToast({
                message: "Error",
                type: "error"
            })
        }

        return showToast({
            message: "Login successfuly",
            type: "success"
        })
    }
    const handleLogout = async () => {
        logClickedEvent('logout_oauth', 'Interaction', 'Button Click', 1);
        const res = await supabase.auth.signOut()
        console.log('res', res);

        if (!res?.error) {
            setUser(null);
            setSession(null);
            setIsLoading(true);
            setIsInitialFetchUser(false);
            setProvider("");
            showToast({
                message: "Logout successfully",
                type: "success"
            })
        }
    }


    if (!isInitialFetchUser) {
        return <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
            <div className="flex flex-col items-center space-y-4">
                <p>Loading...</p>
                <CryptoLoading />
            </div>
        </div>
    }
    return (
        <div className="w-full max-w-2xl mx-auto px-6 space-y-8">
            <div className="flex flex-col items-center space-y-4">
                {user?.app_metadata.provider && (
                    <div className="flex flex-col items-center space-y-2">
                        <Image
                            src={user?.user_metadata.avatar_url}
                            alt={user?.app_metadata.provider}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-gray-200"
                        />
                        <p className="text-sm font-medium">{user?.user_metadata?.full_name}</p>
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
                                    <span className="text-sm text-gray-600">{identity?.identity_data?.full_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center">
                {!user ? (
                    <div className="flex flex-col gap-4">
                        <button
                            className="border border-gray-300 flex flex-row items-center gap-2 px-6 py-2 rounded-lg  hover:bg-blue-700 font-medium transition-colors"
                            onClick={() => handleLogin("twitter")}
                        >
                            <Image
                                className="w-6 h-6 bg-[var(--color-primary)]"
                            src="/assets/icons/twitter.svg" alt="Twitter" width={50} height={50} />
                            Sign in with Twitter
                        </button>
                        <button
                            className="border border-gray-300 flex flex-row items-center gap-2 px-6 py-2 rounded-lg  hover:bg-blue-700 font-medium transition-colors"
                            onClick={() => handleLogin("google")}
                        >
                            <Image src="/assets/icons/google-icon.png" alt="Google" width={50} height={50} />
                            Sign in with Google
                        </button>

                        {/* <button
                            className="px-6 py-2 rounded-lg  hover:bg-blue-700 text-white font-medium transition-colors"
                            onClick={() => handleLogin("github")}
                        >
                            <Image src="/assets/icons/github.svg" alt="Twitter" width={50} height={50} />
                            Sign in with Github
                        </button>
                        <button
                            className="px-6 py-2 rounded-lg  hover:bg-blue-700 text-white font-medium transition-colors"
                            onClick={() => handleLogin("discord")}
                        >
                            <Image src="/assets/icons/discord.svg" alt="Discord" width={50} height={50} />
                            Sign in with Discord
                        </button> */}

                    </div>

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