import { ExtractedSchema, SchemaEntity } from "./types";

/**
 * Fetches a URL and extracts all schema markup
 */
export async function fetchAndExtract(url: string): Promise<{
    html: string;
    schemas: ExtractedSchema;
    error?: string;
}> {
    try {
        // Validate URL
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Only HTTP and HTTPS URLs are supported");
        }

        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; SIPBot/1.0; +https://sip.dev/bot)",
                Accept: "text/html,application/xhtml+xml",
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const schemas = extractAllSchemas(html);

        return { html, schemas };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch URL";
        return {
            html: "",
            schemas: { jsonLd: [], microdata: [], rdfa: [], raw: [] },
            error: message,
        };
    }
}

/**
 * Extracts all JSON-LD, microdata, and RDFa from HTML
 */
export function extractAllSchemas(html: string): ExtractedSchema {
    return {
        jsonLd: extractJsonLd(html),
        microdata: extractMicrodata(html),
        rdfa: extractRdfa(html),
        raw: extractRawJsonLd(html),
    };
}

/**
 * Extracts and parses JSON-LD scripts
 */
export function extractJsonLd(html: string): SchemaEntity[] {
    const entities: SchemaEntity[] = [];
    const scriptRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        try {
            const content = match[1].trim();
            if (!content) continue;

            const parsed = JSON.parse(content);

            // Handle @graph arrays
            if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
                entities.push(...parsed["@graph"]);
            }
            // Handle single entity
            else if (parsed["@type"]) {
                entities.push(parsed);
            }
            // Handle arrays of entities
            else if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (item["@type"]) {
                        entities.push(item);
                    }
                }
            }
        } catch {
            // Skip malformed JSON-LD
            console.warn("Failed to parse JSON-LD block");
        }
    }

    return entities;
}

/**
 * Extracts raw JSON-LD strings for display
 */
export function extractRawJsonLd(html: string): string[] {
    const raw: string[] = [];
    const scriptRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1].trim();
        if (content) {
            try {
                // Pretty print the JSON
                raw.push(JSON.stringify(JSON.parse(content), null, 2));
            } catch {
                raw.push(content);
            }
        }
    }

    return raw;
}

/**
 * Extracts microdata (basic implementation)
 */
export function extractMicrodata(html: string): SchemaEntity[] {
    const entities: SchemaEntity[] = [];

    // Simple microdata extraction - looks for itemscope with itemtype
    const itemscopeRegex =
        /<[^>]+itemscope[^>]*itemtype=["']([^"']+)["'][^>]*>/gi;

    let match;
    while ((match = itemscopeRegex.exec(html)) !== null) {
        const itemtype = match[1];
        // Extract type from URL like https://schema.org/Product
        const typeMatch = itemtype.match(/schema\.org\/(\w+)/);
        if (typeMatch) {
            entities.push({
                "@type": typeMatch[1],
                _source: "microdata",
            } as SchemaEntity);
        }
    }

    return entities;
}

/**
 * Extracts RDFa (basic implementation)
 */
export function extractRdfa(html: string): SchemaEntity[] {
    const entities: SchemaEntity[] = [];

    // Simple RDFa extraction - looks for typeof with vocab
    const rdfaRegex = /typeof=["']([^"']+)["']/gi;

    let match;
    while ((match = rdfaRegex.exec(html)) !== null) {
        const types = match[1].split(/\s+/);
        for (const type of types) {
            if (type && !type.includes(":")) {
                entities.push({
                    "@type": type,
                    _source: "rdfa",
                } as SchemaEntity);
            }
        }
    }

    return entities;
}

/**
 * Normalizes entity type to a single string
 */
export function normalizeType(entity: SchemaEntity): string {
    if (Array.isArray(entity["@type"])) {
        return entity["@type"][0];
    }
    return entity["@type"];
}

/**
 * Gets all types from an entity (handles arrays)
 */
export function getAllTypes(entity: SchemaEntity): string[] {
    if (Array.isArray(entity["@type"])) {
        return entity["@type"];
    }
    return [entity["@type"]];
}

/**
 * Checks if entity has a specific property
 */
export function hasProperty(entity: SchemaEntity, property: string): boolean {
    return property in entity && entity[property] !== undefined && entity[property] !== null;
}

/**
 * Gets missing properties from an entity
 */
export function getMissingProperties(
    entity: SchemaEntity,
    requiredProperties: readonly string[]
): string[] {
    return requiredProperties.filter((prop) => !hasProperty(entity, prop));
}
