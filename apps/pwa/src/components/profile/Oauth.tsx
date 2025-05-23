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
    return (
        <div>
            <p> {provider}</p>
            <div
                className="flex flex-row items-center gap-2"
            >

                {user?.app_metadata.provider == "google" &&
                    <div>
                        <p>{user?.app_metadata.provider_id}</p>
                        <Image src={user?.user_metadata.avatar_url} alt="Google" width={50} height={50}
                            className="rounded-full"
                        />
                    </div>}

                {user?.app_metadata.provider == "twitter" &&
                    <div>
                        <p>{user?.app_metadata.provider_id}</p>
                        <Image src={user?.user_metadata.avatar_url} alt="Twitter" width={100} height={100} />
                    </div>}
                <p>{user?.email}</p>
            </div>
            <div>

                <p>Identities</p>

                {user?.identities?.map((identity) => (
                    <div key={identity.id} className="flex gap-2">
                        <p>{identity.provider}</p>
                        <p>{identity.identity_data.email}</p>
                    </div>
                ))}

            </div>
            <p className="text-xs whitespace-pre-wrap overflow-hidden text-ellipsis">{JSON.stringify(user?.user_metadata)}</p>
        </div>
    )
}