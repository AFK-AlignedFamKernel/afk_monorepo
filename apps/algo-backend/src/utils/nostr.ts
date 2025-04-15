/**
 * Checks if a given string is a valid NOSTR address.
 *
 * A valid NOSTR address must contain 64 alphanumeric characters.
 *
 * @param address - The string to be tested against the NOSTR address format.
 * @returns `true` if the string is a valid NOSTR address, otherwise `false`.
 */
export function isValidNostrAddress(address: string | undefined): boolean {
    if (!address) return false;
    const regex = /^[a-zA-Z0-9]{64}$/;
    return regex.test(address);
}