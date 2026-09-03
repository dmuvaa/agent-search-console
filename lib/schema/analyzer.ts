import {
    SchemaEntity,
    EntityNode,
    Issue,
    RichResultEligibility,
    AnalysisResult,
    Recommendation,
    ScoreBreakdown,
    AnalysisConfig,
    RICH_RESULT_TYPES,
} from "./types";
import {
    normalizeType,
    getAllTypes,
    hasProperty,
    getMissingProperties,
} from "./extractor";

/**
 * Analyzes extracted schemas and produces a full analysis result
 */
export function analyzeSchemas(
    schemas: SchemaEntity[],
    url: string,
    config?: Partial<AnalysisConfig>
): AnalysisResult {
    const entityNodes = buildEntityGraph(schemas);
    const issues = detectAllIssues(schemas, entityNodes);
    const eligibleRichResults = checkRichResultEligibility(schemas);
    const scoreBreakdown = calculateScoreBreakdown(schemas, entityNodes, eligibleRichResults, config);
    const opportunityScore = calculateOpportunityScore(scoreBreakdown);
    const recommendations = generateRecommendations(schemas, issues, eligibleRichResults, config);

    return {
        url,
        fetchedAt: new Date().toISOString(),
        entities: entityNodes,
        eligibleRichResults,
        opportunityScore,
        scoreBreakdown,
        issues,
        recommendations,
    };
}

/**
 * Builds an entity graph from flat schema entities
 */
function buildEntityGraph(schemas: SchemaEntity[]): EntityNode[] {
    return schemas.map((entity, index) => {
        const type = normalizeType(entity);
        const issues = detectEntityIssues(entity);

        return {
            id: entity["@id"]?.toString() || `entity-${index}`,
            type,
            properties: extractProperties(entity),
            children: extractNestedEntities(entity),
            issues,
            confidence: calculateEntityConfidence(entity, issues),
        };
    });
}

/**
 * Extracts displayable properties from an entity
 */
function extractProperties(entity: SchemaEntity): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(entity)) {
        if (key.startsWith("@")) continue;
        if (typeof value === "object" && value !== null && "@type" in value) continue;
        props[key] = value;
    }

    return props;
}

/**
 * Extracts nested entities as children
 */
function extractNestedEntities(entity: SchemaEntity): EntityNode[] {
    const children: EntityNode[] = [];

    for (const [key, value] of Object.entries(entity)) {
        if (key.startsWith("@")) continue;

        if (typeof value === "object" && value !== null && "@type" in value) {
            const nested = value as SchemaEntity;
            children.push({
                id: nested["@id"]?.toString() || `nested-${key}`,
                type: normalizeType(nested),
                properties: extractProperties(nested),
                children: extractNestedEntities(nested),
                issues: detectEntityIssues(nested),
                confidence: "medium",
            });
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "object" && item !== null && "@type" in item) {
                    const nested = item as SchemaEntity;
                    children.push({
                        id: nested["@id"]?.toString() || `nested-array-${key}`,
                        type: normalizeType(nested),
                        properties: extractProperties(nested),
                        children: extractNestedEntities(nested),
                        issues: detectEntityIssues(nested),
                        confidence: "medium",
                    });
                }
            }
        }
    }

    return children;
}

/**
 * Detects issues with a single entity
 */
function detectEntityIssues(entity: SchemaEntity): Issue[] {
    const issues: Issue[] = [];
    const types = getAllTypes(entity);

    for (const [, richResult] of Object.entries(RICH_RESULT_TYPES)) {
        const matchingType = types.find((t) => (richResult.requiredTypes as readonly string[]).includes(t));
        if (matchingType) {
            // Check required properties
            const missingRequired = getMissingProperties(entity, richResult.requiredProperties);
            for (const prop of missingRequired) {
                issues.push({
                    type: "missing",
                    severity: "error",
                    property: prop,
                    message: `Missing required property: ${prop}`,
                    recommendation: `Add the "${prop}" property to enable ${richResult.name} rich results`,
                });
            }

            // Check recommended properties
            const missingRecommended = getMissingProperties(entity, richResult.recommendedProperties);
            for (const prop of missingRecommended) {
                issues.push({
                    type: "weak",
                    severity: "warning",
                    property: prop,
                    message: `Missing recommended property: ${prop}`,
                    recommendation: `Adding "${prop}" increases eligibility confidence for ${richResult.name}`,
                });
            }
        }
    }

    return issues;
}

