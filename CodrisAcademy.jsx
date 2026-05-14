import { useState, useRef, useEffect } from "react";

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"];

const CODRIS_SYSTEM = `You are Codris — an AI coding tutor for Codris Academy by LUMINAR Inc 🇰🇪. You are female, strict but warm, adaptive, and deeply invested in your student's success. You teach HTML, CSS, and JavaScript from scratch, then guide students to their chosen framework (React, Vue, or Angular).

Rules:
- Always address the student by name once you know it
- Give clear, beginner-friendly explanations
- Assign practical tasks after each concept
- If a student is wrong, guide them step by step — never just give the answer
- Adapt your teaching style to how the student learns best
- Track topics covered and push toward daily/weekly goals
- Be encouraging but firm about attendance and effort
- Keep responses concise and mobile-friendly
- Use emojis sparingly but warmly`;

const CURRICULUM = [
  { phase: 1, topic: "HTML Basics", subtopics: ["Structure & tags", "Headings & paragraphs", "Links & images", "Lists & forms"] },
  { phase: 1, topic: "CSS Basics", subtopics: ["Selectors & properties", "Box model", "Flexbox", "Grid layout"] },
  { phase: 1, topic: "JavaScript", subtopics: ["Variables & types", "Functions", "DOM manipulation", "Events"] },
  { phase: 2, topic: "Framework", subtopics: ["React / Vue / Angular"] },
];

// SVG Icons
const Icons = {
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Code: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Close: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Key: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Upload: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
};

// Onboarding Screen
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [schedule, setSchedule] = useState("");
  const [style, setStyle] = useState("");
  const [error, setError] = useState("");

  const testKey = () => {
    if (!apiKey.trim().startsWith("gsk_")) {
      setError("Key should start with gsk_ — double check and try again.");
      return;
    }
    setStep(1);
  };

  const finish = () => {
    if (!name || !time || !schedule || !style) return;
    onComplete({ apiKey: apiKey.trim(), name, time, schedule, style });
  };

  const steps = [
    // Step 0: API Key
    <div key="key" style={styles.onboardCard}>
      <div style={styles.onboardIcon}><Icons.Key /></div>
      <h2 style={styles.onboardTitle}>Power up Codris</h2>
      <p style={styles.onboardSub}>
        Codris runs on Groq — a free AI platform. You'll need a free API key to get started.
      </p>
      <div style={styles.onboardSteps}>
        <p>1. Go to <strong>console.groq.com</strong></p>
        <p>2. Sign up for free</p>
        <p>3. Click <strong>API Keys → Create API Key</strong></p>
        <p>4. Copy and paste it below</p>
      </div>
      <input
        style={styles.input}
        placeholder="gsk_..."
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        type="password"
      />
      {error && <p style={styles.errorText}>{error}</p>}
      <button style={styles.primaryBtn} onClick={testKey} disabled={!apiKey}>
        "Activate Codris →"
      </button>
    </div>,

    // Step 1: Name
    <div key="name" style={styles.onboardCard}>
      <h2 style={styles.onboardTitle}>Hey there! 👋</h2>
      <p style={styles.onboardSub}>I'm Codris, your personal coding tutor. What's your name?</p>
      <input style={styles.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
      <button style={styles.primaryBtn} onClick={() => name && setStep(2)}>Continue →</button>
    </div>,

    // Step 2: Time commitment
    <div key="time" style={styles.onboardCard}>
      <h2 style={styles.onboardTitle}>How much time, {name}?</h2>
      <p style={styles.onboardSub}>How long can you study each day?</p>
      <div style={styles.optionGrid}>
        {["30 minutes", "1 hour", "2 hours", "Custom"].map(t => (
          <button key={t} style={{ ...styles.optionBtn, ...(time === t ? styles.optionBtnActive : {}) }}
            onClick={() => setTime(t)}>{t}</button>
        ))}
      </div>
      {time === "Custom" && (
        <input style={styles.input} placeholder="e.g. 45 minutes" onChange={e => setTime(e.target.value)} />
      )}
      <button style={styles.primaryBtn} onClick={() => time && setStep(3)}>Continue →</button>
    </div>,

    // Step 3: Schedule
    <div key="schedule" style={styles.onboardCard}>
      <h2 style={styles.onboardTitle}>When are you free?</h2>
      <p style={styles.onboardSub}>Pick your daily study time slot</p>
      <div style={styles.optionGrid}>
        {["Morning", "Afternoon", "Evening", "Night"].map(s => (
          <button key={s} style={{ ...styles.optionBtn, ...(schedule === s ? styles.optionBtnActive : {}) }}
            onClick={() => setSchedule(s)}>{s}</button>
        ))}
      </div>
      <button style={styles.primaryBtn} onClick={() => schedule && setStep(4)}>Continue →</button>
    </div>,

    // Step 4: Learning style
    <div key="style" style={styles.onboardCard}>
      <h2 style={styles.onboardTitle}>How do you learn best?</h2>
      <p style={styles.onboardSub}>I'll build your curriculum around this</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["By building projects", "Reading examples then practicing", "Explanation first, then tasks", "I'll tell you as we go"].map(s => (
          <button key={s} style={{ ...styles.optionBtnFull, ...(style === s ? styles.optionBtnActive : {}) }}
            onClick={() => setStyle(s)}>{s}</button>
        ))}
      </div>
      <button style={{ ...styles.primaryBtn, marginTop: 20 }} onClick={finish}>
        Start Learning →
      </button>
    </div>,
  ];

  return (
    <div style={styles.onboardWrap}>
      <div style={styles.onboardLogo}>
        <span style={styles.logoText}>Codris Academy</span>
        <span style={styles.logoBy}>by LUMINAR Inc 🇰🇪</span>
      </div>
      <div style={styles.progressDots}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ ...styles.dot, ...(i <= step ? styles.dotActive : {}) }} />
        ))}
      </div>
      {steps[step]}
    </div>
  );
}

