import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are AJ Mode — a sharp, no-bullshit daily business advisor built specifically for AJ Washington.

AJ's full context:
- Founder of Phlote: music infrastructure company that acquires independent artist catalogs, deploys them for usage licensing (apps, AI training, UGC content, sync), and compounds royalty income. White/navy brand. Raising institutional investment now.
- Creator of AJ Mode: this product — a daily practice advisor for founders and artists
- North star: Best asset maker in the world
- 90-day target: $50K/month passive income through Phlote + AJ Mode
- AJ's "Ben Simmons" (load-bearing weakness): making assets rights-clear and programmable

The 5 characteristics of a minimum viable asset:
1. Functional
2. Reusable by others
3. Rights-clear and programmable
4. Attached to a real audience
5. Stems available

AJ's Daily 5 (90 min total deliberate practice):
1. Move Phlote forward — one concrete action (30 min)
2. Make or release an asset (20 min)
3. Make it deployable — rights-clear, programmable (15 min)
4. Document + post — the work IS the content (15 min)
5. Log it. Chain updates. Tomorrow's one thing. (5 min)

Active priorities:
- Harry Fraud deal: 300 tracks, $25K, 1.25M listeners — closing this week
- Murda Beatz: potential NYC meeting
- Investors: Randy Wade / EIG (message sent), John Morrison, Brian Jacobs, Mark Hastings, Jun Cho
- Ben Horowitz play: path through Steve Stoute or QJ3
- LinkedIn: "Fuck Listeners. Get Users." post ready to publish
- AJ Mode launch: $99/mo to 720-person Phlote list

Your role:
1. END OF DAY RECAP PARTNER — AJ sends what he did, links, wins, misses. Score against Daily 5. Tell him what mattered.
2. TODO LIST MANAGER — Organize into NOW / THIS WEEK / LATER. Sharp comment on each. Flag what to cut.
3. OPPORTUNITY SPOTTER — Signal or noise? Does it move the 90-day target? Say so directly.
4. PRACTICE COACH — Hold the Daily 5 standard. If something didn't ship, ask why.
5. LINK REVIEWER — Assess asset quality using the 5-characteristic framework.

Tone: Direct. Warm. Like a great GM talking to their best player. Short sentences. No filler. No "Great question!" ever.
Always end with exactly ONE thing: a question OR a clear next action. Never both. Never neither.`;

const C = {
    navy: "#0B2545",
    gold: "#B8963E",
    white: "#FFFFFF",
    off: "#F0F2F6",
    mid: "#7A8AA0",
    rule: "#D1D9E6",
    text: "#1A2A3A",
};

const serif = "'Georgia', 'Times New Roman', serif";
const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'Courier New', Courier, monospace";

const QUICK_ACTIONS = [
    "End of day recap",
    "Update my todo list",
    "New opportunity",
    "Prioritize tomorrow",
    "Score my week",
];

function getTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function TypingDots() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "14px 16px" }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.mid,
                    animation: `ajDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
            ))}
        </div>
    );
}

function Avatar({ role }) {
    return (
        <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: role === "user" ? C.navy : C.gold,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: sans, fontSize: 10, fontWeight: 700, color: C.white,
            letterSpacing: 0.5, marginTop: 3,
        }}>
            {role === "user" ? "AJ" : "AM"}
        </div>
    );
}

