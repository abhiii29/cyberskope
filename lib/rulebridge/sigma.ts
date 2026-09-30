// Browser port of the core of RuleBridge: parse a Sigma rule into a small
// condition tree that every target renders from. Nothing leaves the browser.

import { parseAllDocuments } from "yaml"

export type Severity = "error" | "warning" | "info"
export type Diagnostic = { severity: Severity; code: string; message: string; hint?: string }

// A Sigma string value, split into literal text and wildcards.
export type Part = { lit: string } | { wild: "*" | "?" }
export type Str = { kind: "str"; parts: Part[] }
export type Value =
  | Str
  | { kind: "re"; pattern: string }
  | { kind: "cidr"; cidr: string }
  | { kind: "num"; op: "gt" | "gte" | "lt" | "lte" | "eq"; n: number }
  | { kind: "null" }

// field === null means a keyword (fieldless) search.
export type Leaf = { type: "leaf"; field: string | null; values: Value[]; all: boolean }
export type Node = Leaf | { type: "and" | "or"; args: Node[] } | { type: "not"; arg: Node }

export type Rule = {
  title: string
  level: string
  logsource: { product?: string; category?: string; service?: string }
  tags: string[]
  tree: Node
  fields: string[]
  selections: Record<string, Node>
}

export type ParseResult = { rule: Rule | null; diagnostics: Diagnostic[] }

const SUPPORTED_MODS = new Set(["contains", "startswith", "endswith", "all", "re", "cidr", "gt", "gte", "lt", "lte", "i", "m", "s"])

export function parseStr(raw: string): Str {
  const parts: Part[] = []
  let buf = ""
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    // Sigma: a backslash only escapes *, ? and itself; otherwise it is literal.
    if (c === "\\" && i + 1 < raw.length && "*?\\".includes(raw[i + 1])) {
      buf += raw[++i]
    } else if (c === "*" || c === "?") {
      if (buf) parts.push({ lit: buf })
      buf = ""
      parts.push({ wild: c })
    } else buf += c
  }
  if (buf) parts.push({ lit: buf })
  return { kind: "str", parts }
}

function toValue(v: unknown, mods: string[], diags: Diagnostic[], field: string): Value {
  if (v === null || v === undefined) return { kind: "null" }
  const num = mods.find((m) => ["gt", "gte", "lt", "lte"].includes(m)) as "gt" | "gte" | "lt" | "lte" | undefined
  if (num) return { kind: "num", op: num, n: Number(v) }
  if (mods.includes("re")) return { kind: "re", pattern: String(v) }
  if (mods.includes("cidr")) return { kind: "cidr", cidr: String(v) }
  if (typeof v === "number") return { kind: "num", op: "eq", n: v }
  if (typeof v === "boolean") return parseStr(String(v))
  if (typeof v !== "string") {
    diags.push({ severity: "error", code: "parse.value", message: `${field}: unsupported value type` })
    return parseStr(String(v))
  }
  const s = parseStr(v)
  if (mods.includes("contains")) s.parts = [{ wild: "*" }, ...s.parts, { wild: "*" }]
  else if (mods.includes("startswith")) s.parts = [...s.parts, { wild: "*" }]
  else if (mods.includes("endswith")) s.parts = [{ wild: "*" }, ...s.parts]
  return s
}

function parseMap(map: Record<string, unknown>, diags: Diagnostic[], fields: Set<string>): Node {
  const leaves: Node[] = []
  for (const [key, raw] of Object.entries(map)) {
    const [field, ...mods] = key.split("|")
    const bad = mods.filter((m) => !SUPPORTED_MODS.has(m))
    if (bad.length)
      diags.push({
        severity: "error",
        code: "unsupported.modifier",
        message: `${field}: modifier '${bad.join("|")}' is not supported by this in-browser port`,
        hint: "Remove the modifier or convert with the full RuleBridge.",
      })
    fields.add(field)
    const list = Array.isArray(raw) ? raw : [raw]
    leaves.push({ type: "leaf", field, values: list.map((v) => toValue(v, mods, diags, field)), all: mods.includes("all") })
  }
  return leaves.length === 1 ? leaves[0] : { type: "and", args: leaves }
}

