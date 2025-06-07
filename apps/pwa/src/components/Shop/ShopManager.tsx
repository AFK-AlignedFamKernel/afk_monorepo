'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ShopFormData {
    name: string;
    description: string;
    slug_name: string;
    picture?: string;
    banner?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    medium?: string;
    github?: string;
    socials?: { platform: string, handle: string }[];
    topics?: string[];
}

interface Shop extends ShopFormData {
    id: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export default function ShopManager() {
    const [formData, setFormData] = useState<ShopFormData>({
        name: '',
        description: '',
        slug_name: '',
        picture: '',
        banner: '',
        website: '',
        twitter: '',
        discord: '',
        telegram: '',
        medium: '',
        github: '',
        socials: [],
        topics: [],
    });
    const [file, setFile] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);

    const fileUpload = useFileUpload()

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [editId, setEditId] = useState<string | null>(null);
    const [editData, setEditData] = useState<ShopFormData>({ name: '', description: '', slug_name: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch all shops
    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const data = await api.shops.getAll();
            setShops(data);
        } catch (err) {
            setError('Failed to fetch shops');
        }
    };

    // Create shop
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let imageUrl = '';
        let bannerUrl = '';
        let urlHash = '';
        let imgHash = '';
        let bannerHash = '';

        if (file) {
            try {
                const result = await fileUpload.mutateAsync(file);
                console.log("result file upload", result);
                if (result.data.url) {
                    imageUrl = result.data.url
                    imgHash = result.data?.hash
                }
            } catch (error) {
                console.log("error", error)

            }

        }


        if (banner) {
            try {
                const result = await fileUpload.mutateAsync(banner);
                console.log("result file upload", result);
                if (result.data.url) {
                    bannerUrl = result.data.url
                    bannerHash = result.data?.hash
                }
            } catch (error) {
                console.log("error", error)

            }

        }

        formData.picture = imageUrl;
        formData.banner = bannerUrl;


        try {
            const data = await api.shops.create(formData);
            setFormData({ name: '', description: '', slug_name: '' });
            await fetchShops();
            // Optionally, navigate to the new shop page
            // router.push(`/content-creator/shop/${data.id}`);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Edit shop
    const handleEdit = (shop: Shop) => {
        setEditId(shop.id);
        setEditData({
            name: shop.name,
            description: shop.description || '',
            slug_name: shop.slug_name,
        });
        setEditError(null);
    };

    // Update shop
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editId) return;
        setEditLoading(true);
        setEditError(null);
        try {
            await api.shops.update(editId, editData);
            setEditId(null);
            await fetchShops();
        } catch (err: any) {
            setEditError(err.message || 'Failed to update shop');
        } finally {
            setEditLoading(false);
        }
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditId(null);
        setEditError(null);
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Create Your Shop</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Shop Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="slug_name" className="block text-sm font-medium text-gray-700">Shop URL Slug</label>
                    <input type="text" id="slug_name" name="slug_name" value={formData.slug_name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Shop Image</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // Handle file upload here
                                // You may want to add this to your formData state
                                setFormData(prev => ({ ...prev, image: file }));
                                setFile(file);
                            }
                        }}
                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Banner
                    </label>
                    <input type="file" id="banner" className="nostr-form__input w-100" onChange={(e) => setBanner(e.target.files?.[0] || null)} />

                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Shop'}
                </button>
            </form>

            <h2 className="text-xl font-bold mb-4">Your Shops</h2>
            <div className="space-y-4">
                {shops.length === 0 && <div className="text-gray-500">No shops found.</div>}
                {shops.map(shop => (
                    <div key={shop.id} className="border rounded p-4 flex flex-col gap-2 bg-white shadow-sm">
                        {editId === shop.id ? (
                            <form onSubmit={handleUpdate} className="space-y-2">
                                <div>
                                    <label className="block text-xs font-medium">Name</label>
                                    <input type="text" name="name" value={editData.name} onChange={handleEditChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium">Slug</label>
                                    <input type="text" name="slug_name" value={editData.slug_name} onChange={handleEditChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium">Description</label>
                                    <textarea name="description" value={editData.description} onChange={handleEditChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Shop Image</label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Handle file upload here
                                                // You may want to add this to your formData state
                                                setFormData(prev => ({ ...prev, image: file }));
                                                setFile(file);
                                            }
                                        }}
                                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Banner
                                    </label>
                                    <input type="file" id="banner" className="nostr-form__input w-100" onChange={(e) => setBanner(e.target.files?.[0] || null)} />

                                </div>
                                {editError && <div className="text-red-500 text-xs">{editError}</div>}
                                <div className="flex gap-2">
                                    <button type="submit" disabled={editLoading} className="btn btn-primary btn-sm">{editLoading ? 'Saving...' : 'Save'}</button>
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary btn-sm">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="font-semibold text-lg">{shop.name}</div>
                                <div className="text-sm text-gray-500">Slug: {shop.slug_name}</div>
                                <div className="text-sm">{shop.description}</div>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleEdit(shop)} className="btn btn-secondary btn-xs">Edit</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 