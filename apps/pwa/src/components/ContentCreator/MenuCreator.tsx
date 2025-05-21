import Link from "next/link";

export default function MenuCreator() {
    return (
        <div className="mx-auto p-4 gap-4 flex flex-row justify-center">
            <Link href="/content-creator/profile">
                <button className="bg-blue-500 text-white p-2 rounded-md">
                    Create your profile
                </button>
            </Link>
            <Link href="/content-creator/shop">
                <button className="bg-blue-500 text-white p-2 rounded-md">
                    Create your shop
                </button>
            </Link>
        </div>
    )
}