// Chat Page
function ChatPage({ session, onUpdateSession }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`codris_chat_${session.name}`);
    if (saved) return JSON.parse(saved);
    return [{
      role: "assistant",
      content: `Welcome to Codris Academy, ${session.name}! 🎉 I'm Codris, your coding tutor.\n\nBased on what you told me:\n• Study time: ${session.time}/day\n• Schedule: ${session.schedule}s\n• Learning style: ${session.style}\n\nI've prepared a curriculum just for you. We'll start with **HTML** — the backbone of every website.\n\nReady to begin your first lesson? Just say "Let's go!" 🚀`
    }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelIdx, setModelIdx] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(`codris_chat_${session.name}`, JSON.stringify(messages));
  }, [messages, session.name]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    const tryModel = async (idx) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODELS[idx],
          max_tokens: 600,
          messages: [
            { role: "system", content: CODRIS_SYSTEM },
            ...newMsgs.map(m => ({ role: m.role, content: m.content }))
          ]
        })
      });
      if (!res.ok) throw new Error("model_fail");
      const data = await res.json();
      return data.choices[0].message.content;
    };

    try {
      let reply = "";
      for (let i = modelIdx; i < GROQ_MODELS.length; i++) {
        try { reply = await tryModel(i); setModelIdx(i); break; }
        catch { if (i === GROQ_MODELS.length - 1) throw new Error("all_failed"); }
      }
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      // Update XP
      const newXP = (session.xp || 0) + 10;
      const newMsgsCount = (session.totalMessages || 0) + 1;
      onUpdateSession({ xp: newXP, totalMessages: newMsgsCount });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Hmm, I couldn't connect. Check your Groq key or internet and try again." }]);
    }
    setLoading(false);
  };

  const formatMsg = (text) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} style={{ margin: "2px 0", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
    });
  };

  return (
    <div style={styles.chatWrap}>
      <div style={styles.chatHeader}>
        <div style={styles.codrisAvatar}>C</div>
        <div>
          <div style={styles.codrisName}>Codris</div>
          <div style={styles.codrisStatus}>● Online</div>
        </div>
      </div>
      <div style={styles.chatMessages}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{ ...styles.bubble, ...(m.role === "user" ? styles.userBubble : styles.aiBubble) }}>
              {formatMsg(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <div style={styles.typingDots}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={styles.chatInputWrap}>
        <input
          style={styles.chatInput}
          placeholder="Message Codris..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading || !input.trim()}>
          <Icons.Send />
        </button>
      </div>
    </div>
  );
}

