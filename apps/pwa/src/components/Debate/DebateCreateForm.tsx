import { fetchWithAuth } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useCommunitiesStore } from "@/store/communities";
import { useUIStore } from "@/store/uiStore";
import { useState } from "react";
import { Oauth } from "../profile/Oauth";
import { useFileUpload } from "@/hooks/useFileUpload";
import Image from "next/image";

interface DebateCreateFormProps {
    community_id?: string;
    community_name?: string;
}

export default function DebateCreateForm({ community_id, community_name }: DebateCreateFormProps) {
    const { user, session } = useAppStore();
    const { showModal, hideModal, showToast } = useUIStore();
    const { communities } = useCommunitiesStore();
    const [form, setForm] = useState({
        title: '',
        description: '',
        image: '',
        tags: [],
        community_id: community_id || '',
        content: '',
    })
    const [image, setImage] = useState<File | null>(null);
    const fileUpload = useFileUpload();


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImage(e.target.files?.[0] || null)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }


    const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, community_id: e.target.value })
    }

    const handleSubmit = async () => {
        console.log(form)
        if (!user && !session) {
            showToast({ message: 'Please login to create a debate', type: 'error', duration: 3000 })
            return;
        }

        if (form.content.length < 10) {
            showToast({ message: 'Content must be at least 10 characters', type: 'error', duration: 3000 })
            return;
        }


        let imageUrl = '';
        let urlHash = '';


        const res = await fetchWithAuth('/messages/create', {
            method: 'POST',
            body: JSON.stringify({ ...form, image_url: imageUrl, url_hash: urlHash }),
        })
        // console.log("res", res)
        if (res.message) {
            showToast({ message: 'Debate created', type: 'success', duration: 3000 })
        } else {
            showToast({ message: 'Failed to create debate', type: 'error', duration: 3000 })
        }
    }

    return (
        <div className="flex flex-col gap-4 items-left">

            {!user && !session && (
                <button onClick={() => showModal(<Oauth />)}>Login</button>
            )}
            <select name="community_id" value={form.community_id} onChange={handleCommunityChange}>
                <option value="">Select a community</option>
                {communities && communities.length > 0 && communities?.map((community) => (
                    <option key={community.id} value={community.id}>{community.name}</option>
                ))}
            </select>
            <textarea
                name="content"
                placeholder="Content"
                className="input input-bordered w-full my-4 bg-base-200 text-gray-500"
                value={form.content} onChange={handleChange} />

            <input type="file" name="image" onChange={handleFileChange}
                className="input input-bordered w-full max-w-xs my-4"
            />
            {image && <Image src={URL.createObjectURL(image)} alt="Image" className="w-full max-w-xs my-4" />}
            <button
            className="btn btn-primary"
            onClick={handleSubmit}>Create debate</button>

            <p className="text-sm text-gray-500">
                This will be a debate in the community.
                Create conversation, debate, ask questions, share your thoughts, and more.
            </p>
        </div>
    )
}       