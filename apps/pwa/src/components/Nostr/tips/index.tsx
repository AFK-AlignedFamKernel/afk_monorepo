import { useState } from "react";
import { FormTipAtomiq } from "./atomiq-tip";
import { FormTipLN } from "./ln-tip";
import { NDKEvent, NDKUserProfile } from "@nostr-dev-kit/ndk";

interface ITipNostr {
    profile?:NDKUserProfile;
    event?:NDKEvent;
}

export const TipNostr = ({profile, event}:ITipNostr) => {


  const [tipType, setTipType] = useState<'atomiq' | 'ln'>('atomiq');
  const [showTipModal, setShowTipModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NDKEvent | undefined>(event);
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

  return (
    <>
      {tipType === 'atomiq' ? (
        <FormTipAtomiq
          event={selectedEvent}
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