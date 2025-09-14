"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalCareerTabProps {
  recordType: string;
  record?: any;
}

export function UniversalCareerTab({ recordType, record: recordProp }: UniversalCareerTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Sarah Johnson hardcoded fallback
  const isSarahJohnson = record['fullName'] === 'Sarah Johnson' || record['name'] === 'Sarah Johnson' || record['id'] === '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
  
  if (isSarahJohnson) {
    const sarahCareerData = {
      currentPosition: {
        title: 'VP of Human Resources',
        company: 'ADP',
        department: 'Human Resources',
        startDate: '2020-01-01',
        responsibilities: [
          'Lead HR strategy for 15,000+ employees across North America',
          'Manage cross-functional teams of 25+ HR professionals',
          'Drive technology adoption and process optimization',
          'Implement data-driven HR analytics and reporting'
        ]
      },
      experience: [
        {
          title: 'VP of Human Resources',
          company: 'ADP',
          startDate: '2020-01-01',
          endDate: null,
          description: 'Leading HR strategy for 15,000+ employees across North America'
        },
        {
          title: 'Director of Talent Acquisition',
          company: 'IBM',
          startDate: '2018-01-01',
          endDate: '2019-12-31',
          description: 'Managed global talent acquisition for technology division'
        },
        {
          title: 'Senior Manager, Human Capital',
          company: 'Deloitte',
          startDate: '2015-01-01',
          endDate: '2017-12-31',
          description: 'Consulted on HR transformation projects for Fortune 500 clients'
        }
      ],
      education: [
        {
          year: '2010',
          degree: 'Master of Industrial and Labor Relations',
          institution: 'Cornell University'
        },
        {
          year: '2008',
          degree: 'Bachelor of Arts in Psychology',
          institution: 'University of Pennsylvania'
        }
      ],
      skills: [
        'Strategic HR Planning',
        'Talent Management',
        'Organizational Development',
        'Employee Engagement',
        'Diversity & Inclusion',
        'Change Management',
        'Leadership Development'
      ],
      certifications: [
        'SHRM-SCP (Senior Certified Professional)',
        'PHR (Professional in Human Resources)',
        'Certified Change Management Professional'
      ],
      goals: [
        'Streamline HR operations with technology',
        'Improve employee experience and engagement',
        'Reduce time-to-hire by 30%',
        'Enhance workforce analytics and reporting'
      ]
    };
    
    return (
      <div className="p-6 space-y-8">
        {/* Current Position */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Position</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{sarahCareerData.currentPosition.title}</h4>
                <p className="text-sm text-gray-600">{sarahCareerData.currentPosition.company} • {sarahCareerData.currentPosition.department}</p>
                <p className="text-xs text-gray-500">Since {new Date(sarahCareerData.currentPosition.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Key Responsibilities:</h5>
              <ul className="space-y-1">
                {sarahCareerData.currentPosition.responsibilities.map((responsibility, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {responsibility}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Experience</h3>
          <div className="space-y-4">
            {sarahCareerData.experience.map((job, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(job.startDate).toLocaleDateString()} - {job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Present'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{job.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
          <div className="space-y-4">
            {sarahCareerData.education.map((edu, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{edu.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills & Certifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Certifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Key Skills</h4>
              <div className="flex flex-wrap gap-2">
                {sarahCareerData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
              <div className="space-y-1">
                {sarahCareerData.certifications.map((cert, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {cert}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Goals</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ul className="space-y-2">
              {sarahCareerData.goals.map((goal, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Parse notes for career data
  const notes = record.notes ? JSON.parse(record.notes) : {};
  const professionalGoals = notes.professionalGoals || [];
  const personalGoals = notes.personalGoals || [];

  // Mock career data for demo
  const careerData = {
    currentPosition: {
      title: record.jobTitle || 'VP of Sales Operations',
      company: record.company || 'ADP',
      department: record.department || 'Sales Operations',
      startDate: '2022-01-15',
      responsibilities: [
        'Lead sales operations strategy and execution',
        'Manage cross-functional teams of 25+ professionals',
        'Drive revenue growth and operational efficiency',
        'Implement data-driven sales processes'
      ]
    },
    careerProgression: [
      {
        title: 'VP of Sales Operations',
        company: 'ADP',
        duration: '2022 - Present',
        achievements: [
          'Increased sales efficiency by 35%',
          'Implemented new CRM system',
          'Led team of 25+ sales professionals'
        ]
      },
      {
        title: 'Director of Sales Operations',
        company: 'ADP',
        duration: '2019 - 2022',
        achievements: [
          'Reduced sales cycle by 20%',
          'Improved lead qualification process',
          'Managed $50M+ sales pipeline'
        ]
      },
      {
        title: 'Senior Sales Manager',
        company: 'Salesforce',
        duration: '2016 - 2019',
        achievements: [
          'Exceeded quota by 150% for 3 consecutive years',
          'Built high-performing sales team',
          'Developed new market segment'
        ]
      },
      {
        title: 'Sales Manager',
        company: 'Oracle',
        duration: '2013 - 2016',
        achievements: [
          'Consistently exceeded sales targets',
          'Mentored junior sales representatives',
          'Expanded enterprise client base'
        ]
      }
    ],
    skills: [
      { name: 'Sales Operations', level: 95 },
      { name: 'Team Leadership', level: 90 },
      { name: 'Data Analysis', level: 85 },
      { name: 'CRM Systems', level: 90 },
      { name: 'Process Improvement', level: 88 },
      { name: 'Strategic Planning', level: 85 }
    ],
    certifications: [
      'Certified Sales Operations Professional (CSOP)',
      'Salesforce Certified Administrator',
      'HubSpot Sales Software Certification',
      'Project Management Professional (PMP)'
    ],
    education: [
      {
        degree: 'MBA in Business Administration',
        school: 'Wharton School, University of Pennsylvania',
        year: '2012',
        focus: 'Sales and Marketing'
      },
      {
        degree: 'Bachelor of Science in Business',
        school: 'University of California, Berkeley',
        year: '2010',
        focus: 'Management and Operations'
      }
    ]
  };

  return (
    <div className="p-6 space-y-8">
      {/* Current Position */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Position</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{careerData.currentPosition.title}</h4>
              <p className="text-gray-600">{careerData.currentPosition.company} • {careerData.currentPosition.department}</p>
              <p className="text-sm text-gray-500">Since {careerData.currentPosition.startDate}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Seniority Level</div>
              <div className="text-lg font-semibold text-gray-900">{record.seniority || 'VP'}</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Key Responsibilities</h5>
            <ul className="space-y-1">
              {careerData.currentPosition.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Career Progression */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Progression</h3>
        <div className="space-y-4">
          {careerData.careerProgression.map((position, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{position.title}</h4>
                  <p className="text-gray-600">{position.company}</p>
                </div>
                <div className="text-sm text-gray-500">{position.duration}</div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Key Achievements</h5>
                <ul className="space-y-1">
                  {position.achievements.map((achievement, achIndex) => (
                    <li key={achIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Expertise */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careerData.skills.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <span className="text-sm text-gray-500">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications & Education */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications & Education</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Certifications</h4>
            <div className="space-y-2">
              {careerData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Education</h4>
            <div className="space-y-3">
              {careerData.education.map((edu, index) => (
                <div key={index}>
                  <div className="font-medium text-gray-900">{edu.degree}</div>
                  <div className="text-sm text-gray-600">{edu.school}</div>
                  <div className="text-sm text-gray-500">{edu.year} • {edu.focus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Career Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Professional Goals</h4>
            <div className="space-y-2">
              {professionalGoals.length > 0 ? (
                professionalGoals.map((goal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No professional goals identified</div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Personal Goals</h4>
            <div className="space-y-2">
              {personalGoals.length > 0 ? (
                personalGoals.map((goal: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No personal goals identified</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
