#!/usr/bin/env python3
"""
AI Sentry v0.1 - AI exposure scanner.

Read-only by design: this program only reads files and lists running services.
It never deletes, moves or changes anything, and it never sends data over the
internet. The only network activity is a check of this computer's own
listening ports (127.0.0.1).

Run:  python3 ai_sentry.py            (scans your home folder)
      python3 ai_sentry.py --no-open  (don't open the report when done)
"""
import datetime as _dt
import glob
import html
import json
import math
import os
import platform
import plistlib
import re
import socket
import sqlite3
import subprocess
import sys
import zipfile

VERSION = "0.1.0"
HOME = os.path.expanduser("~")
IS_MAC = sys.platform == "darwin"

# --------------------------------------------------------------------------
# Findings
# --------------------------------------------------------------------------
FINDINGS = []
INVENTORY = []          # every AI component seen, risky or not
STATS = {"files": 0, "rules": 0, "collectors": 0}

SEV_ORDER = {"red": 0, "yellow": 1, "green": 2}


def finding(fid, sev, cat, title, detail, evidence, fix, atlas="", owasp="", nist=""):
    FINDINGS.append({
        "id": fid, "severity": sev, "category": cat, "title": title,
        "detail": detail, "evidence": evidence, "fix": fix,
        "atlas": atlas, "owasp": owasp, "nist_csf": nist,
    })


def inv(kind, name, where):
    INVENTORY.append({"kind": kind, "name": name, "where": short(where)})


def short(p):
    p = str(p)
    return "~" + p[len(HOME):] if p.startswith(HOME) else p


def read_text(path, limit=2_000_000):
    try:
        if os.path.getsize(path) > limit:
            return None
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            STATS["files"] += 1
            return f.read()
    except (OSError, ValueError):
        return None


def load_json(path):
    t = read_text(path)
    if t is None:
        return None
    try:
        return json.loads(t)
    except ValueError:
        # tolerate comments in JSONC files (VS Code settings)
        try:
            t2 = re.sub(r"(?m)^\s*//.*$", "", t)
            t2 = re.sub(r",(\s*[}\]])", r"\1", t2)
            return json.loads(t2)
        except ValueError:
            return None


# --------------------------------------------------------------------------
# 1. AI apps and privacy permissions
# --------------------------------------------------------------------------
AI_APPS = {
    "chatgpt": "ChatGPT", "claude": "Claude", "copilot": "Microsoft Copilot",
    "perplexity": "Perplexity", "gemini": "Gemini", "cursor": "Cursor",
    "windsurf": "Windsurf", "ollama": "Ollama", "lm studio": "LM Studio",
    "msty": "Msty", "jan": "Jan", "gpt4all": "GPT4All", "grammarly": "Grammarly",
    "superwhisper": "superwhisper", "macwhisper": "MacWhisper", "raycast": "Raycast",
    "warp": "Warp", "zed": "Zed", "notion": "Notion", "poe": "Poe",
    "deepseek": "DeepSeek", "grok": "Grok", "pieces": "Pieces", "rewind": "Rewind",
    "limitless": "Limitless", "comet": "Comet", "dia": "Dia", "atlas": "ChatGPT Atlas",
    "codex": "Codex", "kiro": "Kiro", "trae": "Trae", "elevenlabs": "ElevenLabs",
}

SENSITIVE_TCC = {
    "kTCCServiceSystemPolicyAllFiles": ("Full Disk Access", "red"),
    "kTCCServiceAccessibility": ("Accessibility (can control the computer)", "red"),
    "kTCCServiceScreenCapture": ("Screen Recording", "yellow"),
    "kTCCServiceListenEvent": ("Input Monitoring (can see keystrokes)", "red"),
    "kTCCServiceMicrophone": ("Microphone", "yellow"),
    "kTCCServiceCamera": ("Camera", "yellow"),
    "kTCCServiceAppleEvents": ("Automation (can control other apps)", "yellow"),
    "kTCCServiceSystemPolicyDocumentsFolder": ("Documents folder", "yellow"),
    "kTCCServiceSystemPolicyDesktopFolder": ("Desktop folder", "yellow"),
    "kTCCServiceSystemPolicyDownloadsFolder": ("Downloads folder", "yellow"),
}


def match_ai_app(name):
    n = name.lower()
    for key, label in AI_APPS.items():
        if key in ("jan", "dia", "zed", "warp", "atlas", "comet", "poe", "trae", "kiro"):
            if re.fullmatch(key + r"(\.app)?", n) or n.startswith(key + " "):
                return label
        elif key in n:
            return label
    return None


def collect_apps():
    STATS["collectors"] += 1
    found = {}
    dirs = ["/Applications", os.path.join(HOME, "Applications")]
    for d in dirs:
        for app in glob.glob(os.path.join(d, "*.app")) + glob.glob(os.path.join(d, "*", "*.app")):
            label = match_ai_app(os.path.basename(app)[:-4])
            if not label:
                continue
            bid = ""
            try:
                with open(os.path.join(app, "Contents", "Info.plist"), "rb") as f:
                    bid = plistlib.load(f).get("CFBundleIdentifier", "")
                    STATS["files"] += 1
            except Exception:
                pass
            found[bid or app] = (label, app)
            inv("app", label, app)
    STATS["rules"] += len(AI_APPS)
    return found


