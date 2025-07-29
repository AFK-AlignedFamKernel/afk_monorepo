import { useUIStore } from "@/store/uiStore";
import { useAuth, useContacts, useProfile } from "afk_nostr_sdk";
import React from "react";
import { FormPrivateMessage } from "./nip17/FormPrivateMessage";
import { ButtonSecondary } from "@/components/button/Buttons";
import ProfileCardOverview from "../EventCard/ProfileCardOverview";
import CryptoLoading from "@/components/small/crypto-loading";


// Card component for a single contact
const ContactCard: React.FC<{ contact: string }> = ({ contact }) => {

    const { data: profile } = useProfile({ publicKey: contact });

    const { showToast, showModal } = useUIStore();
    // console.log("profile", profile);

    return (
        <div
            className="p-4 rounded-lg shadow-sm border mb-2 bg-[var(--card-bg)]"
            style={{
                background: "var(--card-bg, var(--color-bg-secondary))",
                color: "var(--card-text, var(--color-text-primary))",
                borderColor: "var(--card-border, var(--color-border))",
            }}
        >


            <div className="my-4"
                onClick={() => {
                    showModal(<ProfileCardOverview
                        profile={profile || undefined}
                        pubkey={contact}
                        isLinkToProfile={true}
                    // onClose={() => { }}

                    />)
                }}
            >

                {profile && (
                    <div className="flex items-center gap-2">

                        {profile?.image && <img src={profile?.image} alt={profile?.name || String(profile?.display_name) || contact || ""}
                            className="w-10 h-10 rounded-full" />}
                        <div>
                            {profile?.name || String(profile?.display_name) || contact}

                            <div>
                                {profile?.nip05 || profile?.lud06 || profile?.lud16 || profile?.website || profile?.nip05 || profile?.lud06 || profile?.lud16 || profile?.website}
                            </div>
                        </div>
                    </div>

                )}
                <div
                    className="flex items-center gap-3 "
                // style={{
                //     background: "var(--card-bg, var(--color-bg-secondary))",
                //     color: "var(--card-text, var(--color-text-primary))",
                //     borderColor: "var(--card-border, var(--color-border))",
                // }}
                >


                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-[var(--avatar-bg)]"
                    // style={{
                    //     background: "var(--avatar-bg, var(--color-bg-tertiary))",
                    //     color: "var(--avatar-text, var(--color-text-secondary))",
                    // }}
                    >
                        {contact.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{contact}</div>
                        {/* Optionally, add more info here */}
                    </div>

                </div>
            </div>


            <div>

                <ButtonSecondary onClick={() => {
                    showModal(<FormPrivateMessage onClose={() => { }} type="NIP17"
                        recipientAddress={contact}
                    />)
                }}>Send Message</ButtonSecondary>
            </div>
        </div>

    )
};

// List component for contacts
const ContactList: React.FC<{ contacts: string[] }> = ({ contacts }) => (
    <div className="flex flex-col gap-2">
        {contacts.length === 0 ? (
            <div className="text-[var(--color-text-secondary)] text-center py-8">No contacts found.</div>
        ) : (
            contacts.map((contact) => <ContactCard key={contact} contact={contact} />)
        )}
    </div>
);

export const NostrContactList = () => {
    const { publicKey } = useAuth();
    const { data: contacts, isLoading } = useContacts({
        authors: [publicKey],
    });

    const flatContacts = contacts?.flat() ?? [];

    return (
        <div className="p-4">
            <h1
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
            >
                Contacts
            </h1>

            {isLoading &&
                <CryptoLoading />
            }
            <ContactList contacts={flatContacts} />
        </div>
    );
};