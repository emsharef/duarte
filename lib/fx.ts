// Historical FX rates via the Frankfurter API (ECB reference rates, no key).
// Server-side only. Returns null on any failure — callers leave the rate
// blank for the user to fill manually.

const cache = new Map<string, number | null>()

export async function getHistoricalRate(
    from: string,
    to: string,
    date: string // YYYY-MM-DD
): Promise<number | null> {
    if (!from || !to || !date) return null
    if (from === to) return 1

    const key = `${from}:${to}:${date}`
    const cached = cache.get(key)
    if (cached !== undefined) return cached

    try {
        const res = await fetch(
            `https://api.frankfurter.dev/v1/${date}?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`,
            { next: { revalidate: 86400 } }
        )
        if (!res.ok) {
            cache.set(key, null)
            return null
        }
        const data = (await res.json()) as { rates?: Record<string, number> }
        const rate = data.rates?.[to] ?? null
        cache.set(key, rate)
        return rate
    } catch {
        cache.set(key, null)
        return null
    }
}