def collect_tcc(apps):
    """Read the user's privacy-permission database (needs Full Disk Access)."""
    if not IS_MAC:
        return
    STATS["collectors"] += 1
    db = os.path.join(HOME, "Library/Application Support/com.apple.TCC/TCC.db")
    rows = []
    try:
        con = sqlite3.connect("file:%s?mode=ro" % db, uri=True)
        rows = con.execute("SELECT service, client, auth_value FROM access").fetchall()
        con.close()
        STATS["files"] += 1
    except Exception:
        finding("AIS-SYS-001", "green", "System",
                "Privacy permissions not readable",
                "AI Sentry could not read the list of apps allowed to use your screen, "
                "microphone and files. This is normal: macOS protects that list.",
                short(db),
                "For a deeper scan: System Settings > Privacy & Security > Full Disk Access, "
                "add Terminal, then run AI Sentry again.", nist="ID.AM")
        return
    bymap = {bid: v for bid, v in apps.items()}
    for service, client, auth in rows:
        if auth != 2 or service not in SENSITIVE_TCC:
            continue
        label = None
        if client in bymap:
            label = bymap[client][0]
        else:
            label = match_ai_app(client.split(".")[-1]) if "." in client else None
            if not label:
                for key, lab in AI_APPS.items():
                    if len(key) > 4 and key in client.lower():
                        label = lab
        if not label:
            continue
        perm, sev = SENSITIVE_TCC[service]
        STATS["rules"] += 1
        finding("AIS-APP-%03d" % (len(FINDINGS) + 1), sev, "AI apps",
                "%s has %s" % (label, perm),
                "This AI app has been granted %s. If the app or its AI is tricked or "
                "compromised, it can use this access." % perm,
                client,
                "If you don't need it: System Settings > Privacy & Security > %s, "
                "turn %s off." % (perm.split(" (")[0], label),
                atlas="AML.T0050", owasp="LLM06 Excessive Agency", nist="PR.AA")


# --------------------------------------------------------------------------
# 2. Browser extensions
# --------------------------------------------------------------------------
AI_WORDS = re.compile(r"\b(ai|gpt|chatgpt|claude|gemini|copilot|llm|openai|anthropic|"
                      r"perplexity|assistant|summar\w*|grammarly|writer|monica|"
                      r"sider|merlin|harpa|maxai|deepseek)\b", re.I)
BROAD = ("<all_urls>", "*://*/*", "http://*/*", "https://*/*")

CHROMIUM_ROOTS = [
    "Library/Application Support/Google/Chrome", "Library/Application Support/BraveSoftware/Brave-Browser",
    "Library/Application Support/Microsoft Edge", "Library/Application Support/Arc/User Data",
    "Library/Application Support/Vivaldi", "Library/Application Support/Chromium",
    "Library/Application Support/com.openai.atlas", "Library/Application Support/Comet",
    ".config/google-chrome", ".config/BraveSoftware/Brave-Browser", ".config/microsoft-edge", ".config/chromium",
]


def ext_name(manifest, extdir):
    name = manifest.get("name", "")
    if name.startswith("__MSG_"):
        key = name[6:-2]
        default = manifest.get("default_locale", "en")
        for loc in (default, "en", "en_US"):
            msgs = load_json(os.path.join(extdir, "_locales", loc, "messages.json"))
            if isinstance(msgs, dict):
                for k, v in msgs.items():
                    if k.lower() == key.lower() and isinstance(v, dict):
                        return v.get("message", name)
    return name


