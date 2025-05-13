import { useAuth, useContacts } from "afk_nostr_sdk";

export const NostrContactList = () => {
    const { publicKey } = useAuth();
    const { data: contacts } = useContacts({
        authors: [publicKey]
    });
    return (
        <div>
            <h1>Contacts</h1>
            {contacts?.flat().map((contact) => (
                <div key={contact}>
                    {contact}
                </div>
            ))}
        </div>
    )
}