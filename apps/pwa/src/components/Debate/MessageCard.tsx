import { fetchWithAuth } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useCommunitiesStore } from "@/store/communities";
import { useUIStore } from "@/store/uiStore";
import { useState } from "react";
import { Oauth } from "../profile/Oauth";
import Image from "next/image";
import CommentContainer from "./CommentContainer";
import { Icon } from "../small/icon-component";

interface MessageCardProps {
    message: any;
}

export default function MessageCard({ message }: MessageCardProps) {
   
    const { user, session } = useAppStore();
    const [isLiked, setIsLiked] = useState(false);
    const { showModal, hideModal, showToast } = useUIStore();
    const { communities } = useCommunitiesStore();
    const [form, setForm] = useState({
        content: message?.content,
    })

    const [isOpenReply, setIsOpenReply] = useState(false);
   
    const handleLike = async () => {
        console.log("like")
        const res = await fetchWithAuth(`/messages/like`, {
            method: 'POST',
            body: JSON.stringify({parent_id: message?.id}),
        })
        console.log("res", res)
        if (res.message) {
            showToast({ message: 'Liked', type: 'success', duration: 3000 })
        } else {
            showToast({ message: 'Failed to like', type: 'error', duration: 3000 })
        }
    }

    return (
        <div className="card card-bordered shadow-md rounded-xl p-4 bg-base-200 hover:bg-base-300 transition flex flex-col gap-4">
            <div className="flex flex-row gap-3 items-center">
                {message?.user?.profile_image_url ? (
                    <Image 
                    unoptimized
                    src={message?.user?.profile_image_url} alt={message?.user?.name} width={40} height={40} className="rounded-full bg-gray-200" />
                ) : (
                    <span className="text-xs text-gray-500">{message?.user?.name}</span>
                )}
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400">{message?.created_at}</span>
                    <p className="mt-1">{message?.content}</p>
                </div>
            </div>
            <div className="flex flex-row gap-4 items-center">
                {message?.image_url && (
                    <Image 
                    unoptimized
                    src={message?.image_url} alt="Image" width={100} height={100} className="rounded-md bg-gray-200" />
                )}
            </div>  
            <div className="flex flex-row gap-4 items-center">
                <button className="flex flex-row gap-2 items-center" onClick={() => setIsOpenReply(!isOpenReply)}>
                    <Icon name="CommentIcon" size={16} />
                    <span className="text-xs">Reply {message?.reply_count || 0}</span>
                </button>
                <button className="flex flex-row gap-2 items-center" onClick={handleLike}>
                    <Icon name="LikeIcon" size={16} strokeWidth={2} />
                    <span className="text-xs">{message?.likes || 0}</span>
                </button>
            </div>
            {isOpenReply && (
                <div className="ml-6 border-l-2 border-gray-300 pl-4">
                    <CommentContainer message={message} parent_id={message?.id} />
                </div>
            )}
        </div>
    )
}       