def collect_extensions():
    STATS["collectors"] += 1
    seen = set()
    for root in CHROMIUM_ROOTS:
        base = os.path.join(HOME, root)
        browser = root.split("/")[-1] if "User Data" not in root else "Arc"
        for mf in glob.glob(os.path.join(base, "*", "Extensions", "*", "*", "manifest.json")):
            m = load_json(mf)
            if not isinstance(m, dict):
                continue
            extdir = os.path.dirname(mf)
            name = ext_name(m, extdir)
            desc = m.get("description", "")
            if desc.startswith("__MSG_"):
                desc = ""
            STATS["rules"] += 1
            if not AI_WORDS.search(name + " " + desc):
                continue
            key = (browser, name)
            if key in seen:
                continue
            seen.add(key)
            perms = [p for p in (m.get("permissions", []) + m.get("host_permissions", [])) if isinstance(p, str)]
            for cs in m.get("content_scripts", []) or []:
                perms += [p for p in cs.get("matches", []) if isinstance(p, str)]
            broad = any(p in BROAD for p in perms)
            inv("extension", "%s (%s)" % (name, browser), mf)
            if broad:
                finding("AIS-EXT-%03d" % (len(FINDINGS) + 1), "red", "Browser extensions",
                        "AI extension can read every website: %s" % name,
                        "This AI extension in %s has permission to read and change every page you "
                        "open, including email, banking and work systems." % browser,
                        short(extdir),
                        "Remove it if you don't use it, or set its Site access to 'On click' in the "
                        "browser's Extensions page.",
                        atlas="AML.T0057", owasp="LLM02 Sensitive Information Disclosure", nist="PR.DS")
            else:
                finding("AIS-EXT-%03d" % (len(FINDINGS) + 1), "green", "Browser extensions",
                        "AI extension with limited access: %s" % name,
                        "Installed in %s; it cannot read every website." % browser,
                        short(extdir), "No action needed.", nist="ID.AM")
    # Firefox
    for prof in glob.glob(os.path.join(HOME, "Library/Application Support/Firefox/Profiles/*")) + \
            glob.glob(os.path.join(HOME, ".mozilla/firefox/*")):
        data = load_json(os.path.join(prof, "extensions.json"))
        if not isinstance(data, dict):
            continue
        for a in data.get("addons", []):
            if a.get("type") != "extension" or not a.get("active"):
                continue
            loc = a.get("defaultLocale") or {}
            name = loc.get("name", "") if isinstance(loc, dict) else ""
            STATS["rules"] += 1
            if not AI_WORDS.search(name + " " + (loc.get("description", "") if isinstance(loc, dict) else "")):
                continue
            perms = (a.get("userPermissions") or {}).get("origins", [])
            broad = any(p in BROAD for p in perms)
            inv("extension", "%s (Firefox)" % name, prof)
            finding("AIS-EXT-%03d" % (len(FINDINGS) + 1), "red" if broad else "green", "Browser extensions",
                    ("AI extension can read every website: %s" if broad else "AI extension with limited access: %s") % name,
                    "Installed in Firefox.", short(prof),
                    "Remove it if you don't use it." if broad else "No action needed.",
                    atlas="AML.T0057" if broad else "", owasp="LLM02 Sensitive Information Disclosure" if broad else "",
                    nist="PR.DS" if broad else "ID.AM")


# --------------------------------------------------------------------------
# 3. AI agents and MCP tool servers
# --------------------------------------------------------------------------
AGENT_CONFIGS = [
    ("Claude Desktop", "Library/Application Support/Claude/claude_desktop_config.json"),
    ("Claude Desktop", ".config/Claude/claude_desktop_config.json"),
    ("Claude Code", ".claude.json"),
    ("Claude Code", ".claude/settings.json"),
    ("Cursor", ".cursor/mcp.json"),
    ("Windsurf", ".codeium/windsurf/mcp_config.json"),
    ("VS Code", "Library/Application Support/Code/User/settings.json"),
    ("VS Code", "Library/Application Support/Code/User/mcp.json"),
    ("VS Code", ".config/Code/User/settings.json"),
    ("VS Code", ".config/Code/User/mcp.json"),
    ("Zed", ".config/zed/settings.json"),
    ("Gemini CLI", ".gemini/settings.json"),
    ("Codex", ".codex/config.toml"),
    ("Continue", ".continue/config.json"),
    ("Cline", "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"),
]

CAPS = [
    ("shell", re.compile(r"shell|terminal|exec|command|bash|zsh|desktop-commander|run[-_]?cmd|ssh", re.I),
     "run commands on your computer", "red"),
    ("files", re.compile(r"filesystem|file[-_]?system|server-files|\bfs\b|files", re.I),
     "read and write your files", "yellow"),
    ("email", re.compile(r"gmail|mail|outlook|smtp|imap", re.I), "read and send email", "red"),
    ("browser", re.compile(r"puppeteer|playwright|browser|chrome|selenium", re.I),
     "drive a web browser", "yellow"),
    ("messaging", re.compile(r"slack|discord|telegram|whatsapp|imessage|sms|twilio", re.I),
     "send messages", "yellow"),
    ("payments", re.compile(r"stripe|paypal|coinbase|wallet|bank|plaid", re.I),
     "touch payments or money", "red"),
    ("code", re.compile(r"github|gitlab|\bgit\b", re.I), "change code repositories", "yellow"),
    ("database", re.compile(r"postgres|mysql|sqlite|mongo|supabase|database", re.I),
     "read and change databases", "yellow"),
]


def iter_servers(cfg):
    """Yield (name, server_dict) from the different MCP config shapes."""
    if not isinstance(cfg, dict):
        return
    for key in ("mcpServers", "servers", "mcp_servers", "context_servers"):
        block = cfg.get(key)
        if isinstance(block, dict):
            for n, s in block.items():
                if isinstance(s, dict):
                    yield n, s
    mcp = cfg.get("mcp")
    if isinstance(mcp, dict):
        for n, s in iter_servers(mcp):
            yield n, s
    projects = cfg.get("projects")  # ~/.claude.json keeps per-project servers
    if isinstance(projects, dict):
        for pv in projects.values():
            if isinstance(pv, dict):
                for n, s in iter_servers(pv):
                    yield n, s


def parse_toml_servers(text):
    out = {}
    cur = None
    for line in text.splitlines():
        m = re.match(r"\s*\[mcp_servers\.([^\]]+)\]", line)
        if m:
            cur = m.group(1).strip('"')
            out[cur] = {}
            continue
        if line.strip().startswith("["):
            cur = None
        if cur and "=" in line:
            k, v = line.split("=", 1)
            out[cur][k.strip()] = v.strip()
    return out


