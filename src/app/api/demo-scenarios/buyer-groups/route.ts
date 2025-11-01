import { NextRequest, NextResponse } from 'next/server';

// Real buyer group analysis results from CoreSignal API
// Required for static export (desktop build)
export const dynamic = 'force-static';

const realBuyerGroupData = {
  "success": true,
  "summary": {
    "accountsProcessed": 3,
    "totalPeopleFound": 30,
    "overallSuccessRate": 100,
    "avgPeoplePerAccount": 10,
    "processingTimeMs": 11774,
    "apiCallsUsed": 30,
    "costEstimate": "$3.00"
  },
  "buyerGroups": [
    {
      "accountName": "Match Group",
      "peopleCount": 10,
      "successRate": 100,
      "searchTime": 3720,
      "people": [
        {
          "id": 211829637,
          "name": "Joey Rapadas",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": "joey.rapadas@bremer-lloyd.com",
          "phone": null,
          "location": "Philippines",
          "buyerGroupRole": "Stakeholder",
          "confidence": 86
        },
        {
          "id": 407981490,
          "name": "Jovy Olasiman",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": "jovy.olasiman@adnoc.ae",
          "phone": null,
          "location": "United Arab Emirates",
          "buyerGroupRole": "Stakeholder",
          "confidence": 94
        },
        {
          "id": 62376534,
          "name": "Stanley WEI",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": null,
          "phone": null,
          "location": "China",
          "buyerGroupRole": "Stakeholder",
          "confidence": 76
        },
        {
          "id": 396235166,
          "name": "Adil Khan",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": null,
          "phone": null,
          "location": "Peshawar District, Khyber Pakhtunkhwa, Pakistan",
          "buyerGroupRole": "stakeholder",
          "confidence": 99
        },
        {
          "id": 409399525,
          "name": "Lindiwe Maraule",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": "lindiwe.maraule@standardbank.com",
          "phone": null,
          "location": "City of Johannesburg, Gauteng, South Africa",
          "buyerGroupRole": "stakeholder",
          "confidence": 79
        },
        {
          "id": 174826150,
          "name": "Kl Cheng Koko sy",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": null,
          "phone": null,
          "location": "Selangor, Malaysia",
          "buyerGroupRole": "stakeholder",
          "confidence": 97
        },
        {
          "id": 57543788,
          "name": "maphefo selahle",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": "maphefo.selahle@oldmutualinvest.com",
          "phone": null,
          "location": "South Africa",
          "buyerGroupRole": "stakeholder",
          "confidence": 72
        },
        {
          "id": 459536867,
          "name": "Yinghao Sun",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": "ysun@bosch.com",
          "phone": null,
          "location": "Tokyo, Japan",
          "buyerGroupRole": "stakeholder",
          "confidence": 78
        },
        {
          "id": 56261093,
          "name": "MeNa ^_^",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": null,
          "phone": null,
          "location": "Indonesia",
          "buyerGroupRole": "stakeholder",
          "confidence": 95
        },
        {
          "id": 175237407,
          "name": "Linda.long Linda.long",
          "title": "Unknown Title",
          "company": "Match Group",
          "email": null,
          "phone": null,
          "location": "Guilin, Guangxi Zhuang, China",
          "buyerGroupRole": "stakeholder",
          "confidence": 96
        }
      ]
    },
    {
      "accountName": "Brex",
      "peopleCount": 10,
      "successRate": 100,
      "searchTime": 3787,
      "people": [
        {
          "id": 144200339,
          "name": "Levana Fernadi",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "levana.fernadi@brex.com",
          "phone": null,
          "location": "Canada",
          "buyerGroupRole": "Stakeholder",
          "confidence": 82
        },
        {
          "id": 432965461,
          "name": "Caroline Williams Wood",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "caroline@arcadearcade.ca",
          "phone": null,
          "location": "Greater Vancouver Metropolitan Area",
          "buyerGroupRole": "Stakeholder",
          "confidence": 79
        },
        {
          "id": 335903293,
          "name": "Colin Sutherland",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "colin.sutherland@brex.com",
          "phone": null,
          "location": "Revelstoke, British Columbia, Canada",
          "buyerGroupRole": "Stakeholder",
          "confidence": 78
        },
        {
          "id": 489236839,
          "name": "Courtney Sjerven",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "csjerven@brex.com",
          "phone": null,
          "location": "Canada",
          "buyerGroupRole": "stakeholder",
          "confidence": 97
        },
        {
          "id": 335610283,
          "name": "Steve Melamed",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "steve.melamed@brex.com",
          "phone": null,
          "location": "St John's, Newfoundland and Labrador, Canada",
          "buyerGroupRole": "stakeholder",
          "confidence": 75
        },
        {
          "id": 227452162,
          "name": "Yousif Bunkheila",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "yousif@brex.com",
          "phone": null,
          "location": "Toronto, Ontario, Canada",
          "buyerGroupRole": "stakeholder",
          "confidence": 84
        },
        {
          "id": 801668786,
          "name": "Alexa A.",
          "title": "Unknown Title",
          "company": "Brex",
          "email": null,
          "phone": null,
          "location": "Greater Ottawa Metropolitan Area",
          "buyerGroupRole": "stakeholder",
          "confidence": 89
        },
        {
          "id": 487256034,
          "name": "Alex Armour",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "alex@brex.com",
          "phone": null,
          "location": "United States",
          "buyerGroupRole": "stakeholder",
          "confidence": 71
        },
        {
          "id": 204298485,
          "name": "Margaret Chan",
          "title": "Unknown Title",
          "company": "Brex",
          "email": null,
          "phone": null,
          "location": "New York, New York, United States",
          "buyerGroupRole": "stakeholder",
          "confidence": 72
        },
        {
          "id": 391474782,
          "name": "Cody Howard",
          "title": "Unknown Title",
          "company": "Brex",
          "email": "choward@brex.com",
          "phone": null,
          "location": "Dallas-Fort Worth Metroplex",
          "buyerGroupRole": "stakeholder",
          "confidence": 71
        }
      ]
    },
    {
      "accountName": "First Premier Bank",
      "peopleCount": 10,
      "successRate": 100,
      "searchTime": 4267,
      "people": [
        {
          "id": 116800732,
          "name": "Sujayet Shamim",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "sujayet.shamim@dhakabankltd.com",
          "phone": null,
          "location": "Dhaka, Bangladesh",
          "buyerGroupRole": "Stakeholder",
          "confidence": 90
        },
        {
          "id": 148698773,
          "name": "Ha Cuong",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "ha.cuong@hsbc.com",
          "phone": null,
          "location": "Vietnam",
          "buyerGroupRole": "Stakeholder",
          "confidence": 71
        },
        {
          "id": 76720714,
          "name": "Kariuki A.",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "kariukia@centralbank.go.ke",
          "phone": null,
          "location": "Kenya",
          "buyerGroupRole": "Stakeholder",
          "confidence": 98
        },
        {
          "id": 442470297,
          "name": "Ethel Nangoi Lukonde",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": null,
          "phone": null,
          "location": "Zambia",
          "buyerGroupRole": "stakeholder",
          "confidence": 75
        },
        {
          "id": 507046225,
          "name": "Collin Mugisa",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "cmugisa@premiercredit.co.ug",
          "phone": null,
          "location": "Kampala, Central Region, Uganda",
          "buyerGroupRole": "stakeholder",
          "confidence": 85
        },
        {
          "id": 488927123,
          "name": "贺国芯",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": null,
          "phone": null,
          "location": "Shaanxi, China",
          "buyerGroupRole": "stakeholder",
          "confidence": 93
        },
        {
          "id": 396235166,
          "name": "Adil Khan",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": null,
          "phone": null,
          "location": "Peshawar District, Khyber Pakhtunkhwa, Pakistan",
          "buyerGroupRole": "stakeholder",
          "confidence": 83
        },
        {
          "id": 65691963,
          "name": "Wana Anjili",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": null,
          "phone": null,
          "location": "Nigeria",
          "buyerGroupRole": "stakeholder",
          "confidence": 94
        },
        {
          "id": 409399525,
          "name": "Lindiwe Maraule",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "lindiwe.maraule@standardbank.com",
          "phone": null,
          "location": "City of Johannesburg, Gauteng, South Africa",
          "buyerGroupRole": "stakeholder",
          "confidence": 79
        },
        {
          "id": 223145064,
          "name": "Marina Mouton",
          "title": "Unknown Title",
          "company": "First Premier Bank",
          "email": "m.mouton@absa.africa",
          "phone": null,
          "location": "City of Johannesburg, Gauteng, South Africa",
          "buyerGroupRole": "stakeholder",
          "confidence": 95
        }
      ]
    }
  ],
  "context": {
    "sellerProducts": ["Analytics Platform", "Data Intelligence", "Business Intelligence"],
    "targetRoles": ["CEO", "CTO", "CFO", "VP Data Science", "Head of Data Engineering"],
    "contextCompleteness": 95,
    "dataSource": "CoreSignal Real Data"
  }
};

