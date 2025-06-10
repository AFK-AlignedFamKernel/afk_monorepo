import { cairo } from "starknet";
import { finalizeEvent, getPublicKey, verifyEvent } from "nostr-tools";

// Test the signature generation with the exact same parameters as the working Cairo test
const testSignatureGeneration = () => {
    console.log("=== Testing Nostr Signature Generation ===\n");

    // Use the same secret key and public key from the working test
    const sk = "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35";
    const expectedPk = "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc";
    
    // Generate public key and verify it matches
    const pk = getPublicKey(sk as any);
    console.log("Expected Public Key:", expectedPk);
    console.log("Generated Public Key:", pk);
    console.log("Public Key Match:", pk === expectedPk);
    console.log();

    // Test with the same address format as Cairo contract
    const testAddress = "123"; // Same as sender_address in Cairo test
    const addressFelt = cairo.felt(testAddress);
    console.log("Test Address:", testAddress);
    console.log("Address as felt252:", addressFelt);
    console.log();

    // Format content exactly as Cairo contract: "link {felt252_address}"
    const content = `link ${addressFelt}`;
    console.log("Content:", content);
    console.log();

    // Use the exact timestamp from the test
    const timestamp = 1716285235;

    // Generate the event
    const event = finalizeEvent(
        {
            kind: 1,
            created_at: timestamp,
            tags: [],
            content: content,
        },
        sk as any
    );

    console.log("Generated Event:");
    console.log("- ID:", event.id);
    console.log("- Public Key:", event.pubkey);
    console.log("- Created At:", event.created_at);
    console.log("- Kind:", event.kind);
    console.log("- Tags:", event.tags);
    console.log("- Content:", event.content);
    console.log("- Signature:", event.sig);
    console.log();

    // Verify the event
    const isValid = verifyEvent(event);
    console.log("Event Verification:", isValid ? "✅ VALID" : "❌ INVALID");
    console.log();

    // Split signature into R and S components
    const signature = event.sig;
    const signatureR = "0x" + signature.slice(0, signature.length / 2);
    const signatureS = "0x" + signature.slice(signature.length / 2);
    
    console.log("Signature Components:");
    console.log("- R:", signatureR);
    console.log("- S:", signatureS);
    console.log();

    // Compare with expected signatures from working Cairo test
    console.log("Expected signatures from Cairo test:");
    console.log("- R: 0xac9c698ef50872a5fbfec95f5aaa84014519912ab398f192df6cd3c91dfb563c");
    console.log("- S: 0xf9403e3bf9dea20a06c8416a0ef78ad08e93dd21e665c72826d22976a4d08126");
    console.log();

    return {
        event,
        isValid,
        signatureR,
        signatureS,
        content,
        addressFelt
    };
};

// Run the test
const result = testSignatureGeneration();

console.log("=== Test Summary ===");
console.log("✅ Signature generation completed");
console.log("✅ Event verification:", result.isValid ? "PASSED" : "FAILED");
console.log("✅ Content format:", result.content);
console.log("✅ Address format:", result.addressFelt);