def collect_agents():
    STATS["collectors"] += 1
    for app, rel in AGENT_CONFIGS:
        path = os.path.join(HOME, rel)
        if not os.path.exists(path):
            continue
        if path.endswith(".toml"):
            t = read_text(path) or ""
            servers = list(parse_toml_servers(t).items())
        else:
            servers = list(iter_servers(load_json(path)))
        inv("agent", app, path)
        for name, s in servers:
            blob = " ".join([name, str(s.get("command", "")), " ".join(map(str, s.get("args", []) or [])),
                             str(s.get("url", ""))])
            inv("tool server", "%s -> %s" % (app, name), path)
            caps = [(c, words, sev) for c, rx, words, sev in CAPS if rx.search(blob)]
            STATS["rules"] += len(CAPS)
            remote = bool(re.search(r"https?://", blob)) and not re.search(r"localhost|127\.0\.0\.1", blob)
            if caps:
                worst = "red" if any(c[2] == "red" for c in caps) else "yellow"
                what = ", ".join(c[1] for c in caps)
                finding("AIS-AGT-%03d" % (len(FINDINGS) + 1), worst, "AI agents",
                        "%s can %s through '%s'" % (app, caps[0][1], name),
                        "The AI in %s is connected to a tool that lets it %s. If it reads a "
                        "booby-trapped document or web page, an attacker could steer it to use "
                        "that power." % (app, what),
                        short(path),
                        "Keep 'ask before running tools' turned on in %s, and remove this tool "
                        "connection if you don't use it." % app,
                        atlas="AML.T0051", owasp="LLM06 Excessive Agency", nist="PR.AA")
            elif remote:
                finding("AIS-AGT-%03d" % (len(FINDINGS) + 1), "yellow", "AI agents",
                        "%s talks to an outside tool server: %s" % (app, name),
                        "This AI tool connection runs on someone else's server. What the AI sends "
                        "it leaves your computer.", short(path),
                        "Make sure you trust the company running it.",
                        atlas="AML.T0010", owasp="LLM03 Supply Chain", nist="GV.SC")
            env = s.get("env") if isinstance(s.get("env"), dict) else {}
            for k, v in env.items():
                if isinstance(v, str) and len(v) >= 16 and re.search(r"key|token|secret", k, re.I) \
                        and not v.startswith("${"):
                    finding("AIS-AGT-%03d" % (len(FINDINGS) + 1), "red", "Exposed AI keys",
                            "Secret written into %s's tool settings (%s)" % (app, k),
                            "A password-like key is stored in plain text in this settings file.",
                            "%s  %s=%s" % (short(path), k, redact(v)),
                            "Move the key to the macOS Keychain or an environment variable, and "
                            "create a new key if this file was ever shared.",
                            atlas="AML.T0055", owasp="LLM02 Sensitive Information Disclosure", nist="PR.AA")


# --------------------------------------------------------------------------
# 4. Secret sweep (AI service keys)
# --------------------------------------------------------------------------
KEY_PATTERNS = [
    ("Anthropic", re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}")),
    ("OpenAI", re.compile(r"sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_\-]{32,}")),
    ("Google AI", re.compile(r"AIza[0-9A-Za-z_\-]{35}")),
    ("Hugging Face", re.compile(r"hf_[A-Za-z0-9]{30,}")),
    ("Groq", re.compile(r"gsk_[A-Za-z0-9]{40,}")),
    ("Replicate", re.compile(r"r8_[A-Za-z0-9]{30,}")),
    ("xAI", re.compile(r"xai-[A-Za-z0-9]{40,}")),
    ("Perplexity", re.compile(r"pplx-[A-Za-z0-9]{40,}")),
    ("ElevenLabs", re.compile(r"(?i)elevenlabs[_-]?api[_-]?key\s*[=:]\s*['\"]?([a-f0-9]{32})")),
    ("AI service", re.compile(r"(?i)(?:openai|anthropic|claude|gemini|mistral|cohere|together|deepseek)"
                              r"[_-]?api[_-]?key\s*[=:]\s*['\"]?([A-Za-z0-9_\-]{24,})")),
]

SKIP_DIRS = {"Library", "node_modules", ".git", ".Trash", "Pictures", "Movies", "Music",
             ".npm", ".cache", ".venv", "venv", "site-packages", ".cargo", ".rustup",
             "Photos Library.photoslibrary", ".docker", "go", ".gradle", ".m2"}
SECRET_FILES = [".zshrc", ".bashrc", ".bash_profile", ".profile", ".zprofile", ".zshenv",
                ".zsh_history", ".bash_history", ".netrc", ".npmrc", ".pypirc",
                ".config/fish/config.fish", ".aws/credentials"]
SECRET_EXT = {".env", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".sh", ".py",
              ".js", ".ts", ".ipynb", ".txt", ".md"}


def redact(s):
    s = str(s)
    return s[:6] + "…" + s[-4:] if len(s) > 12 else "…"


def entropy(s):
    if not s:
        return 0
    counts = {c: s.count(c) for c in set(s)}
    return -sum(n / len(s) * math.log2(n / len(s)) for n in counts.values())


