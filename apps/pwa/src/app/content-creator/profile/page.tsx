import LinkAccount from "@/components/ContentCreator/profile/LinkAccount";
import CreatorProfile from "@/components/profile/CreatorProfile";
import SupabaseLink from "@/components/profile/SupabaseLink";

export default function MyProfileContentCreator() {
    return (
        <div>
            <h1>My Profile</h1>
            <LinkAccount />
            <SupabaseLink />
            <CreatorProfile />
        </div>
    )
}   