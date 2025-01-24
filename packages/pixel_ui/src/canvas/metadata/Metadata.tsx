import './metadataForm.css'
type IProps = {
    showMeta: boolean;
    closeMeta: () => void;
    handleOpen:()=>void;
    selectorMode:boolean;
    setFormData:any;
    formData
}

export default function MetadataForm({ showMeta, closeMeta, handleOpen, selectorMode,formData, setFormData }: IProps) {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('Form submitted', formData);
        closeMeta()
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
                     Clear Metadata
                    </button>
                </form>
            </div>
        </div>
    )
}

