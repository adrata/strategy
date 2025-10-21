/**
 * Buyer Group Role Archetypes
 * 25 archetypes across 5 roles: Champion, Stakeholder, Blocker, Decision Maker, Introducer
 */

export interface BuyerGroupArchetype {
  id: string;
  name: string;
  role: 'Champion' | 'Stakeholder' | 'Blocker' | 'Decision Maker' | 'Introducer';
  description: string;
  characteristics: {
    motivations: string[];
    concerns: string[];
    decisionMakingStyle: string;
    communicationStyle: string;
    keyNeeds: string[];
  };
  situation: string;
  complication: string;
  futureState: string;
  industryPersonalization: {
    [industry: string]: {
      situation: string;
      complication: string;
      futureState: string;
    };
  };
}

export const BUYER_GROUP_ARCHETYPES: BuyerGroupArchetype[] = [
  // CHAMPION ARCHETYPES (5)
  {
    id: 'rising-star',
    name: 'The Rising Star',
    role: 'Champion',
    description: 'Mid-level manager eager to prove themselves with innovative solutions',
    characteristics: {
      motivations: ['Career advancement', 'Visibility', 'Innovation recognition'],
      concerns: ['Business case justification', 'Implementation risks', 'Leadership approval'],
      decisionMakingStyle: 'Enthusiastic advocate who works overtime to push solutions through',
      communicationStyle: 'Direct, results-focused, needs ammunition to defend business case',
      keyNeeds: ['ROI data', 'Success stories', 'Implementation support', 'Executive backing']
    },
    situation: 'A motivated mid-level manager seeking to demonstrate value through strategic initiatives',
    complication: 'Needs to justify innovative solutions to skeptical leadership while proving their strategic thinking',
    futureState: 'Becomes the internal champion who successfully drives transformation and gains recognition',
    industryPersonalization: {
      'Technology': {
        situation: 'Leading digital transformation initiatives while proving technical leadership capabilities',
        complication: 'Balancing innovation with enterprise security and compliance requirements',
        futureState: 'Becomes the go-to technical leader who drives successful digital initiatives'
      },
      'Healthcare': {
        situation: 'Implementing patient care improvements while navigating regulatory constraints',
        complication: 'Ensuring HIPAA compliance while driving operational efficiency improvements',
        futureState: 'Becomes the clinical innovation leader who improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'Modernizing production processes while maintaining operational continuity',
        complication: 'Integrating new technologies without disrupting existing production lines',
        futureState: 'Becomes the operational excellence leader who drives efficiency gains'
      }
    }
  },
  {
    id: 'frustrated-innovator',
    name: 'The Frustrated Innovator',
    role: 'Champion',
    description: 'Senior individual contributor or team lead living with daily pain points',
    characteristics: {
      motivations: ['Solving real problems', 'Eliminating daily frustrations', 'Proving ROI'],
      concerns: ['Budget approval', 'Previous failures', 'Implementation complexity'],
      decisionMakingStyle: 'Deeply understands the problem and can articulate ROI clearly',
      communicationStyle: 'Passionate about solutions, detailed in problem description',
      keyNeeds: ['Proof of concept', 'Implementation support', 'Budget justification', 'Success metrics']
    },
    situation: 'A seasoned professional who has experienced the pain points firsthand and understands the solution needed',
    complication: 'Has tried to get budget for solutions before but failed, needs compelling evidence of success',
    futureState: 'Becomes the fiercest internal advocate once the solution proves its value',
    industryPersonalization: {
      'Technology': {
        situation: 'Experienced developer dealing with legacy system limitations and technical debt',
        complication: 'Previous attempts to modernize were blocked by budget constraints and risk aversion',
        futureState: 'Becomes the technical evangelist who drives successful modernization initiatives'
      },
      'Healthcare': {
        situation: 'Clinical professional frustrated with inefficient workflows and outdated systems',
        complication: 'Previous technology implementations failed due to poor change management',
        futureState: 'Becomes the clinical champion who successfully implements workflow improvements'
      },
      'Manufacturing': {
        situation: 'Operations manager dealing with manual processes and outdated equipment',
        complication: 'Previous automation attempts were too complex and disrupted production',
        futureState: 'Becomes the operations champion who drives successful process automation'
      }
    }
  },
  {
    id: 'mentor-backed-protege',
    name: 'The Mentor-Backed Protégé',
    role: 'Champion',
    description: 'Has a sponsor in senior leadership who encouraged them to explore solutions',
    characteristics: {
      motivations: ['Executive approval', 'Learning opportunities', 'Career development'],
      concerns: ['Implementation complexity', 'Learning curve', 'Executive expectations'],
      decisionMakingStyle: 'Less experienced but politically protected, brings credibility through executive relationship',
      communicationStyle: 'Respectful, seeks guidance, values mentorship',
      keyNeeds: ['Hand-holding', 'Clear implementation path', 'Executive support', 'Training resources']
    },
    situation: 'A promising professional with executive backing exploring strategic solutions',
    complication: 'May need more guidance but has clear path to approval through executive relationship',
    futureState: 'Develops into a confident leader who successfully implements strategic initiatives',
    industryPersonalization: {
      'Technology': {
        situation: 'Junior technical leader with CTO backing exploring modern development practices',
        complication: 'Learning modern technologies while maintaining existing system stability',
        futureState: 'Becomes the technical leader who successfully drives development modernization'
      },
      'Healthcare': {
        situation: 'Clinical professional with CMO support exploring patient care innovations',
        complication: 'Balancing clinical excellence with operational efficiency improvements',
        futureState: 'Becomes the clinical leader who successfully improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'Operations professional with COO backing exploring production optimization',
        complication: 'Learning advanced manufacturing while maintaining current production levels',
        futureState: 'Becomes the operations leader who successfully drives production improvements'
      }
    }
  },
  {
    id: 'change-agent',
    name: 'The Change Agent',
    role: 'Champion',
    description: 'Recently brought in to transform a department or function',
    characteristics: {
      motivations: ['Quick wins', 'Transformation success', 'Building momentum'],
      concerns: ['Resistance to change', 'Implementation timeline', 'Resource constraints'],
      decisionMakingStyle: 'Moving fast with leadership air cover, looking for quick wins',
      communicationStyle: 'Urgent, results-focused, emphasizes transformation benefits',
      keyNeeds: ['Quick implementation', 'Visible results', 'Change management support', 'Success metrics']
    },
    situation: 'A transformation leader with explicit mandate to modernize operations and drive change',
    complication: 'Facing resistance to change while needing to demonstrate quick wins to build momentum',
    futureState: 'Successfully transforms the organization and becomes the go-to change leader',
    industryPersonalization: {
      'Technology': {
        situation: 'New CTO tasked with modernizing legacy systems and driving digital transformation',
        complication: 'Overcoming technical debt and resistance to new development practices',
        futureState: 'Becomes the transformation leader who successfully modernizes the technology stack'
      },
      'Healthcare': {
        situation: 'New clinical director tasked with improving patient care and operational efficiency',
        complication: 'Overcoming clinical resistance while maintaining patient safety standards',
        futureState: 'Becomes the clinical transformation leader who improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'New operations director tasked with modernizing production and driving efficiency',
        complication: 'Overcoming operational resistance while maintaining production quality',
        futureState: 'Becomes the operations transformation leader who drives manufacturing excellence'
      }
    }
  },
  {
    id: 'technical-visionary',
    name: 'The Technical Visionary',
    role: 'Champion',
    description: 'Lead architect, engineer, or technical expert who sees the strategic value',
    characteristics: {
      motivations: ['Technical excellence', 'Strategic impact', 'Innovation leadership'],
      concerns: ['Technical fit', 'Scalability', 'Integration complexity'],
      decisionMakingStyle: 'Respected voice that bridges technical and business stakeholders',
      communicationStyle: 'Technical but strategic, can articulate both technical fit and business impact',
      keyNeeds: ['Technical deep dives', 'Architecture validation', 'Integration support', 'Performance metrics']
    },
    situation: 'A technical leader who understands both the technical requirements and strategic business value',
    complication: 'Needs to balance technical excellence with business requirements and stakeholder needs',
    futureState: 'Becomes the technical leader who successfully bridges technology and business strategy',
    industryPersonalization: {
      'Technology': {
        situation: 'Lead architect designing scalable systems that support business growth',
        complication: 'Balancing technical debt reduction with new feature development',
        futureState: 'Becomes the technical leader who successfully architects scalable solutions'
      },
      'Healthcare': {
        situation: 'Clinical informatics leader designing systems that improve patient care',
        complication: 'Ensuring HIPAA compliance while enabling clinical workflow improvements',
        futureState: 'Becomes the clinical technology leader who improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'Industrial engineer designing smart manufacturing systems for efficiency',
        complication: 'Integrating IoT and automation while maintaining production reliability',
        futureState: 'Becomes the manufacturing technology leader who drives smart production'
      }
    }
  },

  // STAKEHOLDER ARCHETYPES (5)
  {
    id: 'finance-gatekeeper',
    name: 'The Finance Gatekeeper',
    role: 'Stakeholder',
    description: 'CFO, Controller, or FP&A leader who controls budget approval',
    characteristics: {
      motivations: ['ROI optimization', 'Cost control', 'Financial risk management'],
      concerns: ['Budget impact', 'Payment terms', 'Financial risk', 'ROI validation'],
      decisionMakingStyle: 'Focused on ROI, cash flow impact, and financial risk',
      communicationStyle: 'Numbers-focused, asks tough questions about pricing and business case',
      keyNeeds: ['Financial justification', 'ROI data', 'Payment flexibility', 'Risk mitigation']
    },
    situation: 'A financial leader responsible for budget allocation and financial risk management',
    complication: 'Needs to justify significant investments while managing cash flow and financial risk',
    futureState: 'Becomes the financial champion who successfully manages budget and ROI',
    industryPersonalization: {
      'Technology': {
        situation: 'CFO managing technology investments while controlling IT spending',
        complication: 'Balancing innovation investments with cost control and financial discipline',
        futureState: 'Becomes the financial leader who successfully manages technology ROI'
      },
      'Healthcare': {
        situation: 'CFO managing healthcare investments while controlling operational costs',
        complication: 'Balancing patient care investments with financial sustainability',
        futureState: 'Becomes the financial leader who successfully manages healthcare ROI'
      },
      'Manufacturing': {
        situation: 'CFO managing manufacturing investments while controlling production costs',
        complication: 'Balancing automation investments with cost control and efficiency',
        futureState: 'Becomes the financial leader who successfully manages manufacturing ROI'
      }
    }
  },
  {
    id: 'end-user-representative',
    name: 'The End User Representative',
    role: 'Stakeholder',
    description: 'Department head or team lead whose people will use the solution daily',
    characteristics: {
      motivations: ['User adoption', 'Workflow efficiency', 'Team productivity'],
      concerns: ['Usability', 'Training requirements', 'Change management', 'User resistance'],
      decisionMakingStyle: 'Primarily concerned with usability, training, and adoption',
      communicationStyle: 'User-focused, practical, concerned with implementation impact',
      keyNeeds: ['User training', 'Change management', 'Usability testing', 'Support resources']
    },
    situation: 'A department leader responsible for team productivity and user experience',
    complication: 'Needs to ensure the solution will be adopted by their team without disrupting workflows',
    futureState: 'Becomes the user champion who successfully drives adoption and productivity gains',
    industryPersonalization: {
      'Technology': {
        situation: 'Engineering manager responsible for developer productivity and tool adoption',
        complication: 'Ensuring new tools integrate with existing workflows without disrupting development',
        futureState: 'Becomes the productivity champion who successfully improves developer efficiency'
      },
      'Healthcare': {
        situation: 'Clinical manager responsible for healthcare provider efficiency and patient care',
        complication: 'Ensuring new systems improve clinical workflows without disrupting patient care',
        futureState: 'Becomes the clinical efficiency champion who improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'Production manager responsible for operator efficiency and production quality',
        complication: 'Ensuring new systems improve production workflows without disrupting operations',
        futureState: 'Becomes the production efficiency champion who improves manufacturing output'
      }
    }
  },
  {
    id: 'process-owner',
    name: 'The Process Owner',
    role: 'Stakeholder',
    description: 'Operations leader responsible for the workflows your solution impacts',
    characteristics: {
      motivations: ['Process efficiency', 'Workflow optimization', 'Operational excellence'],
      concerns: ['Process disruption', 'Integration complexity', 'Change management'],
      decisionMakingStyle: 'Worried about disruption, integration with current processes',
      communicationStyle: 'Process-focused, detailed, concerned with implementation methodology',
      keyNeeds: ['Process mapping', 'Integration support', 'Change management', 'Training resources']
    },
    situation: 'An operations leader responsible for workflow optimization and process efficiency',
    complication: 'Needs to ensure new solutions integrate smoothly with existing processes',
    futureState: 'Becomes the process champion who successfully optimizes operational workflows',
    industryPersonalization: {
      'Technology': {
        situation: 'DevOps manager responsible for development and deployment processes',
        complication: 'Integrating new tools with existing CI/CD pipelines and development workflows',
        futureState: 'Becomes the process champion who successfully optimizes development workflows'
      },
      'Healthcare': {
        situation: 'Operations manager responsible for clinical workflows and patient care processes',
        complication: 'Integrating new systems with existing clinical workflows and care protocols',
        futureState: 'Becomes the process champion who successfully optimizes clinical workflows'
      },
      'Manufacturing': {
        situation: 'Operations manager responsible for production processes and quality control',
        complication: 'Integrating new systems with existing production workflows and quality processes',
        futureState: 'Becomes the process champion who successfully optimizes manufacturing workflows'
      }
    }
  },
  {
    id: 'technical-architect',
    name: 'The Technical Architect',
    role: 'Stakeholder',
    description: 'CTO, IT Director, or Senior Engineer evaluating technical fit',
    characteristics: {
      motivations: ['Technical excellence', 'System reliability', 'Architecture integrity'],
      concerns: ['Security', 'Scalability', 'Integration', 'Technical debt'],
      decisionMakingStyle: 'Focused on security, scalability, integration, and technical debt',
      communicationStyle: 'Technical, detailed, concerned with architecture and implementation',
      keyNeeds: ['Architecture diagrams', 'Security documentation', 'Integration support', 'Performance data']
    },
    situation: 'A technical leader responsible for system architecture and technical decision-making',
    complication: 'Needs to ensure new solutions meet technical requirements and integrate with existing systems',
    futureState: 'Becomes the technical champion who successfully integrates and optimizes systems',
    industryPersonalization: {
      'Technology': {
        situation: 'CTO responsible for technology architecture and development platform decisions',
        complication: 'Ensuring new tools integrate with existing technology stack and development practices',
        futureState: 'Becomes the technical champion who successfully modernizes technology architecture'
      },
      'Healthcare': {
        situation: 'CTO responsible for healthcare technology architecture and clinical system integration',
        complication: 'Ensuring new systems meet HIPAA requirements and integrate with clinical workflows',
        futureState: 'Becomes the technical champion who successfully modernizes healthcare technology'
      },
      'Manufacturing': {
        situation: 'CTO responsible for manufacturing technology architecture and production system integration',
        complication: 'Ensuring new systems integrate with existing production systems and quality processes',
        futureState: 'Becomes the technical champion who successfully modernizes manufacturing technology'
      }
    }
  },
  {
    id: 'legal-compliance-officer',
    name: 'The Legal/Compliance Officer',
    role: 'Stakeholder',
    description: 'General Counsel, Compliance Director, or Risk Manager',
    characteristics: {
      motivations: ['Compliance', 'Risk mitigation', 'Legal protection'],
      concerns: ['Regulatory compliance', 'Data privacy', 'Contract terms', 'Liability'],
      decisionMakingStyle: 'Concerned with contracts, data privacy, regulatory requirements, and liability',
      communicationStyle: 'Legal, risk-focused, concerned with compliance and protection',
      keyNeeds: ['Compliance documentation', 'Security attestations', 'Legal terms', 'Risk assessment']
    },
    situation: 'A legal leader responsible for compliance, risk management, and legal protection',
    complication: 'Needs to ensure new solutions meet regulatory requirements and protect the organization',
    futureState: 'Becomes the compliance champion who successfully manages risk and regulatory requirements',
    industryPersonalization: {
      'Technology': {
        situation: 'General Counsel responsible for technology compliance and data protection',
        complication: 'Ensuring new tools meet data privacy regulations and security requirements',
        futureState: 'Becomes the compliance champion who successfully manages technology risk'
      },
      'Healthcare': {
        situation: 'Compliance Director responsible for healthcare regulations and patient data protection',
        complication: 'Ensuring new systems meet HIPAA requirements and healthcare compliance standards',
        futureState: 'Becomes the compliance champion who successfully manages healthcare risk'
      },
      'Manufacturing': {
        situation: 'Risk Manager responsible for manufacturing compliance and safety regulations',
        complication: 'Ensuring new systems meet safety standards and manufacturing compliance requirements',
        futureState: 'Becomes the compliance champion who successfully manages manufacturing risk'
      }
    }
  },

  // BLOCKER ARCHETYPES (5)
  {
    id: 'incumbent-vendor-protector',
    name: 'The Incumbent Vendor Protector',
    role: 'Blocker',
    description: 'Has long relationship with current solution provider',
    characteristics: {
      motivations: ['Relationship preservation', 'Status quo maintenance', 'Personal value'],
      concerns: ['Switching costs', 'Implementation risks', 'Relationship loss'],
      decisionMakingStyle: 'Will emphasize switching costs and risks of change',
      communicationStyle: 'Defensive, relationship-focused, emphasizes current solution benefits',
      keyNeeds: ['Neutralization strategy', 'Executive sponsorship', 'Competitive advantage proof']
    },
    situation: 'A stakeholder with strong relationships to current vendors and solutions',
    complication: 'May receive personal value from status quo and will resist change',
    futureState: 'Needs to be neutralized through executive sponsorship or clear competitive advantage',
    industryPersonalization: {
      'Technology': {
        situation: 'IT leader with strong relationships to current technology vendors',
        complication: 'Personal relationships and vendor partnerships create resistance to change',
        futureState: 'Requires executive intervention or clear technical superiority to overcome resistance'
      },
      'Healthcare': {
        situation: 'Clinical leader with strong relationships to current healthcare technology vendors',
        complication: 'Clinical partnerships and vendor relationships create resistance to change',
        futureState: 'Requires executive intervention or clear clinical superiority to overcome resistance'
      },
      'Manufacturing': {
        situation: 'Operations leader with strong relationships to current manufacturing technology vendors',
        complication: 'Vendor partnerships and operational relationships create resistance to change',
        futureState: 'Requires executive intervention or clear operational superiority to overcome resistance'
      }
    }
  },
  {
    id: 'empire-builder',
    name: 'The Empire Builder',
    role: 'Blocker',
    description: 'Leader who sees your solution as a threat to their team\'s scope or headcount',
    characteristics: {
      motivations: ['Team protection', 'Scope preservation', 'Organizational importance'],
      concerns: ['Job security', 'Team relevance', 'Organizational change'],
      decisionMakingStyle: 'Worried that automation or efficiency will reduce their organizational importance',
      communicationStyle: 'Defensive, scope-focused, emphasizes internal capabilities',
      keyNeeds: ['Political strategy', 'Boss appeal', 'Value demonstration', 'Scope protection']
    },
    situation: 'A leader concerned about organizational change and team relevance',
    complication: 'Sees new solutions as a threat to their team\'s scope and organizational importance',
    futureState: 'Requires political strategy - appeal to their boss or find a way to make them look good',
    industryPersonalization: {
      'Technology': {
        situation: 'IT leader concerned about automation reducing their team\'s relevance',
        complication: 'New technologies threaten existing IT roles and organizational structure',
        futureState: 'Requires demonstrating how new technology enhances their team\'s value'
      },
      'Healthcare': {
        situation: 'Clinical leader concerned about technology reducing their team\'s importance',
        complication: 'New systems threaten existing clinical roles and organizational structure',
        futureState: 'Requires demonstrating how new technology enhances their clinical team\'s value'
      },
      'Manufacturing': {
        situation: 'Operations leader concerned about automation reducing their team\'s relevance',
        complication: 'New systems threaten existing operational roles and organizational structure',
        futureState: 'Requires demonstrating how new technology enhances their operations team\'s value'
      }
    }
  },
  {
    id: 'skeptical-technologist',
    name: 'The Skeptical Technologist',
    role: 'Blocker',
    description: 'Senior technical person who\'s "seen it all before"',
    characteristics: {
      motivations: ['Technical validation', 'Proven solutions', 'Risk avoidance'],
      concerns: ['Technical complexity', 'Implementation risks', 'Unproven technology'],
      decisionMakingStyle: 'Dismissive of new solutions, believes current approach is sufficient',
      communicationStyle: 'Skeptical, technical, emphasizes edge cases and limitations',
      keyNeeds: ['Technical respect', 'Deep engagement', 'Proof through pilots', 'Technical validation']
    },
    situation: 'A senior technical expert who has experience with many solutions and approaches',
    complication: 'Believes current approach is sufficient and is skeptical of new solutions',
    futureState: 'Needs respect, deep technical engagement, and proof through pilot projects',
    industryPersonalization: {
      'Technology': {
        situation: 'Senior architect who has seen many technology trends come and go',
        complication: 'Skeptical of new technologies and believes current architecture is sufficient',
        futureState: 'Requires technical deep dives and proof of concept to overcome skepticism'
      },
      'Healthcare': {
        situation: 'Senior clinical informatics expert who has seen many healthcare technology failures',
        complication: 'Skeptical of new clinical systems and believes current approach is adequate',
        futureState: 'Requires clinical proof of concept and deep technical validation'
      },
      'Manufacturing': {
        situation: 'Senior manufacturing engineer who has seen many automation attempts fail',
        complication: 'Skeptical of new manufacturing technologies and believes current processes work',
        futureState: 'Requires manufacturing proof of concept and technical validation'
      }
    }
  },
  {
    id: 'budget-protector',
    name: 'The Budget Protector',
    role: 'Blocker',
    description: 'Finance leader protecting budget for other priorities',
    characteristics: {
      motivations: ['Budget control', 'Priority management', 'Resource allocation'],
      concerns: ['Budget constraints', 'Timing', 'Other priorities'],
      decisionMakingStyle: 'Not necessarily against your solution, just advocating for other investments',
      communicationStyle: 'Budget-focused, priority-driven, emphasizes timing and alternatives',
      keyNeeds: ['Strong business case', 'Champion support', 'Budget battle', 'Priority justification']
    },
    situation: 'A finance leader managing competing budget priorities and resource allocation',
    complication: 'Advocating for other investments and questioning timing of your solution',
    futureState: 'Requires strong business case and champion who can win the budget battle',
    industryPersonalization: {
      'Technology': {
        situation: 'CFO managing competing technology investments and budget priorities',
        complication: 'Other technology initiatives competing for limited IT budget',
        futureState: 'Requires strong ROI case and technology champion to secure budget'
      },
      'Healthcare': {
        situation: 'CFO managing competing healthcare investments and budget priorities',
        complication: 'Other clinical initiatives competing for limited healthcare budget',
        futureState: 'Requires strong clinical ROI case and healthcare champion to secure budget'
      },
      'Manufacturing': {
        situation: 'CFO managing competing manufacturing investments and budget priorities',
        complication: 'Other production initiatives competing for limited manufacturing budget',
        futureState: 'Requires strong operational ROI case and manufacturing champion to secure budget'
      }
    }
  },
  {
    id: 'change-averse-manager',
    name: 'The Change-Averse Manager',
    role: 'Blocker',
    description: 'Mid-level manager comfortable with current state despite inefficiencies',
    characteristics: {
      motivations: ['Status quo', 'Risk avoidance', 'Comfort zone'],
      concerns: ['Change risks', 'Implementation complexity', 'Failure blame'],
      decisionMakingStyle: 'Risk-averse personality who fears blame if new solution fails',
      communicationStyle: 'Conservative, risk-focused, emphasizes "if it ain\'t broke, don\'t fix it"',
      keyNeeds: ['Reassurance', 'References', 'Guarantees', 'Phased implementation']
    },
    situation: 'A risk-averse manager who prefers the comfort of current processes',
    complication: 'Fears change and potential failure, prefers to maintain status quo',
    futureState: 'Needs reassurance through references, guarantees, and phased implementation plans',
    industryPersonalization: {
      'Technology': {
        situation: 'IT manager comfortable with current technology despite inefficiencies',
        complication: 'Fears new technology implementation risks and prefers familiar systems',
        futureState: 'Requires technology references and phased implementation to overcome resistance'
      },
      'Healthcare': {
        situation: 'Clinical manager comfortable with current processes despite inefficiencies',
        complication: 'Fears new clinical system risks and prefers familiar workflows',
        futureState: 'Requires clinical references and phased implementation to overcome resistance'
      },
      'Manufacturing': {
        situation: 'Operations manager comfortable with current processes despite inefficiencies',
        complication: 'Fears new manufacturing system risks and prefers familiar operations',
        futureState: 'Requires manufacturing references and phased implementation to overcome resistance'
      }
    }
  },

  // DECISION MAKER ARCHETYPES (5)
  {
    id: 'economic-buyer',
    name: 'The Economic Buyer',
    role: 'Decision Maker',
    description: 'C-suite executive (CEO, CFO, COO) with ultimate budget authority',
    characteristics: {
      motivations: ['Strategic impact', 'Financial returns', 'Shareholder value'],
      concerns: ['Strategic alignment', 'Financial risk', 'Competitive advantage'],
      decisionMakingStyle: 'Time-constrained, relies heavily on trusted advisors and executive summaries',
      communicationStyle: 'Strategic, high-level, focused on business impact and ROI',
      keyNeeds: ['Clear ROI', 'Strategic alignment', 'Risk mitigation', 'Peer references']
    },
    situation: 'A C-suite executive with ultimate budget authority and strategic decision-making power',
    complication: 'Time-constrained and needs clear strategic justification for significant investments',
    futureState: 'Becomes the strategic champion who drives organizational transformation',
    industryPersonalization: {
      'Technology': {
        situation: 'CEO making strategic technology decisions that impact competitive advantage',
        complication: 'Balancing technology innovation with business strategy and financial returns',
        futureState: 'Becomes the technology strategy champion who drives digital transformation'
      },
      'Healthcare': {
        situation: 'CEO making strategic healthcare decisions that impact patient outcomes',
        complication: 'Balancing clinical excellence with operational efficiency and financial sustainability',
        futureState: 'Becomes the healthcare strategy champion who improves patient outcomes'
      },
      'Manufacturing': {
        situation: 'CEO making strategic manufacturing decisions that impact operational excellence',
        complication: 'Balancing production efficiency with quality and financial performance',
        futureState: 'Becomes the manufacturing strategy champion who drives operational excellence'
      }
    }
  },
  {
    id: 'operational-authority',
    name: 'The Operational Authority',
    role: 'Decision Maker',
    description: 'VP or SVP with delegated decision-making power for their function',
    characteristics: {
      motivations: ['Functional excellence', 'Operational efficiency', 'Team success'],
      concerns: ['Implementation success', 'Resource allocation', 'Team performance'],
      decisionMakingStyle: 'Balances departmental needs with company-wide considerations',
      communicationStyle: 'Operational, results-focused, concerned with implementation and success',
      keyNeeds: ['Business case', 'Implementation roadmap', 'Success metrics', 'Resource support']
    },
    situation: 'A senior leader with delegated decision-making power for their functional area',
    complication: 'Needs to balance departmental needs with company-wide considerations and resource constraints',
    futureState: 'Becomes the functional champion who successfully drives departmental transformation',
    industryPersonalization: {
      'Technology': {
        situation: 'VP Engineering making technology decisions that impact development capabilities',
        complication: 'Balancing technical excellence with business needs and resource constraints',
        futureState: 'Becomes the engineering champion who drives development transformation'
      },
      'Healthcare': {
        situation: 'VP Clinical making healthcare decisions that impact patient care delivery',
        complication: 'Balancing clinical excellence with operational efficiency and resource constraints',
        futureState: 'Becomes the clinical champion who drives healthcare transformation'
      },
      'Manufacturing': {
        situation: 'VP Operations making manufacturing decisions that impact production capabilities',
        complication: 'Balancing production efficiency with quality and resource constraints',
        futureState: 'Becomes the operations champion who drives manufacturing transformation'
      }
    }
  },
  {
    id: 'consensus-builder',
    name: 'The Consensus Builder',
    role: 'Decision Maker',
    description: 'Senior leader who makes decisions through committee and stakeholder buy-in',
    characteristics: {
      motivations: ['Stakeholder alignment', 'Risk mitigation', 'Organizational harmony'],
      concerns: ['Stakeholder resistance', 'Implementation complexity', 'Change management'],
      decisionMakingStyle: 'Wants broad agreement before committing to avoid internal conflict',
      communicationStyle: 'Collaborative, consensus-focused, emphasizes stakeholder validation',
      keyNeeds: ['Stakeholder validation', 'Multiple perspectives', 'Collaborative process', 'Change management']
    },
    situation: 'A senior leader who values consensus and stakeholder alignment in decision-making',
    complication: 'Needs to build broad agreement while managing diverse stakeholder interests',
    futureState: 'Becomes the consensus champion who successfully drives collaborative transformation',
    industryPersonalization: {
      'Technology': {
        situation: 'CTO building consensus for technology decisions across multiple departments',
        complication: 'Balancing technical requirements with business needs and stakeholder interests',
        futureState: 'Becomes the technology consensus champion who drives collaborative transformation'
      },
      'Healthcare': {
        situation: 'CMO building consensus for healthcare decisions across clinical and administrative teams',
        complication: 'Balancing clinical excellence with operational efficiency and stakeholder interests',
        futureState: 'Becomes the healthcare consensus champion who drives collaborative transformation'
      },
      'Manufacturing': {
        situation: 'COO building consensus for manufacturing decisions across production and quality teams',
        complication: 'Balancing production efficiency with quality and stakeholder interests',
        futureState: 'Becomes the manufacturing consensus champion who drives collaborative transformation'
      }
    }
  },
  {
    id: 'visionary-decider',
    name: 'The Visionary Decider',
    role: 'Decision Maker',
    description: 'Forward-thinking executive who makes bold, intuitive decisions quickly',
    characteristics: {
      motivations: ['Innovation', 'Competitive advantage', 'Transformation'],
      concerns: ['Strategic fit', 'Competitive positioning', 'Innovation leadership'],
      decisionMakingStyle: 'Comfortable with calculated risk if they see transformative potential',
      communicationStyle: 'Visionary, strategic, focused on big picture and competitive advantage',
      keyNeeds: ['Big picture impact', 'Competitive advantage', 'Innovation narrative', 'Strategic vision']
    },
    situation: 'A visionary leader who makes bold decisions based on strategic potential and competitive advantage',
    complication: 'Needs to see transformative potential and competitive advantage in new solutions',
    futureState: 'Becomes the innovation champion who drives transformative change',
    industryPersonalization: {
      'Technology': {
        situation: 'CEO making visionary technology decisions that create competitive advantage',
        complication: 'Balancing innovation with business strategy and competitive positioning',
        futureState: 'Becomes the technology innovation champion who drives competitive transformation'
      },
      'Healthcare': {
        situation: 'CEO making visionary healthcare decisions that improve patient outcomes',
        complication: 'Balancing clinical innovation with operational efficiency and competitive advantage',
        futureState: 'Becomes the healthcare innovation champion who drives patient outcome transformation'
      },
      'Manufacturing': {
        situation: 'CEO making visionary manufacturing decisions that create operational excellence',
        complication: 'Balancing production innovation with quality and competitive advantage',
        futureState: 'Becomes the manufacturing innovation champion who drives operational transformation'
      }
    }
  },
  {
    id: 'technical-decision-maker',
    name: 'The Technical Decision Maker',
    role: 'Decision Maker',
    description: 'CTO, CIO, or VP Engineering with both technical expertise and budget authority',
    characteristics: {
      motivations: ['Technical excellence', 'Architecture integrity', 'Team capability'],
      concerns: ['Technical fit', 'Implementation complexity', 'Team readiness'],
      decisionMakingStyle: 'Makes decisions based on technical merit, architecture fit, and team capability',
      communicationStyle: 'Technical, detailed, concerned with architecture and implementation',
      keyNeeds: ['Technical deep dives', 'Proof of concepts', 'Architecture validation', 'Developer experience']
    },
    situation: 'A technical leader with both technical expertise and budget authority for technology decisions',
    complication: 'Needs to balance technical excellence with business requirements and team capabilities',
    futureState: 'Becomes the technical champion who successfully drives technology transformation',
    industryPersonalization: {
      'Technology': {
        situation: 'CTO making technical decisions that impact development capabilities and architecture',
        complication: 'Balancing technical excellence with business needs and team capabilities',
        futureState: 'Becomes the technical champion who drives development transformation'
      },
      'Healthcare': {
        situation: 'CTO making technical decisions that impact clinical capabilities and healthcare technology',
        complication: 'Balancing technical excellence with clinical needs and healthcare compliance',
        futureState: 'Becomes the technical champion who drives healthcare technology transformation'
      },
      'Manufacturing': {
        situation: 'CTO making technical decisions that impact production capabilities and manufacturing technology',
        complication: 'Balancing technical excellence with production needs and manufacturing requirements',
        futureState: 'Becomes the technical champion who drives manufacturing technology transformation'
      }
    }
  },

  // INTRODUCER ARCHETYPES (5)
  {
    id: 'trusted-advisor',
    name: 'The Trusted Advisor',
    role: 'Introducer',
    description: 'Consultant, agency partner, or professional services provider to the account',
    characteristics: {
      motivations: ['Client value', 'Relationship building', 'Reciprocity'],
      concerns: ['Client relationship', 'Value delivery', 'Professional credibility'],
      decisionMakingStyle: 'Makes introductions to add value to their client relationships',
      communicationStyle: 'Professional, value-focused, emphasizes client benefit',
      keyNeeds: ['Clear value proposition', 'Client benefit', 'Professional credibility', 'Relationship value']
    },
    situation: 'A trusted advisor who has credibility and regular access to decision makers',
    complication: 'Needs to ensure introductions add value to their client relationships',
    futureState: 'Becomes the introduction champion who successfully connects solutions with clients',
    industryPersonalization: {
      'Technology': {
        situation: 'Technology consultant with trusted relationships to CTOs and IT leaders',
        complication: 'Balancing client value with technology recommendations and professional credibility',
        futureState: 'Becomes the technology advisor who successfully connects clients with solutions'
      },
      'Healthcare': {
        situation: 'Healthcare consultant with trusted relationships to clinical and administrative leaders',
        complication: 'Balancing client value with healthcare recommendations and professional credibility',
        futureState: 'Becomes the healthcare advisor who successfully connects clients with solutions'
      },
      'Manufacturing': {
        situation: 'Manufacturing consultant with trusted relationships to operations and production leaders',
        complication: 'Balancing client value with manufacturing recommendations and professional credibility',
        futureState: 'Becomes the manufacturing advisor who successfully connects clients with solutions'
      }
    }
  },
  {
    id: 'peer-networker',
    name: 'The Peer Networker',
    role: 'Introducer',
    description: 'Executive at another company who\'s a customer or connection',
    characteristics: {
      motivations: ['Peer relationships', 'Industry networking', 'Professional development'],
      concerns: ['Professional credibility', 'Relationship value', 'Social risk'],
      decisionMakingStyle: 'Willing to make warm introductions through their professional network',
      communicationStyle: 'Peer-focused, relationship-driven, emphasizes professional value',
      keyNeeds: ['Easy process', 'Clear value', 'Professional credibility', 'Low social risk']
    },
    situation: 'A peer executive who can make warm introductions through their professional network',
    complication: 'Needs to ensure introductions provide value while protecting professional credibility',
    futureState: 'Becomes the network champion who successfully connects peers with solutions',
    industryPersonalization: {
      'Technology': {
        situation: 'Technology executive who can introduce other CTOs to innovative solutions',
        complication: 'Balancing peer value with technology recommendations and professional credibility',
        futureState: 'Becomes the technology networker who successfully connects peers with solutions'
      },
      'Healthcare': {
        situation: 'Healthcare executive who can introduce other clinical leaders to innovative solutions',
        complication: 'Balancing peer value with healthcare recommendations and professional credibility',
        futureState: 'Becomes the healthcare networker who successfully connects peers with solutions'
      },
      'Manufacturing': {
        situation: 'Manufacturing executive who can introduce other operations leaders to innovative solutions',
        complication: 'Balancing peer value with manufacturing recommendations and professional credibility',
        futureState: 'Becomes the manufacturing networker who successfully connects peers with solutions'
      }
    }
  },
  {
    id: 'internal-connector',
    name: 'The Internal Connector',
    role: 'Introducer',
    description: 'Employee at target company who isn\'t the buyer but knows the right people',
    characteristics: {
      motivations: ['Internal relationships', 'Company success', 'Professional development'],
      concerns: ['Social risk', 'Professional credibility', 'Internal politics'],
      decisionMakingStyle: 'Has cultural knowledge and can navigate internal politics',
      communicationStyle: 'Internal, relationship-focused, emphasizes company benefit',
      keyNeeds: ['Clear understanding', 'Low social risk', 'Company benefit', 'Professional credibility']
    },
    situation: 'An internal employee who can navigate company politics and connect with decision makers',
    complication: 'Needs to balance internal relationships with professional credibility and social risk',
    futureState: 'Becomes the internal champion who successfully connects solutions with decision makers',
    industryPersonalization: {
      'Technology': {
        situation: 'Internal IT employee who can connect with technology decision makers',
        complication: 'Balancing internal relationships with technology recommendations and professional credibility',
        futureState: 'Becomes the internal technology connector who successfully facilitates solutions'
      },
      'Healthcare': {
        situation: 'Internal clinical employee who can connect with healthcare decision makers',
        complication: 'Balancing internal relationships with healthcare recommendations and professional credibility',
        futureState: 'Becomes the internal healthcare connector who successfully facilitates solutions'
      },
      'Manufacturing': {
        situation: 'Internal operations employee who can connect with manufacturing decision makers',
        complication: 'Balancing internal relationships with manufacturing recommendations and professional credibility',
        futureState: 'Becomes the internal manufacturing connector who successfully facilitates solutions'
      }
    }
  },
  {
    id: 'invested-champion',
    name: 'The Invested Champion',
    role: 'Introducer',
    description: 'Board member, investor, or advisor with vested interest in company success',
    characteristics: {
      motivations: ['Company success', 'Investment returns', 'Strategic value'],
      concerns: ['Strategic fit', 'Company benefit', 'Investment impact'],
      decisionMakingStyle: 'Makes strategic introductions to help portfolio companies or advisees',
      communicationStyle: 'Strategic, investment-focused, emphasizes company value',
      keyNeeds: ['Strategic value', 'Company benefit', 'Investment impact', 'Professional credibility']
    },
    situation: 'A board member or investor with vested interest in company success and strategic value',
    complication: 'Needs to ensure introductions provide strategic value and company benefit',
    futureState: 'Becomes the strategic champion who successfully connects companies with solutions',
    industryPersonalization: {
      'Technology': {
        situation: 'Technology investor who can introduce portfolio companies to innovative solutions',
        complication: 'Balancing investment value with technology recommendations and strategic fit',
        futureState: 'Becomes the technology investor who successfully connects portfolio companies with solutions'
      },
      'Healthcare': {
        situation: 'Healthcare investor who can introduce portfolio companies to innovative solutions',
        complication: 'Balancing investment value with healthcare recommendations and strategic fit',
        futureState: 'Becomes the healthcare investor who successfully connects portfolio companies with solutions'
      },
      'Manufacturing': {
        situation: 'Manufacturing investor who can introduce portfolio companies to innovative solutions',
        complication: 'Balancing investment value with manufacturing recommendations and strategic fit',
        futureState: 'Becomes the manufacturing investor who successfully connects portfolio companies with solutions'
      }
    }
  },
  {
    id: 'reciprocal-partner',
    name: 'The Reciprocal Partner',
    role: 'Introducer',
    description: 'Complementary vendor, technology partner, or ecosystem player',
    characteristics: {
      motivations: ['Partnership value', 'Co-selling opportunities', 'Ecosystem growth'],
      concerns: ['Partnership fit', 'Co-selling complexity', 'Ecosystem alignment'],
      decisionMakingStyle: 'Makes introductions as part of mutual go-to-market strategy',
      communicationStyle: 'Partnership-focused, ecosystem-driven, emphasizes mutual value',
      keyNeeds: ['Partnership value', 'Co-selling opportunities', 'Ecosystem alignment', 'Mutual benefit']
    },
    situation: 'A complementary partner who can make introductions as part of mutual go-to-market strategy',
    complication: 'Needs to ensure introductions provide mutual value and ecosystem alignment',
    futureState: 'Becomes the partnership champion who successfully drives ecosystem growth',
    industryPersonalization: {
      'Technology': {
        situation: 'Technology partner who can introduce complementary solutions to shared clients',
        complication: 'Balancing partnership value with technology recommendations and ecosystem alignment',
        futureState: 'Becomes the technology partner who successfully drives ecosystem growth'
      },
      'Healthcare': {
        situation: 'Healthcare partner who can introduce complementary solutions to shared clients',
        complication: 'Balancing partnership value with healthcare recommendations and ecosystem alignment',
        futureState: 'Becomes the healthcare partner who successfully drives ecosystem growth'
      },
      'Manufacturing': {
        situation: 'Manufacturing partner who can introduce complementary solutions to shared clients',
        complication: 'Balancing partnership value with manufacturing recommendations and ecosystem alignment',
        futureState: 'Becomes the manufacturing partner who successfully drives ecosystem growth'
      }
    }
  }
];

