@AGENTS.md

# ATC Free Star Chatbot — pravidla pro Claude

## Po každé změně VŽDY provést tyto 3 kroky:

1. **GitHub** — `git push origin main`
2. **Vercel** — `vercel --prod --yes`
3. **ZIP záloha** — aktualizovat soubor na Ploše:
   ```bash
   cd /Users/romanrichterjr && zip -r "Desktop/Free Star Chatbot/Free Star Chatbot.zip" kemp-agent \
     --exclude "kemp-agent/node_modules/*" \
     --exclude "kemp-agent/.next/*" \
     --exclude "kemp-agent/.git/*"
   ```

## Projekt

- **Repo:** https://github.com/romanrichter1/ATC-Free-Star-AI-Agent
- **Produkce:** https://kemp-agent.vercel.app
- **ZIP záloha:** `/Users/romanrichterjr/Desktop/Free Star Chatbot/Free Star Chatbot.zip`
- **Stack:** Next.js 16, Vercel AI SDK v6, Claude claude-sonnet-4-6, Resend
