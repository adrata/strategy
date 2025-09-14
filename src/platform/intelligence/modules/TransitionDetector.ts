/**
 * 🔄 TRANSITION DETECTOR
 * 
 * Detects executive transitions and outdated information
 */

export class TransitionDetector {
  private transitionKeywords = [
    'former', 'ex-', 'previous', 'retired', 'stepping down', 'departed',
    'resigned', 'left the company', 'interim', 'acting', 'temporary',
    'recently appointed', 'newly hired', 'just joined', 'started in'
  ];

  /**
   * 🔍 CHECK FOR TRANSITION INDICATORS
   */
  checkTransitionIndicators(executive: any): {
    isOutdated: boolean;
    isInterim: boolean;
    isRecent: boolean;
    confidence: number;
    issues: string[];
  } {
    const result = {
      isOutdated: false,
      isInterim: false, 
      isRecent: false,
      confidence: 100,
      issues: [] as string[]
    };

    const title = executive.title?.toLowerCase() || '';
    const name = executive.name?.toLowerCase() || '';
    
    // Check for former/outdated indicators
    const formerKeywords = ['former', 'ex-', 'previous', 'retired', 'stepped down', 'departed', 'resigned', 'left'];
    if (formerKeywords.some(keyword => title.includes(keyword) || name.includes(keyword))) {
      result['isOutdated'] = true;
      result['confidence'] = 20;
      result.issues.push('Executive marked as former or departed');
    }
    
    // Check for interim indicators
    const interimKeywords = ['interim', 'acting', 'temporary', 'transitional'];
    if (interimKeywords.some(keyword => title.includes(keyword))) {
      result['isInterim'] = true;
      result['confidence'] = 60;
      result.issues.push('Executive in interim/temporary role');
    }
    
    // Check for recent appointment indicators
    const recentKeywords = ['recently appointed', 'newly hired', 'just joined', 'started in'];
    if (recentKeywords.some(keyword => title.includes(keyword))) {
      result['isRecent'] = true;
      result['confidence'] = 85;
      result.issues.push('Recently appointed executive - verify current status');
    }
    
    return result;
  }

  /**
   * 📅 VALIDATE APPOINTMENT DATE
   */
  validateAppointmentDate(appointmentDate?: string): {
    isCurrent: boolean;
    daysSince: number;
    confidence: number;
  } {
    if (!appointmentDate) {
      return { isCurrent: true, daysSince: 0, confidence: 70 };
    }

    try {
      const appointmentTime = new Date(appointmentDate).getTime();
      const now = Date.now();
      const daysSince = Math.floor((now - appointmentTime) / (1000 * 60 * 60 * 24));
      
      // Very recent appointments might still be transitioning
      if (daysSince < 30) {
        return { isCurrent: true, daysSince, confidence: 80 };
      }
      
      // Normal tenure
      if (daysSince < 365 * 3) { // 3 years
        return { isCurrent: true, daysSince, confidence: 95 };
      }
      
      // Long tenure - very stable
      return { isCurrent: true, daysSince, confidence: 98 };
      
    } catch (error) {
      return { isCurrent: true, daysSince: 0, confidence: 60 };
    }
  }
}