def walk(roots, max_depth=5, max_files=20000):
    n = 0
    for root in roots:
        if not os.path.isdir(root):
            continue
        base_depth = root.rstrip("/").count("/")
        for dp, dns, fns in os.walk(root):
            dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.endswith(".app")]
            if dp.count("/") - base_depth >= max_depth:
                dns[:] = []
            for fn in fns:
                n += 1
                if n > max_files:
                    return
                yield os.path.join(dp, fn)


def scan_secrets_in(path, text, seen):
    for provider, rx in KEY_PATTERNS:
        STATS["rules"] += 1
        for m in rx.finditer(text):
            key = m.group(1) if m.groups() else m.group(0)
            if entropy(key) < 3.3 or "xxxx" in key.lower() or "your" in key.lower():
                continue
            sig = (path, key)
            if sig in seen:
                continue
            seen.add(sig)
            hist = "history" in os.path.basename(path)
            finding("AIS-SEC-%03d" % (len(FINDINGS) + 1), "red", "Exposed AI keys",
                    "%s key stored in plain text%s" % (provider, " in your command history" if hist else ""),
                    "Anyone or any program that can read this file can use your %s account and "
                    "run up charges in your name." % provider,
                    "%s  %s" % (short(path), redact(key)),
                    "Create a new key in your %s account, delete the old one, and keep keys in the "
                    "macOS Keychain instead of files." % provider,
                    atlas="AML.T0055", owasp="LLM02 Sensitive Information Disclosure", nist="PR.AA")


def collect_secrets():
    STATS["collectors"] += 1
    seen = set()
    for rel in SECRET_FILES:
        p = os.path.join(HOME, rel)
        t = read_text(p, 20_000_000)
        if t:
            scan_secrets_in(p, t, seen)
    for p in walk([HOME], max_depth=5):
        name = os.path.basename(p)
        ext = os.path.splitext(name)[1].lower()
        if not (name.startswith(".env") or ext in SECRET_EXT):
            continue
        t = read_text(p, 2_000_000)
        if t:
            scan_secrets_in(p, t, seen)


# --------------------------------------------------------------------------
# 5. Prompt-injection traps in documents
# --------------------------------------------------------------------------
INJECT = re.compile(
    r"(ignore|disregard|forget)\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)"
    r"|you\s+are\s+now\s+(a|an|in)\b"
    r"|(new|updated)\s+system\s+(prompt|instructions)"
    r"|do\s+not\s+(tell|inform|mention\s+this\s+to)\s+the\s+user"
    r"|(send|forward|upload|exfiltrate)\s+(the\s+|all\s+|any\s+)?(api\s+keys?|passwords?|credentials|secrets|ssh\s+keys?)"
    r"|<\s*/?\s*(system|assistant)\s*>"
    r"|\[\s*(system|INST)\s*\]"
    r"|as\s+an\s+ai\s+(assistant|agent)\s*,?\s+you\s+must",
    re.I)
ZW = re.compile("[​‌‍⁠﻿­]{8,}|[\U000e0000-\U000e007f]{4,}")
HIDDEN_HTML = re.compile(r"(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|"
                         r"color\s*:\s*(#fff(fff)?|white)\s*;?\s*background(-color)?\s*:\s*(#fff(fff)?|white)|"
                         r"opacity\s*:\s*0(\.0+)?\s*[;\"'])", re.I)
DOC_EXT = {".txt", ".md", ".html", ".htm", ".rtf", ".csv", ".json", ".xml", ".docx", ".pptx",
           ".xlsx", ".pdf", ".eml", ".svg"}


def doc_text(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".docx", ".pptx", ".xlsx"):
        try:
            with zipfile.ZipFile(path) as z:
                parts = [n for n in z.namelist() if n.endswith(".xml") and
                         (n.startswith("word/") or n.startswith("ppt/slides/") or n.startswith("xl/sharedStrings"))]
                xml = " ".join(z.read(n).decode("utf-8", "ignore") for n in parts[:60])
                STATS["files"] += 1
                hidden = bool(re.search(r"<w:vanish/>|<w:color w:val=\"FFFFFF\"/>|<w:sz w:val=\"[1-4]\"/>", xml))
                return re.sub(r"<[^>]+>", " ", xml), hidden
        except Exception:
            return "", False
    if ext == ".pdf":
        try:
            if os.path.getsize(path) > 15_000_000:
                return "", False
            with open(path, "rb") as f:
                raw = f.read()
            STATS["files"] += 1
            import zlib
            chunks = []
            for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", raw, re.S):
                data = m.group(1)
                try:
                    data = zlib.decompress(data)
                except Exception:
                    pass
                chunks += re.findall(rb"\(((?:\\.|[^\\)]){2,})\)", data)
            text = b" ".join(chunks).decode("latin-1", "ignore")
            hidden = bool(re.search(rb"\b3 Tr\b|\b0 0 0 0 k\b|\b1 1 1 rg\b", raw))
            return text, hidden
        except Exception:
            return "", False
    t = read_text(path, 5_000_000) or ""
    hidden = ext in (".html", ".htm", ".svg") and bool(HIDDEN_HTML.search(t))
    return t, hidden


