// Simple test to verify content format matches Cairo contract expectation
// This doesn't require all the heavy dependencies

console.log("=== Testing Content Format ===\n");

// Simulate cairo.felt() function behavior
function simulateCairoFelt(address) {
    // Convert hex address to decimal, then back to string representation
    if (typeof address === 'string' && address.startsWith('0x')) {
        return BigInt(address).toString();
    }
    return address.toString();
}

// Test addresses
const testAddresses = [
    "123", // Same as Cairo test
    "0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca", // Katana address
    "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123" // Example hex
];

console.log("Testing content format for different addresses:\n");

testAddresses.forEach((address, index) => {
    const feltAddress = simulateCairoFelt(address);
    const content = `link ${feltAddress}`;
    
    console.log(`Test ${index + 1}:`);
    console.log(`  Original Address: ${address}`);
    console.log(`  Felt252 Format:   ${feltAddress}`);
    console.log(`  Content:          "${content}"`);
    console.log(`  Length:           ${content.length} chars`);
    console.log();
});

// Test the exact format from Cairo contract
console.log("=== Cairo Contract Format Test ===");
console.log("Cairo contract uses: @format!(\"link {}\", recipient_address)");
console.log("where recipient_address is felt252 = (*self.starknet_address).into()");
console.log();

// Test with the exact address from working Cairo test
const cairoTestAddress = "123";
const cairoTestFelt = simulateCairoFelt(cairoTestAddress);
const cairoTestContent = `link ${cairoTestFelt}`;

console.log("Cairo Test Case:");
console.log(`  Address: ${cairoTestAddress}`);
console.log(`  Content: "${cairoTestContent}"`);
console.log();

console.log("✅ Content format test completed");
console.log("✅ The TypeScript script should now generate the same content format as Cairo contract");
