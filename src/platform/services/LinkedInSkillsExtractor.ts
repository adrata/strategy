/**
 * LinkedIn Skills Extraction Service
 * Extracts skills from rich LinkedIn CSV data fields
 */

export interface SkillExtractionResult {
  skills: string[];
  skillsByCategory: {
    technical: string[];
    business: string[];
    industry: string[];
    tools: string[];
    certifications: string[];
  };
  confidenceScore: number;
}

export class LinkedInSkillsExtractor {
  
  // Comprehensive skill dictionaries for extraction
  private static readonly SKILL_PATTERNS = {
    // Programming Languages & Technologies
    technical: [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', '.net',
      'html', 'css', 'sass', 'scss', 'bootstrap', 'tailwind',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
      'terraform', 'ansible', 'chef', 'puppet', 'nginx', 'apache',
      'microservices', 'api', 'rest', 'graphql', 'grpc', 'soap'
    ],
    
    // Business & Analytics Tools
    business: [
      'salesforce', 'hubspot', 'dynamics', 'workday', 'servicenow', 'zendesk',
      'tableau', 'power bi', 'looker', 'qlik', 'google analytics', 'adobe analytics',
      'excel', 'powerpoint', 'word', 'outlook', 'google sheets', 'google docs',
      'jira', 'confluence', 'asana', 'trello', 'monday.com', 'notion',
      'slack', 'microsoft teams', 'zoom', 'webex'
    ],
    
    // Project Management & Methodologies
    methodologies: [
      'agile', 'scrum', 'kanban', 'lean', 'six sigma', 'pmp', 'prince2',
      'devops', 'ci/cd', 'continuous integration', 'continuous deployment',
      'waterfall', 'safe', 'less', 'spotify model'
    ],
    
    // Industry & Domain Expertise
    industry: [
      'fintech', 'healthcare', 'edtech', 'retail', 'e-commerce', 'manufacturing',
      'logistics', 'supply chain', 'automotive', 'aerospace', 'defense',
      'cybersecurity', 'blockchain', 'cryptocurrency', 'ai', 'machine learning',
      'data science', 'artificial intelligence', 'deep learning', 'nlp',
      'iot', 'ar', 'vr', 'cloud computing', 'saas', 'paas', 'iaas'
    ],
    
    // Compliance & Standards
    compliance: [
      'gdpr', 'ccpa', 'hipaa', 'sox', 'pci dss', 'iso 27001', 'nist',
      'cmmi', 'itil', 'cobit', 'togaf'
    ]
  };

  /**
   * Main extraction method - processes all LinkedIn fields for skills
   */
  extractSkills(linkedInRecord: any): SkillExtractionResult {
    const allSkills = new Set<string>();
    const skillsByCategory = {
      technical: new Set<string>(),
      business: new Set<string>(),
      industry: new Set<string>(),
      tools: new Set<string>(),
      certifications: new Set<string>()
    };

    let totalFields = 0;
    let processedFields = 0;

    // Extract from experience (highest priority - most detailed)
    if (linkedInRecord.experience) {
      totalFields++;
      const experienceSkills = this.extractFromExperience(linkedInRecord.experience);
      if (experienceSkills.length > 0) {
        processedFields++;
        experienceSkills.forEach(skill => {
          allSkills.add(skill);
          this.categorizeSkill(skill, skillsByCategory);
        });
      }
    }

    // Extract from certifications (high confidence)
    if (linkedInRecord.certifications) {
      totalFields++;
      const certSkills = this.extractFromCertifications(linkedInRecord.certifications);
      if (certSkills.length > 0) {
        processedFields++;
        certSkills.forEach(skill => {
          allSkills.add(skill);
          skillsByCategory.certifications.add(skill);
          this.categorizeSkill(skill, skillsByCategory);
        });
      }
    }

    // Extract from about section (medium confidence)
    if (linkedInRecord.about) {
      totalFields++;
      const aboutSkills = this.extractFromAbout(linkedInRecord.about);
      if (aboutSkills.length > 0) {
        processedFields++;
        aboutSkills.forEach(skill => {
          allSkills.add(skill);
          this.categorizeSkill(skill, skillsByCategory);
        });
      }
    }

    // Extract from education (lower confidence, but important for specializations)
    if (linkedInRecord.education) {
      totalFields++;
      const eduSkills = this.extractFromEducation(linkedInRecord.education);
      if (eduSkills.length > 0) {
        processedFields++;
        eduSkills.forEach(skill => {
          allSkills.add(skill);
          this.categorizeSkill(skill, skillsByCategory);
        });
      }
    }

    // Extract from courses (medium confidence)
    if (linkedInRecord.courses) {
      totalFields++;
      const courseSkills = this.extractFromCourses(linkedInRecord.courses);
      if (courseSkills.length > 0) {
        processedFields++;
        courseSkills.forEach(skill => {
          allSkills.add(skill);
          this.categorizeSkill(skill, skillsByCategory);
        });
      }
    }

    // Calculate confidence score based on data coverage
    const confidenceScore = totalFields > 0 ? (processedFields / totalFields) * 100 : 0;

    return {
      skills: Array.from(allSkills),
      skillsByCategory: {
        technical: Array.from(skillsByCategory.technical),
        business: Array.from(skillsByCategory.business),
        industry: Array.from(skillsByCategory.industry),
        tools: Array.from(skillsByCategory.tools),
        certifications: Array.from(skillsByCategory.certifications)
      },
      confidenceScore
    };
  }

