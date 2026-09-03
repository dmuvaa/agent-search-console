// Schema.org entity types and analysis types

export interface SchemaEntity {
    "@context"?: string;
    "@type": string | string[];
    "@id"?: string;
    [key: string]: unknown;
}

export interface ExtractedSchema {
    jsonLd: SchemaEntity[];
    microdata: SchemaEntity[];
    rdfa: SchemaEntity[];
    raw: string[];
}

export interface EntityNode {
    id: string;
    type: string;
    properties: Record<string, unknown>;
    children: EntityNode[];
    issues: Issue[];
    confidence: "high" | "medium" | "low";
}

export interface Issue {
    type: "missing" | "weak" | "conflict" | "framework";
    severity: "error" | "warning" | "info";
    property?: string;
    message: string;
    recommendation?: string;
}

export interface RichResultEligibility {
    type: string;
    name: string;
    eligible: boolean;
    confidence: "high" | "medium" | "low";
    missingProperties: string[];
    reason?: string;
}

export interface AnalysisResult {
    url: string;
    fetchedAt: string;
    entities: EntityNode[];
    eligibleRichResults: RichResultEligibility[];
    opportunityScore: number;
    scoreBreakdown: ScoreBreakdown;
    issues: Issue[];
    recommendations: Recommendation[];
}

export interface ScoreBreakdown {
    entityClarity: number;
    relationshipDepth: number;
    richResultAlignment: number;
    businessIntentMatch: number;
    contentConsistency: number;
}

export interface Recommendation {
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
    fix?: string; // JSON-LD fix code
}

export type BusinessType =
    | "saas"
    | "local-business"
    | "publisher"
    | "marketplace"
    | "ecommerce"
    | "custom";

export type BusinessIntent =
    | "lead-generation"
    | "app-installs"
    | "content-discovery"
    | "transactions";

export interface AnalysisConfig {
    businessType: BusinessType;
    intent: BusinessIntent;
}

// Rich result types that Google supports
export const RICH_RESULT_TYPES = {
    Article: {
        name: "Article",
        requiredTypes: ["Article", "NewsArticle", "BlogPosting"],
        requiredProperties: ["headline", "image", "author", "datePublished"],
        recommendedProperties: ["dateModified", "publisher"],
    },
    Product: {
        name: "Product",
        requiredTypes: ["Product"],
        requiredProperties: ["name", "image"],
        recommendedProperties: ["offers", "aggregateRating", "review", "brand"],
    },
    SoftwareApp: {
        name: "Software App",
        requiredTypes: ["SoftwareApplication", "MobileApplication", "WebApplication"],
        requiredProperties: ["name"],
        recommendedProperties: ["applicationCategory", "operatingSystem", "offers", "aggregateRating"],
    },
    LocalBusiness: {
        name: "Local Business",
        requiredTypes: ["LocalBusiness", "Restaurant", "Store"],
        requiredProperties: ["name", "address"],
        recommendedProperties: ["telephone", "openingHoursSpecification", "geo", "image"],
    },
    Organization: {
        name: "Organization",
        requiredTypes: ["Organization", "Corporation"],
        requiredProperties: ["name"],
        recommendedProperties: ["logo", "url", "sameAs", "contactPoint"],
    },
    FAQ: {
        name: "FAQ",
        requiredTypes: ["FAQPage"],
        requiredProperties: ["mainEntity"],
        recommendedProperties: [],
    },
    HowTo: {
        name: "How-to",
        requiredTypes: ["HowTo"],
        requiredProperties: ["name", "step"],
        recommendedProperties: ["image", "totalTime", "estimatedCost"],
    },
    Review: {
        name: "Review",
        requiredTypes: ["Review"],
        requiredProperties: ["itemReviewed", "reviewRating", "author"],
        recommendedProperties: ["reviewBody", "datePublished"],
    },
    BreadcrumbList: {
        name: "Breadcrumb",
        requiredTypes: ["BreadcrumbList"],
        requiredProperties: ["itemListElement"],
        recommendedProperties: [],
    },
    WebSite: {
        name: "Sitelinks Search Box",
        requiredTypes: ["WebSite"],
        requiredProperties: ["url", "potentialAction"],
        recommendedProperties: ["name"],
    },
} as const;
