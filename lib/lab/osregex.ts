// Wazuh's OS_Regex / OS_Match dialects translated to JavaScript regex, plus
// portability checks for other dialects. Follows the documented syntax; it is
// an approximation of the C engine, not a port of it.

export type Dialect = "pcre2" | "osregex" | "osmatch" | "splunk" | "kql"

/** OS_Regex → JS. Documented escapes only; everything else is literal. */
export function osRegexToJs(p: string): { source: string; notes: string[] } {
  const notes: string[] = []
  let out = ""
  for (let i = 0; i < p.length; i++) {
    const c = p[i]
    if (c === "\\" && i + 1 < p.length) {
      const n = p[++i]
      const map: Record<string, string> = {
        w: "[A-Za-z0-9@_-]", W: "[^A-Za-z0-9@_-]", d: "[0-9]", D: "[^0-9]", s: "[ ]", S: "[^ ]",
        p: "[()*+,\\-.:;<=>?\\[\\]!\"'#$%&|{}]", t: "\\t", ".": "[\\s\\S]",
        "(": "\\(", ")": "\\)", "\\": "\\\\", "$": "\\$", "|": "\\|", "<": "<",
      }
      if (map[n] !== undefined) out += map[n]
      else (out += n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), notes.push(`\\${n} is not an OS_Regex escape; treated as a literal "${n}"`)
    } else if ("+*".includes(c)) out += c
    else if ("()|^$".includes(c)) out += c
    else if (c === ".") out += "\\." // a bare dot is literal in OS_Regex
    else if ("[]{}?".includes(c)) {
      out += "\\" + c
      if (!notes.some((x) => x.includes("character classes"))) notes.push("OS_Regex has no [...] character classes, {n} counts or ? — they match literally")
    } else out += c
  }
  return { source: out, notes }
}

/** OS_Match → JS: literal substrings, ^ / $ anchors, | alternation, ! negation. */
export function osMatchToJs(p: string): { source: string; negate: boolean; notes: string[] } {
  const negate = p.startsWith("!")
  const body = negate ? p.slice(1) : p
  const alts = body.split("|").map((a) => {
    const start = a.startsWith("^"), end = a.endsWith("$") && a.length > 1
    const core = a.slice(start ? 1 : 0, end ? -1 : undefined).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return `${start ? "^" : ""}${core}${end ? "$" : ""}`
  })
  return { source: alts.join("|"), negate, notes: [] }
}

/** Compile a pattern for a dialect, collecting portability notes. */
export function compile(p: string, d: Dialect, flags = ""): { re?: RegExp; negate?: boolean; notes: string[]; error?: string } {
  try {
    if (d === "osregex") {
      const { source, notes } = osRegexToJs(p)
      return { re: new RegExp(source, flags), notes }
    }
    if (d === "osmatch") {
      const { source, negate, notes } = osMatchToJs(p)
      return { re: new RegExp(source, flags), negate, notes }
    }
    const notes: string[] = []
    if (d === "kql") {
      // KQL uses RE2: linear time, so no lookaround or backreferences.
      if (/\(\?<?[=!]/.test(p)) return { notes, error: "lookaround isn't supported by RE2 (KQL matches_regex / extract)" }
      if (/\\[1-9]|\\k</.test(p)) return { notes, error: "backreferences aren't supported by RE2" }
      if (/\(\?<[A-Za-z]/.test(p)) notes.push("RE2 named groups are written (?P<name>...); KQL extract() uses group numbers")
      if (/[*+?}]\+/.test(p)) return { notes, error: "possessive quantifiers aren't supported by RE2" }
    }
    if (d === "splunk") {
      if (/\(\?<[A-Za-z]/.test(p) === false && /\(/.test(p)) notes.push("rex only creates fields from named groups: (?<field>...)")
      if (p.includes('"')) notes.push('escape double quotes inside rex "..." as \\"')
    }
    if (d === "pcre2" || d === "splunk") {
      if (/\(\?[imsx]+\)/.test(p)) {
        const m = p.match(/^\(\?([imsx]+)\)/)
        if (m) (flags += m[1].replace(/x/g, "")), (p = p.slice(m[0].length))
        if (/x/.test(m?.[1] ?? "")) notes.push("extended mode (x) isn't emulated here")
      }
      if (/\\[AZz]/.test(p)) {
        p = p.replace(/\\A/g, "^").replace(/\\[Zz]/g, "$")
        notes.push("\\A / \\Z emulated as ^ / $")
      }
      if (/[*+?}]\+|\(\?>/.test(p)) return { notes, error: "possessive / atomic groups aren't available in the browser engine; PCRE2 supports them" }
    }
    return { re: new RegExp(p, [...new Set(flags)].join("")), notes }
  } catch (e) {
    return { notes: [], error: (e as Error).message.replace(/^Invalid regular expression: /, "") }
  }
}