def collect_injection():
    STATS["collectors"] += 1
    roots = [os.path.join(HOME, d) for d in ("Downloads", "Documents", "Desktop")]
    for p in walk(roots, max_depth=4, max_files=15000):
        if os.path.splitext(p)[1].lower() not in DOC_EXT:
            continue
        text, hidden = doc_text(p)
        if not text:
            continue
        STATS["rules"] += 3
        m = INJECT.search(text)
        zw = ZW.search(text)
        if not m and not zw:
            continue
        sev = "red" if (m and (hidden or zw)) else "yellow"
        why = []
        if m:
            why.append("text written to give orders to an AI (\"%s\")" % m.group(0)[:60].strip())
        if zw:
            why.append("invisible characters that can hide instructions")
        if hidden:
            why.append("hidden formatting (white or invisible text)")
        finding("AIS-INJ-%03d" % (len(FINDINGS) + 1), sev, "Prompt injection",
                "Possible AI trap in %s" % os.path.basename(p),
                "This file contains " + "; ".join(why) + ". If you ask an AI assistant to read or "
                "summarize it, the AI may follow these hidden orders instead of yours.",
                short(p),
                "Don't give this file to an AI assistant or agent. Delete it if you don't know "
                "where it came from.",
                atlas="AML.T0051", owasp="LLM01 Prompt Injection", nist="DE.CM")


# --------------------------------------------------------------------------
# 6. Local AI servers and network exposure
# --------------------------------------------------------------------------
AI_PORTS = {11434: "Ollama", 1234: "LM Studio", 1337: "Jan", 4891: "GPT4All", 8080: "llama.cpp / local AI",
            5001: "KoboldCpp", 7860: "Gradio / Stable Diffusion", 8188: "ComfyUI", 3000: "Open WebUI",
            10000: "Msty"}


def listening():
    """Return {port: [bind addresses]} from lsof (macOS) or ss (Linux)."""
    out = {}
    cmds = [["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"], ["ss", "-ltnH"]]
    for cmd in cmds:
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        except Exception:
            continue
        for line in r.stdout.splitlines():
            m = re.search(r"(\*|\[?[0-9a-fA-F:.]+\]?)[:.](\d+)\s*(\(LISTEN\))?\s*$", line.strip()) if cmd[0] == "lsof" \
                else re.search(r"\s(\S+):(\d+)\s", line)
            if m:
                out.setdefault(int(m.group(2)), set()).add(m.group(1))
        if out:
            break
    return out


def collect_network():
    STATS["collectors"] += 1
    ports = listening()
    for port, label in AI_PORTS.items():
        STATS["rules"] += 1
        binds = ports.get(port)
        if binds is None:
            s = socket.socket()
            s.settimeout(0.25)
            try:
                if s.connect_ex(("127.0.0.1", port)) != 0:
                    continue
                binds = {"127.0.0.1"}
            finally:
                s.close()
        open_all = any(b in ("*", "0.0.0.0", "[::]", "::") for b in binds)
        inv("local AI server", "%s on port %d" % (label, port), ", ".join(sorted(binds)))
        if open_all:
            finding("AIS-NET-%03d" % (len(FINDINGS) + 1), "red", "Shadow AI and network",
                    "%s is reachable from other computers (port %d)" % (label, port),
                    "A local AI service is listening on all network connections, so other devices "
                    "on your Wi-Fi may be able to use it or read what it is doing.",
                    "listening on %s:%d" % ("/".join(sorted(binds)), port),
                    "Set it to listen on 127.0.0.1 only (for Ollama: OLLAMA_HOST=127.0.0.1), or turn "
                    "on the macOS firewall.",
                    atlas="AML.T0040", owasp="LLM10 Unbounded Consumption", nist="PR.IR")
        else:
            finding("AIS-NET-%03d" % (len(FINDINGS) + 1), "green", "Shadow AI and network",
                    "%s is running, local only (port %d)" % (label, port),
                    "A local AI service is running but only this computer can reach it.",
                    "listening on 127.0.0.1:%d" % port, "No action needed.", nist="ID.AM")


# --------------------------------------------------------------------------
# Scoring and reports
# --------------------------------------------------------------------------
def score():
    red = sum(f["severity"] == "red" for f in FINDINGS)
    yel = sum(f["severity"] == "yellow" for f in FINDINGS)
    raw = 100 * (1 - math.exp(-(red * 0.35 + yel * 0.12)))
    s = int(round(raw))
    level = "LOW" if s < 35 else "MODERATE" if s < 70 else "HIGH"
    return s, level, red, yel


CAT_ORDER = ["Exposed AI keys", "AI agents", "Browser extensions", "Prompt injection",
             "AI apps", "Shadow AI and network", "System"]


