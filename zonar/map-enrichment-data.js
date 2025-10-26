#!/usr/bin/env node

/**
 * Enrichment Data Mapper
 * 
 * This script maps Coresignal data from customFields to proper schema fields
 * for all people and companies in the Notary Everyday workspace.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichmentDataMapper {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      peopleProcessed: 0,
      companiesProcessed: 0,
      peopleMapped: 0,
      companiesMapped: 0,
      errors: 0
    };
  }

  async run() {
    try {
      console.log('🗺️ Starting Enrichment Data Mapping for Notary Everyday workspace...\n');
      
      // Map people data
      await this.mapPeopleData();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Map companies data
      await this.mapCompaniesData();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in enrichment data mapping:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async mapPeopleData() {
    console.log('👤 Mapping People Enrichment Data...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { customFields: { path: ['coresignalData'], not: null } },
          { coresignalData: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        customFields: true,
        coresignalData: true,
        // Fields to potentially update
        bio: true,
        profilePictureUrl: true,
        technicalSkills: true,
        softSkills: true,
        industrySkills: true,
        certifications: true,
        totalExperience: true,
        yearsAtCompany: true,
        yearsInRole: true,
        degrees: true,
        institutions: true,
        fieldsOfStudy: true,
        graduationYears: true,
        languages: true,
        publications: true,
        speakingEngagements: true,
        achievements: true,
        careerTimeline: true,
        roleHistory: true,
        previousRoles: true,
        leadershipExperience: true,
        industryExperience: true,
        totalExperienceMonths: true,
        yearsExperience: true,
        teamSize: true,
        salaryProjections: true,
        linkedinConnections: true,
        linkedinFollowers: true
      }
    });

    console.log(`   📊 Found ${people.length} people with Coresignal data`);
    
    const batchSize = 100;
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          const mappedData = this.mapPersonData(person);
          if (mappedData.hasChanges) {
            await this.updatePersonData(person.id, mappedData.updates);
            this.results.peopleMapped++;
          }
          this.results.peopleProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error mapping ${person.fullName}:`, error.message);
          this.results.errors++;
        }
      }
    }
  }

  mapPersonData(person) {
    const coresignalData = person.coresignalData || person.customFields?.coresignalData;
    if (!coresignalData) {
      return { hasChanges: false, updates: {} };
    }

    const updates = {};
    let hasChanges = false;

    // Map basic profile data
    if (coresignalData.summary && !person.bio) {
      updates.bio = coresignalData.summary;
      hasChanges = true;
    }

    if (coresignalData.profile_picture_url && !person.profilePictureUrl) {
      updates.profilePictureUrl = coresignalData.profile_picture_url;
      hasChanges = true;
    }

    // Map skills using enhanced extraction
    const skillsData = this.extractSkillsData(coresignalData);
    if (skillsData.technicalSkills.length > 0 && (!person.technicalSkills || person.technicalSkills.length === 0)) {
      updates.technicalSkills = skillsData.technicalSkills;
      hasChanges = true;
    }
    if (skillsData.softSkills.length > 0 && (!person.softSkills || person.softSkills.length === 0)) {
      updates.softSkills = skillsData.softSkills;
      hasChanges = true;
    }
    if (skillsData.industrySkills.length > 0 && (!person.industrySkills || person.industrySkills.length === 0)) {
      updates.industrySkills = skillsData.industrySkills;
      hasChanges = true;
    }

    // Map experience data using enhanced extraction
    const experienceData = this.extractExperienceData(coresignalData);
    if (experienceData.totalExperience && !person.totalExperience) {
      updates.totalExperience = experienceData.totalExperience;
      hasChanges = true;
    }
    if (experienceData.yearsAtCompany && !person.yearsAtCompany) {
      updates.yearsAtCompany = experienceData.yearsAtCompany;
      hasChanges = true;
    }
    if (experienceData.yearsInRole && !person.yearsInRole) {
      updates.yearsInRole = experienceData.yearsInRole;
      hasChanges = true;
    }
    if (experienceData.roleHistory && experienceData.roleHistory.length > 0 && (!person.roleHistory || person.roleHistory.length === 0)) {
      updates.roleHistory = experienceData.roleHistory;
      hasChanges = true;
    }
    if (experienceData.previousRoles && experienceData.previousRoles.length > 0 && (!person.previousRoles || person.previousRoles.length === 0)) {
      updates.previousRoles = experienceData.previousRoles;
      hasChanges = true;
    }
    if (experienceData.careerTimeline && experienceData.careerTimeline.length > 0 && (!person.careerTimeline || person.careerTimeline.length === 0)) {
      updates.careerTimeline = experienceData.careerTimeline;
      hasChanges = true;
    }

    // Map education data using enhanced extraction
    const educationData = this.extractEducationData(coresignalData);
    if (educationData.degrees.length > 0 && (!person.degrees || person.degrees.length === 0)) {
      updates.degrees = educationData.degrees;
      hasChanges = true;
    }
    if (educationData.institutions.length > 0 && (!person.institutions || person.institutions.length === 0)) {
      updates.institutions = educationData.institutions;
      hasChanges = true;
    }
    if (educationData.fieldsOfStudy.length > 0 && (!person.fieldsOfStudy || person.fieldsOfStudy.length === 0)) {
      updates.fieldsOfStudy = educationData.fieldsOfStudy;
      hasChanges = true;
    }
    if (educationData.graduationYears.length > 0 && (!person.graduationYears || person.graduationYears.length === 0)) {
      updates.graduationYears = educationData.graduationYears;
      hasChanges = true;
    }

    // Map professional data using enhanced extraction
    const professionalData = this.extractProfessionalData(coresignalData);
    if (professionalData.certifications.length > 0 && (!person.certifications || person.certifications.length === 0)) {
      updates.certifications = professionalData.certifications;
      hasChanges = true;
    }
    if (professionalData.publications.length > 0 && (!person.publications || person.publications.length === 0)) {
      updates.publications = professionalData.publications;
      hasChanges = true;
    }
    if (professionalData.speakingEngagements.length > 0 && (!person.speakingEngagements || person.speakingEngagements.length === 0)) {
      updates.speakingEngagements = professionalData.speakingEngagements;
      hasChanges = true;
    }
    if (professionalData.languages.length > 0 && (!person.languages || person.languages.length === 0)) {
      updates.languages = professionalData.languages;
      hasChanges = true;
    }

    // Map LinkedIn data
    if (coresignalData.linkedin_connections && !person.linkedinConnections) {
      updates.linkedinConnections = coresignalData.linkedin_connections;
      hasChanges = true;
    }

    if (coresignalData.linkedin_followers && !person.linkedinFollowers) {
      updates.linkedinFollowers = coresignalData.linkedin_followers;
      hasChanges = true;
    }

    // Map experience timeline
    if (coresignalData.experience && !person.careerTimeline) {
      const experience = Array.isArray(coresignalData.experience) ? coresignalData.experience : [];
      if (experience.length > 0) {
        updates.careerTimeline = experience;
        hasChanges = true;
      }
    }

    // Map role history
    if (coresignalData.experience && !person.roleHistory) {
      const experience = Array.isArray(coresignalData.experience) ? coresignalData.experience : [];
      if (experience.length > 0) {
        const roleHistory = experience.map(exp => ({
          title: exp.title,
          company: exp.company,
          startDate: exp.start_date,
          endDate: exp.end_date,
          description: exp.description
        }));
        updates.roleHistory = roleHistory;
        hasChanges = true;
      }
    }

    // Map total experience in months
    if (coresignalData.total_experience_months && !person.totalExperienceMonths) {
      updates.totalExperienceMonths = coresignalData.total_experience_months;
      hasChanges = true;
    }

    // Map years of experience
    if (coresignalData.years_experience && !person.yearsExperience) {
      updates.yearsExperience = coresignalData.years_experience;
      hasChanges = true;
    }

    return { hasChanges, updates };
  }

  extractExperienceData(coresignalData) {
    const experience = coresignalData.experience || [];
    const currentRole = experience.find(exp => exp.active_experience === 1) || experience[0];
    
    let yearsAtCompany = 0;
    let yearsInRole = 0;
    
    if (currentRole) {
      const startDate = new Date(currentRole.start_date);
      const endDate = currentRole.end_date ? new Date(currentRole.end_date) : new Date();
      yearsInRole = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25));
      
      // Find company tenure
      const companyRoles = experience.filter(exp => 
        exp.company_name === currentRole.company_name || 
        exp.company_linkedin_url === currentRole.company_linkedin_url
      );
      
      if (companyRoles.length > 0) {
        const firstCompanyRole = companyRoles[companyRoles.length - 1];
        const companyStartDate = new Date(firstCompanyRole.start_date);
        yearsAtCompany = Math.floor((endDate - companyStartDate) / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const roleHistory = experience.map(exp => ({
      title: exp.title,
      company: exp.company_name,
      startDate: exp.start_date,
      endDate: exp.end_date,
      description: exp.description,
      location: exp.location,
      isActive: exp.active_experience === 1
    }));

    const previousRoles = experience.slice(1).map(exp => ({
      title: exp.title,
      company: exp.company_name,
      startDate: exp.start_date,
      endDate: exp.end_date,
      duration: this.calculateDuration(exp.start_date, exp.end_date)
    }));

    return {
      totalExperience: coresignalData.total_experience || 0,
      yearsAtCompany,
      yearsInRole,
      roleHistory,
      previousRoles,
      careerTimeline: experience
    };
  }

  extractSkillsData(coresignalData) {
    const skills = coresignalData.skills || [];
    
    // Categorize skills
    const technicalKeywords = ['programming', 'software', 'development', 'engineering', 'technical', 'coding', 'database', 'cloud', 'api', 'system', 'architecture', 'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'azure'];
    const softKeywords = ['leadership', 'management', 'communication', 'teamwork', 'problem solving', 'project management', 'strategy', 'negotiation', 'presentation', 'mentoring'];
    
    const technicalSkills = skills.filter(skill => 
      technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );
    
    const softSkills = skills.filter(skill => 
      softKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );
    
    const industrySkills = skills.filter(skill => 
      !technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword)) &&
      !softKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );

    return {
      technicalSkills,
      softSkills,
      industrySkills
    };
  }

  extractEducationData(coresignalData) {
    const education = coresignalData.education || [];
    
    const degrees = education.map(edu => ({
      degree: edu.degree,
      field: edu.field_of_study,
      school: edu.school,
      graduationYear: edu.graduation_year,
      gpa: edu.gpa,
      description: edu.description
    })).filter(edu => edu.degree);

    const institutions = [...new Set(education.map(edu => edu.school).filter(Boolean))];
    const fieldsOfStudy = [...new Set(education.map(edu => edu.field_of_study).filter(Boolean))];
    const graduationYears = education.map(edu => edu.graduation_year).filter(Boolean);

    return {
      degrees,
      institutions,
      fieldsOfStudy,
      graduationYears
    };
  }

  extractProfessionalData(coresignalData) {
    const certifications = coresignalData.certifications || [];
    const publications = coresignalData.publications || [];
    const speakingEngagements = coresignalData.speaking_engagements || [];
    const languages = coresignalData.languages || [];

    return {
      certifications: certifications.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        credentialId: cert.credential_id
      })),
      publications: publications.map(pub => ({
        title: pub.title,
        publisher: pub.publisher,
        date: pub.date,
        url: pub.url
      })),
      speakingEngagements: speakingEngagements.map(eng => ({
        title: eng.title,
        event: eng.event,
        date: eng.date,
        location: eng.location
      })),
      languages: languages.map(lang => ({
        language: lang.language,
        proficiency: lang.proficiency
      }))
    };
  }

  calculateDuration(startDate, endDate) {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    return Math.floor((end - start) / (1000 * 60 * 60 * 24 * 365.25));
  }

  async updatePersonData(personId, updates) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  async mapCompaniesData() {
    console.log('🏢 Mapping Companies Enrichment Data...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: { path: ['coresignalData'], not: null }
      },
      select: {
        id: true,
        name: true,
        customFields: true,
        description: true,
        descriptionEnriched: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        size: true,
        employeeCount: true,
        foundedYear: true,
        revenue: true,
        currency: true,
        stockSymbol: true,
        isPublic: true,
        hqLocation: true,
        hqFullAddress: true
      }
    });

    console.log(`   📊 Found ${companies.length} companies with Coresignal data`);
    
    const batchSize = 50;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`);
      
      for (const company of batch) {
        try {
          const mappedData = this.mapCompanyData(company);
          if (mappedData.hasChanges) {
            await this.updateCompanyData(company.id, mappedData.updates);
            this.results.companiesMapped++;
          }
          this.results.companiesProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error mapping ${company.name}:`, error.message);
          this.results.errors++;
        }
      }
    }
  }

  mapCompanyData(company) {
    const coresignalData = company.customFields?.coresignalData;
    if (!coresignalData) {
      return { hasChanges: false, updates: {} };
    }

    const updates = {};
    let hasChanges = false;

    // Map description
    if (coresignalData.description_enriched && !company.descriptionEnriched) {
      updates.descriptionEnriched = coresignalData.description_enriched;
      hasChanges = true;
    }

    // Map website
    if (coresignalData.website && !company.website) {
      updates.website = coresignalData.website;
      hasChanges = true;
    }

    // Map LinkedIn
    if (coresignalData.linkedin_url && !company.linkedinUrl) {
      updates.linkedinUrl = coresignalData.linkedin_url;
      hasChanges = true;
    }

    // Map industry
    if (coresignalData.industry && !company.industry) {
      updates.industry = coresignalData.industry;
      hasChanges = true;
    }

    // Map size
    if (coresignalData.size_range && !company.size) {
      updates.size = coresignalData.size_range;
      hasChanges = true;
    }

    // Map employee count
    if (coresignalData.employees_count && !company.employeeCount) {
      updates.employeeCount = coresignalData.employees_count;
      hasChanges = true;
    }

    // Map founded year
    if (coresignalData.founded_year && !company.foundedYear) {
      updates.foundedYear = coresignalData.founded_year;
      hasChanges = true;
    }

    // Map revenue
    if (coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue && !company.revenue) {
      updates.revenue = coresignalData.revenue_annual.source_5_annual_revenue.annual_revenue;
      hasChanges = true;
    }

    // Map currency
    if (coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency && !company.currency) {
      updates.currency = coresignalData.revenue_annual.source_5_annual_revenue.annual_revenue_currency;
      hasChanges = true;
    }

    // Map stock symbol
    if (coresignalData.stock_ticker && !company.stockSymbol) {
      updates.stockSymbol = coresignalData.stock_ticker;
      hasChanges = true;
    }

    // Map public status
    if (coresignalData.ownership_status !== undefined && company.isPublic === null) {
      updates.isPublic = coresignalData.ownership_status === 'public';
      hasChanges = true;
    }

    // Map headquarters location
    if (coresignalData.hq_location && !company.hqLocation) {
      updates.hqLocation = coresignalData.hq_location;
      hasChanges = true;
    }

    // Map headquarters full address
    if (coresignalData.hq_full_address && !company.hqFullAddress) {
      updates.hqFullAddress = coresignalData.hq_full_address;
      hasChanges = true;
    }

    return { hasChanges, updates };
  }

  async updateCompanyData(companyId, updates) {
    await this.prisma.companies.update({
      where: { id: companyId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  printResults() {
    console.log('\n🗺️ Enrichment Data Mapping Results:');
    console.log('====================================');
    console.log(`People Processed: ${this.results.peopleProcessed}`);
    console.log(`People Mapped: ${this.results.peopleMapped}`);
    console.log(`Companies Processed: ${this.results.companiesProcessed}`);
    console.log(`Companies Mapped: ${this.results.companiesMapped}`);
    console.log(`Errors: ${this.results.errors}`);
    
    const peopleMappingRate = this.results.peopleProcessed > 0 ? 
      Math.round((this.results.peopleMapped / this.results.peopleProcessed) * 100) : 0;
    const companiesMappingRate = this.results.companiesProcessed > 0 ? 
      Math.round((this.results.companiesMapped / this.results.companiesProcessed) * 100) : 0;
    
    console.log(`People Mapping Rate: ${peopleMappingRate}%`);
    console.log(`Companies Mapping Rate: ${companiesMappingRate}%`);
  }
}

// Run the mapper
const mapper = new EnrichmentDataMapper();
mapper.run().catch(console.error);