/**
 * Determine buyer group archetype based on person data
 */
export function determineArchetype(person: any): BuyerGroupArchetype | null {
  if (!person) return null;

  // Extract person data
  const title = person.jobTitle || person.title || '';
  const role = person.buyerGroupRole || inferRole(title);
  const seniority = inferSeniority(title, person.experience);
  const department = person.department || '';
  const recentHire = checkIfRecentHire(person.startDate);
  const budgetAuthority = checkBudgetAuthority(title, seniority);
  const technical = isTechnicalRole(title, department);
  const executive = isExecutiveRole(title);
  const manager = isManagerRole(title);

  // Map to archetypes based on role and characteristics
  if (role === 'Champion') {
    if (seniority === 'mid' && hasCareerProgression(person)) return findArchetype('rising-star');
    if (hasLongTenure(person) && hasDailyPainPoints(person)) return findArchetype('frustrated-innovator');
    if (hasExecutiveSponsor(person)) return findArchetype('mentor-backed-protege');
    if (recentHire && hasTransformationMandate(person)) return findArchetype('change-agent');
    if (technical && hasStrategicThinking(person)) return findArchetype('technical-visionary');
  }

  if (role === 'Stakeholder') {
    if (isFinanceRole(title)) return findArchetype('finance-gatekeeper');
    if (isEndUserRole(title)) return findArchetype('end-user-representative');
    if (isProcessOwner(title)) return findArchetype('process-owner');
    if (technical && isArchitectureRole(title)) return findArchetype('technical-architect');
    if (isLegalComplianceRole(title)) return findArchetype('legal-compliance-officer');
  }

  if (role === 'Blocker') {
    if (hasIncumbentVendorRelationships(person)) return findArchetype('incumbent-vendor-protector');
    if (manager && isEmpireBuilder(person)) return findArchetype('empire-builder');
    if (technical && isSkeptical(person)) return findArchetype('skeptical-technologist');
    if (isFinanceRole(title) && isBudgetProtector(person)) return findArchetype('budget-protector');
    if (isChangeAverse(person)) return findArchetype('change-averse-manager');
  }

  if (role === 'Decision Maker') {
    if (executive && hasBudgetAuthority(budgetAuthority)) return findArchetype('economic-buyer');
    if (isVPLevel(title) && hasDelegatedAuthority(person)) return findArchetype('operational-authority');
    if (isConsensusBuilder(person)) return findArchetype('consensus-builder');
    if (isVisionary(person)) return findArchetype('visionary-decider');
    if (technical && hasBudgetAuthority(budgetAuthority)) return findArchetype('technical-decision-maker');
  }

  if (role === 'Introducer') {
    if (isExternalAdvisor(person)) return findArchetype('trusted-advisor');
    if (isPeerExecutive(person)) return findArchetype('peer-networker');
    if (isInternalConnector(person)) return findArchetype('internal-connector');
    if (isInvestedStakeholder(person)) return findArchetype('invested-champion');
    if (isEcosystemPartner(person)) return findArchetype('reciprocal-partner');
  }

  // Default fallback
  return findArchetype('stakeholder') || BUYER_GROUP_ARCHETYPES[0];
}