def html_report(meta):
    s, level, red, yel = meta["score"], meta["level"], meta["red"], meta["yellow"]
    col = {"LOW": "#3ccf8e", "MODERATE": "#f2c14e", "HIGH": "#ff6b6b"}[level]
    e = html.escape
    rows = []
    for f in sorted(FINDINGS, key=lambda f: (SEV_ORDER[f["severity"]], CAT_ORDER.index(f["category"]) if f["category"] in CAT_ORDER else 99)):
        tags = " ".join('<span class="tag">%s</span>' % e(t) for t in
                        [f["atlas"] and "ATLAS " + f["atlas"], f["owasp"] and "OWASP " + f["owasp"],
                         f["nist_csf"] and "NIST CSF " + f["nist_csf"]] if t)
        rows.append('<div class="f %s"><div class="sv"></div><div><div class="ft">%s</div>'
                    '<div class="cat">%s · %s</div><p>%s</p><div class="ev">%s</div>'
                    '<div class="fx"><b>Fix:</b> %s</div><div class="tags">%s</div></div></div>'
                    % (f["severity"], e(f["title"]), e(f["category"]), e(f["id"]), e(f["detail"]),
                       e(f["evidence"]), e(f["fix"]), tags))
    cats = {}
    for f in FINDINGS:
        if f["severity"] != "green":
            cats[f["category"]] = cats.get(f["category"], 0) + 1
    bars = "".join('<div class="bar"><span>%s</span><i><em style="width:%d%%"></em></i><b>%d</b></div>'
                   % (e(c), min(100, cats.get(c, 0) * 25), cats.get(c, 0)) for c in CAT_ORDER[:6])
    invrows = "".join("<tr><td>%s</td><td>%s</td><td>%s</td></tr>" % (e(i["kind"]), e(i["name"]), e(i["where"]))
                      for i in INVENTORY) or '<tr><td colspan="3">No AI components found.</td></tr>'
    dash = 251 * (1 - s / 100)
    return """<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Sentry Report · %(host)s · %(date)s</title><style>
:root{--bg:#070b14;--pn:#0b1324;--line:rgba(148,170,210,.16);--ink:#eef2f9;--mut:#93a1bb;--acc:#5aa9ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif}
.w{max-width:1100px;margin:0 auto;padding:32px 24px 80px}.mono{font-family:"SF Mono",Menlo,monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
header{display:flex;align-items:center;gap:12px;margin-bottom:22px}header b{font-size:20px}header .mono{margin-left:auto}
.top{display:grid;grid-template-columns:260px 1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:26px}
.top>div{background:var(--pn);padding:20px}.g{position:relative;max-width:220px;margin:0 auto}.g svg{width:100%%}.gv{position:absolute;left:0;right:0;bottom:4px;text-align:center}.gv b{font-size:38px;display:block;line-height:1}.gv span{font-family:"SF Mono",Menlo,monospace;font-size:11px;letter-spacing:.14em;color:%(col)s}
.bar{display:grid;grid-template-columns:150px 1fr 20px;gap:10px;align-items:center;font-size:13px;color:var(--mut);margin:8px 0}.bar i{height:6px;background:#17213a;border-radius:4px;overflow:hidden}.bar em{display:block;height:100%%;background:linear-gradient(90deg,#f2c14e,#ff6b6b)}.bar b{color:var(--ink);text-align:right}
.kv{display:flex;justify-content:space-between;gap:14px;text-align:right;border-bottom:1px solid var(--line);padding:7px 0;font-size:13.5px;color:var(--mut)}.kv b{color:var(--ink);font-family:"SF Mono",Menlo,monospace;font-weight:500}
h2{font-size:22px;margin:34px 0 14px}.f{display:grid;grid-template-columns:6px 1fr;gap:16px;background:var(--pn);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:10px}
.sv{border-radius:4px}.red .sv{background:#ff6b6b}.yellow .sv{background:#f2c14e}.green .sv{background:#3ccf8e}
.ft{font-weight:600;font-size:16px}.cat{font-family:"SF Mono",Menlo,monospace;font-size:11px;letter-spacing:.08em;color:var(--mut);text-transform:uppercase;margin:2px 0 6px}
.f p{margin:0 0 8px;color:#c7d1e3}.ev{font-family:"SF Mono",Menlo,monospace;font-size:12.5px;color:#8ad4ff;background:#060a13;border:1px solid var(--line);border-radius:8px;padding:7px 10px;word-break:break-all;margin-bottom:8px}
.fx{font-size:14px}.tags{margin-top:8px}.tag{display:inline-block;font-family:"SF Mono",Menlo,monospace;font-size:11px;color:#8ad4ff;border:1px solid rgba(148,170,210,.28);border-radius:6px;padding:2px 7px;margin:0 6px 4px 0}
table{width:100%%;border-collapse:collapse;background:var(--pn);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:13.5px}td{padding:9px 14px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{color:var(--mut);white-space:nowrap}td:last-child{font-family:"SF Mono",Menlo,monospace;font-size:12px;color:var(--mut);word-break:break-all}
.note{color:var(--mut);font-size:13px;margin-top:30px;border-top:1px solid var(--line);padding-top:16px}
@media(max-width:800px){.top{grid-template-columns:1fr}}@media print{body{background:#fff;color:#000}}
</style></head><body><div class="w">
<header><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 2 4 7v8c0 7.5 5.1 13.3 12 15 6.9-1.7 12-7.5 12-15V7L16 2Z" stroke="#8ad4ff" stroke-width="2"/><circle cx="16" cy="15" r="4.5" stroke="#5aa9ff" stroke-width="2"/></svg><b>AI Sentry</b><span class="mono">Scan report · %(date)s</span></header>
<div class="top">
<div><div class="mono">Exposure index</div><div class="g"><svg viewBox="0 0 200 120"><path d="M20 110A80 80 0 0 1 180 110" fill="none" stroke="#1d2840" stroke-width="14" stroke-linecap="round"/><path d="M20 110A80 80 0 0 1 180 110" fill="none" stroke="%(col)s" stroke-width="14" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="%(dash).0f"/></svg><div class="gv"><b>%(score)d</b><span>%(level)s</span></div></div></div>
<div><div class="mono">Needs attention</div>%(bars)s</div>
<div><div class="mono">Scan</div>
<div class="kv"><span>Computer</span><b>%(host)s</b></div><div class="kv"><span>System</span><b>%(os)s</b></div>
<div class="kv"><span>Critical (red)</span><b>%(red)d</b></div><div class="kv"><span>Warnings (yellow)</span><b>%(yellow)d</b></div>
<div class="kv"><span>AI components</span><b>%(inv)d</b></div><div class="kv"><span>Files inspected</span><b>%(files)s</b></div>
<div class="kv"><span>Rules evaluated</span><b>%(rules)s</b></div><div class="kv"><span>Network egress</span><b style="color:#3ccf8e">0 bytes</b></div></div>
</div>
<h2>Findings</h2>%(rows)s
<h2>AI inventory</h2><table>%(invrows)s</table>
<p class="note">AI Sentry %(ver)s · read-only scan: nothing on this computer was changed and nothing was sent over the internet. Keys are shown shortened. Findings are mapped to MITRE ATLAS, the OWASP Top 10 for LLM Applications (2025) and NIST CSF 2.0. This report is a guide, not a guarantee: it covers the places listed above, not every file on the computer.</p>
</div></body></html>""" % dict(host=e(meta["host"]), date=e(meta["date"]), col=col, dash=dash, score=s, level=level,
                                bars=bars, os=e(meta["os"]), red=red, yellow=yel, inv=len(INVENTORY),
                                files="{:,}".format(STATS["files"]), rules="{:,}".format(STATS["rules"]),
                                rows="".join(rows) or "<p>No findings.</p>", invrows=invrows, ver=VERSION)


