/**
 * IP Address Matching Utility
 * Handles CIDR notation, wildcards, and exact matches securely
 */

/**
 * Check if IP matches a pattern (supports CIDR notation, wildcards, exact match)
 * Simplified implementation - for production, consider using a library like ipaddr.js
 */
export function ipMatches(ip: string, pattern: string): boolean {
  if (!ip || !pattern) return false;
  
  // Normalize inputs
  const normalizedIp = ip.trim();
  const normalizedPattern = pattern.trim();
  
  // Exact match
  if (normalizedIp === normalizedPattern) {
    return true;
  }

  // Wildcard support (e.g., "192.168.*")
  if (normalizedPattern.includes('*')) {
    const regex = new RegExp('^' + normalizedPattern.replace(/\*/g, '[0-9.]+') + '$');
    return regex.test(normalizedIp);
  }

  // CIDR notation (e.g., "192.168.1.0/24")
  if (normalizedPattern.includes('/')) {
    const [network, prefixLenStr] = normalizedPattern.split('/');
    const prefixLen = parseInt(prefixLenStr, 10);
    
    if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) {
      return false; // Invalid CIDR
    }
    
    // For IPv4 CIDR matching (simplified - full implementation needs proper subnet calculation)
    const networkParts = network.split('.').map(Number);
    const ipParts = normalizedIp.split('.').map(Number);
    
    if (networkParts.length !== 4 || ipParts.length !== 4) {
      return false; // Invalid IP format
    }
    
    // Calculate how many full octets we need to match
    const fullOctets = Math.floor(prefixLen / 8);
    const partialBits = prefixLen % 8;
    
    // Check full octets
    for (let i = 0; i < fullOctets; i++) {
      if (networkParts[i] !== ipParts[i]) {
        return false;
      }
    }
    
    // Check partial octet if needed
    if (partialBits > 0 && fullOctets < 4) {
      const mask = (0xFF << (8 - partialBits)) & 0xFF;
      if ((networkParts[fullOctets] & mask) !== (ipParts[fullOctets] & mask)) {
        return false;
      }
    }
    
    return true;
  }

  // Prefix match (e.g., "192.168." matches "192.168.1.1")
  if (normalizedIp.startsWith(normalizedPattern + '.')) {
    return true;
  }

  return false;
}

/**
 * Validate IP address format (basic validation)
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    // Validate IPv4 ranges
    const parts = ip.split('.').map(Number);
    return parts.length === 4 && parts.every(part => part >= 0 && part <= 255);
  }
  
  if (ipv6Regex.test(ip)) {
    return true; // Basic IPv6 validation
  }
  
  return false;
}

/**
 * Validate CIDR notation
 */
export function isValidCidr(cidr: string): boolean {
  if (!cidr || typeof cidr !== 'string') return false;
  
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const [network, prefixLenStr] = parts;
  const prefixLen = parseInt(prefixLenStr, 10);
  
  return isValidIp(network) && !isNaN(prefixLen) && prefixLen >= 0 && prefixLen <= 32;
}

