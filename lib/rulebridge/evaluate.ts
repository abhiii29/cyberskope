// Evaluate a parsed Sigma rule against a sample event, using Sigma's own
// semantics (not any target's). Mirrors the idea of RuleBridge's evaluate.py.

import { strToRegex, type Leaf, type Node, type Rule, type Value } from "./sigma"

export type LeafResult = { field: string; expected: string; actual: string; matched: boolean }
export type EvalResult = {
  matched: boolean
  selections: { name: string; matched: boolean; leaves: LeafResult[] }[]
  error?: string
}

function lookup(ev: Record<string, unknown>, field: string): unknown {
  if (field in ev) return ev[field]
  // Case-insensitive key, then dotted path.
  const k = Object.keys(ev).find((x) => x.toLowerCase() === field.toLowerCase())
  if (k) return ev[k]
  return field.split(".").reduce<unknown>((o, p) => (o && typeof o === "object" ? (o as Record<string, unknown>)[p] : undefined), ev)
}

function ipInCidr(ip: string, cidr: string): boolean {
  const toInt = (s: string) => s.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0
  const [net, bits] = cidr.split("/")
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) || !bits) return false
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0
  return (toInt(ip) & mask) === (toInt(net) & mask)
}

function matchValue(v: Value, actual: unknown): boolean {
  if (v.kind === "null") return actual === undefined || actual === null || actual === ""
  if (actual === undefined || actual === null) return false
  const a = String(actual)
  switch (v.kind) {
    case "str": return new RegExp(strToRegex(v), "is").test(a)
    case "re": return new RegExp(v.pattern).test(a)
    case "cidr": return ipInCidr(a, v.cidr)
    case "num": {
      const n = Number(a)
      if (Number.isNaN(n)) return false
      return { gt: n > v.n, gte: n >= v.n, lt: n < v.n, lte: n <= v.n, eq: n === v.n }[v.op]
    }
  }
}

const describe = (v: Value) =>
  v.kind === "str" ? v.parts.map((p) => ("lit" in p ? p.lit : p.wild)).join("")
    : v.kind === "re" ? `/${v.pattern}/`
    : v.kind === "cidr" ? v.cidr
    : v.kind === "num" ? `${v.op} ${v.n}`
    : "null"

function flatStrings(o: unknown): string[] {
  if (o === null || o === undefined) return []
  if (typeof o === "object") return Object.values(o as object).flatMap(flatStrings)
  return [String(o)]
}

function evalLeaf(l: Leaf, ev: Record<string, unknown>): LeafResult {
  if (l.field === null) {
    const hay = flatStrings(ev)
    const hit = l.values.some((v) => hay.some((h) => matchValue({ ...(v as any), parts: [{ wild: "*" }, ...(v as any).parts, { wild: "*" }] }, h)))
    return { field: "(keyword)", expected: l.values.map(describe).join(" | "), actual: hit ? "found" : "not found", matched: hit }
  }
  const actual = lookup(ev, l.field)
  const test = (v: Value) => matchValue(v, actual)
  const matched = l.all ? l.values.every(test) : l.values.some(test)
  return {
    field: l.field,
    expected: l.values.map(describe).join(l.all ? " AND " : " | "),
    actual: actual === undefined ? "(missing)" : JSON.stringify(actual),
    matched,
  }
}

function evalNode(n: Node, ev: Record<string, unknown>, out: LeafResult[]): boolean {
  if (n.type === "leaf") {
    const r = evalLeaf(n, ev)
    out.push(r)
    return r.matched
  }
  if (n.type === "not") return !evalNode(n.arg, ev, out)
  // Evaluate every branch so the trace is complete.
  const rs = n.args.map((a) => evalNode(a, ev, out))
  return n.type === "and" ? rs.every(Boolean) : rs.some(Boolean)
}

export function evaluate(rule: Rule, eventJson: string): EvalResult {
  let ev: Record<string, unknown>
  try {
    ev = JSON.parse(eventJson)
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) throw new Error("the event must be a JSON object")
  } catch (e) {
    return { matched: false, selections: [], error: (e as Error).message }
  }
  try {
    const selections = Object.entries(rule.selections).map(([name, node]) => {
      const leaves: LeafResult[] = []
      return { name, matched: evalNode(node, ev, leaves), leaves }
    })
    return { matched: evalNode(rule.tree, ev, []), selections }
  } catch (e) {
    return { matched: false, selections: [], error: (e as Error).message }
  }
}
