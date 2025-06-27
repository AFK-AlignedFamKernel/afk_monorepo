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
    const { showModal, hideModal, showToast } = useUIStore();
    const { communities } = useCommunitiesStore();
    const [form, setForm] = useState({
        content: message?.content,
    })

    const [isOpenReply, setIsOpenReply] = useState(false);
    const handleSubmit = async () => {
        console.log(form)
        if (!user && !session) {
            showToast({ message: 'Please login to create a debate', type: 'error', duration: 3000 })
            return;
        }
        const res = await fetchWithAuth('/messages/create', {
            method: 'POST',
            body: JSON.stringify(form),
        })
        console.log("res", res)
        if (res.message) {
            showToast({ message: 'Debate created', type: 'success', duration: 3000 })
        } else {
            showToast({ message: 'Failed to create debate', type: 'error', duration: 3000 })
        }
    }

    const handleLike = async () => {
        console.log("like")
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages/like`, {
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
        <div className="card card-bordered flex flex-col gap-4 items-left">

            <div className="flex flex-row gap-3 items-center">
                <div className="flex flex-row gap-3 items-center">
                    {message?.user?.profile_image_url
                        ? <Image src={message?.user?.profile_image_url} alt={message?.user?.name} width={40} height={40}
                            className="rounded-full bg-gray-200"
                        />
                        : <span className="text-xs text-gray-500">{message?.user?.name}</span>
                    }
                </div>
                <div className="flex flex-col">
                    <h2 className="font-semibold text-base">{message?.user?.name}</h2>
                    <p className="">{message?.content}</p>
                </div>

            </div>
            <div className="flex flex-row gap-4 items-center">
                <button className="flex flex-row gap-2 items-center" onClick={() => setIsOpenReply(!isOpenReply)}>
                    {/* {isOpenReply ? 'Close' : 'Reply'} */}
                    <Icon name="CommentIcon" size={16} />
                </button>
                <button className="flex flex-row gap-2 items-center" onClick={() => handleLike()}>
                    <Icon name="LikeIcon" size={16} strokeWidth={2} />
                </button>
            </div>
            {isOpenReply && <CommentContainer message={message} parent_id={message?.id} />}
        </div>
    )
}       