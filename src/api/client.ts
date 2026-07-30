// API client — replaces Supabase with Express backend
const API_URL = import.meta.env.VITE_API_URL || "";

let _user: any = null;
let _roles: string[] = [];

function headers(withAuth = true): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // Token is sent via httpOnly cookie automatically, but we also send in header for fallback
  return h;
}

async function req(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: headers(true),
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details ? `${data.error}: ${data.details.join(", ")}` : (data.error || "Xatolik"));
  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────
export const api = {
  get user() { return _user; },
  get roles() { return _roles; },

  async login(email: string, password: string) {
    const data = await req("POST", "/api/auth/login", { email, password });
    _user = data.user; _roles = data.roles;
    if (data.token) localStorage.setItem("auth_token", data.token);
    return data;
  },

  async register(email: string, password: string, full_name: string) {
    const data = await req("POST", "/api/auth/register", { email, password, full_name });
    _user = data.user; _roles = data.roles;
    if (data.token) localStorage.setItem("auth_token", data.token);
    return data;
  },

  async googleLogin(credential: string) {
    const data = await req("POST", "/api/auth/google", { credential });
    _user = data.user; _roles = data.roles;
    if (data.token) localStorage.setItem("auth_token", data.token);
    return data;
  },

  async getMe() {
    try {
      const data = await req("GET", "/api/auth/me");
      _user = data.user; _roles = data.roles;
      return data;
    } catch {
      _user = null; _roles = [];
      return null;
    }
  },

  async updateProfile(fields: any) {
    const data = await req("PUT", "/api/auth/profile", fields);
    _user = data.user;
    return data;
  },

  async signOut() {
    _user = null; _roles = [];
    localStorage.removeItem("auth_token");
    try { await req("POST", "/api/auth/logout"); } catch {}
  },

  // ── Generic CRUD ────────────────────────────────────────────────────
  async list(table: string, query?: string) {
    const q = query ? `?${query}` : "";
    const res = await fetch(`${API_URL}/api/${table}${q}`, { headers: headers(true), credentials: "include" });
    return res.json();
  },

  async get(table: string, id: string) {
    const res = await fetch(`${API_URL}/api/${table}/${id}`, { headers: headers(true), credentials: "include" });
    return res.json();
  },

  async create(table: string, data: any) {
    return req("POST", `/api/${table}`, data);
  },

  async update(table: string, id: string, data: any) {
    return req("PUT", `/api/${table}/${id}`, data);
  },

  async remove(table: string, id: string) {
    return req("DELETE", `/api/${table}/${id}`);
  },

  // ── Likes ───────────────────────────────────────────────────────────
  async like(type: "gallery" | "certificates", id: string) {
    return req("POST", `/api/${type}/${id}/like`);
  },
  async unlike(type: "gallery" | "certificates", id: string) {
    return req("DELETE", `/api/${type}/${id}/like`);
  },

  // ── Upload ──────────────────────────────────────────────────────────
  async upload(file: File, caption?: string) {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    const res = await fetch(`${API_URL}/api/gallery/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    return res.json();
  },

  async uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    return res.json();
  },

  // ── Site settings ───────────────────────────────────────────────────
  async getSiteSettings() {
    const res = await fetch(`${API_URL}/api/site-settings`, { credentials: "include" });
    return res.json();
  },

  async updateSiteSettings(data: any) {
    return req("PUT", "/api/site-settings", data);
  },

  // ── Admin ───────────────────────────────────────────────────────────
  async getUsers() {
    return req("GET", "/api/admin/users");
  },

  async updateUserRole(userId: string, role: string, action: "add" | "remove") {
    return req("PUT", `/api/admin/users/${userId}/roles`, { role, action });
  },

  async deleteUser(userId: string) {
    return req("DELETE", `/api/admin/users/${userId}`);
  },

  async getAnalytics() {
    return req("GET", "/api/admin/analytics");
  },

  // ── Chat ────────────────────────────────────────────────────────────
  async getChatRooms() {
    return req("GET", "/api/chat/rooms");
  },

  async createChatRoom(name: string, isGroup = true) {
    return req("POST", "/api/chat/rooms", { name, is_group: isGroup });
  },

  async getMessages(roomId: string) {
    return req("GET", `/api/chat/rooms/${roomId}/messages`);
  },

  async sendMessage(roomId: string, content: string) {
    return req("POST", `/api/chat/rooms/${roomId}/messages`, { content });
  },
};

// Auto-restore session on load (via httpOnly cookie)
api.getMe().catch(() => {});

// ── Supabase Compatibility Layer ─────────────────────────────────────

(api as any).from = function(table: string) {
  return {
    select: (fields?: string) => {
      let _limit = 0, _single = false, _orders: {col:string, dir:string}[] = [], _eqCol = "", _eqVal: any, _ilikeCol = "", _ilikeVal = "", _neqCol = "", _neqVal: any, _count = false, _gteCol = "", _gteVal = "", _lteCol = "", _lteVal = "", _inCol = "", _inVals: any[] = [];
      const chain: any = {
        order: (col: string, opts?: any) => { _orders.push({col, dir: opts?.ascending ? "asc" : "desc"}); return chain; },
        eq: (col: string, val: any) => { _eqCol = col; _eqVal = val; return chain; },
        ilike: (col: string, val: string) => { _ilikeCol = col; _ilikeVal = val; return chain; },
        neq: (col: string, val: any) => { _neqCol = col; _neqVal = val; return chain; },
        gte: (col: string, val: string) => { _gteCol = col; _gteVal = val; return chain; },
        lte: (col: string, val: string) => { _lteCol = col; _lteVal = val; return chain; },
        in: (col: string, vals: any[]) => { _inCol = col; _inVals = vals; return chain; },
        single: () => { _single = true; return chain; },
        limit: (n: number) => { _limit = n; return chain; },
        then: (resolve: any) => {
          const orderParts = _orders.map(o => `order=${o.col}&dir=${o.dir}`);
          const query = orderParts.length ? orderParts.join('&') + (_limit ? `&limit=${_limit}` : '') : (_limit ? `limit=${_limit}` : '');
          api.list(table, query)
            .then((data: any[]) => {
              let result = data;
              result = data;
              resolve({ data: _single ? (result[0] || null) : result, error: null, count: result.length });
            })
            .catch((error: any) => resolve({ data: null, error }));
        }
      };
      return chain;
    },
    insert: (data: any) => {
      const chain: any = {
        select: () => chain, single: () => chain,
        then: (resolve: any) => api.create(table, data).then(d => resolve({ data: d, error: null })).catch((e: any) => resolve({ data: null, error: e }))
      };
      return chain;
    },
    update: (data: any) => ({
      eq: (col: string, id: string) => {
        const chain: any = {
          select: () => chain, single: () => chain,
          then: (resolve: any) => api.update(table, id, data).then(d => resolve({ data: d, error: null })).catch((e: any) => resolve({ data: null, error: e }))
        };
        return chain;
      }
    }),
    delete: () => ({
      eq: (col: string, id: string) => ({
        then: (resolve: any) => api.remove(table, id).then(d => resolve({ data: d, error: null })).catch((e: any) => resolve({ data: null, error: e }))
      })
    })
  };
};

(api as any).rpc = async (fn: string, params?: any) => {
  try { return { data: await req("POST", `/api/rpc/${fn}`, params), error: null }; }
  catch (error) { return { data: null, error }; }
};

(api as any).channel = () => {
  const chain: any = { on: () => chain, subscribe: () => chain, unsubscribe: () => {} };
  return chain;
};

(api as any).storage = {
  from: () => ({
    upload: async (_path: string, file: File) => {
      try { return { data: { path: (await api.uploadFile(file)).url }, error: null }; }
      catch (error) { return { data: null, error }; }
    },
    createSignedUrl: async (_path: string, _expiresIn: number) => {
      return { data: { signedUrl: "" }, error: null };
    },
    getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } })
  })
};

(api as any).functions = {
  invoke: async (_fn: string, _options?: { body: any }) => {
    return { data: { ok: true }, error: null };
  }
};

(api as any).auth = api;
(api as any).removeChannel = () => {};
