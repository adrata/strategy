"use client";

import React from 'react';
import PasswordProtection from '../PasswordProtection';
import Link from 'next/link';

export default function AthenahealthBusinessCasePage() {
  return (
    <PasswordProtection correctPassword="Absorb-Athena-2025">
      <div className="min-h-screen bg-[var(--background)]" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-[var(--foreground)]">Absorb Adrata</h1>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/platform" 
                  className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors"
                >
                  Platform
                </Link>
                <Link
                  href="https://calendly.com/dan-adrata/biz-dev-call"
                  className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Schedule Call With Dan
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Document Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              athenahealth Buyer Group Intelligence Report
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8">
              Strategic Analysis for Absorb: Navigating athenahealth's LMS Decision-Making Structure
            </p>
            
            <div className="bg-[var(--panel-background)] p-6 rounded-lg border-l-4 border-gray-400">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared For</p>
                  <p className="text-sm font-semibold text-black">Absorb LMS Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Target Company</p>
                  <p className="text-sm font-semibold text-black">athenahealth</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared By</p>
                  <p className="text-sm font-semibold text-black">Adrata Sales Intelligence Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Strategic Focus</p>
                  <p className="text-sm font-semibold text-black">LMS Cost Optimization</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              athenahealth, a leading healthcare technology company providing cloud-based services for medical practices and health systems, is actively seeking to change LMS providers due to rising costs of their incumbent solution. Their primary use cases include onboarding and training clients on their platform, plus onboarding and certifying compliance for internal employees. This presents a significant opportunity for Absorb's premium, enterprise-grade LMS to demonstrate cost containment while streamlining operations.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              As Absorb offers expensive, comprehensive LMS solutions designed for enterprise healthcare organizations, understanding athenahealth's complex compliance requirements, training needs, and procurement process is critical for successful engagement with their revenue and sales teams.
            </p>

            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
              <p className="text-gray-700 mb-4">
                We've identified athenahealth's exact buyer group structure, saving you months of research and guesswork. Our intelligence reveals the specific decision-makers, their influence patterns, and the precise engagement sequence needed for successful deal closure.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-black mb-2">What We Know:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Exact decision-making hierarchy and influence patterns</li>
                    <li>• Individual pain points and strategic priorities</li>
                    <li>• Optimal engagement sequence and timing</li>
                    <li>• Potential blockers and neutralization strategies</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Your Competitive Edge:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Skip months of stakeholder mapping</li>
                    <li>• Avoid wrong-person conversations</li>
                    <li>• Accelerate deal velocity by 40-60%</li>
                    <li>• Increase win rates with precision targeting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
                <div className="text-3xl font-bold text-black">10</div>
                <div className="text-sm text-[var(--muted)]">Buyer Group Size</div>
              </div>
              <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
                <div className="text-3xl font-bold text-black">2</div>
                <div className="text-sm text-[var(--muted)]">Decision Makers</div>
              </div>
              <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
                <div className="text-3xl font-bold text-black">3</div>
                <div className="text-sm text-[var(--muted)]">Champions</div>
              </div>
              <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
                <div className="text-3xl font-bold text-black">$200K+</div>
                <div className="text-sm text-[var(--muted)]">Deal Value Range</div>
              </div>
            </div>
          </section>

          {/* athenahealth Company Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">athenahealth Company Overview</h2>
            
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> Healthcare Software & Technology</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 5,000+ employees</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Watertown, Massachusetts</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 1997</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Key Products:</strong> Electronic Health Records (EHR), Practice Management</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Healthcare Providers, Medical Practices</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> SaaS/Cloud-based Healthcare Software</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Current Challenge:</strong> Rising LMS costs, need for cost containment</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-black mb-4">LMS Use Cases</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-black mb-2">Customer Training:</p>
                  <ul className="space-y-1">
                    <li>• Onboarding new healthcare providers</li>
                    <li>• Platform training and certification</li>
                    <li>• Ongoing feature education</li>
                    <li>• Compliance training modules</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Internal Training:</p>
                  <ul className="space-y-1">
                    <li>• Employee onboarding and certification</li>
                    <li>• Compliance and regulatory training</li>
                    <li>• Product knowledge updates</li>
                    <li>• Professional development</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Research Methodology */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Research Methodology & Intelligence Sources</h2>
            
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Human-AI Partnership Approach</h3>
              <p className="text-gray-700 mb-4">
                This buyer group intelligence represents a sophisticated fusion of human expertise and AI-powered data analysis, 
                leveraging multiple data sources and analytical frameworks to deliver unprecedented accuracy and depth.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-black mb-3">Data Sources & Collection</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• <strong>LinkedIn Intelligence:</strong> Professional profiles and career progression</li>
                    <li>• <strong>Company Research:</strong> Public filings, press releases, and industry reports</li>
                    <li>• <strong>Competitive Analysis:</strong> Market positioning and strategic initiatives</li>
                    <li>• <strong>Industry Intelligence:</strong> Healthcare technology trends and compliance requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-black mb-3">Analytical Framework</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• <strong>Role-Based Analysis:</strong> Seniority, influence, and decision-making authority</li>
                    <li>• <strong>Pain Point Mapping:</strong> Individual and organizational challenges</li>
                    <li>• <strong>Engagement Sequencing:</strong> Optimal contact and influence patterns</li>
                    <li>• <strong>Risk Assessment:</strong> Potential blockers and neutralization strategies</li>
                    <li>• <strong>Success Probability:</strong> Data-driven win likelihood calculations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-black mb-4">Intelligence Validation Process</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-black mb-2">Cross-Reference Verification:</p>
                  <ul className="space-y-1">
                    <li>• Multiple data source confirmation</li>
                    <li>• Professional network validation</li>
                    <li>• Company structure verification</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Contextual Analysis:</p>
                  <ul className="space-y-1">
                    <li>• Industry-specific insights</li>
                    <li>• Healthcare compliance requirements</li>
                    <li>• LMS market dynamics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Strategic Intelligence:</p>
                  <ul className="space-y-1">
                    <li>• Decision-making patterns</li>
                    <li>• Influence network mapping</li>
                    <li>• Engagement optimization</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Buyer Group Analysis */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">athenahealth Buyer Group Intelligence</h2>
            
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
              <p className="text-gray-700 mb-4">
                athenahealth operates in the complex healthcare technology market, where training and compliance are critical for patient safety and regulatory adherence. 
                Their current LMS costs are escalating, creating urgency for a cost-effective replacement that maintains compliance standards.
              </p>
              <p className="text-gray-700">
                <strong>Key Insight:</strong> athenahealth's LMS decision is driven by cost pressure and operational efficiency needs. They require a solution that can handle 
                both customer onboarding (thousands of healthcare providers) and internal employee certification while maintaining HIPAA compliance and reducing operational overhead.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Decision Makers (2)</h4>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-black pl-4">
                    <h5 className="font-semibold text-black text-lg">Scott O'Neil (Vice President, Customer Success Management)</h5>
                    <p className="text-sm text-[var(--muted)] mb-3">Budget authority and final approval for LMS decisions</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><strong>Pain Points:</strong> Customer onboarding complexity and training effectiveness. Current LMS may not provide optimal user experience for healthcare providers learning athenahealth platform.</p>
                      <p><strong>Strategic Priorities:</strong> Customer satisfaction, training effectiveness, user adoption, and platform proficiency.</p>
                      <p><strong>Engagement Approach:</strong> Focus on customer training outcomes, user experience improvements, and platform adoption metrics.</p>
                      <p><strong>Decision Criteria:</strong> User experience, training effectiveness, customer satisfaction, and platform integration.</p>
                    </div>
                  </div>
                  <div className="border-l-4 border-black pl-4">
                    <h5 className="font-semibold text-black text-lg">Brittany Podolak (Chief People Officer)</h5>
                    <p className="text-sm text-[var(--muted)] mb-3">Oversees HR, culture, talent retention & acquisition, DEI at athenahealth</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><strong>Pain Points:</strong> Employee training efficiency, talent development, and compliance tracking. Need for comprehensive learning solutions that support HR initiatives and employee growth.</p>
                      <p><strong>Strategic Priorities:</strong> Employee development, talent retention, compliance training, operational efficiency, and cost optimization.</p>
                      <p><strong>Engagement Approach:</strong> Emphasize employee development ROI, talent retention benefits, compliance efficiency, and operational cost savings.</p>
                      <p><strong>Decision Criteria:</strong> Cost effectiveness, compliance capabilities, employee satisfaction, talent development impact, and operational efficiency.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Champions (3)</h4>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Brittany Freeman (Director, Workplace Experience)</h5>
                    <p className="text-sm text-[var(--muted)] mb-2">Internal advocate for LMS change and improvement</p>
                    <div className="text-xs text-[var(--muted)]">
                      <p><strong>Champion Potential:</strong> High - Directors don't buy at that pricepoint across that large of an organization, but can influence decision makers</p>
                      <p><strong>Key Motivations:</strong> Employee training efficiency, operational cost savings, compliance tracking, workplace experience improvement</p>
                      <p><strong>Engagement Strategy:</strong> Training effectiveness, operational efficiency, cost savings, compliance benefits, employee satisfaction</p>
                    </div>
                  </div>
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Priya Dixit (HR Manager)</h5>
                    <p className="text-sm text-[var(--muted)] mb-2">11+ yrs tenure, based in Boston alongside Nikki</p>
                    <div className="text-xs text-[var(--muted)]">
                      <p><strong>Champion Potential:</strong> High - Long tenure provides deep organizational knowledge and influence</p>
                      <p><strong>Key Motivations:</strong> Employee development, training effectiveness, compliance efficiency, operational improvements</p>
                      <p><strong>Engagement Strategy:</strong> Training effectiveness, employee satisfaction, compliance benefits, operational efficiency</p>
                    </div>
                  </div>
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Sarah Rixey Pharr (Director Of Strategic Programs)</h5>
                    <p className="text-sm text-[var(--muted)] mb-2">Internal advocate for LMS change and improvement</p>
                    <div className="text-xs text-[var(--muted)]">
                      <p><strong>Champion Potential:</strong> Medium - Focused on partner enablement and strategic relationship growth</p>
                      <p><strong>Key Motivations:</strong> Partner enablement, strategic growth, scalable solutions, relationship value</p>
                      <p><strong>Engagement Strategy:</strong> Partner enablement capabilities, strategic value, scalable training solutions</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Key Stakeholders (3)</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">Sarah Ugaz Grove (Senior Solution Design Manager)</h5>
                    <p className="text-sm text-[var(--muted)]">14+ years at athenahealth, key influencer in LMS selection process</p>
                    <p className="text-xs text-[var(--muted)]"><strong>Influence:</strong> High - Long tenure and solution design expertise provides significant influence on LMS selection and implementation decisions</p>
                  </div>
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">Erica Canuto (Manager Platform Services & Solutions)</h5>
                    <p className="text-sm text-[var(--muted)]">Based in Boston, key influencer in LMS selection process</p>
                    <p className="text-xs text-[var(--muted)]"><strong>Influence:</strong> Medium - Platform services expertise provides operational influence on training processes and user experience</p>
                  </div>
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">Emily Anderson (Marketing And Events Coordinator)</h5>
                    <p className="text-sm text-[var(--muted)]">Key influencer in LMS selection process</p>
                    <p className="text-xs text-[var(--muted)]"><strong>Influence:</strong> Medium - Stakeholder influence on training effectiveness and user satisfaction</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Openers (2)</h4>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-semibold text-black">Nikki Ward (Former Global Executive Dir of Learning & Development)</h5>
                    <p className="text-sm text-[var(--muted)] mb-2">Now SVP HR for OncoHealth - Leverage to get inside baseball on athenahealth prior to activating Priya</p>
                    <div className="text-xs text-[var(--muted)]">
                      <p><strong>Opening Potential:</strong> High - Former insider with deep knowledge of athenahealth's training needs and organizational dynamics</p>
                      <p><strong>Key Value:</strong> Inside intelligence on athenahealth's training challenges, organizational structure, and decision-making processes</p>
                      <p><strong>Engagement Strategy:</strong> Leverage former insider knowledge to understand athenahealth's specific training pain points and organizational dynamics before engaging current team</p>
                    </div>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-semibold text-black">David Onorato (Former Director Platform Sales)</h5>
                    <p className="text-sm text-[var(--muted)] mb-2">12+ years at athenahealth, now sales specialist at Snowflake based in Boston - Get him to vent about issues with training reps</p>
                    <div className="text-xs text-[var(--muted)]">
                      <p><strong>Opening Potential:</strong> High - Former sales leader with deep understanding of athenahealth's training challenges and sales team needs</p>
                      <p><strong>Key Value:</strong> Sales training insights, understanding of rep training pain points, and organizational knowledge</p>
                      <p><strong>Engagement Strategy:</strong> Leverage his experience with training challenges at athenahealth to understand specific pain points and training needs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LinkedIn Profiles Reference */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">LinkedIn Profiles Reference</h2>
            
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-black mb-4">Key Contact LinkedIn Profiles</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-black mb-2">Decision Makers:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• <a href="https://www.linkedin.com/in/brittanypodolak/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Brittany Podolak - Chief People Officer</a></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Champions:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• <a href="https://www.linkedin.com/in/priyadixit/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Priya Dixit - HR Manager</a></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Openers:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• <a href="https://www.linkedin.com/in/nikkiwardhr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Nikki Ward - Former Global Executive Dir of Learning & Development</a></li>
                    <li>• <a href="https://www.linkedin.com/in/david-onorato/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">David Onorato - Former Director Platform Sales</a></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Stakeholders:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• <a href="https://www.linkedin.com/in/sarah-ugaz-grove-217520120/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Sarah Ugaz Grove - Senior Solution Design Manager</a></li>
                    <li>• <a href="https://www.linkedin.com/in/ericabielat/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Erica Canuto - Manager Platform Services & Solutions</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Engagement Strategy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Absorb Engagement Strategy</h2>
            
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Cost-Focused Approach</h3>
              <p className="text-gray-700 mb-6">
                Given athenahealth's primary concern about rising LMS costs, the strategy centers on demonstrating clear cost savings and operational efficiency improvements while maintaining or enhancing training effectiveness.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 1: Economic Buyer Engagement (Premium LMS)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary Targets:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Scott O'Neil (VP Customer Success) - Customer training ROI and effectiveness</li>
                      <li>• Brittany Podolak (Chief People Officer) - Employee training efficiency and talent development</li>
                      <li>• Brittany Freeman (Director Workplace Experience) - Employee training efficiency</li>
                      <li>• Priya Dixit (HR Manager) - Employee development and compliance</li>
                      <li>• Sarah Rixey Pharr (Director Strategic Programs) - Strategic program alignment</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Key Messages:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Premium LMS cost reduction vs. current expensive solution</li>
                      <li>• Streamlined operations and reduced complexity</li>
                      <li>• Better ROI and training effectiveness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 2: Champion Development</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Internal Champions:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Brittany Freeman (Director Workplace Experience)</li>
                      <li>• Priya Dixit (HR Manager)</li>
                      <li>• Sarah Rixey Pharr (Director Strategic Programs)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Champion Strategy:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Demonstrate superior user experience</li>
                      <li>• Showcase training effectiveness improvements</li>
                      <li>• Build internal advocacy for change</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 3: Technical Validation</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Technical Stakeholders:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Sarah Ugaz Grove (Senior Solution Design Manager) - Solution architecture and design</li>
                      <li>• Erica Canuto (Manager Platform Services & Solutions) - Platform integration and services</li>
                      <li>• Emily Anderson (Marketing And Events Coordinator) - Training effectiveness and user satisfaction</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Validation Focus:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Healthcare compliance and security</li>
                      <li>• Seamless integration capabilities</li>
                      <li>• Content migration and management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Success Factors */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Key Success Factors</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Critical Success Elements</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Cost Savings:</strong> Demonstrate immediate and long-term cost reduction</li>
                  <li>• <strong>Healthcare Compliance:</strong> Ensure HIPAA and healthcare data security</li>
                  <li>• <strong>User Experience:</strong> Superior training experience for users</li>
                  <li>• <strong>Migration Support:</strong> Seamless transition from current LMS</li>
                  <li>• <strong>ROI Demonstration:</strong> Clear return on investment metrics</li>
                </ul>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Risk Mitigation</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Compliance Concerns:</strong> Address healthcare data security early</li>
                  <li>• <strong>Migration Complexity:</strong> Provide detailed migration plan</li>
                  <li>• <strong>User Adoption:</strong> Demonstrate ease of use and training</li>
                  <li>• <strong>Contract Terms:</strong> Understand current LMS contract constraints</li>
                  <li>• <strong>Timeline Pressure:</strong> Align with their urgency for cost reduction</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12">
            <div className="bg-[var(--panel-background)] border border-[var(--border)] p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-6">Recommended Next Steps</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Immediate Actions (Week 1-2)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Research athenahealth's current LMS costs and pain points</li>
                    <li>• Identify mutual connections to Scott O'Neil and Brittany Podolak</li>
                    <li>• Prepare cost comparison and ROI analysis for decision makers</li>
                    <li>• Develop healthcare compliance documentation for technical validation</li>
                  </ul>
                </div>
                
                <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Strategic Engagement (Week 3-4)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Schedule meetings with Scott O'Neil and Brittany Podolak (Decision Makers)</li>
                    <li>• Conduct technical validation with Sarah Ugaz Grove and Erica Canuto</li>
                    <li>• Present cost savings and ROI analysis to decision makers</li>
                    <li>• Develop migration plan with Brittany Freeman, Priya Dixit, and Sarah Rixey Pharr</li>
                  </ul>
                </div>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg text-center">
                <p className="text-lg font-bold text-black mb-3">
                  <strong>Key Question for athenahealth Engagement:</strong> "How can Absorb's premium, enterprise-grade LMS solution help athenahealth reduce expensive LMS costs while improving training effectiveness for both clients and employees in the healthcare sector?"
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  Focus on immediate cost savings, operational efficiency improvements, and healthcare compliance that address athenahealth's current expensive LMS challenges.
                </p>
                <a 
                  href="https://calendly.com/dan-adrata/biz-dev-call" 
                  className="inline-block bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Schedule Strategy Call →
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[var(--panel-background)] border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-6 text-center">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Adrata - Buyer Group Intelligence Platform</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contact:</strong> Dan Mirolli, Head of Revenue - dan@adrata.com
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Demo:</strong> Schedule Executive Demo<br/>
              <a href="https://calendly.com/dan-adrata/biz-dev-call" className="text-gray-700 underline">Schedule Call With Dan</a>
            </p>
            <p className="text-xs text-[var(--muted)]">© 2025 Adrata. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PasswordProtection>
  );
}