function parseSelection(sel: unknown, diags: Diagnostic[], fields: Set<string>): Node {
  if (Array.isArray(sel)) {
    // A list of maps is OR; a list of scalars is a keyword search.
    if (sel.every((s) => typeof s !== "object" || s === null))
      return { type: "leaf", field: null, values: sel.map((s) => parseStr(String(s))), all: false }
    return { type: "or", args: sel.map((s) => parseMap(s as Record<string, unknown>, diags, fields)) }
  }
  if (sel && typeof sel === "object") return parseMap(sel as Record<string, unknown>, diags, fields)
  throw new Error("selection must be a map or a list")
}

// Condition grammar: or > and > not > ( ) | "1 of x*" | "all of them" | name
function parseCondition(cond: string, sels: Record<string, Node>): Node {
  const toks = cond.match(/\(|\)|[^\s()]+/g) ?? []
  let i = 0
  const peek = () => toks[i]?.toLowerCase()
  const pick = (pat: string) => {
    const names = Object.keys(sels).filter((n) =>
      pat === "them" ? true : new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(n),
    )
    if (!names.length) throw new Error(`condition: no selection matches '${pat}'`)
    return names.map((n) => sels[n])
  }
  const primary = (): Node => {
    const t = toks[i++]
    if (!t) throw new Error("condition ended unexpectedly")
    if (t === "(") {
      const n = or()
      if (toks[i++] !== ")") throw new Error("condition: missing ')'")
      return n
    }
    if (/^(1|all)$/i.test(t) && peek() === "of") {
      i++
      const nodes = pick(toks[i++])
      return nodes.length === 1 ? nodes[0] : { type: t === "1" ? "or" : "and", args: nodes }
    }
    if (!(t in sels)) throw new Error(`condition: unknown selection '${t}'`)
    return sels[t]
  }
  const not = (): Node => (peek() === "not" ? (i++, { type: "not", arg: not() }) : primary())
  const and = (): Node => {
    const args = [not()]
    while (peek() === "and") i++, args.push(not())
    return args.length === 1 ? args[0] : { type: "and", args }
  }
  const or = (): Node => {
    const args = [and()]
    while (peek() === "or") i++, args.push(and())
    return args.length === 1 ? args[0] : { type: "or", args }
  }
  const n = or()
  if (i < toks.length) throw new Error(`condition: unexpected '${toks[i]}'`)
  return n
}

export function parseSigma(text: string): ParseResult {
  const diags: Diagnostic[] = []
  let docs: Record<string, any>[]
  try {
    docs = parseAllDocuments(text).map((d) => {
      if (d.errors.length) throw new Error(d.errors[0].message)
      return d.toJS()
    }).filter(Boolean)
  } catch (e) {
    return { rule: null, diagnostics: [{ severity: "error", code: "parse.yaml", message: (e as Error).message }] }
  }
  if (docs.some((d) => d.correlation))
    diags.push({
      severity: "warning",
      code: "unsupported.correlation",
      message: "Correlation rules are skipped here; only the base detection rule is converted.",
      hint: "Most converters drop correlations silently. RuleBridge proper reports which targets can express them.",
    })
  const doc = docs.find((d) => d.detection)
  if (!doc) return { rule: null, diagnostics: [...diags, { severity: "error", code: "parse.detection", message: "No rule with a 'detection' block found." }] }
  if (docs.filter((d) => d.detection).length > 1)
    diags.push({ severity: "info", code: "parse.multi", message: "Several rules found; converting the first one." })

  const { condition, ...rest } = doc.detection ?? {}
  if (!condition) return { rule: null, diagnostics: [...diags, { severity: "error", code: "parse.condition", message: "detection.condition is missing." }] }
  const fields = new Set<string>()
  try {
    const sels: Record<string, Node> = {}
    for (const [name, sel] of Object.entries(rest)) sels[name] = parseSelection(sel, diags, fields)
    const tree = parseCondition(Array.isArray(condition) ? condition[0] : String(condition), sels)
    return {
      rule: {
        title: String(doc.title ?? "Untitled rule"),
        level: String(doc.level ?? "medium"),
        logsource: doc.logsource ?? {},
        tags: (doc.tags ?? []).map(String),
        tree,
        fields: [...fields],
        selections: sels,
      },
      diagnostics: diags,
    }
  } catch (e) {
    return { rule: null, diagnostics: [...diags, { severity: "error", code: "parse.detection", message: (e as Error).message }] }
  }
}

