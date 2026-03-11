import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `<role>
You are "AutoMark AI" – a professional, autonomous AI Marketing Automation Agent created for small businesses and content creators (especially OnlyFans / Fansly / TikTok creators). 
Your purpose is to automate customer engagement, DM replies, ad optimization suggestions, content scheduling and lead conversion 24/7, while saving the owner 10+ hours per week.
You work as part of a paid monthly service (200–800€/muaj) that the human owner sells to clients.
</role>
<personality>
- Tone: Friendly, professional, slightly flirty when the client is a creator (use emojis 😏💋 intelligently).
- Style: Short, natural, human-like replies (max 3–4 sentences per message).
- Goal: Always maximize engagement, tips/subscriptions and conversions without being pushy or explicit unless the client explicitly asks.
</personality>
<core_rules>
- NEVER send explicit/nude content or promises.
- ALWAYS stay in character of the specific client (use the client_style provided in context).
- If unsure or the request is complex → escalate to human owner with a clear summary.
- Protect privacy: Never share client data outside the conversation.
- Date awareness: Current date is March 2026 – use this for timely suggestions.
</core_rules>
<memory_system>
You have access to long-term memory (Google Sheets or Airtable):
- Client profile (name, niche, style, subscription price, best selling content)
- Chat history with each fan
- Performance log (which replies convert better)
Always read the latest memory before replying.
</memory_system>
<step_by_step_reasoning>
Before every action, think internally in this exact order (use <thinking> tags):
1. Understand intent of the incoming message.
2. Check memory/context for client style and history.
3. Decide action: auto-reply, escalate, schedule post, suggest ad, or log.
4. Choose tone and length.
5. Generate final response or action.
</step_by_step_reasoning>
<available_tools>
- send_dm_reply (to Instagram/OnlyFans)
- create_content_draft
- suggest_ad_optimization
- escalate_to_human (send notification via Slack/Telegram/Email)
- log_interaction (to Google Sheets)
- check_subscription_status
</available_tools>
<output_format>
Always respond with valid JSON only (no extra text outside JSON):
{
  "thinking": "brief internal reasoning",
  "action": "send_reply | escalate | log | suggest_ad | create_content",
  "reply_text": "the exact message to send (if action is send_reply)",
  "escalation_note": "optional message for human owner",
  "suggestion": "optional optimization tip"
}
</output_format>
<client_style_example>
Example for a blonde creator with glasses (nerdy-sexy vibe):
"Use teasing but smart tone, mention glasses or curves only if relevant, emojis 😏👓💋, focus on 'exclusive behind the scenes' and 'personal chat'."
</client_style_example>`;

const ACTION_COLORS = {
  send_reply: { bg: "#10b981", label: "📤 DM Reply" },
  escalate: { bg: "#f59e0b", label: "🚨 Escalate" },
  log: { bg: "#6366f1", label: "📝 Log" },
  suggest_ad: { bg: "#ec4899", label: "📊 Ad Suggestion" },
  create_content: { bg: "#8b5cf6", label: "✍️ Content Draft" },
};

const PRESET_PROFILES = [
  { id: 1, name: "Luna ✨", niche: "TikTok / OnlyFans", style: "Nerdy-sexy, glasses, smart humor, emojis 😏👓", price: "€9.99/mo" },
  { id: 2, name: "Bella 💋", niche: "Fansly / Instagram", style: "Flirty, luxury lifestyle, sophisticated 💅", price: "€14.99/mo" },
  { id: 3, name: "Sofia 🌸", niche: "Fitness / OnlyFans", style: "Athletic, motivational, healthy vibes 💪", price: "€7.99/mo" },
];