function Message({ msg, animate }) {
    const isUser = msg.role === "user";
    return (
        <div style={{
            display: "flex",
            flexDirection: isUser ? "row-reverse" : "row",
            gap: 10, marginBottom: 18, alignItems: "flex-start",
            animation: animate ? "ajFade 0.3s ease-out" : "none",
        }}>
            <Avatar role={msg.role} />
            <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                    background: isUser ? C.navy : C.white,
                    border: isUser ? "none" : `1px solid ${C.rule}`,
                    padding: "13px 16px",
                    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    color: isUser ? "rgba(255,255,255,0.93)" : C.text,
                    fontFamily: sans, fontSize: 14, lineHeight: 1.72,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                    {msg.content}
                </div>
                <div style={{ fontFamily: sans, fontSize: 10, color: C.mid, marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                    {msg.time}
                </div>
            </div>
        </div>
    );
}

export default function AJMode() {
    const [messages, setMessages] = useState([{
        role: "assistant",
        content: "AJ Mode online.\n\nEnd of day — what moved? Drop your links, your wins, what's still open. I'll tell you where you stand and what's next.",
        time: getTime(),
        id: "init",
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [latestId, setLatestId] = useState(null);
    const historyRef = useRef([]);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const send = async (text) => {
        const content = (text || input).trim();
        if (!content || loading) return;
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        const userMsg = { role: "user", content, time: getTime(), id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        historyRef.current = [...historyRef.current, { role: "user", content }];
        setLoading(true);

        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    system: SYSTEM_PROMPT,
                    messages: historyRef.current,
                }),
            });

            const data = await res.json();
            const reply = data.content?.[0]?.text || "Something went wrong. Try again.";
            historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];

            const id = Date.now() + 1;
            setLatestId(id);
            setMessages(prev => [...prev, { role: "assistant", content: reply, time: getTime(), id }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant", content: "Connection error. Check your network.",
                time: getTime(), id: Date.now() + 1,
            }]);
        }
        setLoading(false);
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.off, fontFamily: sans }}>
            <style>{`
        @keyframes ajDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes ajFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea { outline: none; font-family: inherit; }
        textarea::placeholder { color: ${C.mid}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${C.rule}; border-radius: 2px; }
      `}</style>

            {/* Header */}
            <div style={{ background: C.navy, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 700, color: C.white }}>AM</div>
                    <div>
                        <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: C.white, letterSpacing: 0.3 }}>AJ Mode</div>
                        <div style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Daily Practice Advisor</div>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.gold }}>USER #1</div>
                    <div style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>90 days → $50K/mo</div>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>
                <div style={{ maxWidth: 680, margin: "0 auto" }}>
                    {messages.map(msg => <Message key={msg.id} msg={msg} animate={msg.id === latestId} />)}
                    {loading && (
                        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "flex-start" }}>
                            <Avatar role="assistant" />
                            <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: "4px 16px 16px 16px" }}>
                                <TypingDots />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Quick actions */}
            <div style={{ padding: "8px 16px 6px", background: C.off }}>
                <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                    {QUICK_ACTIONS.map(a => (
                        <button key={a} onClick={() => send(a)} style={{
                            padding: "6px 13px", borderRadius: 20,
                            border: `1px solid ${C.rule}`, background: C.white,
                            color: C.mid, fontFamily: sans, fontSize: 11,
                            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.color = C.mid; }}
                        >{a}</button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div style={{ background: C.white, borderTop: `1px solid ${C.rule}`, padding: "12px 16px", flexShrink: 0 }}>
                <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 130) + "px";
                        }}
                        onKeyDown={handleKey}
                        placeholder="Drop your end of day recap, links, todos, new opportunities..."
                        rows={1}
                        style={{
                            flex: 1, padding: "11px 15px",
                            border: `1.5px solid ${C.rule}`, borderRadius: 12,
                            fontSize: 14, color: C.text, lineHeight: 1.6,
                            resize: "none", background: C.off,
                            minHeight: 44, maxHeight: 130,
                            transition: "border-color 0.15s",
                        }}
                        onFocus={e => e.target.style.borderColor = C.navy}
                        onBlur={e => e.target.style.borderColor = C.rule}
                    />
                    <button
                        onClick={() => send()}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
                            background: input.trim() && !loading ? C.navy : C.rule,
                            color: C.white, cursor: input.trim() && !loading ? "pointer" : "default",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background 0.15s", fontSize: 18,
                        }}
                    >→</button>
                </div>
            </div>
        </div>
    );
}