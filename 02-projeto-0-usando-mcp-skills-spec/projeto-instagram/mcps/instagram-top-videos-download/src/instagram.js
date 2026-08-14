// Resolução da URL do arquivo .mp4 a partir do shortcode, usando apenas o
// GraphQL público (web) do Instagram — sem login, cookies ou tokens.
const GRAPHQL_ENDPOINT = "https://www.instagram.com/graphql/query";
const DOC_ID = "10015901848480474";
const IG_APP_ID = "936619743392459";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export function browserHeaders(shortcode) {
  return {
    "User-Agent": USER_AGENT,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8",
    "Referer": shortcode
      ? `https://www.instagram.com/reel/${shortcode}/`
      : "https://www.instagram.com/",
    "x-ig-app-id": IG_APP_ID,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
  };
}

/**
 * Consulta o GraphQL público e retorna a `video_url` do nó
 * `data.xdt_shortcode_media`. Lança erro descritivo em caso de falha.
 */
export async function resolveVideoUrl(shortcode) {
  const params = new URLSearchParams({
    doc_id: DOC_ID,
    variables: JSON.stringify({ shortcode }),
  });

  const res = await fetch(`${GRAPHQL_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    headers: browserHeaders(shortcode),
  });

  if (!res.ok) {
    throw new Error(`GraphQL retornou HTTP ${res.status} para ${shortcode}`);
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new Error(`Resposta não-JSON do GraphQL para ${shortcode}`);
  }

  const media = payload?.data?.xdt_shortcode_media;
  if (!media) {
    throw new Error(`xdt_shortcode_media ausente na resposta de ${shortcode}`);
  }

  const videoUrl = media.video_url;
  if (!videoUrl) {
    throw new Error(`video_url ausente para ${shortcode} (pode não ser vídeo)`);
  }

  return videoUrl;
}
