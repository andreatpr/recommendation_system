const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  } catch {
    throw new ApiError(`No se pudo conectar con la API en ${API_URL}`);
  }
  if (!response.ok) {
    throw new ApiError(`La API respondió ${response.status} para ${path}`);
  }
  return response.json() as Promise<T>;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}

export interface MetricsSnapshot {
  precision: number;
  recall: number;
  ndcg: number;
  map: number;
}

export interface ModelInfoResponse {
  n_users: number;
  n_cities: number;
  n_factors: number;
  hybrid_config: {
    cf_weight: number;
    content_weight: number;
    popularity_weight: number;
    top_k: number;
  };
  metrics: {
    k: number;
    evaluation_protocol: string;
    n_users_eval: number;
    baseline_popularity: MetricsSnapshot;
    hybrid: MetricsSnapshot;
  };
  data_quality: {
    cluster_popularity_source: string;
    seen_exclusion_available: boolean;
    cities_filtered_count: number;
    cities_scored_count: number;
  };
}

export interface CityScore {
  city: string;
  score: number;
  cluster: number;
}

export interface RecommendationResponse {
  user_id: string;
  method: "hybrid" | "popularity";
  is_cold_start: boolean;
  recommendations: CityScore[];
}

export interface CityInfo {
  city: string;
  cluster: number;
}

export interface CityListResponse {
  total: number;
  cities: CityInfo[];
}

export interface SampleUsersResponse {
  user_ids: string[];
}

export interface RecommendationWeights {
  k?: number;
  w_content?: number;
  w_pop?: number;
  w_cf?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/health");
}

export function getModelInfo(): Promise<ModelInfoResponse> {
  return getJson<ModelInfoResponse>("/model-info");
}

export function getSampleUsers(n = 20): Promise<SampleUsersResponse> {
  return getJson<SampleUsersResponse>(`/users/sample${buildQuery({ n })}`);
}

export function getRecommendations(
  userId: string,
  weights: RecommendationWeights = {}
): Promise<RecommendationResponse> {
  const query = buildQuery({
    k: weights.k,
    w_content: weights.w_content,
    w_pop: weights.w_pop,
    w_cf: weights.w_cf,
  });
  return getJson<RecommendationResponse>(`/recommendations/${encodeURIComponent(userId)}${query}`);
}

export function getPopularity(k = 10): Promise<RecommendationResponse> {
  return getJson<RecommendationResponse>(`/recommendations/popularity${buildQuery({ k })}`);
}

export function getCities(cluster?: number): Promise<CityListResponse> {
  return getJson<CityListResponse>(`/cities${buildQuery({ cluster })}`);
}

export type NewUserRating = {
  city: string;
  rating: number;
};

export type NewUserRecommendationItem = {
  city: string;
  score: number;
  content_score: number;
  popularity_score: number;
  cluster: number | null;
};

export type NewUserRecommendationResponse = {
  method: string;
  is_cold_start: boolean;
  input_cities: string[];
  ignored_cities: string[];
  recommendations: NewUserRecommendationItem[];
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(`La API respondió ${res.status} para ${path}`);
  }

  return res.json();
}

export function getNewUserRecommendations(
  ratings: NewUserRating[],
  k = 10
): Promise<NewUserRecommendationResponse> {
  return postJson<NewUserRecommendationResponse>("/recommendations/new-user", {
    ratings,
    k,
  });
}