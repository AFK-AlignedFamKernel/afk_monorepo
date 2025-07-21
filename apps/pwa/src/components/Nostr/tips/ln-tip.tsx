import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useUIStore } from "@/store/uiStore";
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
    const {showToast} = useUIStore();
    return(
        <>
        <p>Under developement</p>
        </>
    )
}