import {
  extractBestCurrentTitle,
  normalizeCompanyName,
  isProfessionalRole,
  calculateSeniorityScore,
} from '../title-extraction';
import type { WorkExperience, CoreSignalExperience } from '../title-extraction';

describe('title-extraction', () => {
  describe('normalizeCompanyName', () => {
    it('should normalize company names by removing suffixes', () => {
      expect(normalizeCompanyName('Fastly Inc')).toBe('fastly');
      expect(normalizeCompanyName('Fastly, Inc.')).toBe('fastly');
      expect(normalizeCompanyName('Fastly LLC')).toBe('fastly');
      expect(normalizeCompanyName('Fastly Corp')).toBe('fastly');
    });

    it('should handle null and undefined', () => {
      expect(normalizeCompanyName(null)).toBe('');
      expect(normalizeCompanyName(undefined)).toBe('');
    });

    it('should remove special characters', () => {
      expect(normalizeCompanyName('Fastly, Inc.')).toBe('fastly');
      expect(normalizeCompanyName('Fastly & Co.')).toBe('fastlyco');
    });
  });

  describe('isProfessionalRole', () => {
    it('should identify professional roles', () => {
      expect(isProfessionalRole('VP Engineering')).toBe(true);
      expect(isProfessionalRole('Software Engineer')).toBe(true);
      expect(isProfessionalRole('Director of Marketing')).toBe(true);
      expect(isProfessionalRole('CEO')).toBe(true);
    });

    it('should identify side roles', () => {
      expect(isProfessionalRole('Team 91 Lacross Coach')).toBe(false);
      expect(isProfessionalRole('Volunteer Advisor')).toBe(false);
      expect(isProfessionalRole('Board Member')).toBe(false);
      expect(isProfessionalRole('Freelance Consultant')).toBe(false);
    });

    it('should default to professional for unknown roles', () => {
      expect(isProfessionalRole(null)).toBe(true);
      expect(isProfessionalRole(undefined)).toBe(true);
    });
  });

  describe('calculateSeniorityScore', () => {
    it('should score C-level roles highest', () => {
      expect(calculateSeniorityScore('CEO')).toBe(100);
      expect(calculateSeniorityScore('Chief Technology Officer')).toBe(100);
      expect(calculateSeniorityScore('CTO')).toBe(100);
    });

    it('should score VP roles high', () => {
      expect(calculateSeniorityScore('VP Engineering')).toBe(80);
      expect(calculateSeniorityScore('Vice President of Sales')).toBe(80);
    });

    it('should score Director roles', () => {
      expect(calculateSeniorityScore('Director of Marketing')).toBe(60);
      expect(calculateSeniorityScore('Head of Engineering')).toBe(60);
    });

    it('should score Manager/Lead roles', () => {
      expect(calculateSeniorityScore('Engineering Manager')).toBe(40);
      expect(calculateSeniorityScore('Lead Developer')).toBe(40);
      expect(calculateSeniorityScore('Principal Engineer')).toBe(40);
    });

    it('should score Individual Contributor roles', () => {
      expect(calculateSeniorityScore('Software Engineer')).toBe(20);
      expect(calculateSeniorityScore('Product Designer')).toBe(20);
      expect(calculateSeniorityScore('Data Analyst')).toBe(20);
    });

    it('should default to low score for unknown roles', () => {
      expect(calculateSeniorityScore('Unknown Role')).toBe(10);
      expect(calculateSeniorityScore(null)).toBe(10);
    });
  });

  describe('extractBestCurrentTitle', () => {
    describe('with PDL work history', () => {
      const workHistory: WorkExperience[] = [
        {
          company: 'Fastly',
          companyId: 'fastly-123',
          title: 'Team 91 Lacross Coach',
          startDate: '2024-01-01',
          isCurrent: true,
        },
        {
          company: 'Fastly',
          companyId: 'fastly-123',
          title: 'VP Engineering',
          startDate: '2018-01-01',
          isCurrent: true,
        },
        {
          company: 'Google',
          title: 'Software Engineer',
          startDate: '2015-01-01',
          endDate: '2017-12-31',
          isCurrent: false,
        },
      ];

      it('should prefer company-matched professional role over side role', () => {
        const result = extractBestCurrentTitle(
          { workHistory },
          'Fastly',
          'fastly-123',
          null
        );

        expect(result.title).toBe('VP Engineering');
        expect(result.source).toBe('company-matched');
        expect(result.confidence).toBeGreaterThan(90);
      });

      it('should use manual title when provided', () => {
        const result = extractBestCurrentTitle(
          { workHistory },
          'Fastly',
          'fastly-123',
          'Custom Title'
        );

        expect(result.title).toBe('Custom Title');
        expect(result.source).toBe('manual');
        expect(result.confidence).toBe(100);
      });

      it('should fallback to most recent current role when no company match', () => {
        const result = extractBestCurrentTitle(
          { workHistory },
          'Microsoft',
          null,
          null
        );

        expect(result.title).toBe('Team 91 Lacross Coach'); // Most recent current
        expect(result.source).toBe('current-role');
      });
    });

    describe('with CoreSignal experience', () => {
      const experience: CoreSignalExperience[] = [
        {
          company_name: 'Fastly',
          company_id: 'fastly-123',
          position_title: 'Team 91 Lacross Coach',
          active_experience: 1,
          date_from: '2024-01-01',
        },
        {
          company_name: 'Fastly',
          company_id: 'fastly-123',
          position_title: 'VP Engineering',
          active_experience: 1,
          date_from: '2018-01-01',
        },
        {
          company_name: 'Google',
          position_title: 'Software Engineer',
          active_experience: 0,
          date_from: '2015-01-01',
          date_to: '2017-12-31',
        },
      ];

      it('should prefer company-matched professional role', () => {
        const result = extractBestCurrentTitle(
          {
            experience,
            active_experience_title: 'Team 91 Lacross Coach',
          },
          'Fastly',
          'fastly-123',
          null
        );

        expect(result.title).toBe('VP Engineering');
        expect(result.source).toBe('company-matched');
      });

      it('should handle company name variations', () => {
        const result = extractBestCurrentTitle(
          {
            experience,
            active_experience_title: 'Team 91 Lacross Coach',
          },
          'Fastly Inc',
          null,
          null
        );

        expect(result.title).toBe('VP Engineering');
      });
    });

    describe('edge cases', () => {
      it('should handle no work experience', () => {
        const result = extractBestCurrentTitle(
          {
            job_title: 'Software Engineer',
          },
          null,
          null,
          null
        );

        expect(result.title).toBe('Software Engineer');
        expect(result.source).toBe('api-default');
      });

      it('should handle no current roles', () => {
        const workHistory: WorkExperience[] = [
          {
            company: 'Google',
            title: 'Software Engineer',
            startDate: '2015-01-01',
            endDate: '2017-12-31',
            isCurrent: false,
          },
        ];

        const result = extractBestCurrentTitle(
          { workHistory },
          'Google',
          null,
          null
        );

        expect(result.title).toBe('Software Engineer');
        expect(result.source).toBe('recent-role');
        expect(result.isCurrent).toBe(false);
      });

      it('should handle multiple professional roles at same company', () => {
        const workHistory: WorkExperience[] = [
          {
            company: 'Fastly',
            title: 'VP Product',
            startDate: '2020-01-01',
            isCurrent: true,
          },
          {
            company: 'Fastly',
            title: 'VP Engineering',
            startDate: '2018-01-01', // Longer tenure
            isCurrent: true,
          },
        ];

        const result = extractBestCurrentTitle(
          { workHistory },
          'Fastly',
          null,
          null
        );

        // Should prefer VP Engineering due to longer tenure
        expect(result.title).toBe('VP Engineering');
        expect(result.source).toBe('company-matched');
      });

      it('should handle only side roles at company', () => {
        const workHistory: WorkExperience[] = [
          {
            company: 'Fastly',
            title: 'Team 91 Lacross Coach',
            startDate: '2024-01-01',
            isCurrent: true,
          },
          {
            company: 'Fastly',
            title: 'Volunteer Advisor',
            startDate: '2023-01-01',
            isCurrent: true,
          },
        ];

        const result = extractBestCurrentTitle(
          { workHistory },
          'Fastly',
          null,
          null
        );

        // Should still return a title (most recent side role)
        expect(result.title).toBe('Team 91 Lacross Coach');
        expect(result.source).toBe('company-matched');
      });

      it('should handle person at different company', () => {
        const workHistory: WorkExperience[] = [
          {
            company: 'Microsoft',
            title: 'CTO',
            startDate: '2024-01-01',
            isCurrent: true,
          },
          {
            company: 'Fastly',
            title: 'VP Engineering',
            startDate: '2018-01-01',
            endDate: '2023-12-31',
            isCurrent: false,
          },
        ];

        const result = extractBestCurrentTitle(
          { workHistory },
          'Fastly',
          null,
          null
        );

        // Should use current role at Microsoft (most accurate current title)
        expect(result.title).toBe('CTO');
        expect(result.source).toBe('current-role');
        expect(result.matchedCompany).toBe('Microsoft');
      });
    });
  });
});

