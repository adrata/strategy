import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  twitterImage?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export const baseSEO = {
  siteName: "Adrata",
  siteUrl: "https://adrata.com",
  defaultImage: "/og-image.jpg",
  defaultTwitterImage: "/twitter-image.jpg",
  twitterHandle: "@adrata",
  company: "Adrata Inc",
  author: "Adrata",
};

export const pageSEO: Record<string, SEOConfig> = {
  home: {
    title: "Adrata: #1 Buyer Group Intelligence Platform",
    description: "Adrata is the complete buyer group intelligence platform with AI-powered stakeholder mapping, influence analysis, and deal intelligence. Decode complex B2B buying decisions in seconds, not months.",
    keywords: "buyer group intelligence, stakeholder mapping, B2B sales, deal intelligence, influence analysis, sales platform, enterprise sales, buyer analysis, CRM integration",
    canonical: "https://adrata.com",
  },
  platform: {
    title: "Platform - Complete Buyer Group Intelligence | Adrata",
    description: "Experience the complete buyer group intelligence platform with AI-powered stakeholder mapping, influence analysis, real-time deal intelligence, and CRM integration for enterprise sales teams.",
    keywords: "buyer group platform, stakeholder mapping software, influence analysis, deal intelligence, enterprise sales platform, CRM integration, B2B sales tools",
    canonical: "https://adrata.com/platform",
  },
  pricing: {
    title: "Pricing - Flexible Plans for Buyer Group Intelligence | Adrata",
    description: "Flexible pricing plans for buyer group intelligence platform. Custom quotes available for enterprise teams. Start with a free demo and scale with your sales organization.",
    keywords: "buyer group intelligence pricing, sales platform pricing, enterprise sales software cost, stakeholder mapping pricing, CRM integration pricing",
    canonical: "https://adrata.com/pricing",
  },
  company: {
    title: "Company - About Adrata's Mission | Adrata",
    description: "Learn about Adrata's mission to revolutionize enterprise sales with buyer group intelligence. Discover how we're solving the $1T+ problem in B2B sales through AI-powered stakeholder analysis.",
    keywords: "adrata company, buyer group intelligence company, enterprise sales company, B2B sales innovation, stakeholder mapping company",
    canonical: "https://adrata.com/company",
  },
  careers: {
    title: "Careers - Join the Future of Buyer Group Intelligence | Adrata",
    description: "Join our team building the future of buyer group intelligence and enterprise sales technology. Explore career opportunities at Adrata and help solve the biggest problem in B2B sales.",
    keywords: "adrata careers, buyer group intelligence jobs, enterprise sales jobs, B2B sales technology careers, stakeholder mapping careers",
    canonical: "https://adrata.com/careers",
  },
  demo: {
    title: "See a Demo - Experience Buyer Group Intelligence | Adrata",
    description: "Experience buyer group intelligence in action with a personalized demo of the Adrata platform. See how to decode complex B2B buying decisions in seconds, not months.",
    keywords: "buyer group intelligence demo, stakeholder mapping demo, enterprise sales demo, B2B sales platform demo, influence analysis demo",
    canonical: "https://adrata.com/demo",
  },
  contact: {
    title: "Contact - Get in Touch with Adrata | Adrata",
    description: "Get in touch with Adrata for buyer group intelligence inquiries, enterprise sales solutions, and platform demonstrations. Contact our team for personalized support.",
    keywords: "contact adrata, buyer group intelligence contact, enterprise sales contact, stakeholder mapping support",
    canonical: "https://adrata.com/contact",
  },
  privacy: {
    title: "Privacy Policy - Data Protection at Adrata | Adrata",
    description: "Learn about Adrata's privacy policy and data protection practices for buyer group intelligence platform. Enterprise-grade security and GDPR compliance.",
    keywords: "adrata privacy policy, buyer group intelligence privacy, enterprise sales privacy, data protection, GDPR compliance",
    canonical: "https://adrata.com/privacy",
  },
  terms: {
    title: "Terms of Service - Adrata Platform Terms | Adrata",
    description: "Review Adrata's terms of service for buyer group intelligence platform usage, enterprise sales tools, and stakeholder mapping services.",
    keywords: "adrata terms of service, buyer group intelligence terms, enterprise sales terms, platform terms",
    canonical: "https://adrata.com/terms",
  },
};

export function generateMetadata(pageKey: string, customConfig?: Partial<SEOConfig>): Metadata {
  const config = { ...pageSEO[pageKey], ...customConfig };
  
  if (!config) {
    console.warn(`No SEO config found for page: ${pageKey}`);
    return {};
  }

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    robots: config.noIndex ? "noindex, nofollow" : "index, follow",
    alternates: {
      canonical: config.canonical,
    },
    openGraph: {
      type: "website",
      url: config.canonical,
      title: config.title,
      description: config.description,
      siteName: baseSEO.siteName,
      images: [
        {
          url: config.ogImage || baseSEO.defaultImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: baseSEO.twitterHandle,
      creator: baseSEO.twitterHandle,
      title: config.title,
      description: config.description,
      images: [config.twitterImage || baseSEO.defaultTwitterImage],
    },
    authors: [{ name: baseSEO.author }],
    publisher: baseSEO.company,
    formatDetection: {
      telephone: false,
    },
    viewport: {
      width: "device-width",
      initialScale: 1,
    },
  };
}

export function generateStructuredData(type: string, data: any) {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
  
  return JSON.stringify(baseStructuredData);
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return generateStructuredData("BreadcrumbList", {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}) {
  return generateStructuredData("Article", {
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: baseSEO.company,
      logo: {
        "@type": "ImageObject",
        url: `${baseSEO.siteUrl}/adrata-logo.png`,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image || baseSEO.defaultImage,
    url: article.url,
  });
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return generateStructuredData("FAQPage", {
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}

export function generateSoftwareApplicationStructuredData(app: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  price?: string;
  priceCurrency?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return generateStructuredData("SoftwareApplication", {
    name: app.name,
    description: app.description,
    url: app.url,
    applicationCategory: app.applicationCategory,
    operatingSystem: app.operatingSystem,
    offers: app.price ? {
      "@type": "Offer",
      price: app.price,
      priceCurrency: app.priceCurrency || "USD",
      availability: "https://schema.org/InStock",
    } : undefined,
    aggregateRating: app.rating ? {
      "@type": "AggregateRating",
      ratingValue: app.rating,
      reviewCount: app.reviewCount || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  });
} 