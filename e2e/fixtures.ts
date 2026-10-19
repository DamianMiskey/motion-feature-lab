import { test as base, type Page } from "@playwright/test";

// Every page test gets a fake leaderboard API: the games' real one is the API
// lab in production (api.djmiskey.com), and tests must never post to it.
// The fake keeps scores in memory and records each submission (with its
// Idempotency-Key), refused ones included, so tests can check what a game
// sent; failNext makes the next submissions fail with a 503.

type Submission = { game: string; initials: string; value: number; key: string };
export type ScoresMock = { submissions: Submission[]; failNext: number };

const API = /^https:\/\/api\.djmiskey\.com\//;
const cors = (origin: string | undefined) => ({
  "access-control-allow-origin": origin ?? "*",
  "access-control-allow-methods": "GET, POST",
  "access-control-allow-headers": "content-type, idempotency-key, last-event-id",
  "access-control-expose-headers": "idempotent-replayed",
});

async function mockScores(page: Page, mock: ScoresMock) {
  const entries: Record<string, { id: string; initials: string; value: number }[]> = {};
  const byKey = new Map<string, { id: string; rank: number }>();
  await page.route(API, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const headers = cors(await req.headerValue("origin") ?? undefined);
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    const board = (game: string) => ({ game, entries: (entries[game] ?? []).slice(0, 5).map((e, i) => ({ rank: i + 1, ...e, createdAt: "" })) });
    if (url.pathname === "/api/scores/stream") {
      const body = `retry: 60000\nevent: board\nid: 1\ndata: ${JSON.stringify(board(url.searchParams.get("game")!))}\n\n`;
      return route.fulfill({ status: 200, headers: { ...headers, "content-type": "text/event-stream" }, body });
    }
    if (url.pathname === "/api/scores" && req.method() === "POST") {
      const input = req.postDataJSON() as Omit<Submission, "key">;
      const key = (await req.headerValue("idempotency-key")) ?? "";
      mock.submissions.push({ ...input, key });
      if (mock.failNext > 0) {
        mock.failNext--;
        return route.fulfill({ status: 503, headers, contentType: "application/problem+json", body: '{"detail":"try again"}' });
      }
      let created = byKey.get(key);
      if (!created) {
        const list = (entries[input.game] ??= []);
        const id = crypto.randomUUID();
        list.push({ id, initials: input.initials, value: input.value });
        list.sort((a, b) => (input.game === "marble" ? a.value - b.value : b.value - a.value));
        created = { id, rank: list.findIndex((e) => e.id === id) + 1 };
        byKey.set(key, created);
      }
      return route.fulfill({ status: 201, headers, contentType: "application/json", body: JSON.stringify({ ...input, ...created }) });
    }
    return route.fulfill({ status: 404, headers, body: "" });
  });
}

export const test = base.extend<{ scores: ScoresMock }>({
  scores: [async ({ page }, use) => {
    const mock: ScoresMock = { submissions: [], failNext: 0 };
    await mockScores(page, mock);
    await use(mock);
  }, { auto: true }],
});
export { expect } from "@playwright/test";
