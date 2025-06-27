import { useState } from "react";
import { FormTipAtomiq } from "./atomiq-tip";
import { FormTipLN } from "./ln-tip";
import { NDKEvent, NDKUserProfile } from "@nostr-dev-kit/ndk";
import { useNote, useProfile, useProfileUser, useSearch } from "afk_nostr_sdk";
interface ITipNostrUser {
  profile?: NDKUserProfile;
  pubkey: string;
}

export const TipNostrUser = ({ profile, pubkey }: ITipNostrUser) => {

  const [tipType, setTipType] = useState<'atomiq' | 'ln'>('atomiq');
  

  console.log("profile", profile);
  // const {data:profileUser} = useProfileUser({publicKey:pubkey});
  // console.log('profileUser', profileUser);

  const {data:profileNotes} = useSearch({authors:[pubkey], kinds:[0], limit:5});
  const [showTipModal, setShowTipModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { data: event } = useNote({ noteId: pubkey });
  const [selectedEvent, setSelectedEvent] = useState<NDKEvent | undefined>(profileNotes?.[0]);
  const [selectedProfile, setSelectedProfile] = useState<NDKUserProfile | undefined>(profile);

  const showTip = (event: NDKEvent) => {
    setSelectedEvent(event);
    setShowTipModal(true);
  };

  const hideTip = () => {
    setShowTipModal(false);
    setSelectedEvent(undefined);
  };

  const showSuccess = () => {
    setShowSuccessModal(true);
  };

  const hideSuccess = () => {
    setShowSuccessModal(false);
  };

  if (!selectedEvent && !profile ) return (<p>No event selected</p>);

  return (
    <>
      {tipType === 'atomiq' ? (
        <FormTipAtomiq
          event={selectedEvent  }
          profile={profile}
          show={showTip}
          hide={hideTip}
          showSuccess={showSuccess}
          hideSuccess={hideSuccess}
        />
      ) : (
        <FormTipLN
          event={selectedEvent}
          show={showTip}
          hide={hideTip}
          showSuccess={showSuccess}
          hideSuccess={hideSuccess}
        />
      )}
    </>
  );
}