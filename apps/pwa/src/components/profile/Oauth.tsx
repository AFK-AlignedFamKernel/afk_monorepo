import { useUIStore } from "@/store/uiStore"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Session } from "@supabase/supabase-js";
export const Oauth = () => {
    const { showToast } = useUIStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialFetch, setIsInitialFetch] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchSession = async () => {
            const { data: session } = await supabase.auth.getSession();
            const { data: user } = await supabase.auth.getUser();
            setSession(session?.session);
            setUser(user?.user);
        }
        fetchSession();
    }, []);
    return (
        <div>
            <p>Oauth</p>
            <p>{session?.user.email}</p>
            <p>{user?.email}</p>
        </div>
    )
}