/**
 * Detects all issues across the schema set
 */
function detectAllIssues(schemas: SchemaEntity[], nodes: EntityNode[]): Issue[] {
    const issues: Issue[] = [];

    // Collect all entity issues
    for (const node of nodes) {
        issues.push(...node.issues);
    }

    // Check for multiple conflicting schemas
    const typeCount: Record<string, number> = {};
    for (const schema of schemas) {
        const type = normalizeType(schema);
        typeCount[type] = (typeCount[type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCount)) {
        if (count > 1) {
            issues.push({
                type: "conflict",
                severity: "warning",
                message: `Multiple ${type} entities detected (${count})`,
                recommendation: "Consider consolidating into a single entity or using @id references",
            });
        }
    }

    // Check for missing Organization on SoftwareApplication
    const hasSoftwareApp = schemas.some((s) =>
        getAllTypes(s).some((t) => ["SoftwareApplication", "WebApplication", "MobileApplication"].includes(t))
    );
    const hasOrg = schemas.some((s) =>
        getAllTypes(s).some((t) => t === "Organization")
    );

    if (hasSoftwareApp && !hasOrg) {
        issues.push({
            type: "weak",
            severity: "info",
            message: "SoftwareApplication without linked Organization",
            recommendation: "Add an Organization entity with publisher relationship",
        });
    }

    return issues;
}

/**
 * Checks rich result eligibility for all supported types
 */
function checkRichResultEligibility(schemas: SchemaEntity[]): RichResultEligibility[] {
    const results: RichResultEligibility[] = [];

    for (const [key, richResult] of Object.entries(RICH_RESULT_TYPES)) {
        const matchingEntity = schemas.find((schema) =>
            getAllTypes(schema).some((t) => (richResult.requiredTypes as readonly string[]).includes(t))
        );

        if (matchingEntity) {
            const missingRequired = getMissingProperties(matchingEntity, richResult.requiredProperties);
            const missingRecommended = getMissingProperties(matchingEntity, richResult.recommendedProperties);

            let confidence: "high" | "medium" | "low" = "high";
            let eligible = true;

            if (missingRequired.length > 0) {
                eligible = false;
                confidence = "low";
            } else if (missingRecommended.length > 2) {
                confidence = "low";
            } else if (missingRecommended.length > 0) {
                confidence = "medium";
            }

            results.push({
                type: key,
                name: richResult.name,
                eligible,
                confidence,
                missingProperties: [...missingRequired, ...missingRecommended],
                reason: eligible
                    ? missingRecommended.length > 0
                        ? `Eligible, but add ${missingRecommended.join(", ")} to increase confidence`
                        : "All required and recommended properties present"
                    : `Missing required: ${missingRequired.join(", ")}`,
            });
        }
    }

    return results;
}

/**
 * Calculates the score breakdown
 */
function calculateScoreBreakdown(
    schemas: SchemaEntity[],
    nodes: EntityNode[],
    eligibility: RichResultEligibility[],
    config?: Partial<AnalysisConfig>
): ScoreBreakdown {
    // Entity Clarity (25%): How well-defined are the entities?
    let entityClarity = 100;
    const totalErrors = nodes.reduce((sum, n) => sum + n.issues.filter(i => i.severity === "error").length, 0);
    entityClarity = Math.max(0, 100 - totalErrors * 15);

    // Relationship Depth (20%): Are entities properly linked?
    let relationshipDepth = 50; // Base score
    const hasNestedEntities = nodes.some((n) => n.children.length > 0);
    const hasIdReferences = schemas.some((s) => s["@id"]);
    if (hasNestedEntities) relationshipDepth += 25;
    if (hasIdReferences) relationshipDepth += 25;

    // Rich Result Alignment (25%): How many rich results are eligible?
    let richResultAlignment = 0;
    if (eligibility.length > 0) {
        const eligibleCount = eligibility.filter((e) => e.eligible).length;
        const highConfidenceCount = eligibility.filter((e) => e.confidence === "high").length;
        richResultAlignment = Math.round(
            (eligibleCount / eligibility.length) * 60 +
            (highConfidenceCount / eligibility.length) * 40
        );
    }

    // Business Intent Match (15%): Does schema match stated intent?
    let businessIntentMatch = 70; // Default
    if (config?.businessType === "saas") {
        const hasSoftware = schemas.some((s) =>
            getAllTypes(s).some((t) => ["SoftwareApplication", "WebApplication"].includes(t))
        );
        businessIntentMatch = hasSoftware ? 100 : 30;
    }

    // Content Consistency (15%): Basic heuristic
    let contentConsistency = 60;
    const hasName = schemas.some((s) => hasProperty(s, "name"));
    const hasDescription = schemas.some((s) => hasProperty(s, "description"));
    if (hasName) contentConsistency += 20;
    if (hasDescription) contentConsistency += 20;

    return {
        entityClarity: Math.min(100, entityClarity),
        relationshipDepth: Math.min(100, relationshipDepth),
        richResultAlignment: Math.min(100, richResultAlignment),
        businessIntentMatch: Math.min(100, businessIntentMatch),
        contentConsistency: Math.min(100, contentConsistency),
    };
}

/**
 * Calculates the overall opportunity score
 */
function calculateOpportunityScore(breakdown: ScoreBreakdown): number {
    const weights = {
        entityClarity: 0.25,
        relationshipDepth: 0.2,
        richResultAlignment: 0.25,
        businessIntentMatch: 0.15,
        contentConsistency: 0.15,
    };

    return Math.round(
        breakdown.entityClarity * weights.entityClarity +
        breakdown.relationshipDepth * weights.relationshipDepth +
        breakdown.richResultAlignment * weights.richResultAlignment +
        breakdown.businessIntentMatch * weights.businessIntentMatch +
        breakdown.contentConsistency * weights.contentConsistency
    );
}

/**
 * Calculates confidence level for an entity
 */
function calculateEntityConfidence(
    entity: SchemaEntity,
    issues: Issue[]
): "high" | "medium" | "low" {
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;

    if (errors > 0) return "low";
    if (warnings > 2) return "low";
    if (warnings > 0) return "medium";
    return "high";
}

/**
 * Generates prioritized recommendations
 */
function generateRecommendations(
    schemas: SchemaEntity[],
    issues: Issue[],
    eligibility: RichResultEligibility[],
    config?: Partial<AnalysisConfig>
): Recommendation[] {
    void eligibility;
    void config;
    const recommendations: Recommendation[] = [];

    // High priority: Fix missing required properties
    const errorIssues = issues.filter((i) => i.severity === "error" && i.property);
    for (const issue of errorIssues.slice(0, 3)) {
        recommendations.push({
            priority: "high",
            title: `Add missing "${issue.property}"`,
            description: issue.message,
            impact: "Required for rich result eligibility",
        });
    }

    // Medium priority: Add recommended properties
    const warningIssues = issues.filter((i) => i.severity === "warning" && i.property);
    for (const issue of warningIssues.slice(0, 3)) {
        recommendations.push({
            priority: "medium",
            title: `Add "${issue.property}" property`,
            description: issue.recommendation || issue.message,
            impact: "Increases confidence for rich results",
        });
    }

    // Low priority: General improvements
    if (!schemas.some((s) => hasProperty(s, "image"))) {
        recommendations.push({
            priority: "low",
            title: "Add image property",
            description: "Images significantly increase rich result chances",
            impact: "Visual enhancement in search results",
        });
    }

    return recommendations;
}