def main():
    no_open = "--no-open" in sys.argv
    print("\n  AI Sentry %s  ·  read-only scan  ·  nothing leaves this computer\n" % VERSION)
    steps = [("AI apps", collect_apps), ("Browser extensions", collect_extensions),
             ("AI agents and tool servers", collect_agents), ("AI keys in files", collect_secrets),
             ("Hidden AI instructions in documents", collect_injection), ("Local AI servers", collect_network)]
    apps = {}
    for label, fn in steps:
        sys.stdout.write("  scanning  %-38s" % label)
        sys.stdout.flush()
        before = len(FINDINGS)
        try:
            r = fn()
            if fn is collect_apps:
                apps = r or {}
                collect_tcc(apps)
        except Exception as ex:  # one broken collector must not stop the scan
            finding("AIS-SYS-ERR", "green", "System", "Part of the scan was skipped: %s" % label,
                    "AI Sentry hit an error and skipped this step.", str(ex)[:200], "Run the scan again.")
        new = FINDINGS[before:]
        r_ = sum(f["severity"] == "red" for f in new)
        y_ = sum(f["severity"] == "yellow" for f in new)
        print("done   %s" % ("\033[31m%d critical\033[0m " % r_ if r_ else "") +
              ("\033[33m%d warning\033[0m" % y_ if y_ else ("" if r_ else "\033[32mclear\033[0m")))
    s, level, red, yel = score()
    now = _dt.datetime.now()
    meta = {"score": s, "level": level, "red": red, "yellow": yel, "date": now.strftime("%Y-%m-%d %H:%M"),
            "host": platform.node().split(".")[0] or "this computer",
            "os": ("macOS " + platform.mac_ver()[0]) if IS_MAC else platform.platform(terse=True)}
    outdir = os.path.join(HOME, "Desktop") if os.path.isdir(os.path.join(HOME, "Desktop")) else HOME
    stamp = now.strftime("%Y-%m-%d-%H%M")
    hpath = os.path.join(outdir, "AI-Sentry-Report-%s.html" % stamp)
    jpath = os.path.join(outdir, "AI-Sentry-Report-%s.json" % stamp)
    with open(hpath, "w", encoding="utf-8") as f:
        f.write(html_report(meta))
    with open(jpath, "w", encoding="utf-8") as f:
        json.dump({"tool": "AI Sentry", "version": VERSION, "meta": meta, "stats": STATS,
                   "findings": FINDINGS, "inventory": INVENTORY}, f, indent=2)
    c = {"LOW": "32", "MODERATE": "33", "HIGH": "31"}[level]
    print("\n  Exposure index: \033[%sm%d  %s\033[0m   ·   %d critical, %d warnings, %d AI components"
          % (c, s, level, red, yel, len(INVENTORY)))
    print("  Report saved: %s\n" % short(hpath))
    if not no_open:
        opener = "open" if IS_MAC else "xdg-open"
        try:
            subprocess.run([opener, hpath], capture_output=True, timeout=10)
        except Exception:
            pass


if __name__ == "__main__":
    main()
