/**
 * Unit Tests for TOP Competitor Field Manual Service
 * 
 * Tests the knowledge base service to ensure all content is accessible
 * and methods return expected content
 */

import { TOPCompetitorFieldManual } from '@/platform/services/top-competitor-field-manual';

describe('TOPCompetitorFieldManual', () => {
  describe('getCompleteManual', () => {
    it('should return complete manual with all sections', () => {
      const manual = TOPCompetitorFieldManual.getCompleteManual();
      
      expect(manual).toBeDefined();
      expect(manual.length).toBeGreaterThan(1000); // Should be substantial content
      
      // Check for key sections
      expect(manual).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(manual).toContain('Burns & McDonnell');
      expect(manual).toContain('Black & Veatch');
      expect(manual).toContain('Lockard & White');
      expect(manual).toContain('POSITIONING PLAYBOOK');
      expect(manual).toContain('SALES CHEAT SHEET');
    });
  });

  describe('getIntroduction', () => {
    it('should return introduction section', () => {
      const intro = TOPCompetitorFieldManual.getIntroduction();
      
      expect(intro).toBeDefined();
      expect(intro).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(intro).toContain('A Tactical Guide to Outflanking Large EPCs');
      expect(intro).toContain('TOP Engineers Plus');
      expect(intro).toContain('HOW TO USE THIS FIELD MANUAL');
    });
  });

  describe('getBurnsMcDonnellProfile', () => {
    it('should return Burns & McDonnell competitor profile', () => {
      const profile = TOPCompetitorFieldManual.getBurnsMcDonnellProfile();
      
      expect(profile).toBeDefined();
      expect(profile).toContain('BURNS & MCDONNELL');
      expect(profile).toContain('WHO THEY ARE');
      expect(profile).toContain('WHAT THEY\'LL SAY');
      expect(profile).toContain('VULNERABILITIES YOU CAN EXPLOIT');
      expect(profile).toContain('DISCOVERY QUESTIONS');
      expect(profile).toContain('TALK TRACKS / COUNTERS');
      expect(profile).toContain('PROOF REQUESTS');
      expect(profile).toContain('RFP LANGUAGE TRAPS');
      expect(profile).toContain('PRICING & TIMELINE WEDGE');
      expect(profile).toContain('CONCLUSION: HOW WE WIN');
    });

    it('should contain specific Burns & McDonnell content', () => {
      const profile = TOPCompetitorFieldManual.getBurnsMcDonnellProfile();
      
      expect(profile).toContain('Integrated EPC for predictable outcomes');
      expect(profile).toContain('slow mobilization');
      expect(profile).toContain('Excessive overhead');
      expect(profile).toContain('move as fast as your data does');
    });
  });

  describe('getBlackVeatchProfile', () => {
    it('should return Black & Veatch competitor profile', () => {
      const profile = TOPCompetitorFieldManual.getBlackVeatchProfile();
      
      expect(profile).toBeDefined();
      expect(profile).toContain('BLACK & VEATCH');
      expect(profile).toContain('WHO THEY ARE');
      expect(profile).toContain('Private LTE');
      expect(profile).toContain('PLTE orthodoxy');
      expect(profile).toContain('We design for the outcome, not the spectrum');
    });

    it('should contain specific Black & Veatch content', () => {
      const profile = TOPCompetitorFieldManual.getBlackVeatchProfile();
      
      expect(profile).toContain('800 MHz Band 26');
      expect(profile).toContain('technology-agnostic trade-off analysis');
      expect(profile).toContain('Black & Veatch writes the standard');
    });
  });

  describe('getLockardWhiteProfile', () => {
    it('should return Lockard & White competitor profile', () => {
      const profile = TOPCompetitorFieldManual.getLockardWhiteProfile();
      
      expect(profile).toBeDefined();
      expect(profile).toContain('LOCKARD & WHITE');
      expect(profile).toContain('boutique');
      expect(profile).toContain('woman-owned');
      expect(profile).toContain('Limited EPC capacity');
      expect(profile).toContain('They do great design work');
    });

    it('should contain specific Lockard & White content', () => {
      const profile = TOPCompetitorFieldManual.getLockardWhiteProfile();
      
      expect(profile).toContain('Telecom is all we do');
      expect(profile).toContain('No unified project accountability');
      expect(profile).toContain('Lockard & White can design the network');
    });
  });

  describe('getPositioningPlaybook', () => {
    it('should return positioning playbook', () => {
      const playbook = TOPCompetitorFieldManual.getPositioningPlaybook();
      
      expect(playbook).toBeDefined();
      expect(playbook).toContain('TOP POSITIONING PLAYBOOK');
      expect(playbook).toContain('CORE POSITIONING STATEMENT');
      expect(playbook).toContain('FIELD-READY PHRASE VARIANTS');
      expect(playbook).toContain('DISCOVERY PATH QUESTIONS');
      expect(playbook).toContain('GENERAL COMPETITIVE RECOMMENDATIONS');
    });

    it('should contain positioning strategies', () => {
      const playbook = TOPCompetitorFieldManual.getPositioningPlaybook();
      
      expect(playbook).toContain('leaner, smarter, and faster');
      expect(playbook).toContain('elite expertise');
      expect(playbook).toContain('full-service focus');
      expect(playbook).toContain('speed of execution');
    });
  });

  describe('getSalesCheatSheet', () => {
    it('should return sales cheat sheet', () => {
      const cheatSheet = TOPCompetitorFieldManual.getSalesCheatSheet();
      
      expect(cheatSheet).toBeDefined();
      expect(cheatSheet).toContain('SALES CHEAT SHEET');
      expect(cheatSheet).toContain('COMPETITOR COMPARISON GRID');
      expect(cheatSheet).toContain('KEY BUYER TRIGGERS');
      expect(cheatSheet).toContain('CORE POSITIONING ANCHORS');
      expect(cheatSheet).toContain('THE 3-WORD CLOSE');
    });

    it('should contain all three competitors in comparison grid', () => {
      const cheatSheet = TOPCompetitorFieldManual.getSalesCheatSheet();
      
      expect(cheatSheet).toContain('BURNS & MCDONNELL');
      expect(cheatSheet).toContain('BLACK & VEATCH');
      expect(cheatSheet).toContain('LOCKARD & WHITE');
      expect(cheatSheet).toContain('Elite. Fast. Full-Service');
    });
  });

  describe('getCompetitorProfile', () => {
    it('should return Burns & McDonnell profile when name matches', () => {
      const profile = TOPCompetitorFieldManual.getCompetitorProfile('Burns & McDonnell');
      
      expect(profile).toBeDefined();
      expect(profile).toContain('BURNS & MCDONNELL');
    });

    it('should return Burns & McDonnell profile for variations', () => {
      expect(TOPCompetitorFieldManual.getCompetitorProfile('Burns')).toContain('BURNS & MCDONNELL');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('McDonnell')).toContain('BURNS & MCDONNELL');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('B&M')).toContain('BURNS & MCDONNELL');
    });

    it('should return Black & Veatch profile when name matches', () => {
      const profile = TOPCompetitorFieldManual.getCompetitorProfile('Black & Veatch');
      
      expect(profile).toBeDefined();
      expect(profile).toContain('BLACK & VEATCH');
    });

    it('should return Black & Veatch profile for variations', () => {
      expect(TOPCompetitorFieldManual.getCompetitorProfile('Black')).toContain('BLACK & VEATCH');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('Veatch')).toContain('BLACK & VEATCH');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('B&V')).toContain('BLACK & VEATCH');
    });

    it('should return Lockard & White profile when name matches', () => {
      const profile = TOPCompetitorFieldManual.getCompetitorProfile('Lockard & White');
      
      expect(profile).toBeDefined();
      expect(profile).toContain('LOCKARD & WHITE');
    });

    it('should return Lockard & White profile for variations', () => {
      expect(TOPCompetitorFieldManual.getCompetitorProfile('Lockard')).toContain('LOCKARD & WHITE');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('White')).toContain('LOCKARD & WHITE');
      expect(TOPCompetitorFieldManual.getCompetitorProfile('L&W')).toContain('LOCKARD & WHITE');
    });

    it('should return positioning playbook for unknown competitor', () => {
      const profile = TOPCompetitorFieldManual.getCompetitorProfile('Unknown Competitor');
      
      expect(profile).toBeDefined();
      expect(profile).toContain('TOP POSITIONING PLAYBOOK');
    });
  });

  describe('getContextualManual', () => {
    it('should return contextual manual with specific competitor', () => {
      const manual = TOPCompetitorFieldManual.getContextualManual({
        competitorName: 'Burns & McDonnell'
      });
      
      expect(manual).toBeDefined();
      expect(manual).toContain('BURNS & MCDONNELL');
      expect(manual).toContain('SALES CHEAT SHEET');
    });

    it('should return contextual manual with positioning playbook for competitive situation', () => {
      const manual = TOPCompetitorFieldManual.getContextualManual({
        situation: 'competitive',
        queryType: 'positioning'
      });
      
      expect(manual).toBeDefined();
      expect(manual).toContain('TOP POSITIONING PLAYBOOK');
      expect(manual).toContain('SALES CHEAT SHEET');
    });

    it('should return full manual when no context provided', () => {
      const manual = TOPCompetitorFieldManual.getContextualManual({});
      
      expect(manual).toBeDefined();
      expect(manual).toContain('TOP POSITIONING PLAYBOOK');
      expect(manual).toContain('SALES CHEAT SHEET');
    });
  });

  describe('Content Quality', () => {
    it('should have substantial content in all sections', () => {
      const intro = TOPCompetitorFieldManual.getIntroduction();
      const burns = TOPCompetitorFieldManual.getBurnsMcDonnellProfile();
      const bv = TOPCompetitorFieldManual.getBlackVeatchProfile();
      const lw = TOPCompetitorFieldManual.getLockardWhiteProfile();
      const playbook = TOPCompetitorFieldManual.getPositioningPlaybook();
      const cheatSheet = TOPCompetitorFieldManual.getSalesCheatSheet();
      
      expect(intro.length).toBeGreaterThan(500);
      expect(burns.length).toBeGreaterThan(1000);
      expect(bv.length).toBeGreaterThan(1000);
      expect(lw.length).toBeGreaterThan(1000);
      expect(playbook.length).toBeGreaterThan(1000);
      expect(cheatSheet.length).toBeGreaterThan(500);
    });

    it('should contain actionable content (questions, talk tracks, etc.)', () => {
      const burns = TOPCompetitorFieldManual.getBurnsMcDonnellProfile();
      
      // Should contain discovery questions
      expect(burns).toContain('How quickly do you expect');
      expect(burns).toContain('When changes come mid-project');
      
      // Should contain talk tracks
      expect(burns).toContain('We deliver the same EPC accountability');
      expect(burns).toContain('principal-led teams');
      
      // Should contain RFP language
      expect(burns).toContain('Vendor must provide');
      expect(burns).toContain('within 30 days');
    });
  });
});