/**
 * Helper functions for archetype determination
 */
function findArchetype(id: string): BuyerGroupArchetype | null {
  return BUYER_GROUP_ARCHETYPES.find(archetype => archetype.id === id) || null;
}

function inferRole(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('ceo') || lowerTitle.includes('president') || lowerTitle.includes('founder')) return 'Decision Maker';
  if (lowerTitle.includes('cto') || lowerTitle.includes('cio') || lowerTitle.includes('vp engineering')) return 'Decision Maker';
  if (lowerTitle.includes('cfo') || lowerTitle.includes('controller') || lowerTitle.includes('finance')) return 'Stakeholder';
  if (lowerTitle.includes('director') || lowerTitle.includes('manager') || lowerTitle.includes('lead')) return 'Champion';
  if (lowerTitle.includes('consultant') || lowerTitle.includes('advisor') || lowerTitle.includes('partner')) return 'Introducer';
  
  return 'Stakeholder';
}

function inferSeniority(title: string, experience: any): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('senior') || lowerTitle.includes('principal') || lowerTitle.includes('lead')) return 'senior';
  if (lowerTitle.includes('junior') || lowerTitle.includes('associate') || lowerTitle.includes('entry')) return 'junior';
  if (lowerTitle.includes('director') || lowerTitle.includes('vp') || lowerTitle.includes('c-level')) return 'executive';
  
  return 'mid';
}

