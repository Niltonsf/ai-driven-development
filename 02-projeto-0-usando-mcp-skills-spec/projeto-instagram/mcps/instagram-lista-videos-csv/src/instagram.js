// Cliente para a API pública (web) do Instagram, sem autenticação.
//
// Estratégia (sem login/cookies de sessão/tokens de usuário):
//  1. GET /api/v1/users/web_profile_info/?username=<conta>
//     -> resolve o id numérico, total de mídias e se a conta é privada.
//  2. Paginação PRIMÁRIA pelo mesmo caminho que o site usa ao rolar o perfil:
//     POST /graphql/query com a query "PolarisProfilePostsTabContentQuery".
//     Para isso, lê do HTML público do perfil os tokens efêmeros `csrftoken`
//     (cookie) e `lsd`. Pagina pelo cursor `end_cursor` da connection
//     `xdt_api__v1__feed__user_timeline_graphql_connection`.
//  3. AUTO-CURA: o Instagram rotaciona o `doc_id` da query. Se o doc_id fixo
//     falhar, os bundles JS do perfil são raspados para descobrir o doc_id
//     atual e a chamada é refeita.
//  4. FALLBACK: se o caminho GraphQL falhar logo na 1ª página, tenta o
//     endpoint legado /api/v1/feed/user/<id>/ (hoje costuma exigir login).
//
// Erros de página são ignorados: a função retorna tudo que conseguiu coletar.

const WEB_APP_ID = "936619743392459";
const PAGE_SIZE = 12;

// doc_id padrão da query de posts do perfil (web). É sobrescrito em runtime
// pelo valor raspado dos bundles caso este falhe (o Instagram rotaciona).
// Pode ser fixado via env IG_POSTS_DOC_ID.
const DEFAULT_POSTS_DOC_ID =
  process.env.IG_POSTS_DOC_ID || "27964987773089789";

const POSTS_FRIENDLY_NAME =
  "PolarisProfilePostsTabContentQuery_connection_" +
  "xdt_api__v1__feed__user_timeline_graphql_connection";

// Flags de "provided variables" exigidas pela query (lidas do bundle). Mantê-las
// presentes (mesmo como false) evita o "execution error" da API.
const PROVIDER_FLAGS = [
  "__relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider",
  "__relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider",
  "__relay_internal__pv__PolarisWebSchoolsEnabledrelayprovider",
  "__relay_internal__pv__PolarisRepostsConsumptionEnabledrelayprovider",
  "__relay_internal__pv__PolarisImmersiveFeedChainingEnabledrelayprovider",
  "__relay_internal__pv__PolarisAIGMAccountLabelEnabledrelayprovider",
];

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "x-ig-app-id": WEB_APP_ID,
  "X-Requested-With": "XMLHttpRequest",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { referer, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(referer ? { Referer: referer } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Resposta não é JSON (possível bloqueio/login wall).");
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

// media_type: 1 = imagem, 2 = vídeo, 8 = carrossel.
function isVideoItem(item) {
  return (
    item?.media_type === 2 ||
    item?.product_type === "clips" ||
    item?.product_type === "igtv"
  );
}

// Normaliza um "item" do feed v1 (ou nó da connection web, mesmo formato) para
// um registro de vídeo.
function itemToVideo(item, username) {
  const shortcode = item.code || "";
  const timestamp = item.taken_at || 0;
  const caption = item.caption?.text ?? "";

  const views =
    item.play_count ?? item.ig_play_count ?? item.view_count ?? null;
  const likes = item.like_count ?? null;
  const comments = item.comment_count ?? null;

  const isReel = item.product_type === "clips" || item.product_type === "igtv";
  const path = isReel ? "reel" : "p";

  const thumbnail =
    item.image_versions2?.candidates?.[0]?.url || item.display_uri || "";

  return {
    shortcode,
    url: shortcode ? `https://www.instagram.com/${path}/${shortcode}/` : "",
    username,
    type: item.product_type || "video",
    timestamp,
    taken_at: timestamp ? new Date(timestamp * 1000).toISOString() : "",
    views,
    likes,
    comments,
    duration: item.video_duration ?? null,
    caption,
    thumbnail,
  };
}

// Resolve o id numérico do usuário a partir do username.
async function fetchProfile(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
    username
  )}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  const user = json?.data?.user;
  if (!user || !user.id) {
    throw new Error("Perfil não encontrado ou bloqueado pela API pública.");
  }
  return {
    id: user.id,
    totalMedia: user.edge_owner_to_timeline_media?.count ?? null,
    isPrivate: user.is_private === true,
  };
}

