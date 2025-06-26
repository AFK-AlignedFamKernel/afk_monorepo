import { fetchWithAuth } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { useCommunitiesStore } from "@/store/communities";
import { useUIStore } from "@/store/uiStore";
import { useState } from "react";
import { Oauth } from "../profile/Oauth";

export default function DebateCreateForm() {
    const {user, session} = useAppStore();
    const {showModal, hideModal, showToast} = useUIStore();
    const { communities } = useCommunitiesStore();
    const [form, setForm] = useState({
        title: '',
        description: '',
        image: '',
        tags: [],
        community_id: '',
        content: '',
    })
    const [image, setImage] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImage(e.target.files?.[0] || null)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }


    const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, community_id: e.target.value })
    }

    const handleSubmit = () => {
        console.log(form)
        if(!user && !session) {
            showToast({message: 'Please login to create a debate', type: 'error', duration: 3000})
            return;
        }
        fetchWithAuth('/messages/create', {
            method: 'POST',
            body: JSON.stringify(form),
        })

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
                className="input input-bordered w-full my-4"
                value={form.content} onChange={handleChange} />
     
            <input type="file" name="image" onChange={handleFileChange}
                className="input input-bordered w-full max-w-xs my-4"
            />
            {image && <img src={URL.createObjectURL(image)} alt="Image" className="w-full max-w-xs my-4" />}
            <button onClick={handleSubmit}>Create debate</button>

            <p className="text-sm text-gray-500">
                This will be a debate in the community.
                Create conversation, debate, ask questions, share your thoughts, and more.
            </p>
        </div>
    )
}       