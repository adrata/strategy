/**
 * Advanced Phonetic Algorithms for Name Matching (2025)
 * 
 * Implements state-of-the-art phonetic algorithms:
 * - Double Metaphone (most accurate for names)
 * - NYSIIS (New York State Identification and Intelligence System)
 * - Enhanced Soundex
 * 
 * These algorithms convert names to phonetic codes that sound similar,
 * enabling matching of names with different spellings but similar pronunciation.
 */

export interface PhoneticResult {
  primary: string;
  secondary?: string;
}

export class AdvancedPhoneticAlgorithms {
  
  /**
   * Calculate advanced phonetic similarity using multiple algorithms
   */
  static calculatePhoneticSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    // Double Metaphone - most accurate for names
    const metaphone1 = this.doubleMetaphone(str1);
    const metaphone2 = this.doubleMetaphone(str2);
    
    // Check both primary and secondary codes
    const metaphoneMatch = (
      metaphone1['primary'] === metaphone2.primary ||
      metaphone1['primary'] === metaphone2.secondary ||
      metaphone1['secondary'] === metaphone2.primary ||
      (metaphone1['secondary'] && metaphone2['secondary'] && metaphone1['secondary'] === metaphone2.secondary)
    );
    
    // NYSIIS - good for similar sounding names
    const nysiis1 = this.nysiis(str1);
    const nysiis2 = this.nysiis(str2);
    const nysiisMatch = nysiis1 === nysiis2;
    
    // Soundex - basic but reliable
    const soundex1 = this.soundex(str1);
    const soundex2 = this.soundex(str2);
    const soundexMatch = soundex1 === soundex2;
    
