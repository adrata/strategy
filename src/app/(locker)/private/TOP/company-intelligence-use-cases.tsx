export default function CompanyIntelligenceUseCases() {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-[var(--background)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Company Intelligence & Contact Validation Use Cases
        </h1>
        <p className="text-[var(--muted)]">Comprehensive guide to company research and professional contact validation</p>
      </div>

      <div className="space-y-8">
        {/* COMPANY INTELLIGENCE TYPES */}
        <div className="bg-blue-50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">🏢 What We Can Learn About Companies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Technology Intelligence */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">💻</span>
                Technology Stack
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Cloud providers (AWS, Azure, GCP)</li>
                <li>• Programming languages & frameworks</li>
                <li>• Databases & data tools</li>
                <li>• CRM/ERP systems</li>
                <li>• Security & compliance tools</li>
                <li>• DevOps & infrastructure</li>
                <li>• Analytics & BI platforms</li>
                <li>• Communication tools</li>
                <li>• Industry-specific software</li>
                <li>• Modernization priorities</li>
              </ul>
            </div>

            {/* Business Intelligence */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Business Intelligence
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Business model & revenue streams</li>
                <li>• Market position & share</li>
                <li>• Competitive advantages</li>
                <li>• Customer segments</li>
                <li>• Partnership network</li>
                <li>• Organizational structure</li>
                <li>• Decision-making process</li>
                <li>• Budget cycles & procurement</li>
                <li>• Vendor preferences</li>
                <li>• Change management style</li>
              </ul>
            </div>

            {/* Financial Intelligence */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">💰</span>
                Financial Intelligence
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Revenue & growth metrics</li>
                <li>• Funding rounds & investors</li>
                <li>• Financial health indicators</li>
                <li>• Tech spending patterns</li>
                <li>• Budget allocation</li>
                <li>• Investment priorities</li>
                <li>• Cost structure analysis</li>
                <li>• Acquisition activity</li>
                <li>• IPO readiness</li>
                <li>• Economic sensitivity</li>
              </ul>
            </div>

            {/* Market Intelligence */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                Market Intelligence
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Industry trends & disruptions</li>
                <li>• Competitive landscape</li>
                <li>• Market opportunities</li>
                <li>• Regulatory environment</li>
                <li>• Industry challenges</li>
                <li>• Growth drivers</li>
                <li>• Threat assessment</li>
                <li>• Innovation patterns</li>
                <li>• Market maturity</li>
                <li>• Future outlook</li>
              </ul>
            </div>

            {/* Operational Intelligence */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">⚙️</span>
                Operational Intelligence
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Office locations & expansion</li>
                <li>• Department structure</li>
                <li>• Headcount & hiring patterns</li>
                <li>• Remote work policies</li>
                <li>• Operational efficiency</li>
                <li>• Process maturity</li>
                <li>• Change events</li>
                <li>• Project methodologies</li>
                <li>• Quality standards</li>
                <li>• Cultural indicators</li>
              </ul>
            </div>

            {/* Buying Signals */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center">
                <span className="text-2xl mr-2">🚀</span>
                Buying Signals
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Hiring sprees in relevant roles</li>
                <li>• Funding announcements</li>
                <li>• Technology adoption signals</li>
                <li>• Leadership changes</li>
                <li>• Office expansions</li>
                <li>• Partnership announcements</li>
                <li>• Acquisition activity</li>
                <li>• Product launches</li>
                <li>• Compliance deadlines</li>
                <li>• Digital transformation initiatives</li>
              </ul>
            </div>
          </div>
        </div>

        {/* COMPANY TYPE WORKFLOWS */}
        <div className="bg-green-50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-4">🎯 Company Type-Specific Workflows</h2>
          
          <div className="space-y-6">
            {/* Startup Workflow */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🚀</span>
                Startup Companies (1-50 employees)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Research Focus:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Funding stage & runway</li>
                    <li>• Investor backing & credibility</li>
                    <li>• Growth trajectory & hiring</li>
                    <li>• Technology choices & scalability</li>
                    <li>• Market validation & traction</li>
                    <li>• Founder backgrounds</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Engagement Strategy:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Fast decision cycles (2-4 weeks)</li>
                    <li>• Direct founder/C-suite access</li>
                    <li>• Cost-conscious solutions</li>
                    <li>• Scalability demonstrations</li>
                    <li>• Reference customers similar stage</li>
                    <li>• Flexible pricing models</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enterprise Workflow */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🏢</span>
                Enterprise Companies (1000+ employees)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Research Focus:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Existing vendor relationships</li>
                    <li>• IT governance & approval processes</li>
                    <li>• Compliance requirements</li>
                    <li>• Integration capabilities</li>
                    <li>• Security & risk management</li>
                    <li>• Budget cycles & procurement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Engagement Strategy:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Long sales cycles (6-18 months)</li>
                    <li>• Multiple stakeholder alignment</li>
                    <li>• Proof of concepts & pilots</li>
                    <li>• Security & compliance validation</li>
                    <li>• Enterprise references</li>
                    <li>• Professional services support</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Government Workflow */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🏛️</span>
                Government Organizations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Research Focus:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Regulatory compliance requirements</li>
                    <li>• Security clearance needs</li>
                    <li>• Public procurement processes</li>
                    <li>• Budget appropriations</li>
                    <li>• Political & policy influences</li>
                    <li>• Existing contractor relationships</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Engagement Strategy:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Very long cycles (12-36 months)</li>
                    <li>• RFP/RFQ formal processes</li>
                    <li>• Security certifications required</li>
                    <li>• Cost-effectiveness emphasis</li>
                    <li>• Government references essential</li>
                    <li>• Compliance documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT VALIDATION */}
        <div className="bg-purple-50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">📞 Professional Contact Validation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Validation */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📧</span>
                Email Validation & Classification
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Validation Providers:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>DropContact:</strong> Business emails (≤$0.02/email)</li>
                    <li>• <strong>ZeroBounce:</strong> DPA compliant, enterprise-grade</li>
                    <li>• <strong>MyEmailVerifier:</strong> Cost-effective ($0.002-$0.004)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Email Types Detected:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Professional:</strong> john.smith@company.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Role-based:</strong> info@company.com, sales@company.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Personal:</strong> john.smith@gmail.com</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Disposable:</strong> temp@10minutemail.com</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Domain Analysis:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Business vs. generic domain detection</li>
                    <li>• Company name matching</li>
                    <li>• Domain reputation & age</li>
                    <li>• Technology stack detection</li>
                    <li>• Risk factor assessment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Phone Validation */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📱</span>
                Phone Validation & Classification
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Validation Provider:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Twilio Lookup:</strong> Line type intelligence ($0.008/lookup)</li>
                    <li>• Carrier information & location</li>
                    <li>• Caller name identification</li>
                    <li>• Reachability assessment</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Phone Types Detected:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Landline:</strong> Office/business lines (most professional)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Mobile:</strong> Personal or business mobile</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>VoIP:</strong> Internet-based calling</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                      <span className="text-sm"><strong>Toll-free:</strong> Business customer service lines</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Context Detection:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Professional vs. personal context</li>
                    <li>• Company name matching</li>
                    <li>• Business hours appropriateness</li>
                    <li>• Geographic location analysis</li>
                    <li>• Carrier reputation assessment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-WORLD USE CASES */}
        <div className="bg-orange-50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">🎯 Real-World Use Cases for TOP Engineering Plus</h2>
          
          <div className="space-y-6">
            {/* Use Case 1 */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-orange-900 mb-3">Use Case 1: Utility Technology Modernization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Company Intelligence Needed:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Current SCADA/communications systems</li>
                    <li>• Cybersecurity compliance requirements</li>
                    <li>• Grid modernization initiatives</li>
                    <li>• Technology budget & approval cycles</li>
                    <li>• Regulatory compliance deadlines</li>
                    <li>• Existing vendor relationships</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Contact Validation Priority:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Engineering managers (professional emails)</li>
                    <li>• IT directors (business phone lines)</li>
                    <li>• Operations supervisors (direct contact)</li>
                    <li>• Procurement officers (role-based emails OK)</li>
                    <li>• Avoid personal emails for compliance</li>
                    <li>• Verify current employment status</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Use Case 2 */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-orange-900 mb-3">Use Case 2: Competitive Displacement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Intelligence Requirements:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Current vendor contracts & expiration dates</li>
                    <li>• Technology pain points & limitations</li>
                    <li>• Budget dissatisfaction signals</li>
                    <li>• Leadership changes affecting decisions</li>
                    <li>• Competitive vendor performance issues</li>
                    <li>• Renewal timeline & decision process</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Contact Strategy:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Target decision influencers, not just users</li>
                    <li>• Professional communication channels only</li>
                    <li>• Validate contacts are still at company</li>
                    <li>• Identify change champions</li>
                    <li>• Map complete buyer group</li>
                    <li>• Time outreach with renewal cycles</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Use Case 3 */}
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-orange-900 mb-3">Use Case 3: New Market Expansion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Market Research Focus:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Regional utility market characteristics</li>
                    <li>• Local regulatory requirements</li>
                    <li>• Technology adoption patterns</li>
                    <li>• Competitive landscape mapping</li>
                    <li>• Budget cycles & procurement processes</li>
                    <li>• Industry association participation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-2">Contact Development:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Industry conference attendee lists</li>
                    <li>• Professional association members</li>
                    <li>• LinkedIn utility industry groups</li>
                    <li>• Validate professional credentials</li>
                    <li>• Prioritize business contact methods</li>
                    <li>• Build regional reference network</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROFESSIONAL STANDARDS */}
        <div className="bg-[var(--hover)] border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">✨ Professional Standards & Best Practices</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">📧 Email Best Practices</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• <strong>Prefer:</strong> Professional business emails (95%+ confidence)</li>
                <li>• <strong>Accept:</strong> Role-based emails for initial contact</li>
                <li>• <strong>Caution:</strong> Personal emails (request business alternative)</li>
                <li>• <strong>Avoid:</strong> Disposable/temporary email addresses</li>
                <li>• <strong>Validate:</strong> Domain reputation and deliverability</li>
                <li>• <strong>Verify:</strong> Email format and syntax accuracy</li>
              </ul>
            </div>
            
            <div className="bg-[var(--background)] border rounded p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">📞 Phone Best Practices</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• <strong>Prefer:</strong> Business landlines (highest professionalism)</li>
                <li>• <strong>Accept:</strong> Mobile numbers with business context</li>
                <li>• <strong>Note:</strong> VoIP numbers (different reachability patterns)</li>
                <li>• <strong>Respect:</strong> Personal mobile usage boundaries</li>
                <li>• <strong>Validate:</strong> Number format and carrier information</li>
                <li>• <strong>Consider:</strong> Time zones and business hours</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-100 border border-blue-300 rounded p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🎯 Client Presentation Standards</h3>
            <p className="text-sm text-blue-800">
              All contact information and company intelligence provided to clients undergoes rigorous validation:
              <strong> 85%+ confidence threshold</strong>, <strong>multiple source verification</strong>, 
              <strong>professional context confirmation</strong>, and <strong>real-time accuracy validation</strong>. 
              This ensures TOP Engineering Plus maintains the highest standards of professionalism and data quality 
              in all client interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