// ---- helpers shared by targets ----

export const hasWild = (s: Str) => s.parts.some((p) => "wild" in p)
export const litText = (s: Str) => s.parts.map((p) => ("lit" in p ? p.lit : p.wild)).join("")

/** Classify a plain string match so targets can use their native operators. */
export function shape(s: Str): { op: "eq" | "contains" | "startswith" | "endswith" | "wild"; text: string } {
  const p = s.parts
  const inner = (a: Part[]) => (a.every((x) => "lit" in x) ? a.map((x) => (x as { lit: string }).lit).join("") : null)
  const star = (x?: Part) => !!x && "wild" in x && x.wild === "*"
  if (!hasWild(s)) return { op: "eq", text: litText(s) }
  if (p.length >= 2 && star(p[0]) && star(p[p.length - 1]) && inner(p.slice(1, -1)) !== null)
    return { op: "contains", text: inner(p.slice(1, -1))! }
  if (star(p[p.length - 1]) && inner(p.slice(0, -1)) !== null) return { op: "startswith", text: inner(p.slice(0, -1))! }
  if (star(p[0]) && inner(p.slice(1)) !== null) return { op: "endswith", text: inner(p.slice(1))! }
  return { op: "wild", text: litText(s) }
}

export const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")

/** Sigma wildcard string -> anchored regex body. */
export function strToRegex(s: Str): string {
  const body = s.parts.map((p) => ("lit" in p ? reEscape(p.lit) : p.wild === "*" ? ".*" : ".")).join("")
  return "^" + body + "$"
}

/** Exact IPv4 CIDR -> regex (octet-aligned expansion). */
export function cidrToRegex(cidr: string): string | null {
  const m = cidr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/)
  if (!m) return null
  const oct = m.slice(1, 5).map(Number)
  const bits = Number(m[5])
  const out: string[] = []
  for (let k = 0; k < 4; k++) {
    const b = Math.max(0, Math.min(8, bits - k * 8))
    if (b === 8) out.push(String(oct[k]))
    else if (b === 0) out.push("\\d{1,3}")
    else {
      const size = 1 << (8 - b)
      const start = oct[k] & ~(size - 1) & 255
      out.push("(?:" + Array.from({ length: size }, (_, j) => start + j).join("|") + ")")
    }
  }
  return "^" + out.join("\\.") + "$"
}

export function walkLeaves(n: Node, fn: (l: Leaf, negated: boolean) => void, neg = false) {
  if (n.type === "leaf") fn(n, neg)
  else if (n.type === "not") walkLeaves(n.arg, fn, !neg)
  else n.args.forEach((a) => walkLeaves(a, fn, neg))
}

export type Technique = { id: string; url: string }
export function attackOf(tags: string[]): { techniques: Technique[]; tactics: string[] } {
  const techniques: Technique[] = []
  const tactics: string[] = []
  for (const t of tags) {
    const m = t.match(/^attack\.t(\d{4})(?:\.(\d{3}))?$/i)
    if (m) techniques.push({ id: `T${m[1]}${m[2] ? "." + m[2] : ""}`, url: `https://attack.mitre.org/techniques/T${m[1]}/${m[2] ? m[2] + "/" : ""}` })
    else if (/^attack\.[a-z_]+$/i.test(t)) tactics.push(t.slice(7).replace(/_/g, " "))
  }
  return { techniques, tactics }
}