function checkIfRecentHire(startDate: string): boolean {
  if (!startDate) return false;
  const start = new Date(startDate);
  const now = new Date();
  const diffInMonths = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return diffInMonths < 12;
}

function checkBudgetAuthority(title: string, seniority: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('ceo') || lowerTitle.includes('cfo') || lowerTitle.includes('cto') || 
         lowerTitle.includes('vp') || lowerTitle.includes('director') || seniority === 'executive';
}

function isTechnicalRole(title: string, department: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerDept = department.toLowerCase();
  return lowerTitle.includes('engineer') || lowerTitle.includes('developer') || lowerTitle.includes('architect') ||
         lowerDept.includes('engineering') || lowerDept.includes('technology') || lowerDept.includes('it');
}

function isExecutiveRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('ceo') || lowerTitle.includes('cfo') || lowerTitle.includes('cto') || 
         lowerTitle.includes('president') || lowerTitle.includes('vp') || lowerTitle.includes('director');
}

function isManagerRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('manager') || lowerTitle.includes('lead') || lowerTitle.includes('head');
}

function isFinanceRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('finance') || lowerTitle.includes('cfo') || lowerTitle.includes('controller') ||
         lowerTitle.includes('accounting') || lowerTitle.includes('treasurer');
}

function isEndUserRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('user') || lowerTitle.includes('operator') || lowerTitle.includes('analyst') ||
         lowerTitle.includes('specialist') || lowerTitle.includes('coordinator');
}

