import { useState } from 'react';
import './metadataForm.css'
type IProps = {
    showMeta: boolean;
    closeMeta: () => void;
}
type FormData = {
    twitter: string;
    nostr: string;
    ips: string;
}

export default function MetadataForm({ showMeta, closeMeta }: IProps) {
    const [formData, setFormData] = useState<FormData>({
        twitter: '',
        nostr: '',
        ips: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }))
    }


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Handle form submission logic here
        console.log('Form submitted');
        setFormData({ twitter: '', nostr: '', ips: '' })
        closeMeta()
    }

    return (
        <div className="metadata-form-container">
            <div className={`metadata-form ${showMeta ? 'open' : ''}`}>
                <form onSubmit={handleSubmit} className="metadata-form-content">
                    <button
                        type="button"
                        className="metadata-form-close"
                        onClick={() => closeMeta()}
                    >
                        ✕
                    </button>
                    <h2>Add Pixel Metadata</h2>
                    <div className="metadata-form-field">
                        <label htmlFor="twitter">Twitter Handle</label>
                        <input
                            type="text"
                            placeholder="@username"
                            id="twitter"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="metadata-form-field">
                        <label htmlFor="nostr">Nostr Username</label>
                        <input
                            type="text"
                            id="nostr"
                            name="nostr"
                            value={formData.nostr}
                            onChange={handleInputChange}
                            placeholder="nostr:username"
                        />
                    </div>
                    <div className="metadata-form-field">
                        <label htmlFor="ips">IPS URL</label>
                        <input
                            type="url"
                            id="ips"
                            name="ips"
                            value={formData.ips}
                            onChange={handleInputChange}
                            placeholder="https://example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        className="metadata-form-submit"
                    >
                        Save Metadata
                    </button>
                </form>
            </div>
        </div>
    )
}

