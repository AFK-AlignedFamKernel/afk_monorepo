import { NDKEvent } from "@nostr-dev-kit/ndk";
interface TipSuccessModalProps {
    
}
export type FormLnTips = {
    event?: NDKEvent;
    show: (event: NDKEvent) => void;
    hide: () => void;
    showSuccess: (props: TipSuccessModalProps) => void;
    hideSuccess: () => void;
  };

export const FormTipLN = ({}:FormLnTips) => {
    return(
        <>
        <p>Under developement</p>
        </>
    )
}