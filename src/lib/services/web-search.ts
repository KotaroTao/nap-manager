/**
 * Web検索サービス
 *
 * NAP情報をWeb検索で取得するためのサービス
 * Google Custom Search API または SerpAPI を使用
 */

export interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

export interface WebSearchResponse {
  success: boolean
  results: SearchResult[]
  totalResults: number
  error?: string
}

export interface NapSearchResult {
  foundUrl: string | null
  detectedName: string | null
  detectedAddress: string | null
  detectedPhone: string | null
  confidence: number
  rawResults: SearchResult[]
}

/**
 * サイト別の検索クエリテンプレート
 */
export const SEARCH_TEMPLATES: Record<string, string> = {
  "google-business": "{clinicName} {prefecture} site:google.com/maps",
  "yahoo-place": "{clinicName} {prefecture} site:loco.yahoo.co.jp",
  "epark-dental": "{clinicName} site:haisha-yoyaku.jp",
  denternet: "{clinicName} site:denternet.jp",
  "shika-town": "{clinicName} site:shika-town.com",
  "dental-book": "{clinicName} site:dentalbook.jp",
  facebook: "{clinicName} {prefecture} 歯科 site:facebook.com",
  instagram: "{clinicName} 歯科 site:instagram.com",
  default: "{clinicName} {prefecture} {city} 歯科",
}

/**
 * 検索クエリを生成
 */
export function generateSearchQuery(
  template: string,
  clinic: {
    name: string
    prefecture: string
    city: string
    address: string
  }
): string {
  return template
    .replace("{clinicName}", clinic.name)
    .replace("{prefecture}", clinic.prefecture)
    .replace("{city}", clinic.city)
    .replace("{address}", clinic.address)
    .trim()
}

/**
 * Google Custom Search API を使用して検索
 */
async function searchWithGoogleCSE(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    return {
      success: false,
      results: [],
      totalResults: 0,
      error: "Google Search API の設定がありません",
    }
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1")
    url.searchParams.set("key", apiKey)
    url.searchParams.set("cx", searchEngineId)
    url.searchParams.set("q", query)
    url.searchParams.set("num", "10")
    url.searchParams.set("lr", "lang_ja")

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        results: [],
        totalResults: 0,
        error: errorData.error?.message || `API Error: ${response.status}`,
      }
    }

    const data = await response.json()

    const results: SearchResult[] = (data.items || []).map(
      (item: {
        title: string
        link: string
        snippet: string
        displayLink: string
      }) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
      })
    )

    return {
      success: true,
      results,
      totalResults: parseInt(data.searchInformation?.totalResults || "0", 10),
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      totalResults: 0,
      error: error instanceof Error ? error.message : "検索エラー",
    }
  }
}

/**
 * SerpAPI を使用して検索
 */
async function searchWithSerpAPI(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPAPI_KEY

  if (!apiKey) {
    return {
      success: false,
      results: [],
      totalResults: 0,
      error: "SerpAPI の設定がありません",
    }
  }

  try {
    const url = new URL("https://serpapi.com/search.json")
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("q", query)
    url.searchParams.set("engine", "google")
    url.searchParams.set("hl", "ja")
    url.searchParams.set("gl", "jp")
    url.searchParams.set("num", "10")

    const response = await fetch(url.toString())

    if (!response.ok) {
      return {
        success: false,
        results: [],
        totalResults: 0,
        error: `SerpAPI Error: ${response.status}`,
      }
    }

    const data = await response.json()

    const results: SearchResult[] = (data.organic_results || []).map(
      (item: {
        title: string
        link: string
        snippet: string
        displayed_link: string
      }) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || "",
        displayLink: item.displayed_link,
      })
    )

    return {
      success: true,
      results,
      totalResults: data.search_information?.total_results || results.length,
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      totalResults: 0,
      error: error instanceof Error ? error.message : "検索エラー",
    }
  }
}

/**
 * Web検索を実行（設定に基づいてプロバイダーを選択）
 */
export async function webSearch(query: string): Promise<WebSearchResponse> {
  const provider = process.env.SEARCH_PROVIDER || "google"

  switch (provider) {
    case "serpapi":
      return searchWithSerpAPI(query)
    case "google":
    default:
      return searchWithGoogleCSE(query)
  }
}

/**
 * 検索結果からNAP情報を抽出
 */
export function extractNapFromResults(
  results: SearchResult[],
  clinic: {
    name: string
    phone: string
    prefecture: string
    city: string
    address: string
  }
): NapSearchResult {
  if (results.length === 0) {
    return {
      foundUrl: null,
      detectedName: null,
      detectedAddress: null,
      detectedPhone: null,
      confidence: 0,
      rawResults: [],
    }
  }

  // 最も関連性の高い結果を使用
  const topResult = results[0]

  // 電話番号を抽出（スニペットから）
  const phonePattern = /0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g
  const phoneMatches = topResult.snippet.match(phonePattern)
  const detectedPhone = phoneMatches ? phoneMatches[0].replace(/[-\s]/g, "-") : null

  // 住所を抽出（スニペットから）
  const addressPattern =
    /(東京都|北海道|(?:京都|大阪)府|.{2,3}県).{1,30}?(?:\d+[-−]\d+|\d+番地?)/
  const addressMatch = topResult.snippet.match(addressPattern)
  const detectedAddress = addressMatch ? addressMatch[0] : null

  // 医院名を抽出（タイトルから）
  let detectedName = topResult.title
    .replace(/\s*[-|｜–—]\s*.+$/, "") // サイト名を除去
    .replace(/【.+?】/g, "") // 【】内を除去
    .replace(/\(.+?\)/g, "") // ()内を除去
    .trim()

  // 信頼度を計算
  let confidence = 0.5

  // タイトルに医院名が含まれている場合
  if (topResult.title.includes(clinic.name)) {
    confidence += 0.2
    detectedName = clinic.name
  }

  // スニペットに電話番号が含まれている場合
  if (detectedPhone) {
    confidence += 0.1
  }

  // スニペットに住所が含まれている場合
  if (detectedAddress) {
    confidence += 0.1
  }

  // URLがサイトのドメインと一致する場合
  if (topResult.link) {
    confidence += 0.1
  }

  return {
    foundUrl: topResult.link,
    detectedName,
    detectedAddress,
    detectedPhone,
    confidence: Math.min(confidence, 1),
    rawResults: results,
  }
}

/**
 * サイトに対してNAP検索を実行
 */
export async function searchNapForSite(
  clinic: {
    name: string
    phone: string
    prefecture: string
    city: string
    address: string
  },
  site: {
    name: string
    url: string
    searchUrlTemplate?: string | null
  }
): Promise<NapSearchResult> {
  // サイト固有のテンプレートまたはデフォルトを使用
  const siteKey = site.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")

  const template =
    site.searchUrlTemplate ||
    SEARCH_TEMPLATES[siteKey] ||
    `{clinicName} site:${new URL(site.url).hostname}`

  const query = generateSearchQuery(template, clinic)

  const searchResponse = await webSearch(query)

  if (!searchResponse.success) {
    return {
      foundUrl: null,
      detectedName: null,
      detectedAddress: null,
      detectedPhone: null,
      confidence: 0,
      rawResults: [],
    }
  }

  return extractNapFromResults(searchResponse.results, clinic)
}
