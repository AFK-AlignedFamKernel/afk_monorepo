import { fetchWithAuth } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useUIStore } from "@/store/uiStore";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Icon } from "../small/icon-component";
import CommentContainer from "./CommentContainer";

interface CommentCardProps {
    message: any;
    parent_id: string;
}

export default function CommentCard({ message, parent_id }: CommentCardProps) {
    const { user, session } = useAppStore();
    const { showToast } = useUIStore();
    const [form, setForm] = useState({
        content: '',
        parent_id: parent_id,
    })

    const [messagesState, setMessagesState] = useState<any[]>([]);
    const [isOpenReply, setIsOpenReply] = useState(false);
    const { data: messages, isLoading, error } = useQuery({
        queryKey: ['messages', parent_id],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages/get-replies?parent_id=${parent_id}`);
            const data = await res.json();
            console.log("data", data)
            if (data?.messages) {
                setMessagesState(data?.messages);
            }
        },
        enabled: !!parent_id,
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setForm({ ...form, content: e.target.value })
    }

    const handleSubmit = async () => {
        console.log(form)
        if (!user && !session) {
            showToast({ message: 'Please login to create a debate', type: 'error', duration: 3000 })
            return;
        }
        const res = await fetchWithAuth('/messages/create-reply', {
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

    return (
        <div className="border-b border-gray-200 pb-4 flex flex-col gap-4 items-left">
            <div className="flex flex-row gap-3 items-center">
                <div className="flex flex-row gap-3 items-center">
                    {message?.user?.profile_image_url
                        ? <Image src={message?.user?.profile_image_url} alt={message?.user?.name} width={40} height={40}
                            className="rounded-full bg-gray-200"
                        /> : <span className="text-xs text-gray-500">r/{message?.user?.name}</span>
                    }
                </div>
                <div className="flex flex-col">
                    <h2 className="font-semibold text-base">{message?.user?.name}</h2>
                    <p className="">{message?.content}</p>
                </div>
            </div>
            {/* <div className="flex flex-row gap-3 items-center">
                <textarea
                    name="content"
                    placeholder="Content"
                    className="input input-bordered w-full my-4"
                    value={form.content} onChange={handleChange} />
                <div className="flex flex-row gap-3 items-center">
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.content} >
                        <Icon name="SendIcon" size={16} />
                    </button>
                </div>
            </div> */}

            <div className="flex flex-row gap-4 items-center">
                <button className="flex flex-row gap-2 items-center" onClick={() => setIsOpenReply(!isOpenReply)}>
                    <Icon name="CommentIcon" size={16} />
                </button>

                <button className="flex flex-row gap-2 items-center" onClick={() => setIsOpenReply(!isOpenReply)}>
                    <Icon name="LikeIcon" size={16} strokeWidth={2} />
                </button>
            </div>

            {isOpenReply && <CommentContainer message={message} parent_id={message?.id} />}

            {/* {messagesState && messagesState.length > 0 && messagesState?.map((message: any, index: number) => (
                <CommentCard key={index} message={message} parent_id={parent_id} />
            ))} */}
        </div>
    )
}       