// Lê o HTML público do perfil e extrai os tokens efêmeros (csrftoken + lsd)
// que a query GraphQL web exige. Guarda o HTML para uma eventual raspagem do
// doc_id atual a partir dos bundles JS.
async function bootstrapWebSession(username) {
  const res = await fetch(`https://www.instagram.com/${username}/`, {
    headers: { ...DEFAULT_HEADERS, Accept: "text/html,application/xhtml+xml" },
  });
  const html = await res.text();
  const setCookie = res.headers.get("set-cookie") || "";
  const csrf =
    setCookie.match(/csrftoken=([^;]+)/)?.[1] ||
    html.match(/"csrf_token":"([^"]+)"/)?.[1] ||
    null;
  const lsd =
    html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] ||
    html.match(/"lsd":"([^"]+)"/)?.[1] ||
    null;
  return { csrf, lsd, html };
}

// Raspa os bundles JS referenciados no HTML do perfil em busca do doc_id atual
// da query de posts (auto-cura quando o Instagram rotaciona o id).
async function scrapePostsDocId(html) {
  const bundles = [
    ...new Set([...html.matchAll(/(https:\/\/[^"]+?\.js)"/g)].map((m) => m[1])),
  ];
  // Prioriza bundles cujo nome sugira o módulo de posts do perfil.
  bundles.sort(
    (a, b) => (/Profile|Posts|Consumer/i.test(b) ? 1 : 0) -
      (/Profile|Posts|Consumer/i.test(a) ? 1 : 0)
  );
  for (const url of bundles.slice(0, 12)) {
    try {
      const txt = await (
        await fetch(url, { headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] } })
      ).text();
      if (!txt.includes("ProfilePostsTabContentQuery")) continue;
      const m = txt.match(
        /PolarisProfilePostsTabContentQuery_connection[\s\S]{0,4000}?"(\d{15,})"/
      );
      if (m) return m[1];
    } catch {
      // ignora bundle inacessível e tenta o próximo
    }
  }
  return null;
}

// Monta o corpo do POST GraphQL para uma página de posts do perfil.
function buildPostsBody({ username, after, docId, lsd }) {
  const variables = {
    after: after || null,
    before: null,
    data: { count: PAGE_SIZE },
    first: PAGE_SIZE,
    last: null,
    username,
  };
  for (const f of PROVIDER_FLAGS) variables[f] = false;

  const body = new URLSearchParams();
  body.set("av", "0");
  body.set("__comet_req", "7");
  body.set("lsd", lsd || "");
  body.set("doc_id", docId);
  body.set("fb_api_caller_class", "RelayModern");
  body.set("fb_api_req_friendly_name", POSTS_FRIENDLY_NAME);
  body.set("variables", JSON.stringify(variables));
  body.set("server_timestamps", "true");
  return body.toString();
}

