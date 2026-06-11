'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

type SelectionApi = {
    ids: string[]
    count: number
    has: (id: string) => boolean
    toggle: (id: string) => void
    add: (ids: string[]) => void
    remove: (ids: string[]) => void
    clear: () => void
}

const SelectionContext = createContext<SelectionApi | null>(null)

export function SelectionProvider({ scope, children }: { scope: string; children: ReactNode }) {
    const storageKey = `duarte-selection-${scope}`
    const [ids, setIds] = useState<string[]>([])
    const hydrated = useRef(false)

    // Restore from sessionStorage after mount. This must run in an effect (not a
    // useState initializer) so server and client render the same initial markup.
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(storageKey)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from external storage
                    setIds(parsed.filter((v) => typeof v === 'string'))
                }
            }
        } catch {
            // ignore corrupt storage
        }
        hydrated.current = true
    }, [storageKey])

    useEffect(() => {
        if (!hydrated.current) return
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(ids))
        } catch {
            // storage unavailable; selection stays in memory
        }
    }, [ids, storageKey])

    const idSet = useMemo(() => new Set(ids), [ids])

    const has = useCallback((id: string) => idSet.has(id), [idSet])

    const toggle = useCallback((id: string) => {
        setIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
    }, [])

    const add = useCallback((newIds: string[]) => {
        setIds((prev) => {
            const seen = new Set(prev)
            const merged = [...prev]
            for (const id of newIds) {
                if (!seen.has(id)) {
                    seen.add(id)
                    merged.push(id)
                }
            }
            return merged
        })
    }, [])

    const remove = useCallback((removeIds: string[]) => {
        const toRemove = new Set(removeIds)
        setIds((prev) => prev.filter((id) => !toRemove.has(id)))
    }, [])

    const clear = useCallback(() => setIds([]), [])

    const api = useMemo<SelectionApi>(
        () => ({ ids, count: ids.length, has, toggle, add, remove, clear }),
        [ids, has, toggle, add, remove, clear]
    )

    return <SelectionContext.Provider value={api}>{children}</SelectionContext.Provider>
}

export function useSelection(): SelectionApi {
    const ctx = useContext(SelectionContext)
    if (!ctx) throw new Error('useSelection must be used within a SelectionProvider')
    return ctx
}
