export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation for Bitcoin addresses
  // This is a simplified version - in production, you'd want more comprehensive validation
  
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Remove whitespace
  address = address.trim();

  // Check for P2PKH (Legacy) addresses - starts with '1'
  if (address.startsWith('1') && address.length >= 26 && address.length <= 35) {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }

  // Check for P2SH (Script) addresses - starts with '3'
  if (address.startsWith('3') && address.length >= 26 && address.length <= 35) {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }

  // Check for Bech32 (Native SegWit) addresses - starts with 'bc1'
  if (address.startsWith('bc1') && address.length >= 42 && address.length <= 62) {
    return /^bc1[a-z0-9]{39,59}$/.test(address);
  }

  // Check for Bech32m (Taproot) addresses - starts with 'bc1p'
  if (address.startsWith('bc1p') && address.length === 62) {
    return /^bc1p[a-z0-9]{58}$/.test(address);
  }

  return false;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  
  // Remove whitespace and convert to lowercase for bech32 addresses
  const trimmed = address.trim();
  
  if (trimmed.startsWith('bc1')) {
    return trimmed.toLowerCase();
  }
  
  return trimmed;
}

export function getAddressType(address: string): string {
  if (!isValidBitcoinAddress(address)) {
    return 'Invalid';
  }

  if (address.startsWith('1')) {
    return 'P2PKH (Legacy)';
  }
  
  if (address.startsWith('3')) {
    return 'P2SH (Script)';
  }
  
  if (address.startsWith('bc1p')) {
    return 'P2TR (Taproot)';
  }
  
  if (address.startsWith('bc1')) {
    return 'P2WPKH/P2WSH (Native SegWit)';
  }

  return 'Unknown';
}
