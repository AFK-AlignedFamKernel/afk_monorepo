import './metadataForm.css'
type IProps = {
    isModal?:boolean;
    showMeta: boolean;
    closeMeta: () => void;
    handleOpen:()=>void;
    selectorMode:boolean;
    formData: {
        twitter: string;
        nostr: string;
        ipfs: string;
    };
    setFormData: (data: { twitter: string; nostr: string; ipfs: string; }) => void;
}

export default function MetadataForm({ isModal, showMeta, closeMeta, handleOpen, selectorMode, formData, setFormData }: IProps) {
    // console.log("formData", formData)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Clear the form data
        setFormData({ twitter: '', nostr: '', ipfs: '' });
        closeMeta();
    }

    return (
        <div className="metadata-form-container">
            {selectorMode &&
            <div className="open">
                <button
                    onClick={handleOpen}
                    type="button"
                    className="metadata-form-submit"
                >
                    Add Metadata
                </button>
            </div>
            }
            <div className={`metadata-form ${showMeta ? 'open' : ''}`}>
                <form onSubmit={handleSubmit} className="metadata-form-content">
                    <button
                        type="button"
                        className="metadata-form-close"
                        onClick={() => {
                            setFormData({ twitter: '', nostr: '', ipfs: '' });
                            closeMeta();
                        }}
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
                        <label htmlFor="ipfs">IPS URL</label>
                        <input
                            type="url"
                            id="ipfs"
                            name="ipfs"
                            value={formData.ipfs}
                            onChange={handleInputChange}
                            placeholder="https://example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        className="metadata-form-submit"
                    >
                        Clear Metadata
                    </button>
                </form>
            </div>
        </div>
    )
}

