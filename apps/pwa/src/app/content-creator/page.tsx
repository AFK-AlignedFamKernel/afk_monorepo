import MenuCreator from "@/components/ContentCreator/MenuCreator";
import Explanation from "@/components/ContentCreator/Explanation";
export default function ContentCreatorPage() {
    return (
        <div className="container mx-auto p-4">
            <Explanation />
            <MenuCreator />

        </div>
    )
}