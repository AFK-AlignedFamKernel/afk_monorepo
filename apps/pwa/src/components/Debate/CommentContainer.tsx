import { fetchWithAuth } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useCommunitiesStore } from "@/store/communities";
import { useUIStore } from "@/store/uiStore";
import { useEffect, useState } from "react";
import { Oauth } from "../profile/Oauth";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import MessageCard from "./MessageCard";
import CommentCard from "./CommentCard";
import { Icon } from "../small/icon-component";

interface CommentContainerProps {
    message: any;
    parent_id: string;
}

export default function CommentContainer({ message, parent_id }: CommentContainerProps) {
    const { user, session } = useAppStore();
    const { showModal, hideModal, showToast } = useUIStore();
    const { communities } = useCommunitiesStore();
    const [form, setForm] = useState({
        content: '',
        parent_id: parent_id,
    })

    const [messagesState, setMessagesState] = useState<any[]>([]);
    const { data: messages, isLoading, error } = useQuery({
        queryKey: ['messages', parent_id],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages/get-replies?parent_id=${parent_id}`);
            const data = await res.json();
            console.log("data", data)
            setMessagesState(data?.messages);
        },
        enabled: !!parent_id,
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setForm({ ...form, content: e.target.value })
    }

    const handleSubmit = async () => {
        console.log(form)
        // if (!user && !session) {
        //     showToast({ message: 'Please login to create a debate', type: 'error', duration: 3000 })
        //     return;
        // }
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
        <div className="flex flex-col gap-4 items-left">



            <div className="border border-gray-200 rounded-md p-4 flex flex-col gap-4 items-left max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">

                <div className="flex flex-row gap-4 items-center">
                    <textarea
                        name="content"
                        placeholder="Content"
                        className="input input-bordered w-full my-4"
                        value={form.content} onChange={handleChange} />
                    <div className="flex flex-row gap-3 items-center">
                        <button className="flex flex-row gap-2 items-center border border-gray-300 rounded-md p-2" onClick={handleSubmit} disabled={!form.content} >
                            <Icon name="SendIcon" size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 items-left border-b border-gray-200 pb-4">
                    <h2 className="text-lg font-bold">Replies : {messagesState?.length}</h2>
                </div>

                {/* {messagesState && messagesState.length > 0 && messagesState?.map((message: any, index: number) => (
                    <CommentCard key={index} message={message} parent_id={parent_id} />
                ))} */}
                {messagesState && messagesState.length > 0 && messagesState?.map((message: any, index: number) => (
                    <CommentCard key={index} message={message} parent_id={parent_id} />
                ))}
            </div>
        </div>
    )
}       