import { useState } from 'react'
import { useEditProfile, useAuth, useProfile } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useFileUpload } from '@/hooks/useFileUpload';
export const NostrProfileEditForm = () => {

    const editProfile = useEditProfile()
    const queryClient = useQueryClient();
    const { publicKey } = useAuth();
    const { data: profile } = useProfile({
        publicKey: publicKey as string,
    })
    const fileUpload = useFileUpload();

    const [formData, setFormData] = useState({
        username: profile?.username ? String(profile?.username) : '',
        name: profile?.name ? String(profile?.name) : '',
        about: profile?.about ? String(profile?.about) : '',
        picture: profile?.picture ? String(profile?.picture) : '',
        banner: profile?.banner ? String(profile?.banner) : '',
        nip05: profile?.nip05 ? String(profile?.nip05) : '',
        lud16: profile?.lud16 ? String(profile?.lud16) : '',
        telegram: profile?.telegram ?? '',
        github: profile?.github ?? '',
        twitter: profile?.twitter ?? '',
        lud06: profile?.lud06 ?? '',
        tags: profile?.tags ?? []
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const values = formData;
            const { picture, banner } = values;

            let bannerUrl = banner;
            let pictureUrl = picture;
            if (picture) {
                const result = await fileUpload.mutateAsync(picture);
                if (result.data.url) pictureUrl = result.data.url;
            }
            if (banner) {
                const result = await fileUpload.mutateAsync(banner);
                if (result.data.url) bannerUrl = result.data.url;
            }

            console.log("pictureUrl", pictureUrl);
            console.log("bannerUrl", bannerUrl);
            //   await publishEvent({
            //     kind: 0,
            //     content: JSON.stringify(formData),
            //     tags: []
            //   })
            await editProfile.mutateAsync({
                image: pictureUrl,
                banner: bannerUrl,
                nip05: values.name || undefined,
                displayName: values.username || undefined,
                about: values.about || undefined,
                telegram: values.telegram || undefined,
                github: values.github || undefined,
                twitter: values.twitter || undefined,
                lud06: values?.lud06 || undefined,
                lud16: values.lud16 || undefined,
                // tags: values?.tags || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['profile', publicKey] });

        } catch (error) {
            console.error('Failed to update profile:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                />
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name ?? ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                />
            </div>

            <div>
                <label htmlFor="about" className="block text-sm font-medium">
                    About
                </label>
                <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                />
            </div>

            <div>
                <label htmlFor="picture" className="block text-sm font-medium">
                    Profile Picture
                </label>
                <div className="mt-1 flex items-center gap-4">
                    <input
                        type="file"
                        id="picture"
                        name="picture"
                        accept="image/*,.gif"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const event = new Event('change', { bubbles: true });
                                    const target = Object.assign(event.target ?? {}, {
                                        name: 'picture',
                                        value: reader.result as string
                                    }) as HTMLInputElement;
                                    handleChange({ target } as React.ChangeEvent<HTMLInputElement>);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                    {formData.picture && (
                        <img
                            src={formData.picture}
                            alt="Profile preview"
                            className="h-12 w-12 rounded-full object-cover"
                        />
                    )}
                </div>
            </div>
            <div>
                <label htmlFor="banner" className="block text-sm font-medium">
                    Banner Image
                </label>
                <div className="mt-1 flex items-center gap-4">
                    <input
                        type="file"
                        id="banner"
                        name="banner"
                        accept="image/*,.gif"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    // handleChange({
                                    //     target: {
                                    //         name: 'banner',
                                    //         value: reader.result as string
                                    //     }
                                    // });
                                };
                                reader.onloadend = () => {
                                    const event = new Event('change', { bubbles: true });
                                    const target = Object.assign(event.target ?? {}, {
                                        name: 'picture',
                                        value: reader.result as string
                                    }) as HTMLInputElement;
                                    handleChange({ target } as React.ChangeEvent<HTMLInputElement>);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                    {formData.banner && (
                        <img
                            src={formData.banner}
                            alt="Banner preview"
                            className="h-20 w-32 object-cover rounded"
                        />
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="nip05" className="block text-sm font-medium">
                    NIP-05 Identifier
                </label>
                <input
                    type="text"
                    id="nip05"
                    name="nip05"
                    value={formData.nip05}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"

                />
            </div>

            <div>
                <label htmlFor="lud16" className="block text-sm font-medium">
                    Lightning Address
                </label>
                <input
                    type="text"
                    id="lud16"
                    name="lud16"
                    value={formData.lud16}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"

                />
            </div>

            <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
                Update Profile
            </button>
        </form>
    )
}