function isProcessOwner(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('process') || lowerTitle.includes('operations') || lowerTitle.includes('workflow') ||
         lowerTitle.includes('procedure') || lowerTitle.includes('methodology');
}

function isArchitectureRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('architect') || lowerTitle.includes('designer') || lowerTitle.includes('planner') ||
         lowerTitle.includes('strategist');
}

function isLegalComplianceRole(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('legal') || lowerTitle.includes('compliance') || lowerTitle.includes('risk') ||
         lowerTitle.includes('counsel') || lowerTitle.includes('regulatory');
}

// Additional helper functions for archetype determination
function hasCareerProgression(person: any): boolean {
  // Check for career progression indicators
  return person.experience?.length > 1 || person.promotions?.length > 0;
}

function hasLongTenure(person: any): boolean {
  if (!person.experience) return false;
  return person.experience.some((exp: any) => exp.duration_months > 24);
}

function hasDailyPainPoints(person: any): boolean {
  return person.painPoints?.length > 0 || person.challenges?.length > 0;
}

function hasExecutiveSponsor(person: any): boolean {
  return person.sponsor || person.mentor || person.reportsTo?.includes('executive');
}

function hasTransformationMandate(person: any): boolean {
  return person.role?.includes('transformation') || person.role?.includes('change') || person.role?.includes('modernization');
}

