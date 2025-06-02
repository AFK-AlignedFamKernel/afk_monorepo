import LinkAccount from "@/components/ContentCreator/profile/LinkAccount";
import CreatorProfile from "@/components/profile/CreatorProfile";
import SupabaseLink from "@/components/profile/SupabaseLink";
import Accordion from "@/components/small/accordion";

export default function MyProfileContentCreator() {
    return (
        <div>
            <h1>My Profile</h1>
            <SupabaseLink />
            <CreatorProfile />
            <Accordion items={[{
                title: "Link Account",
                content: <LinkAccount />
            }]} />
        </div>
    )
}   