// Profile Page
function ProfilePage({ session }) {
  const curriculum = [
    { topic: "HTML Basics", done: (session.xp || 0) > 50 },
    { topic: "CSS Basics", done: (session.xp || 0) > 150 },
    { topic: "JavaScript", done: (session.xp || 0) > 300 },
    { topic: "Framework", done: false },
  ];
  const xp = session.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const streak = session.streak || 1;
  const msgs = session.totalMessages || 0;

  return (
    <div style={styles.profileWrap}>
      <div style={styles.profileHero}>
        <div style={styles.profileAvatar}>{session.name?.[0]?.toUpperCase()}</div>
        <div style={styles.profileName}>{session.name}</div>
        <div style={styles.profileBadge}>Level {level} Developer</div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{xp}</div>
          <div style={styles.statLabel}>XP Earned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{streak}</div>
          <div style={styles.statLabel}>Day Streak 🔥</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{msgs}</div>
          <div style={styles.statLabel}>Messages</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{session.time?.split(" ")[0] || "—"}</div>
          <div style={styles.statLabel}>hrs/day goal</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>XP Progress</div>
        <div style={styles.xpBar}>
          <div style={{ ...styles.xpFill, width: `${xpInLevel}%` }} />
        </div>
        <div style={styles.xpLabel}>{xpInLevel}/100 to Level {level + 1}</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Curriculum</div>
        {curriculum.map((c, i) => (
          <div key={i} style={styles.currItem}>
            <div style={{ ...styles.currDot, background: c.done ? "#22c55e" : "#e5e7eb" }} />
            <span style={{ ...styles.currLabel, color: c.done ? "#111" : "#9ca3af", textDecoration: c.done ? "line-through" : "none" }}>
              {c.topic}
            </span>
            {c.done && <span style={styles.doneTag}>✓ Done</span>}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Schedule</div>
        <div style={styles.scheduleCard}>
          <span>📅 {session.schedule}s</span>
          <span>⏱ {session.time}/day</span>
        </div>
      </div>
    </div>
  );
}

// IDE Page
function IDEPage() {
  const [files, setFiles] = useState([
    { name: "index.html", content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Welcome to Codris Academy</p>\n  <script src=\"script.js\"></script>\n</body>\n</html>", lang: "html" },
    { name: "style.css", content: "body {\n  font-family: sans-serif;\n  background: #f9f9f9;\n  color: #333;\n  padding: 20px;\n}\n\nh1 {\n  color: #111;\n}", lang: "css" },
    { name: "script.js", content: "// Your JavaScript here\nconsole.log('Hello from Codris Academy!');", lang: "js" },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState("code"); // code | preview
  const [showPreview, setShowPreview] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [consoleLog, setConsoleLog] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const fileInput = useRef(null);

  const activeFile = files[activeIdx];

  const getPreviewSrc = () => {
    const html = files.find(f => f.name.endsWith(".html"))?.content || "";
    const css = files.find(f => f.name.endsWith(".css"))?.content || "";
    const js = files.find(f => f.name.endsWith(".js"))?.content || "";
    return `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html.replace(/<!DOCTYPE.*?>|<html>|<\/html>|<head>[\s\S]*?<\/head>|<body>|<\/body>/gi, "")}<script>
      const _log = console.log;
      const _err = console.error;
      const logs = [];
      console.log = (...a) => { logs.push({type:'log',msg:a.join(' ')}); _log(...a); window.parent.postMessage({type:'console',logs},'*'); };
      console.error = (...a) => { logs.push({type:'err',msg:a.join(' ')}); _err(...a); window.parent.postMessage({type:'console',logs},'*'); };
      try { ${js} } catch(e){ console.error(e.message); }
    <\/script></body></html>`;
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "console") setConsoleLog(e.data.logs);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const addFile = () => {
    const name = prompt("File name (e.g. about.html):");
    if (!name) return;
    const lang = name.endsWith(".css") ? "css" : name.endsWith(".js") ? "js" : "html";
    setFiles(prev => [...prev, { name, content: "", lang }]);
    setActiveIdx(files.length);
  };

  const removeFile = (i) => {
    if (files.length === 1) return;
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setActiveIdx(0);
  };

  const exportFile = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = activeFile.name;
    a.click();
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lang = file.name.endsWith(".css") ? "css" : file.name.endsWith(".js") ? "js" : "html";
      setFiles(prev => [...prev, { name: file.name, content: ev.target.result, lang }]);
      setActiveIdx(files.length);
    };
    reader.readAsText(file);
  };

  const startRename = (i) => { setRenaming(i); setRenameVal(files[i].name); };
  const finishRename = () => {
    if (renameVal.trim()) {
      setFiles(prev => prev.map((f, i) => i === renaming ? { ...f, name: renameVal.trim() } : f));
    }
    setRenaming(null);
  };

  const getLangColor = (lang) => ({ html: "#e34c26", css: "#264de4", js: "#f7df1e" }[lang] || "#888");

  return (
    <div style={styles.ideWrap}>
      {/* Toolbar */}
      <div style={styles.ideToolbar}>
        <div style={styles.ideTabs}>
          {files.map((f, i) => (
            <div key={i} style={{ ...styles.ideTab, ...(i === activeIdx ? styles.ideTabActive : {}) }}
              onClick={() => setActiveIdx(i)}>
              <div style={{ ...styles.fileDot, background: getLangColor(f.lang) }} />
              {renaming === i ? (
                <input style={styles.renameInput} value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={finishRename} onKeyDown={e => e.key === "Enter" && finishRename()}
                  autoFocus />
              ) : (
                <span onDoubleClick={() => startRename(i)}>{f.name}</span>
              )}
              {files.length > 1 && (
                <button style={styles.tabClose} onClick={e => { e.stopPropagation(); removeFile(i); }}>
                  <Icons.Close />
                </button>
              )}
            </div>
          ))}
          <button style={styles.addTabBtn} onClick={addFile}><Icons.Plus /></button>
        </div>
        <div style={styles.ideActions}>
          <button style={styles.ideActionBtn} onClick={() => startRename(activeIdx)} title="Rename"><Icons.Edit /></button>
          <button style={styles.ideActionBtn} onClick={exportFile} title="Export"><Icons.Download /></button>
          <button style={styles.ideActionBtn} onClick={() => fileInput.current.click()} title="Import"><Icons.Upload /></button>
          <input ref={fileInput} type="file" style={{ display: "none" }} onChange={importFile} />
          <button style={{ ...styles.playBtn }} onClick={() => setView(view === "preview" ? "code" : "preview")}>
            {view === "preview" ? <Icons.Code /> : <><Icons.Play /><span style={{ marginLeft: 4, fontSize: 12 }}>Run</span></>}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div style={styles.editorArea}>
        {view === "code" ? (
          <textarea
            style={styles.codeEditor}
            value={activeFile.content}
            onChange={e => setFiles(prev => prev.map((f, i) => i === activeIdx ? { ...f, content: e.target.value } : f))}
            spellCheck={false}
          />
        ) : (
          <iframe
            title="preview"
            style={styles.previewFrame}
            srcDoc={getPreviewSrc()}
            sandbox="allow-scripts"
          />
        )}
      </div>

      {/* Console Toggle */}
      <div style={styles.consoleBar}>
        <button style={styles.consoleToggle} onClick={() => setShowConsole(!showConsole)}>
          Console {consoleLog.length > 0 && `(${consoleLog.length})`}
        </button>
        {showConsole && (
          <div style={styles.consolePanel}>
            {consoleLog.length === 0 ? <span style={{ color: "#666" }}>No output yet. Run your code first.</span>
              : consoleLog.map((l, i) => (
                <div key={i} style={{ color: l.type === "err" ? "#f87171" : "#86efac", fontSize: 13, marginBottom: 4 }}>
                  {l.type === "err" ? "✗ " : "› "}{l.msg}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main App
export default function CodrisAcademy() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("codris_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState("chat");

  const handleOnboard = (data) => {
    const s = { ...data, xp: 0, streak: 1, totalMessages: 0 };
    localStorage.setItem("codris_session", JSON.stringify(s));
    setSession(s);
  };

  const updateSession = (updates) => {
    setSession(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("codris_session", JSON.stringify(next));
      return next;
    });
  };

  if (!session) return <OnboardingScreen onComplete={handleOnboard} />;

  return (
    <div style={styles.app}>
      <div style={styles.content}>
        {page === "chat" && <ChatPage session={session} onUpdateSession={updateSession} />}
        {page === "profile" && <ProfilePage session={session} />}
        {page === "ide" && <IDEPage />}
      </div>
      <nav style={styles.nav}>
        {[
          { id: "chat", label: "Chat", Icon: Icons.Chat },
          { id: "profile", label: "Profile", Icon: Icons.Profile },
          { id: "ide", label: "IDE", Icon: Icons.Code },
        ].map(({ id, label, Icon }) => (
          <button key={id} style={{ ...styles.navBtn, ...(page === id ? styles.navBtnActive : {}) }}
            onClick={() => setPage(id)}>
            <Icon />
            <span style={styles.navLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  app: { display: "flex", flexDirection: "column", height: "100vh", background: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  content: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },

  // Nav
  nav: { display: "flex", borderTop: "1px solid #f1f1f1", background: "#fff", padding: "8px 0 4px" },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: "6px 0", transition: "color 0.2s" },
  navBtnActive: { color: "#111" },
  navLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 0.5 },

  // Onboarding
  onboardWrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#fafafa" },
  onboardLogo: { textAlign: "center", marginBottom: 24 },
  logoText: { display: "block", fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 },
  logoBy: { fontSize: 12, color: "#888", marginTop: 2 },
  progressDots: { display: "flex", gap: 6, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#e5e7eb", transition: "background 0.3s" },
  dotActive: { background: "#111" },
  onboardCard: { width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  onboardIcon: { width: 48, height: 48, background: "#f4f4f4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  onboardTitle: { fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px", letterSpacing: -0.3 },
  onboardSub: { fontSize: 14, color: "#666", margin: "0 0 20px", lineHeight: 1.6 },
  onboardSteps: { background: "#f9f9f9", borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, color: "#444", lineHeight: 2 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit" },
  primaryBtn: { width: "100%", padding: "13px", background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 10 },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  optionBtn: { padding: "12px 8px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s" },
  optionBtnFull: { padding: "13px 16px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, textAlign: "left", transition: "all 0.2s" },
  optionBtnActive: { border: "1.5px solid #111", background: "#111", color: "#fff" },

  // Chat
  chatWrap: { display: "flex", flexDirection: "column", height: "100%", background: "#fff" },
  chatHeader: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f1f1f1" },
  codrisAvatar: { width: 38, height: 38, borderRadius: "50%", background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 },
  codrisName: { fontWeight: 700, fontSize: 15, color: "#111" },
  codrisStatus: { fontSize: 12, color: "#22c55e" },
  chatMessages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" },
  bubble: { maxWidth: "80%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6 },
  userBubble: { background: "#111", color: "#fff", borderBottomRightRadius: 4 },
  aiBubble: { background: "#f4f4f4", color: "#111", borderBottomLeftRadius: 4 },
  typingDots: { display: "flex", gap: 5, alignItems: "center", padding: "4px 0" },
  chatInputWrap: { display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid #f1f1f1", alignItems: "center" },
  chatInput: { flex: 1, padding: "11px 14px", borderRadius: 22, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit" },
  sendBtn: { width: 40, height: 40, borderRadius: "50%", background: "#111", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  // Profile
  profileWrap: { overflowY: "auto", padding: "0 0 80px" },
  profileHero: { background: "linear-gradient(135deg, #111 0%, #333 100%)", padding: "36px 24px 28px", textAlign: "center", backdropFilter: "blur(10px)" },
  profileAvatar: { width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: -0.3 },
  profileBadge: { display: "inline-block", marginTop: 8, padding: "4px 12px", background: "rgba(255,255,255,0.15)", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 600 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "20px 16px 0" },
  statCard: { background: "#f9f9f9", borderRadius: 14, padding: "16px 12px", textAlign: "center", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.5)" },
  statVal: { fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -1 },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4, fontWeight: 600 },
  section: { padding: "20px 16px 0" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  xpBar: { height: 10, background: "#f1f1f1", borderRadius: 10, overflow: "hidden", marginBottom: 6 },
  xpFill: { height: "100%", background: "#111", borderRadius: 10, transition: "width 0.5s" },
  xpLabel: { fontSize: 12, color: "#888" },
  currItem: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  currDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  currLabel: { fontSize: 14, fontWeight: 500, flex: 1 },
  doneTag: { fontSize: 11, color: "#22c55e", fontWeight: 700 },
  scheduleCard: { display: "flex", gap: 16, background: "#f9f9f9", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#444", fontWeight: 500 },

  // IDE
  ideWrap: { display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" },
  ideToolbar: { background: "#252526", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 0 0", overflowX: "auto" },
  ideTabs: { display: "flex", alignItems: "center", overflowX: "auto", flex: 1 },
  ideTab: { display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", cursor: "pointer", color: "#888", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "all 0.2s", flexShrink: 0 },
  ideTabActive: { color: "#fff", borderBottom: "2px solid #fff" },
  fileDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  tabClose: { background: "none", border: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 },
  addTabBtn: { background: "none", border: "none", color: "#666", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" },
  ideActions: { display: "flex", gap: 6, alignItems: "center", flexShrink: 0 },
  ideActionBtn: { background: "none", border: "none", color: "#888", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" },
  playBtn: { display: "flex", alignItems: "center", background: "#22c55e", border: "none", color: "#fff", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  editorArea: { flex: 1, overflow: "hidden" },
  codeEditor: { width: "100%", height: "100%", background: "#1e1e1e", color: "#d4d4d4", border: "none", outline: "none", padding: 16, fontSize: 13, fontFamily: "'Fira Code', 'Courier New', monospace", lineHeight: 1.7, resize: "none", boxSizing: "border-box", tabSize: 2 },
  previewFrame: { width: "100%", height: "100%", border: "none", background: "#fff" },
  renameInput: { background: "transparent", border: "none", color: "#fff", fontSize: 12, width: 80, outline: "1px solid #555", padding: "1px 4px" },
  consoleBar: { background: "#1a1a1a", borderTop: "1px solid #333" },
  consoleToggle: { background: "none", border: "none", color: "#888", fontSize: 12, padding: "8px 16px", cursor: "pointer", width: "100%", textAlign: "left" },
  consolePanel: { padding: "8px 16px 12px", maxHeight: 120, overflowY: "auto" },
};