    // Weighted combination - Double Metaphone gets highest weight
    let score = 0;
    if (metaphoneMatch) score += 0.6;
    if (nysiisMatch) score += 0.3;
    if (soundexMatch) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Double Metaphone algorithm - most accurate phonetic algorithm for names
   * Based on Lawrence Philips' Double Metaphone algorithm
   */
  static doubleMetaphone(word: string): PhoneticResult {
    if (!word) return { primary: '', secondary: '' };
    
    const original = word.toUpperCase().replace(/[^A-Z]/g, '');
    if (original['length'] === 0) return { primary: '', secondary: '' };
    
    let primary = '';
    let secondary = '';
    let current = 0;
    const length = original.length;
    const last = length - 1;
    
    // Helper functions
    const isVowel = (pos: number): boolean => {
      if (pos < 0 || pos >= length) return false;
      return 'AEIOUY'.includes(original[pos]);
    };
    
    const charAt = (pos: number): string => {
      return pos >= 0 && pos < length ? original[pos] : '';
    };
    
    const stringAt = (start: number, len: number, ...patterns: string[]): boolean => {
      if (start < 0 || start >= length) return false;
      const substr = original.substring(start, start + len);
      return patterns.includes(substr);
    };
    
    // Skip initial silent letters
    if (stringAt(0, 2, 'GN', 'KN', 'PN', 'WR', 'PS')) {
      current = 1;
    }
    
    // Initial X is pronounced Z
    if (charAt(0) === 'X') {
      primary += 'S';
      secondary += 'S';
      current = 1;
    }
    
    while (primary.length < 4 && secondary.length < 4 && current < length) {
      const char = charAt(current);
      
      switch (char) {
        case 'A':
        case 'E':
        case 'I':
        case 'O':
        case 'U':
        case 'Y':
          if (current === 0) {
            primary += 'A';
            secondary += 'A';
          }
          current++;
          break;
          
        case 'B':
          primary += 'P';
          secondary += 'P';
          current += charAt(current + 1) === 'B' ? 2 : 1;
          break;
          
        case 'C':
          // Complex C handling
          if (current > 1 && !isVowel(current - 2) && stringAt(current - 1, 3, 'ACH') && 
              !stringAt(current + 2, 1, 'I', 'E')) {
            primary += 'K';
            secondary += 'K';
            current += 2;
          } else if (current === 0 && stringAt(current, 6, 'CAESAR')) {
            primary += 'S';
            secondary += 'S';
            current += 2;
          } else if (stringAt(current, 2, 'CH')) {
            // CH handling
            if (current > 0 && stringAt(current, 4, 'CHAE')) {
              primary += 'K';
              secondary += 'X';
              current += 2;
            } else if (current === 0 && (stringAt(current + 1, 5, 'HARAC', 'HARIS') || 
                     stringAt(current + 1, 3, 'HOR', 'HYM', 'HIA', 'HEM'))) {
              primary += 'K';
              secondary += 'K';
              current += 2;
            } else {
              if (current > 0 && stringAt(0, 2, 'MC')) {
                primary += 'K';
                secondary += 'K';
              } else {
                primary += 'X';
                secondary += 'X';
              }
              current += 2;
            }
          } else if (stringAt(current, 2, 'CZ') && !stringAt(current - 2, 4, 'WICZ')) {
            primary += 'S';
            secondary += 'X';
            current += 2;
          } else if (stringAt(current + 1, 3, 'CIA')) {
            primary += 'X';
            secondary += 'X';
            current += 3;
          } else if (stringAt(current, 2, 'CC') && !(current === 1 && charAt(0) === 'M')) {
            if (stringAt(current + 2, 1, 'I', 'E', 'H') && !stringAt(current + 2, 2, 'HU')) {
              if ((current === 1 && charAt(current - 1) === 'A') || 
                  stringAt(current - 1, 5, 'UCCEE', 'UCCES')) {
                primary += 'KS';
                secondary += 'KS';
              } else {
                primary += 'X';
                secondary += 'X';
              }
              current += 3;
            } else {
              primary += 'K';
              secondary += 'K';
              current += 2;
            }
          } else if (stringAt(current, 2, 'CK', 'CG', 'CQ')) {
            primary += 'K';
            secondary += 'K';
            current += 2;
          } else if (stringAt(current, 2, 'CI', 'CE', 'CY')) {
            if (stringAt(current, 3, 'CIO', 'CIE', 'CIA')) {
              primary += 'S';
              secondary += 'X';
            } else {
              primary += 'S';
              secondary += 'S';
            }
            current += 2;
          } else {
            primary += 'K';
            secondary += 'K';
            current += stringAt(current + 1, 2, ' C', ' Q', ' G') ? 3 : 1;
          }
          break;
          
        case 'D':
          if (stringAt(current, 2, 'DG')) {
            if (stringAt(current + 2, 1, 'I', 'E', 'Y')) {
              primary += 'J';
              secondary += 'J';
              current += 3;
            } else {
              primary += 'TK';
              secondary += 'TK';
              current += 2;
            }
          } else if (stringAt(current, 2, 'DT', 'DD')) {
            primary += 'T';
            secondary += 'T';
            current += 2;
          } else {
            primary += 'T';
            secondary += 'T';
            current++;
          }
          break;
          
        case 'F':
          primary += 'F';
          secondary += 'F';
          current += charAt(current + 1) === 'F' ? 2 : 1;
          break;
          
        case 'G':
          // Complex G handling
          if (charAt(current + 1) === 'H') {
            if (current > 0 && !isVowel(current - 1)) {
              primary += 'K';
              secondary += 'K';
              current += 2;
            } else if (current < 3) {
              if (current === 0) {
                if (charAt(current + 2) === 'I') {
                  primary += 'J';
                  secondary += 'J';
                } else {
                  primary += 'K';
                  secondary += 'K';
                }
                current += 2;
              }
            } else {
              current += 2;
            }
          } else if (charAt(current + 1) === 'N') {
            if (current === 1 && isVowel(0) && !stringAt(0, 1, 'MC')) {
              primary += 'KN';
              secondary += 'N';
            } else if (!stringAt(current + 2, 2, 'EY') && charAt(current + 1) !== 'Y' && 
                       !stringAt(0, 1, 'MC')) {
              primary += 'N';
              secondary += 'KN';
            } else {
              primary += 'KN';
              secondary += 'KN';
            }
            current += 2;
          } else if (stringAt(current + 1, 2, 'LI') && !stringAt(0, 1, 'MC')) {
            primary += 'KL';
            secondary += 'L';
            current += 2;
          } else if (current === 0 && (charAt(current + 1) === 'Y' || 
                   stringAt(current + 1, 2, 'ES', 'EP', 'EB', 'EL', 'EY', 'IB', 'IL', 'IN', 'IE', 'EI', 'ER'))) {
            primary += 'K';
            secondary += 'J';
            current += 2;
          } else if ((stringAt(current + 1, 2, 'ER') || charAt(current + 1) === 'Y') && 
                     !stringAt(0, 6, 'DANGER', 'RANGER', 'MANGER') && 
                     !stringAt(current - 1, 1, 'E', 'I') && 
                     !stringAt(current - 1, 3, 'RGY', 'OGY')) {
            primary += 'K';
            secondary += 'J';
            current += 2;
          } else if (stringAt(current + 1, 1, 'E', 'I', 'Y') || 
                     stringAt(current - 1, 4, 'AGGI', 'OGGI')) {
            if (stringAt(0, 4, 'VAN ', 'VON ') || stringAt(0, 3, 'SCH') || 
                stringAt(current + 1, 2, 'ET')) {
              primary += 'K';
              secondary += 'K';
            } else if (stringAt(current + 1, 3, 'IER')) {
              primary += 'J';
              secondary += 'J';
            } else {
              primary += 'J';
              secondary += 'K';
            }
            current += 2;
          } else if (charAt(current + 1) === 'G') {
            current += 2;
            primary += 'K';
            secondary += 'K';
          } else {
            current++;
            primary += 'K';
            secondary += 'K';
          }
          break;
          
        case 'H':
          if ((current === 0 || isVowel(current - 1)) && isVowel(current + 1)) {
            primary += 'H';
            secondary += 'H';
            current += 2;
          } else {
            current++;
          }
          break;
          
        case 'J':
          if (stringAt(current, 4, 'JOSE') || stringAt(0, 4, 'SAN ')) {
            if ((current === 0 && charAt(current + 4) === ' ') || stringAt(0, 4, 'SAN ')) {
              primary += 'H';
              secondary += 'H';
            } else {
              primary += 'J';
              secondary += 'H';
            }
            current++;
          } else {
            if (current === 0 && !stringAt(current, 4, 'JOSE')) {
              primary += 'J';
              secondary += 'A';
            } else if (isVowel(current - 1) && !stringAt(0, 1, 'MC') && 
                       (charAt(current + 1) === 'A' || charAt(current + 1) === 'O')) {
              primary += 'J';
              secondary += 'H';
            } else if (current === last) {
              primary += 'J';
              secondary += '';
            } else if (!stringAt(current + 1, 1, 'L', 'T', 'K', 'S', 'N', 'M', 'B', 'Z') && 
                       !stringAt(current - 1, 1, 'S', 'K', 'L')) {
              primary += 'J';
              secondary += 'J';
            }
            current += charAt(current + 1) === 'J' ? 2 : 1;
          }
          break;
          
        case 'K':
          primary += 'K';
          secondary += 'K';
          current += charAt(current + 1) === 'K' ? 2 : 1;
          break;
          
        case 'L':
          if (charAt(current + 1) === 'L') {
            if (((current === length - 3) && stringAt(current - 1, 4, 'ILLO', 'ILLA', 'ALLE')) || 
                ((stringAt(last - 1, 2, 'AS', 'OS') || stringAt(last, 1, 'A', 'O')) && 
                 stringAt(current - 1, 4, 'ALLE'))) {
              primary += 'L';
              secondary += '';
              current += 2;
            } else {
              current += 2;
            }
          } else {
            current++;
          }
          primary += 'L';
          secondary += 'L';
          break;
          
        case 'M':
          if ((stringAt(current - 1, 3, 'UMB') && 
               ((current + 1) === last || stringAt(current + 2, 2, 'ER'))) || 
              charAt(current + 1) === 'M') {
            current += charAt(current + 1) === 'M' ? 2 : 1;
          } else {
            current++;
          }
          primary += 'M';
          secondary += 'M';
          break;
          
        case 'N':
          primary += 'N';
          secondary += 'N';
          current += charAt(current + 1) === 'N' ? 2 : 1;
          break;
          
        case 'P':
          if (charAt(current + 1) === 'H') {
            primary += 'F';
            secondary += 'F';
            current += 2;
          } else {
            primary += 'P';
            secondary += 'P';
            current += stringAt(current + 1, 1, 'P', 'B') ? 2 : 1;
          }
          break;
          
        case 'Q':
          primary += 'K';
          secondary += 'K';
          current += charAt(current + 1) === 'Q' ? 2 : 1;
          break;
          
        case 'R':
          if (current === last && !stringAt(0, 1, 'MC') && 
              stringAt(current - 2, 2, 'IE') && 
              !stringAt(current - 4, 2, 'ME', 'MA')) {
            primary += '';
            secondary += 'R';
          } else {
            primary += 'R';
            secondary += 'R';
          }
          current += charAt(current + 1) === 'R' ? 2 : 1;
          break;
          
        case 'S':
          if (stringAt(current - 1, 3, 'ISL', 'YSL')) {
            current++;
          } else if (current === 0 && stringAt(current, 5, 'SUGAR')) {
            primary += 'X';
            secondary += 'S';
            current++;
          } else if (stringAt(current, 2, 'SH')) {
            if (stringAt(current + 1, 4, 'HEIM', 'HOEK', 'HOLM', 'HOLZ')) {
              primary += 'S';
              secondary += 'S';
            } else {
              primary += 'X';
              secondary += 'X';
            }
            current += 2;
          } else if (stringAt(current, 3, 'SIO', 'SIA') || stringAt(current, 4, 'SIAN')) {
            if (!stringAt(0, 1, 'MC')) {
              primary += 'S';
              secondary += 'X';
            } else {
              primary += 'S';
              secondary += 'S';
            }
            current += 3;
          } else if ((current === 0 && stringAt(current + 1, 1, 'M', 'N', 'L', 'W')) || 
                     stringAt(current + 1, 1, 'Z')) {
            primary += 'S';
            secondary += 'X';
            current += stringAt(current + 1, 1, 'Z') ? 2 : 1;
          } else if (stringAt(current, 2, 'SC')) {
            if (charAt(current + 2) === 'H') {
              if (stringAt(current + 3, 2, 'OO', 'ER', 'EN', 'UY', 'ED', 'EM')) {
                if (stringAt(current + 3, 2, 'ER', 'EN')) {
                  primary += 'X';
                  secondary += 'SK';
                } else {
                  primary += 'SK';
                  secondary += 'SK';
                }
                current += 3;
              } else {
                if (current === 0 && !isVowel(3) && charAt(3) !== 'W') {
                  primary += 'X';
                  secondary += 'S';
                } else {
                  primary += 'X';
                  secondary += 'X';
                }
                current += 3;
              }
            } else if (stringAt(current + 2, 1, 'I', 'E', 'Y')) {
              primary += 'S';
              secondary += 'S';
              current += 3;
            } else {
              primary += 'SK';
              secondary += 'SK';
              current += 3;
            }
          } else {
            if (current === last && stringAt(current - 2, 2, 'AI', 'OI')) {
              primary += '';
              secondary += 'S';
            } else {
              primary += 'S';
              secondary += 'S';
            }
            current += stringAt(current + 1, 1, 'S', 'Z') ? 2 : 1;
          }
          break;
          
        case 'T':
          if (stringAt(current, 4, 'TION')) {
            primary += 'X';
            secondary += 'X';
            current += 3;
          } else if (stringAt(current, 3, 'TIA', 'TCH')) {
            primary += 'X';
            secondary += 'X';
            current += 3;
          } else if (stringAt(current, 2, 'TH') || stringAt(current, 3, 'TTH')) {
            if (stringAt(current + 2, 2, 'OM', 'AM') || 
                stringAt(0, 4, 'VAN ', 'VON ') || 
                stringAt(0, 3, 'SCH')) {
              primary += 'T';
              secondary += 'T';
            } else {
              primary += '0';
              secondary += 'T';
            }
            current += 2;
          } else {
            primary += 'T';
            secondary += 'T';
            current += stringAt(current + 1, 1, 'T', 'D') ? 2 : 1;
          }
          break;
          
        case 'V':
          primary += 'F';
          secondary += 'F';
          current += charAt(current + 1) === 'V' ? 2 : 1;
          break;
          
        case 'W':
          if (stringAt(current, 2, 'WR')) {
            primary += 'R';
            secondary += 'R';
            current += 2;
          } else if (current === 0 && (isVowel(current + 1) || stringAt(current, 2, 'WH'))) {
            if (isVowel(current + 1)) {
              primary += 'A';
              secondary += 'F';
            } else {
              primary += 'A';
              secondary += 'A';
            }
          }
          if (((current === last) && isVowel(current - 1)) || 
              stringAt(current - 1, 5, 'EWSKI', 'EWSKY', 'OWSKI', 'OWSKY') || 
              stringAt(0, 3, 'SCH')) {
            primary += '';
            secondary += 'F';
            current++;
          } else if (stringAt(current, 4, 'WICZ', 'WITZ')) {
            primary += 'TS';
            secondary += 'FX';
            current += 4;
          } else {
            current++;
          }
          break;
          
        case 'X':
          if (!(current === last && (stringAt(current - 3, 3, 'IAU', 'EAU') || 
                stringAt(current - 2, 2, 'AU', 'OU')))) {
            primary += 'KS';
            secondary += 'KS';
          }
          current += stringAt(current + 1, 1, 'C', 'X') ? 2 : 1;
          break;
          
        case 'Z':
          if (charAt(current + 1) === 'H') {
            primary += 'J';
            secondary += 'J';
            current += 2;
          } else if (stringAt(current + 1, 2, 'ZO', 'ZI', 'ZA') || 
                     (stringAt(0, 1, 'MC') && current > 0)) {
            primary += 'S';
            secondary += 'TS';
            current++;
          } else {
            primary += 'S';
            secondary += 'S';
            current++;
          }
          break;
          
        default:
          current++;
          break;
      }
    }
    
    return {
      primary: primary.substring(0, 4),
      secondary: secondary.substring(0, 4)
    };
  }