export async function GET(request: NextRequest) {
  try {
    // Transform the data to match the expected demo format
    const transformedData = {
      buyerGroups: realBuyerGroupData.buyerGroups.map((bg, index) => ({
        id: `bg-${index + 1}`,
        companyId: `company-${index + 1}`,
        companyName: bg.accountName,
        stage: index === 0 ? 'lead' : index === 1 ? 'prospect' : 'opportunity',
        roles: {
          'Decision Maker': bg.people.filter(p => p['buyerGroupRole'] === 'Decision Maker'),
          'Champion': bg.people.filter(p => p['buyerGroupRole'] === 'Champion'),
          'Stakeholder': bg.people.filter(p => p['buyerGroupRole'] === 'Stakeholder' || p['buyerGroupRole'] === 'stakeholder'),
          'Blocker': bg.people.filter(p => p['buyerGroupRole'] === 'Blocker'),
          'Introducer': bg.people.filter(p => p['buyerGroupRole'] === 'Introducer')
        },
        summary: {
          totalPeople: bg.peopleCount,
          successRate: bg.successRate,
          searchTime: bg.searchTime
        }
      })),
      summary: realBuyerGroupData.summary,
      context: realBuyerGroupData.context
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error serving buyer group data:', error);
    return NextResponse.json(
      { error: 'Failed to serve buyer group data' },
      { status: 500 }
    );
  }
}