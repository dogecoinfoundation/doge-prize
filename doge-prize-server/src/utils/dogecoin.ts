import bs58check from 'bs58check';

type PrefixType = 'P2PKH' | 'P2SH' | 'P2PKH_TESTNET' | 'P2SH_TESTNET';

const VALID_PREFIXES: Record<PrefixType, string[]> = {
  P2PKH: ['D'],
  P2SH: ['9', 'A'],
  P2PKH_TESTNET: ['n'],
  P2SH_TESTNET: ['2']
};

/**
 * Validates a Dogecoin address
 * @param address The Dogecoin address to validate
 * @returns true if the address is valid, false otherwise
 */
export function isValidDogecoinAddress(address: string): boolean {
  try {
    // Check if address starts with a valid prefix
    const firstChar = address[0];
    const isValidPrefix = Object.values(VALID_PREFIXES).some(prefixes => 
      prefixes.includes(firstChar)
    );

    if (!isValidPrefix) {
      console.log('invalid prefix', firstChar);
      return false;
    }

    //Base58-decode the address string into a byte array
    const decoded = bs58check.decode(address);
    
    console.log('valid checksum');
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
} 