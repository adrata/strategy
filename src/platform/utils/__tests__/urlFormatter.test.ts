import { 
  formatUrlForDisplay, 
  getUrlDisplayName, 
  truncateUrl, 
  getUrlDomain, 
  getUrlPath 
} from '../urlFormatter';

describe('urlFormatter', () => {
  describe('formatUrlForDisplay', () => {
    it('should return dash for empty or null values', () => {
      expect(formatUrlForDisplay('')).toBe('-');
      expect(formatUrlForDisplay(null as any)).toBe('-');
      expect(formatUrlForDisplay('-')).toBe('-');
    });

    it('should return short URLs unchanged', () => {
      const shortUrl = 'https://example.com';
      expect(formatUrlForDisplay(shortUrl)).toBe(shortUrl);
    });

    it('should truncate long URLs with middle ellipsis', () => {
      const longUrl = 'https://www.linkedin.com/sales/lead/ACwAAAtDwTUB9cQk7bzePYyPi6qDJ8FNJet3';
      const result = formatUrlForDisplay(longUrl, { maxLength: 50 });
      expect(result).toContain('...');
      expect(result).toContain('linkedin.com');
      expect(result).toContain('J8FNJet3'); // Should preserve ending
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should handle LinkedIn Navigator URLs', () => {
      const navigatorUrl = 'https://www.linkedin.com/sales/lead/ACwAAAtDwTUB9cQk7bzePYyPi6qDJ8FNJet3';
      const result = formatUrlForDisplay(navigatorUrl, { maxLength: 60 });
      expect(result).toMatch(/linkedin\.com.*\.\.\..*J8FNJet3/);
    });
  });

  describe('getUrlDisplayName', () => {
    it('should return dash for empty values', () => {
      expect(getUrlDisplayName('')).toBe('-');
      expect(getUrlDisplayName('-')).toBe('-');
    });

    it('should return friendly names for LinkedIn URLs', () => {
      expect(getUrlDisplayName('https://www.linkedin.com/in/john-doe')).toBe('LinkedIn Profile');
      expect(getUrlDisplayName('https://www.linkedin.com/sales/lead/ACwAA')).toBe('LinkedIn Navigator');
    });

    it('should return domain for other URLs', () => {
      expect(getUrlDisplayName('https://example.com')).toBe('example.com');
      expect(getUrlDisplayName('https://www.github.com/user')).toBe('GitHub Profile');
    });
  });

  describe('truncateUrl', () => {
    it('should preserve protocol and domain', () => {
      const url = 'https://www.linkedin.com/sales/lead/ACwAAAtDwTUB9cQk7bzePYyPi6qDJ8FNJet3';
      const result = truncateUrl(url, 50);
      expect(result).toContain('linkedin.com');
      expect(result).toContain('...');
    });

    it('should preserve ending characters', () => {
      const url = 'https://www.linkedin.com/sales/lead/ACwAAAtDwTUB9cQk7bzePYyPi6qDJ8FNJet3';
      const result = truncateUrl(url, 50, { preserveEnding: 10 });
      expect(result).toContain('J8FNJet3');
    });
  });

  describe('getUrlDomain', () => {
    it('should extract domain from URL', () => {
      expect(getUrlDomain('https://www.linkedin.com/sales/lead/ACwAA')).toBe('linkedin.com');
      expect(getUrlDomain('https://example.com/path')).toBe('example.com');
    });

    it('should handle invalid URLs gracefully', () => {
      expect(getUrlDomain('not-a-url')).toBe('not-a-url');
    });
  });

  describe('getUrlPath', () => {
    it('should extract path from URL', () => {
      expect(getUrlPath('https://www.linkedin.com/sales/lead/ACwAA')).toBe('/sales/lead/ACwAA');
      expect(getUrlPath('https://example.com/path?param=value')).toBe('/path?param=value');
    });
  });
});