  /**
   * NYSIIS (New York State Identification and Intelligence System) algorithm
   * Excellent for matching names with different spellings
   */
  static nysiis(name: string): string {
    if (!name) return '';
    
    let word = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (word['length'] === 0) return '';
    
    // Step 1: Translate first characters
    if (word.startsWith('MAC')) word = 'MCC' + word.substring(3);
    else if (word.startsWith('KN')) word = 'NN' + word.substring(2);
    else if (word.startsWith('K')) word = 'C' + word.substring(1);
    else if (word.startsWith('PH')) word = 'FF' + word.substring(2);
    else if (word.startsWith('PF')) word = 'FF' + word.substring(2);
    else if (word.startsWith('SCH')) word = 'SSS' + word.substring(3);
    
    // Step 2: Translate last characters
    if (word.endsWith('EE') || word.endsWith('IE')) word = word.substring(0, word.length - 2) + 'Y';
    else if (word.endsWith('DT') || word.endsWith('RT') || word.endsWith('RD') || 
             word.endsWith('NT') || word.endsWith('ND')) word = word.substring(0, word.length - 2) + 'D';
    
    // Step 3: First character of key = first character of name
    let key = word[0];
    
    // Step 4: Translate remaining characters
    for (let i = 1; i < word.length; i++) {
      const char = word[i];
      const prev = word[i - 1];
      const next = i + 1 < word.length ? word[i + 1] : '';
      
      switch (char) {
        case 'E':
        case 'I':
        case 'O':
        case 'U':
          key += 'A';
          break;
        case 'Q':
          key += 'G';
          break;
        case 'Z':
          key += 'S';
          break;
        case 'M':
          key += 'N';
          break;
        case 'K':
          if (next === 'N') key += 'N';
          else key += 'C';
          break;
        case 'S':
          if (next === 'C' && i + 2 < word['length'] && word[i + 2] === 'H') key += 'S';
          else if (next === 'H') key += 'S';
          else key += 'S';
          break;
        case 'P':
          if (next === 'H') key += 'F';
          else key += 'P';
          break;
        case 'H':
          if (prev !== 'A' && prev !== 'E' && prev !== 'I' && prev !== 'O' && prev !== 'U' &&
              next !== 'A' && next !== 'E' && next !== 'I' && next !== 'O' && next !== 'U') {
            key += prev;
          } else {
            key += 'H';
          }
          break;
        case 'W':
          if (prev === 'A' || prev === 'E' || prev === 'I' || prev === 'O' || prev === 'U') {
            key += prev;
          } else {
            key += 'W';
          }
          break;
        default:
          key += char;
          break;
      }
    }
    
    // Step 5: Remove consecutive duplicate characters
    let result = key[0];
    for (let i = 1; i < key.length; i++) {
      if (key[i] !== key[i - 1]) {
        result += key[i];
      }
    }
    
    // Step 6: Remove trailing 'S'
    if (result.endsWith('S') && result.length > 1) {
      result = result.substring(0, result.length - 1);
    }
    
    // Step 7: Remove trailing 'AY'
    if (result.endsWith('AY') && result.length > 2) {
      result = result.substring(0, result.length - 2) + 'Y';
    }
    
    // Step 8: Remove trailing 'A'
    if (result.endsWith('A') && result.length > 1) {
      result = result.substring(0, result.length - 1);
    }
    
    return result.substring(0, 6); // Return first 6 characters
  }

  /**
   * Enhanced Soundex algorithm
   */
  static soundex(str: string): string {
    const code = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (code['length'] === 0) return '0000';
    
    let soundexCode = code[0];
    const mapping: { [key: string]: string } = {
      'BFPV': '1', 'CGJKQSXZ': '2', 'DT': '3',
      'L': '4', 'MN': '5', 'R': '6'
    };
    
    for (let i = 1; i < code.length; i++) {
      for (const [chars, digit] of Object.entries(mapping)) {
        if (chars.includes(code[i])) {
          if (soundexCode[soundexCode.length - 1] !== digit) {
            soundexCode += digit;
          }
          break;
        }
      }
      if (soundexCode['length'] === 4) break;
    }
    
    return soundexCode.padEnd(4, '0');
  }
}
