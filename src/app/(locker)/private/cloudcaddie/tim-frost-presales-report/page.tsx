"use client";

import React from 'react';
import PasswordProtection from '../../PasswordProtection';
import Link from 'next/link';

export default function TimFrostPreSalesReportPage() {
  return (
    <PasswordProtection correctPassword="CloudCaddieGoat-2025">
      <div className="min-h-screen bg-white" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-medium text-black">CloudCaddie Intelligence</h1>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/platform" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Platform
                </Link>
                <Link
                  href="https://calendly.com/justin-johnson/cloudcaddie-demo"
                  className="bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Schedule Demo
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
              Tim Frost Pre-Sales Intelligence Report
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Strategic Analysis for CloudCaddie: North Carolina Industrial Commission CIO Engagement Strategy
            </p>
            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <span>Generated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span>Target: Tim Frost, CIO</span>
              <span>Organization: North Carolina Industrial Commission</span>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Executive Summary
            </h2>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Intelligence</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Target:</strong> Tim Frost, CIO at North Carolina Industrial Commission (appointed 2019)</li>
                <li>• <strong>Background:</strong> 20+ years IT experience, NC State University graduate, leads NCIC technology strategy</li>
                <li>• <strong>Organization:</strong> State agency processing tens of thousands of claims annually with specialized IT needs</li>
                <li>• <strong>Current Focus:</strong> Legacy system modernization, data security, and operational efficiency improvements</li>
                <li>• <strong>Technology Challenges:</strong> Safeguarding infrastructure, managing legacy systems, limited resources</li>
                <li>• <strong>Strategic Opportunity:</strong> NCIC IT Section seeking software development, hardware upgrades, and staff training</li>
              </ul>
            </div>
          </section>

          {/* Target Profile */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Target Profile: Tim Frost
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Background</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Current Role:</strong> Chief Information Officer (appointed 2019)</li>
                  <li><strong>Organization:</strong> North Carolina Industrial Commission</li>
                  <li><strong>Education:</strong> Bachelor of Arts, North Carolina State University</li>
                  <li><strong>Experience:</strong> 20+ years in information technology</li>
                  <li><strong>Responsibilities:</strong> IT strategy, systems management, claims adjudication support</li>
                  <li><strong>Focus Areas:</strong> Enterprise systems, data security, case management, cloud integration</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision-Making Context</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Authority Level:</strong> Senior IT leadership with budget influence</li>
                  <li><strong>Stakeholders:</strong> State government, legal teams, claims processors</li>
                  <li><strong>Constraints:</strong> Government procurement, compliance requirements</li>
                  <li><strong>Success Metrics:</strong> Security, efficiency, cost-effectiveness</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Organization Analysis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              North Carolina Industrial Commission Analysis
            </h2>
            <div className="space-y-8">
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mission & Core Functions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Administer the Workers' Compensation Act for North Carolina</li>
                  <li>• Adjudicate workers' compensation claims and disputes</li>
                  <li>• Ensure compliance with state and federal regulations</li>
                  <li>• Provide educational resources to employers and employees</li>
                  <li>• Mediate disputes between employees and employers</li>
                </ul>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technology Challenges</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Legacy System Management:</strong> Maintaining and upgrading onsite hardware and software</li>
                  <li>• <strong>Security & Compliance:</strong> Safeguarding information and infrastructure against evolving threats</li>
                  <li>• <strong>Resource Constraints:</strong> Limited IT resources typical of state agencies</li>
                  <li>• <strong>Software Development:</strong> Developing custom solutions while maintaining operational demands</li>
                  <li>• <strong>Staff Training:</strong> Providing technology training to support staff adoption</li>
                  <li>• <strong>Information Management:</strong> Developing comprehensive data management strategy</li>
                </ul>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Regulatory Environment</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>HIPAA Compliance:</strong> Medical information protection requirements</li>
                  <li>• <strong>State Regulations:</strong> North Carolina specific data handling requirements</li>
                  <li>• <strong>Government Standards:</strong> State agency IT security and procurement standards</li>
                  <li>• <strong>Audit Requirements:</strong> Regular compliance audits and reporting</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Opportunity Analysis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              CloudCaddie Opportunity Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Value Use Cases</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Claims Processing Automation:</strong> Streamline workflow and reduce manual errors</li>
                  <li><strong>Data Security Enhancement:</strong> Advanced encryption and access controls</li>
                  <li><strong>Compliance Monitoring:</strong> Automated compliance checking and reporting</li>
                  <li><strong>Stakeholder Portal:</strong> Secure self-service for employers and employees</li>
                  <li><strong>Analytics Dashboard:</strong> Real-time insights into claims trends and processing</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Government Experience:</strong> Proven track record with state agencies</li>
                  <li><strong>Security-First Design:</strong> Built-in compliance and security features</li>
                  <li><strong>Scalable Architecture:</strong> Handles varying claim volumes efficiently</li>
                  <li><strong>Integration Capabilities:</strong> Seamless connection with existing systems</li>
                  <li><strong>Cost Effectiveness:</strong> ROI through process automation and efficiency</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Engagement Strategy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Recommended Engagement Strategy
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase 1: Discovery & Relationship Building</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Schedule initial discovery call to understand current pain points</li>
                  <li>• Conduct IT infrastructure assessment and gap analysis</li>
                  <li>• Identify key stakeholders and decision-making process</li>
                  <li>• Present relevant case studies from similar government agencies</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase 2: Solution Demonstration</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Custom demo focusing on claims processing workflow</li>
                  <li>• Security and compliance feature walkthrough</li>
                  <li>• Integration capabilities with existing systems</li>
                  <li>• ROI calculator and cost-benefit analysis</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase 3: Proposal & Implementation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Detailed proposal addressing specific NCIC requirements</li>
                  <li>• Implementation timeline and resource requirements</li>
                  <li>• Training and support plan for staff</li>
                  <li>• Pilot program recommendation for low-risk testing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Talking Points */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Key Talking Points & Value Propositions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Security & Compliance</h4>
                <p className="text-gray-700 text-sm">"Our platform is designed with government-grade security and built-in compliance features to protect sensitive workers' compensation data while meeting all regulatory requirements."</p>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Process Efficiency</h4>
                <p className="text-gray-700 text-sm">"Automate routine claims processing tasks to reduce manual workload by up to 60% while improving accuracy and reducing processing time."</p>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Cost Savings</h4>
                <p className="text-gray-700 text-sm">"Demonstrate measurable ROI through reduced operational costs, improved efficiency, and decreased error rates in claims processing."</p>
              </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Stakeholder Experience</h4>
                  <p className="text-gray-700 text-sm">"Provide intuitive self-service portals for employers and employees while maintaining security and compliance standards."</p>
                </div>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Scalability</h4>
                  <p className="text-gray-700 text-sm">"Cloud-based architecture that scales with your needs, handling peak claim volumes without performance degradation."</p>
                </div>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Integration</h4>
                  <p className="text-gray-700 text-sm">"Seamless integration with existing systems and databases, minimizing disruption to current operations."</p>
                </div>
              </div>
            </div>
          </section>

          {/* Risk Assessment */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Risk Assessment & Mitigation
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Potential Risks</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Government Procurement Process:</strong> Complex bidding and approval requirements</li>
                  <li>• <strong>Budget Constraints:</strong> Limited IT budget for new initiatives</li>
                  <li>• <strong>Change Management:</strong> Resistance to new technology adoption</li>
                  <li>• <strong>Compliance Concerns:</strong> Strict regulatory requirements for data handling</li>
                </ul>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mitigation Strategies</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Pilot Program:</strong> Start with small-scale implementation to demonstrate value</li>
                  <li>• <strong>ROI Documentation:</strong> Provide detailed cost-benefit analysis and success metrics</li>
                  <li>• <strong>Training & Support:</strong> Comprehensive change management and user training</li>
                  <li>• <strong>Compliance Assurance:</strong> Third-party security audits and compliance certifications</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Recommended Next Steps
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                  <div>
                    <strong>Initial Outreach:</strong> Contact Tim Frost to schedule a discovery call focusing on current IT challenges and pain points
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                  <div>
                    <strong>Needs Assessment:</strong> Conduct detailed analysis of current systems, processes, and compliance requirements
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                  <div>
                    <strong>Custom Demo:</strong> Prepare tailored demonstration showcasing relevant features for workers' compensation use case
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                  <div>
                    <strong>Stakeholder Engagement:</strong> Identify and engage with key decision-makers and influencers within NCIC
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">5</span>
                  <div>
                    <strong>Proposal Development:</strong> Create comprehensive proposal addressing specific NCIC requirements and constraints
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Contact Information & Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Contact</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Name:</strong> Tim Frost</li>
                  <li><strong>Title:</strong> Chief Information Officer</li>
                  <li><strong>Organization:</strong> North Carolina Industrial Commission</li>
                  <li><strong>Location:</strong> North Carolina, USA</li>
                  <li><strong>Industry:</strong> Government/Workers' Compensation</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CloudCaddie Resources</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Sales Contact:</strong> Justin Johnson</li>
                  <li><strong>Calendar:</strong> <a href="https://calendly.com/justin-johnson/cloudcaddie-demo" className="text-blue-600 hover:underline">Schedule Demo</a></li>
                  <li><strong>Platform:</strong> <a href="/platform" className="text-blue-600 hover:underline">CloudCaddie Platform</a></li>
                  <li><strong>Report Generated:</strong> {new Date().toLocaleDateString()}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-8 mt-12">
            <div className="text-center text-gray-500 text-sm">
              <p>This report was generated using CloudCaddie Intelligence Platform</p>
              <p>For questions or additional information, contact the sales team</p>
            </div>
          </footer>
        </main>
      </div>
    </PasswordProtection>
  );
}
