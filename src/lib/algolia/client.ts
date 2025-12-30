import { algoliasearch } from "algoliasearch";
import { algoliaConfig, isAlgoliaAdminConfigured } from "./config";

/**
 * Algolia Admin Client (server-side only)
 * Used for indexing and managing indices
 */
let adminClient: ReturnType<typeof algoliasearch> | null = null;

export function getAlgoliaAdminClient() {
  if (!isAlgoliaAdminConfigured()) {
    throw new Error(
      "Algolia admin not configured. Set ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY environment variables."
    );
  }

  if (!adminClient) {
    adminClient = algoliasearch(algoliaConfig.appId, algoliaConfig.adminApiKey);
  }

  return adminClient;
}

/**
 * Algolia Search Client (client-side safe)
 * Uses search-only API key
 */
let searchClient: ReturnType<typeof algoliasearch> | null = null;

export function getAlgoliaSearchClient() {
  if (!algoliaConfig.appId || !algoliaConfig.searchApiKey) {
    throw new Error(
      "Algolia search not configured. Set ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY environment variables."
    );
  }

  if (!searchClient) {
    searchClient = algoliasearch(algoliaConfig.appId, algoliaConfig.searchApiKey);
  }

  return searchClient;
}

/**
 * Get index reference for admin operations
 */
export function getAdminIndex(indexName: string) {
  const client = getAlgoliaAdminClient();
  return {
    saveObjects: (objects: object[]) =>
      client.saveObjects({
        indexName,
        objects: objects.map((obj, i) => ({
          ...obj,
          objectID: (obj as { objectID?: string }).objectID || `obj_${i}`,
        })),
      }),
    deleteObjects: (objectIDs: string[]) => client.deleteObjects({ indexName, objectIDs }),
    setSettings: (settings: object) =>
      client.setSettings({
        indexName,
        indexSettings: settings as Parameters<typeof client.setSettings>[0]["indexSettings"],
      }),
    clearObjects: () => client.clearObjects({ indexName }),
  };
}
