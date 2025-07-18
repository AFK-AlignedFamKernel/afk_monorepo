'use client'
import { ButtonPrimary } from "@/components/button/Buttons";
import ChannelFeed from "@/components/Nostr/Channel/ChannelFeed";
import FormChannelCreate from "@/components/Nostr/Channel/FormChannelCreate";
import { useUIStore } from "@/store/uiStore";

export default function ChannelsPage() {
  const { showModal } = useUIStore();
  return (
    <div>
      <ButtonPrimary 
        onClick={() => {
          showModal(<FormChannelCreate />);
        }}
      >
        Create Channel
      </ButtonPrimary>
      <ChannelFeed />
    </div>
  );
}