function hasStrategicThinking(person: any): boolean {
  return person.skills?.includes('strategic') || person.skills?.includes('planning') || person.skills?.includes('vision');
}

function hasIncumbentVendorRelationships(person: any): boolean {
  return person.vendorRelationships?.length > 0 || person.currentVendor;
}

function isEmpireBuilder(person: any): boolean {
  return person.teamSize > 10 || person.directReports > 5;
}

function isSkeptical(person: any): boolean {
  return person.skepticism || person.riskAversion || person.previousFailures?.length > 0;
}

function isBudgetProtector(person: any): boolean {
  return person.budgetProtection || person.otherPriorities?.length > 0;
}

function isChangeAverse(person: any): boolean {
  return person.changeAversion || person.riskAversion || person.statusQuoPreference;
}

function hasBudgetAuthority(budgetAuthority: boolean): boolean {
  return budgetAuthority;
}

function hasDelegatedAuthority(person: any): boolean {
  return person.delegatedAuthority || person.decisionMakingPower;
}

function isConsensusBuilder(person: any): boolean {
  return person.consensusBuilding || person.collaborative || person.committeeBased;
}

function isVisionary(person: any): boolean {
  return person.visionary || person.innovative || person.transformational;
}

function isExternalAdvisor(person: any): boolean {
  return person.external || person.consultant || person.advisor;
}

function isPeerExecutive(person: any): boolean {
  return person.peerNetwork || person.industryConnections?.length > 0;
}

function isInternalConnector(person: any): boolean {
  return person.internalConnections?.length > 0 || person.crossFunctional;
}

function isInvestedStakeholder(person: any): boolean {
  return person.boardMember || person.investor || person.advisor;
}

function isEcosystemPartner(person: any): boolean {
  return person.ecosystemPartner || person.complementaryVendor || person.technologyPartner;
}