// Busca uma página de posts via GraphQL web. Retorna a connection bruta.
async function fetchPostsPage({ username, after, docId, session }) {
  const res = await fetch("https://www.instagram.com/graphql/query", {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      "x-csrftoken": session.csrf || "",
      "x-fb-lsd": session.lsd || "",
      "x-fb-friendly-name": POSTS_FRIENDLY_NAME,
      Referer: `https://www.instagram.com/${username}/`,
      Cookie: session.csrf ? `csrftoken=${session.csrf}` : "",
    },
    body: buildPostsBody({ username, after, docId, lsd: session.lsd }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = JSON.parse(await res.text());
  const conn = json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
  if (!conn) {
    const msg = JSON.stringify(json?.errors || json?.error || "sem connection");
    throw new Error(`GraphQL sem dados: ${msg.slice(0, 120)}`);
  }
  return conn;
}

// Coleta via GraphQL web (caminho primário). Lança erro se nem a 1ª página vier.
async function collectViaGraphql({ username, maxPages, onLog }) {
  const session = await bootstrapWebSession(username);
  if (!session.csrf || !session.lsd) {
    throw new Error("Não foi possível obter tokens (csrf/lsd) do HTML.");
  }

  let docId = DEFAULT_POSTS_DOC_ID;
  let after = null;
  let more = true;
  let pagesFetched = 0;
  const videos = [];
  const seen = new Set();

  while (more && pagesFetched < maxPages) {
    if (pagesFetched > 0) await sleep(1200); // educado com o rate-limit
    let conn;
    try {
      conn = await fetchPostsPage({ username, after, docId, session });
    } catch (err) {
      // Auto-cura na 1ª página: doc_id pode ter rotacionado.
      if (pagesFetched === 0) {
        const fresh = await scrapePostsDocId(session.html);
        if (fresh && fresh !== docId) {
          onLog(`doc_id ${docId} falhou; usando doc_id raspado ${fresh}.`);
          docId = fresh;
          conn = await fetchPostsPage({ username, after, docId, session });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    pagesFetched++;
    let pageVideos = 0;
    for (const edge of conn.edges || []) {
      const node = edge.node;
      if (!isVideoItem(node)) continue;
      const v = itemToVideo(node, username);
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
        pageVideos++;
      }
    }
    onLog(
      `[graphql] Página ${pagesFetched}: ${(conn.edges || []).length} mídias, ` +
        `+${pageVideos} vídeos (total vídeos: ${videos.length}).`
    );
    more = conn.page_info?.has_next_page === true && !!conn.page_info?.end_cursor;
    after = conn.page_info?.end_cursor || null;
  }

  return { videos, pagesFetched };
}

// Busca uma página do feed v1 (caminho de fallback legado).
async function fetchFeedPage(userId, maxId, username) {
  let url = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=33`;
  if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  return {
    items: json?.items || [],
    moreAvailable: json?.more_available === true,
    nextMaxId: json?.next_max_id || null,
  };
}

// Coleta via feed v1 (fallback). Reaproveita o que conseguir.
async function collectViaFeedV1({ userId, username, maxPages, onLog, seen, videos }) {
  let maxId = null;
  let more = true;
  let pagesFetched = 0;
  while (more && pagesFetched < maxPages) {
    if (pagesFetched > 0) await sleep(1200);
    const page = await fetchFeedPage(userId, maxId, username);
    pagesFetched++;
    let pageVideos = 0;
    for (const item of page.items) {
      if (!isVideoItem(item)) continue;
      const v = itemToVideo(item, username);
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
        pageVideos++;
      }
    }
    onLog(
      `[feed-v1] Página ${pagesFetched}: ${page.items.length} mídias, ` +
        `+${pageVideos} vídeos (total vídeos: ${videos.length}).`
    );
    more = page.moreAvailable && !!page.nextMaxId;
    maxId = page.nextMaxId;
  }
  return pagesFetched;
}

// --- Estratégia B (fallback): HTML do perfil + JSON embutido (SSR) -----------
// O Instagram server-renderiza no HTML do perfil um ou mais blocos
// <script type="application/json"> contendo o objeto do usuário
// (id/privacidade/contagem) e, com frequência, a PRIMEIRA página do timeline
// (connection xdt_api__v1__feed__user_timeline_graphql_connection) já com
// like_count/play_count reais. Esse caminho NÃO toca em
// /api/v1/users/web_profile_info (endpoint que costuma tomar 429): usa apenas o
// GET do HTML, bem mais tolerante, e ainda reaproveita a sessão para paginar via
// GraphQL a partir do cursor embutido (best-effort, tolerando 429 por página).

// Extrai e faz JSON.parse de cada bloco <script type="application/json"> do HTML.
function extractEmbeddedJson(html) {
  const blocks = [];
  const re = /<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      // bloco não-JSON: ignora
    }
  }
  return blocks;
}

// Busca em profundidade o primeiro valor associado a `keyName`.
function deepFindByKey(root, keyName) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (
      !Array.isArray(cur) &&
      Object.prototype.hasOwnProperty.call(cur, keyName)
    ) {
      return cur[keyName];
    }
    for (const v of Array.isArray(cur) ? cur : Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return undefined;
}

// Busca em profundidade o primeiro objeto que satisfaz `pred`.
function deepFindObject(root, pred) {
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (!Array.isArray(cur) && pred(cur)) return cur;
    for (const v of Array.isArray(cur) ? cur : Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return undefined;
}

// Regex de último recurso para o id numérico do usuário no HTML.
function scrapeUserIdFromHtml(html) {
  return (
    html.match(/"profilePage_(\d+)"/)?.[1] ||
    html.match(/"user_id":"(\d+)"/)?.[1] ||
    html.match(/"profile_id":"(\d+)"/)?.[1] ||
    html.match(/instagram:\/\/user\?username=[^&]*&userid=(\d+)/)?.[1] ||
    null
  );
}

// Extrai do HTML o objeto do usuário e a connection do timeline (se presentes).
function parseProfileFromHtml(html, username) {
  const target = username.toLowerCase();
  let user = null;
  let connection = null;
  for (const block of extractEmbeddedJson(html)) {
    if (!user) {
      user =
        deepFindObject(
          block,
          (o) =>
            typeof o.id === "string" &&
            /^\d+$/.test(o.id) &&
            typeof o.username === "string" &&
            o.username.toLowerCase() === target
        ) || null;
    }
    if (!connection) {
      const c = deepFindByKey(
        block,
        "xdt_api__v1__feed__user_timeline_graphql_connection"
      );
      if (c && Array.isArray(c.edges)) connection = c;
    }
    if (user && connection) break;
  }
  return { user, connection };
}

// Coleta via HTML do perfil (fallback). Pega a 1ª página do SSR e continua a
// paginação via GraphQL reaproveitando a sessão, tolerando erro por página.
async function collectViaProfileHtml({ username, maxPages, onLog }) {
  const session = await bootstrapWebSession(username);
  const { user, connection } = parseProfileFromHtml(session.html, username);

  const userId = user?.id || scrapeUserIdFromHtml(session.html) || null;
  const isPrivate = user?.is_private === true;
  const totalMedia =
    user?.edge_owner_to_timeline_media?.count ?? user?.media_count ?? null;

  const videos = [];
  const seen = new Set();
  let pagesFetched = 0;
  let after = null;
  let more = false;

  if (connection && Array.isArray(connection.edges)) {
    for (const edge of connection.edges) {
      const node = edge.node;
      if (node && isVideoItem(node)) {
        const v = itemToVideo(node, username);
        if (v.shortcode && !seen.has(v.shortcode)) {
          seen.add(v.shortcode);
          videos.push(v);
        }
      }
    }
    pagesFetched = 1;
    onLog(
      `[html] JSON embutido (SSR): ${(connection.edges || []).length} mídias, ` +
        `+${videos.length} vídeos.`
    );
    after = connection.page_info?.end_cursor || null;
    more = connection.page_info?.has_next_page === true && !!after;
  } else {
    onLog(`[html] Sem timeline embutida no HTML; id=${userId ?? "?"}.`);
  }

  // Continua paginando via GraphQL, se houver sessão e cursor (best-effort).
  if (more && session.csrf && session.lsd) {
    let docId = DEFAULT_POSTS_DOC_ID;
    while (more && pagesFetched < maxPages) {
      await sleep(1200);
      let conn;
      try {
        conn = await fetchPostsPage({ username, after, docId, session });
      } catch (err) {
        // auto-cura do doc_id uma vez; se ainda falhar, para e mantém o que tem
        const fresh = await scrapePostsDocId(session.html).catch(() => null);
        if (fresh && fresh !== docId) {
          docId = fresh;
          try {
            conn = await fetchPostsPage({ username, after, docId, session });
          } catch (err2) {
            onLog(`[html] paginação GraphQL parou: ${err2.message}`);
            break;
          }
        } else {
          onLog(`[html] paginação GraphQL parou: ${err.message}`);
          break;
        }
      }
      pagesFetched++;
      let pageVideos = 0;
      for (const edge of conn.edges || []) {
        const node = edge.node;
        if (!isVideoItem(node)) continue;
        const v = itemToVideo(node, username);
        if (v.shortcode && !seen.has(v.shortcode)) {
          seen.add(v.shortcode);
          videos.push(v);
          pageVideos++;
        }
      }
      onLog(
        `[html→graphql] Página ${pagesFetched}: +${pageVideos} vídeos ` +
          `(total: ${videos.length}).`
      );
      more =
        conn.page_info?.has_next_page === true && !!conn.page_info?.end_cursor;
      after = conn.page_info?.end_cursor || null;
    }
  }

  return { userId, isPrivate, totalMedia, videos, pagesFetched };
}

/**
 * Coleta os vídeos de uma conta pública do Instagram.
 *
 * @param {string} username
 * @param {object} [opts]
 * @param {number} [opts.maxPages=Infinity] limite de páginas a percorrer
 * @param {(msg:string)=>void} [opts.onLog] callback de log
 * @returns {Promise<{username:string, userId:string, totalMedia:number|null,
 *   isPrivate:boolean, videos:object[], pagesFetched:number, errors:string[]}>}
 */
export async function fetchAccountVideos(username, opts = {}) {
  const { maxPages = Infinity, onLog = () => {} } = opts;
  const errors = [];
  let videos = [];
  const seen = new Set();

  const absorb = (list) => {
    for (const v of list) {
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
      }
    }
  };

  // Resolve o perfil (id/privacidade). NÃO é fatal: se este endpoint tomar 429,
  // seguimos pelos caminhos que não dependem dele (GraphQL e HTML).
  let profile = null;
  try {
    profile = await fetchProfile(username);
    onLog(
      `Perfil @${username} (id=${profile.id}) — total de mídias: ${
        profile.totalMedia ?? "?"
      }${profile.isPrivate ? " [PRIVADO]" : ""}.`
    );
  } catch (err) {
    errors.push(`web_profile_info: ${err.message}`);
    onLog(`web_profile_info falhou (${err.message}). Seguindo sem ele.`);
  }
  if (profile?.isPrivate) {
    errors.push("Conta privada: a API pública não expõe as mídias.");
  }

  let pagesFetched = 0;

  // Caminho primário: GraphQL web (o mesmo que o site usa ao rolar o perfil).
  try {
    const r = await collectViaGraphql({ username, maxPages, onLog });
    absorb(r.videos);
    pagesFetched += r.pagesFetched;
  } catch (err) {
    errors.push(`GraphQL web: ${err.message}`);
    onLog(`Caminho GraphQL falhou (${err.message}). Tentando fallback HTML...`);
  }

  // Fallback A (2ª estratégia): HTML do perfil + JSON embutido. Endpoint mais
  // tolerante a 429 e independente de web_profile_info.
  if (videos.length === 0) {
    try {
      const r = await collectViaProfileHtml({ username, maxPages, onLog });
      absorb(r.videos);
      pagesFetched += r.pagesFetched;
      if (!profile && r.userId) {
        profile = {
          id: r.userId,
          totalMedia: r.totalMedia,
          isPrivate: r.isPrivate,
        };
      }
    } catch (err) {
      errors.push(`HTML perfil: ${err.message}`);
      onLog(`Fallback HTML falhou (${err.message}).`);
    }
  }

  // Fallback B (legado): feed v1 — depende do id resolvido em algum caminho.
  if (videos.length === 0 && profile?.id) {
    try {
      const fb = await collectViaFeedV1({
        userId: profile.id,
        username,
        maxPages,
        onLog,
        seen,
        videos,
      });
      pagesFetched += fb;
    } catch (err) {
      errors.push(`Feed v1: ${err.message}`);
      onLog(`Fallback v1 também falhou (${err.message}).`);
    }
  }

  // Ordena do mais novo para o mais antigo.
  videos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return {
    username,
    userId: profile?.id ?? null,
    totalMedia: profile?.totalMedia ?? null,
    isPrivate: profile?.isPrivate ?? false,
    videos,
    pagesFetched,
    errors,
  };
}
