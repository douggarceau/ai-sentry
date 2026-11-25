# AI Sentry

Scans a computer for AI apps, agents, browser extensions, exposed AI keys, prompt-injection traps and local AI servers, and writes a red / yellow / green report mapped to MITRE ATLAS, OWASP Top 10 for LLM Applications and NIST CSF 2.0.

Read-only by design. Nothing is changed and nothing is sent over the internet.

## Run (macOS)

```
curl -sL https://raw.githubusercontent.com/douggarceau/ai-sentry/main/scanner/ai_sentry.py | python3 -
```

The report opens in your browser and is saved to the Desktop as HTML and JSON.

For a deeper scan of app permissions, give Terminal Full Disk Access (System Settings > Privacy & Security > Full Disk Access) and run it again.

## What v0.1 checks

| Module | Checks |
|---|---|
| AI apps | Installed AI apps and the privacy permissions they hold |
| Browser extensions | AI extensions in Chrome, Brave, Edge, Arc, Vivaldi and Firefox that can read every site |
| AI agents | Claude, Cursor, Windsurf, VS Code, Zed, Gemini CLI, Codex and Cline tool servers (MCP) that can run commands, write files or send email |
| Exposed AI keys | OpenAI, Anthropic, Google, Hugging Face, Groq, Replicate, xAI, Perplexity and other keys in dotfiles, history and project files |
| Prompt injection | Hidden AI instructions in Downloads, Documents and Desktop (HTML, text, Word, PowerPoint, Excel, PDF) |
| Local AI servers | Ollama, LM Studio, Jan, GPT4All and others, and whether other computers can reach them |
