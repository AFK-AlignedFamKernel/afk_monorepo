import { useUIStore } from "@/store/uiStore"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { useAppStore } from "@/store/app";
export const Oauth = () => {
    const { user, session, setUser, setSession, isInitialFetchUser, setIsInitialFetchUser } = useAppStore();
    const { showToast } = useUIStore();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchSession = async () => {
            const { data: session } = await supabase.auth.getSession();
            const { data: user } = await supabase.auth.getUser();
            setSession(session?.session);
            setUser(user?.user);
            setIsLoading(false);
            setIsInitialFetchUser(true);
        }
        if (!isInitialFetchUser && !user && !session) {
            fetchSession();
        }
    }, [isInitialFetchUser, user, session]);
    return (
        <div>
            <p>{user?.email}</p>
            <div>

                {user?.app_metadata.provider == "google" &&
                    <div>
                        <p>Google</p>
                        <p>{user?.app_metadata.provider_id}</p>
                        <Image src={user?.user_metadata.avatar_url} alt="Google" width={50} height={50}
                            className="rounded-full"
                        />
                    </div>}
                {user?.app_metadata.provider == "twitter" &&
                    <div>
                        <p>Twitter</p>
                        <p>{user?.app_metadata.provider_id}</p>
                        <Image src={user?.user_metadata.avatar_url} alt="Twitter" width={100} height={100} />
                    </div>}
            </div>
            <p className="text-xs whitespace-pre-wrap overflow-hidden text-ellipsis">{JSON.stringify(user?.user_metadata)}</p>
        </div>
    )
}