export default function AutoMarkAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState(PRESET_PROFILES[0]);
  const [stats, setStats] = useState({ replies: 0, escalations: 0, suggestions: 0 });
  const [showThinking, setShowThinking] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg, ts: new Date() }]);
    setLoading(true);

    const contextualSystem = `${SYSTEM_PROMPT}

<active_client>
Name: ${activeProfile.name}
Niche: ${activeProfile.niche}
Style: ${activeProfile.style}
Subscription Price: ${activeProfile.price}
</active_client>`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: contextualSystem,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("");
      let parsed;
      try {
        const clean = raw.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = { thinking: "Parse error", action: "log", reply_text: raw };
      }

      setMessages(prev => [...prev, { role: "assistant", parsed, ts: new Date() }]);
      setStats(prev => ({
        replies: prev.replies + (parsed.action === "send_reply" ? 1 : 0),
        escalations: prev.escalations + (parsed.action === "escalate" ? 1 : 0),
        suggestions: prev.suggestions + (parsed.action === "suggest_ad" || parsed.action === "create_content" ? 1 : 0),
      }));
    } catch (e) {
      setMessages(prev => [...prev, { role: "error", content: "Error: " + e.message, ts: new Date() }]);
    }
    setLoading(false);
  };

  const actionInfo = (action) => ACTION_COLORS[action] || { bg: "#64748b", label: "⚙️ Action" };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a2e 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(139,92,246,0.3)",
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 0 20px rgba(139,92,246,0.5)",
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              AutoMark <span style={{ background: "linear-gradient(90deg,#8b5cf6,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: -2 }}>Marketing Automation Agent • March 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Replies", val: stats.replies, color: "#10b981" },
            { label: "Escalated", val: stats.escalations, color: "#f59e0b" },
            { label: "Suggestions", val: stats.suggestions, color: "#ec4899" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: "#0f0f1a", borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 14px", display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "#475569", marginBottom: 8, paddingLeft: 8 }}>CLIENT PROFILES</div>
          {PRESET_PROFILES.map(p => (
            <button key={p.id} onClick={() => setActiveProfile(p)} style={{
              background: activeProfile.id === p.id ? "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(236,72,153,0.1))" : "transparent",
              border: activeProfile.id === p.id ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
              borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: activeProfile.id === p.id ? "#c4b5fd" : "#94a3b8" }}>{p.name}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{p.niche}</div>
              <div style={{ fontSize: 11, color: "#10b981", marginTop: 4, fontWeight: 600 }}>{p.price}</div>
            </button>
          ))}

          <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#64748b" }}>
              <input type="checkbox" checked={showThinking} onChange={e => setShowThinking(e.target.checked)}
                style={{ accentColor: "#8b5cf6" }} />
              Show thinking
            </label>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Active client bar */}
          <div style={{
            padding: "10px 20px", background: "rgba(139,92,246,0.05)",
            borderBottom: "1px solid rgba(139,92,246,0.15)",
            display: "flex", alignItems: "center", gap: 10, fontSize: 13,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span style={{ color: "#94a3b8" }}>Active client:</span>
            <span style={{ fontWeight: 600, color: "#c4b5fd" }}>{activeProfile.name}</span>
            <span style={{ color: "#475569" }}>•</span>
            <span style={{ color: "#64748b", fontSize: 12 }}>{activeProfile.style}</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#c4b5fd" }}>AutoMark AI është gati!</div>
                <div style={{ color: "#475569", fontSize: 14, marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
                  Shkruaj një mesazh nga një fan, kërko sugjerim reklamash, ose testo automatizimin.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
                  {["Hey, sa kushton subscription? 😍", "Sugjero idee për post sot", "Klienti është shumë aktiv, çfarë bëjmë?", "Optimizo reklamat e mia"].map(s => (
                    <button key={s} onClick={() => setInput(s)} style={{
                      background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 20, padding: "6px 14px", color: "#c4b5fd", fontSize: 12, cursor: "pointer",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "user" && (
                  <div style={{
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    borderRadius: "16px 16px 4px 16px", padding: "10px 16px",
                    maxWidth: "70%", fontSize: 14, lineHeight: 1.5,
                    boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
                  }}>{msg.content}</div>
                )}

                {msg.role === "assistant" && msg.parsed && (
                  <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 8 }}>
                    {showThinking && msg.parsed.thinking && (
                      <div style={{
                        background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)",
                        borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#64748b",
                        fontStyle: "italic",
                      }}>
                        💭 <strong>Thinking:</strong> {msg.parsed.thinking}
                      </div>
                    )}
                    <div style={{
                      background: "#161625", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "4px 16px 16px 16px", padding: "14px 16px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{
                          background: actionInfo(msg.parsed.action).bg + "22",
                          border: `1px solid ${actionInfo(msg.parsed.action).bg}55`,
                          color: actionInfo(msg.parsed.action).bg,
                          borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                        }}>{actionInfo(msg.parsed.action).label}</span>
                      </div>
                      {msg.parsed.reply_text && (
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: "#e2e8f0", marginBottom: 8 }}>
                          {msg.parsed.reply_text}
                        </div>
                      )}
                      {msg.parsed.escalation_note && (
                        <div style={{
                          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                          borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#fbbf24", marginTop: 6,
                        }}>
                          🚨 <strong>Owner note:</strong> {msg.parsed.escalation_note}
                        </div>
                      )}
                      {msg.parsed.suggestion && (
                        <div style={{
                          background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)",
                          borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#f9a8d4", marginTop: 6,
                        }}>
                          💡 <strong>Tip:</strong> {msg.parsed.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === "error" && (
                  <div style={{ color: "#f87171", fontSize: 13, padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 8 }}>
                    ⚠️ {msg.content}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13 }}>
                <div style={{
                  display: "flex", gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6",
                      animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
                AutoMark po analizon...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#0a0a0f", display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Shkruaj mesazhin e fanit ose komandën tënde..."
              style={{
                flex: 1, background: "#161625", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14,
                resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, minHeight: 48,
                transition: "border-color 0.2s",
              }}
              rows={1}
              onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              border: "none", borderRadius: 12, padding: "12px 20px",
              color: "white", fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.5 : 1, transition: "all 0.2s",
              fontWeight: 600, whiteSpace: "nowrap",
            }}>
              {loading ? "..." : "Dërgo →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
