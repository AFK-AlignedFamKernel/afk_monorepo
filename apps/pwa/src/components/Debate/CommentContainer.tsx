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
    classname?: string;
    isViewRepliesProp?: boolean;
}

export default function CommentContainer({ message, parent_id, classname, isViewRepliesProp }: CommentContainerProps) {
    const { user, session } = useAppStore();
    const { showModal, hideModal, showToast } = useUIStore();
    const { communities } = useCommunitiesStore();
    const [isViewReplies, setIsViewReplies] = useState(isViewRepliesProp);
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
        <div className={`flex flex-col gap-0 items-stretch bg-base-100 rounded-xl shadow-md ${classname} max-w-xl`}>
            {/* Replies/messages scrollable area */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[250px] p-4 border-b border-gray-200">
                {/* <h2 className="text-lg font-bold mb-2">Replies: {messagesState?.length}</h2> */}
                {messagesState && messagesState.length > 0 ? (
                    messagesState.map((message: any, index: number) => (
                        <div key={index} className="ml-2 pl-2 border-l-2 border-gray-200">
                            <CommentCard message={message} parent_id={parent_id} />
                        </div>
                    ))
                ) : (
                    <span className="text-xs text-gray-400">No replies yet.</span>
                )}
            </div>
            {/* Input area fixed at the bottom */}
            <div className="p-4 bg-base-200 rounded-b-xl flex flex-row gap-2 items-end">
                <textarea
                    name="content"
                    placeholder="Write a reply..."
                    className="input input-bordered w-full min-h-[48px] resize-y"
                    value={form.content}
                    onChange={handleChange}
                />
                <button
                    className="flex flex-row gap-2 items-center border border-gray-300 rounded-md p-2 bg-primary text-white disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={!form.content}
                >
                    <Icon name="SendIcon" size={16} />
                </button>
            </div>
        </div>
    )
}       