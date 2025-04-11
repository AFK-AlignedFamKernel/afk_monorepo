import { Metadata } from "next";
import InfoFiPageComponent from "../components/infofi/page";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
export const metadata: Metadata = {
    title: 'AFK - InfoFi: Market of Attention & Knowledge',
    description: 'AFK is the InfoFi platform — a decentralized marketplace for content, trends, and reputation across Bitcoin, Ethereum, and Starknet.',
};
export default function InfoFiPage() {
    return (
        <>
        <Navbar />
        <InfoFiPageComponent />
        <Footer></Footer>        
        </>
    )
}