  /**
   * Extract skills from experience JSON/text
   */
  private extractFromExperience(experience: string | any[]): string[] {
    const skills = new Set<string>();
    
    try {
      let experienceData: any[] = [];
      
      if (typeof experience === 'string') {
        // Try to parse as JSON
        try {
          experienceData = JSON.parse(experience);
        } catch {
          // If not JSON, treat as text
          return this.extractSkillsFromText(experience);
        }
      } else if (Array.isArray(experience)) {
        experienceData = experience;
      }

      // Process each experience entry
      experienceData.forEach(exp => {
        if (exp.description) {
          const descSkills = this.extractSkillsFromText(exp.description);
          descSkills.forEach(skill => skills.add(skill));
        }
        
        if (exp.title) {
          const titleSkills = this.extractSkillsFromText(exp.title);
          titleSkills.forEach(skill => skills.add(skill));
        }
      });

    } catch (error) {
      console.warn('Error processing experience data:', error);
    }

    return Array.from(skills);
  }

  /**
   * Extract skills from certifications JSON/text
   */
  private extractFromCertifications(certifications: string | any[]): string[] {
    const skills = new Set<string>();
    
    try {
      let certData: any[] = [];
      
      if (typeof certifications === 'string') {
        try {
          certData = JSON.parse(certifications);
        } catch {
          return this.extractSkillsFromText(certifications);
        }
      } else if (Array.isArray(certifications)) {
        certData = certifications;
      }

      certData.forEach(cert => {
        if (cert.title || cert.name) {
          const certName = cert.title || cert.name;
          skills.add(certName);
          
          // Extract underlying skills from certification names
          const certSkills = this.extractSkillsFromText(certName);
          certSkills.forEach(skill => skills.add(skill));
        }
        
        if (cert.issuer) {
          // Add issuer as a skill (e.g., "AWS", "Salesforce")
          skills.add(cert.issuer);
        }
      });

    } catch (error) {
      console.warn('Error processing certifications data:', error);
    }

    return Array.from(skills);
  }

  /**
   * Extract skills from about/summary text
   */
  private extractFromAbout(about: string): string[] {
    return this.extractSkillsFromText(about);
  }

  /**
   * Extract skills from education JSON/text
   */
  private extractFromEducation(education: string | any[]): string[] {
    const skills = new Set<string>();
    
    try {
      let eduData: any[] = [];
      
      if (typeof education === 'string') {
        try {
          eduData = JSON.parse(education);
        } catch {
          return this.extractSkillsFromText(education);
        }
      } else if (Array.isArray(education)) {
        eduData = education;
      }

      eduData.forEach(edu => {
        if (edu.field_of_study || edu.field) {
          const field = edu.field_of_study || edu.field;
          const fieldSkills = this.extractSkillsFromText(field);
          fieldSkills.forEach(skill => skills.add(skill));
        }
        
        if (edu.degree) {
          const degreeSkills = this.extractSkillsFromText(edu.degree);
          degreeSkills.forEach(skill => skills.add(skill));
        }
      });

    } catch (error) {
      console.warn('Error processing education data:', error);
    }

    return Array.from(skills);
  }

  /**
   * Extract skills from courses JSON/text
   */
  private extractFromCourses(courses: string | any[]): string[] {
    const skills = new Set<string>();
    
    try {
      let courseData: any[] = [];
      
      if (typeof courses === 'string') {
        try {
          courseData = JSON.parse(courses);
        } catch {
          return this.extractSkillsFromText(courses);
        }
      } else if (Array.isArray(courses)) {
        courseData = courses;
      }

      courseData.forEach(course => {
        if (course.title || course.name) {
          const courseName = course.title || course.name;
          const courseSkills = this.extractSkillsFromText(courseName);
          courseSkills.forEach(skill => skills.add(skill));
        }
      });

    } catch (error) {
      console.warn('Error processing courses data:', error);
    }

    return Array.from(skills);
  }

  /**
   * Core text processing method - extracts skills using pattern matching
   */
  private extractSkillsFromText(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    const skills = new Set<string>();
    const lowerText = text.toLowerCase();
    
    // Check all skill patterns
    Object.values(LinkedInSkillsExtractor.SKILL_PATTERNS).flat().forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      if (regex.test(lowerText)) {
        skills.add(this.normalizeSkillName(skill));
      }
    });

    return Array.from(skills);
  }

  /**
   * Categorize skill into appropriate category
   */
  private categorizeSkill(skill: string, categories: any): void {
    const skillLower = skill.toLowerCase();
    
    if (LinkedInSkillsExtractor.SKILL_PATTERNS.technical.some(t => 
      skillLower.includes(t.toLowerCase()))) {
      categories.technical.add(skill);
    }
    
    if (LinkedInSkillsExtractor.SKILL_PATTERNS.business.some(b => 
      skillLower.includes(b.toLowerCase()))) {
      categories.business.add(skill);
    }
    
    if (LinkedInSkillsExtractor.SKILL_PATTERNS.industry.some(i => 
      skillLower.includes(i.toLowerCase()))) {
      categories.industry.add(skill);
    }
  }

  /**
   * Normalize skill names for consistency
   */
  private normalizeSkillName(skill: string): string {
    // Convert to proper case and handle common variations
    const skillMap: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'node.js': 'Node.js',
      'react.js': 'React',
      'vue.js': 'Vue.js',
      'angular.js': 'Angular',
      'c#': 'C#',
      'c++': 'C++',
      '.net': '.NET',
      'aws': 'AWS',
      'gcp': 'Google Cloud Platform',
      'api': 'API',
      'rest': 'REST API',
      'graphql': 'GraphQL',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'ai': 'Artificial Intelligence',
      'ml': 'Machine Learning',
      'nlp': 'Natural Language Processing'
    };

    return skillMap[skill.toLowerCase()] || skill;
  }
}

// Export default instance
export const linkedInSkillsExtractor = new LinkedInSkillsExtractor(); 