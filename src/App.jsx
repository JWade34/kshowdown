import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PLAYERS = ["J$", "K$", "Nydda", "H20", "Chaco"];
const COLORS = {
  "J$":    { bg: "#FF6B6B", text: "#fff", glow: "rgba(255,107,107,.4)" },
  "K$":    { bg: "#FFD93D", text: "#111", glow: "rgba(255,217,61,.4)" },
  "Nydda": { bg: "#6BCB77", text: "#fff", glow: "rgba(107,203,119,.4)" },
  "H20":   { bg: "#4D96FF", text: "#fff", glow: "rgba(77,150,255,.4)" },
  "Chaco": { bg: "#FF6FC8", text: "#fff", glow: "rgba(255,111,200,.4)" },
};
const ROUND_NAMES = ["R64", "R32", "Sweet 16", "Elite 8", "Final Four", "\u{1F3C6}"];
const ROUND_PTS   = [1, 2, 4, 8, 16, 32];

const TEAMS = {
  East: [
    ["Duke",1],["Mount St. Mary's",16],["Alabama",8],["Robert Morris",9],
    ["Baylor",5],["VCU",12],["SMU",4],["McNeese",13],
    ["Michigan",3],["UC San Diego",14],["Marquette",6],["New Mexico",11],
    ["Texas Tech",7],["NC State",10],["Kentucky",2],["Troy",15],
  ],
  West: [
    ["Arizona",1],["Norfolk St.",16],["Memphis",8],["Colorado St.",9],
    ["Clemson",5],["Drake",12],["Boise St.",4],["Akron",13],
    ["Iowa St.",3],["Lipscomb",14],["Mississippi St.",6],["New Mexico St.",11],
    ["Mizzou",7],["Texas",10],["Tennessee",2],["Wofford",15],
  ],
  South: [
    ["Florida",1],["Norfolk St.",16],["UConn",8],["Oklahoma",9],
    ["Memphis",5],["Colorado",12],["Maryland",4],["Grand Canyon",13],
    ["Texas A&M",3],["Yale",14],["Ole Miss",6],["Liberty",11],
    ["Purdue",7],["High Point",10],["St. John's",2],["Omaha",15],
  ],
  Midwest: [
    ["Michigan",1],["American",16],["Gonzaga",8],["Georgia",9],
    ["Oregon",5],["Liberty",12],["UCLA",4],["Morehead St.",13],
    ["Kansas",3],["Little Rock",14],["Illinois",6],["Arkansas",11],
    ["Auburn",7],["Vanderbilt",10],["Wisconsin",2],["Montana",15],
  ],
};

function buildR1(region) {
  const t = TEAMS[region];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${region}-0-${i}`,
    tA: { n: t[i*2][0], s: t[i*2][1] },
    tB: { n: t[i*2+1][0], s: t[i*2+1][1] },
  }));
}

function getSeed(name) {
  for (const teams of Object.values(TEAMS)) {
    const f = teams.find(x => x[0] === name);
    if (f) return f[1];
  }
  return "?";
}

function getRegionRounds(region, picks, ap) {
  const all = [buildR1(region)];
  for (let r = 1; r < 6; r++) {
    const prev = all[r - 1];
    const next = Array.from({ length: Math.floor(prev.length / 2) }, (_, i) => {
      const gA = prev[i*2], gB = prev[i*2+1];
      const wA = picks[ap]?.[gA.id], wB = picks[ap]?.[gB.id];
      return {
        id: `${region}-${r}-${i}`,
        tA: wA ? { n: wA, s: getSeed(wA) } : null,
        tB: wB ? { n: wB, s: getSeed(wB) } : null,
      };
    });
    all.push(next);
  }
  return all;
}

function initPicks() {
  const p = {};
  PLAYERS.forEach(pl => { p[pl] = {}; });
  return p;
}

export default function KShowdown() {
  const [picks,     setPicks]     = useState(initPicks);
  const [ap,        setAp]        = useState("J$");
  const [tab,       setTab]       = useState("bracket");
  const [region,    setRegion]    = useState("East");
  const [liveGames, setLiveGames] = useState([]);
  const [confetti,  setConfetti]  = useState([]);
  const [toast,     setToast]     = useState(null);
  const [syncing,   setSyncing]   = useState(false);
  const [online,    setOnline]    = useState(true);
  const toastTimer = useRef(null);

  useEffect(() => {
    loadAllPicks();
    subscribeToRealtime();
    fetchLiveScores();
    const t = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(t);
  }, []);

  async function loadAllPicks() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.from("picks").select("*");
      if (error) throw error;
      const rebuilt = initPicks();
      data.forEach(row => {
        if (rebuilt[row.player]) rebuilt[row.player][row.game_id] = row.team_name;
      });
      setPicks(rebuilt);
      setOnline(true);
    } catch (e) {
      console.error("Load error:", e);
      setOnline(false);
    } finally {
      setSyncing(false);
    }
  }

  function subscribeToRealtime() {
    supabase
      .channel("picks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, payload => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (payload.eventType === "DELETE") {
          setPicks(prev => {
            const next = { ...prev, [row.player]: { ...prev[row.player] } };
            delete next[row.player][row.game_id];
            return next;
          });
        } else {
          setPicks(prev => ({
            ...prev,
            [row.player]: { ...prev[row.player], [row.game_id]: row.team_name },
          }));
        }
      })
      .subscribe();
  }

  async function fetchLiveScores() {
    try {
      const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=50");
      const d = await r.json();
      setLiveGames(d?.events?.slice(0, 8) || []);
    } catch {}
  }

  async function makePick(rn, ri, gi, teamName) {
    const gameId = `${rn}-${ri}-${gi}`;
    const old = picks[ap]?.[gameId];
    setPicks(prev => {
      const next = { ...prev, [ap]: { ...prev[ap], [gameId]: teamName } };
      if (old && old !== teamName) {
        const cleaned = { ...next[ap] };
        for (let r = ri + 1; r < 6; r++) {
          Object.keys(cleaned).forEach(k => {
            if (k.startsWith(`${rn}-${r}-`) && cleaned[k] === old) delete cleaned[k];
          });
        }
        next[ap] = cleaned;
      }
      return next;
    });
    burst();
    showToast(`${ap} picked ${teamName}!`);
    try {
      await supabase.from("picks").upsert(
        { player: ap, game_id: gameId, team_name: teamName, updated_at: new Date().toISOString() },
        { onConflict: "player,game_id" }
      );
      if (old && old !== teamName) {
        const toDelete = [];
        for (let r = ri + 1; r < 6; r++) {
          Object.keys(picks[ap] || {}).forEach(k => {
            if (k.startsWith(`${rn}-${r}-`) && picks[ap][k] === old) toDelete.push(k);
          });
        }
        if (toDelete.length > 0) {
          await supabase.from("picks").delete().eq("player", ap).in("game_id", toDelete);
        }
      }
      setOnline(true);
    } catch (e) {
      console.error("Upsert error:", e);
      setOnline(false);
    }
  }

  async function resetPlayer() {
    if (!window.confirm(`Reset ALL picks for ${ap}?`)) return;
    setPicks(prev => ({ ...prev, [ap]: {} }));
    try {
      await supabase.from("picks").delete().eq("player", ap);
      showToast(`${ap} picks cleared`);
    } catch (e) { console.error("Reset error:", e); }
  }

  function burst() {
    const clrs = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF6FC8"];
    setConfetti(Array.from({ length: 22 }, (_, i) => ({
      id: Date.now() + i, x: 5 + Math.random() * 90,
      c: clrs[i % 5], d: Math.random() * 0.35, circle: Math.random() > 0.5,
    })));
    setTimeout(() => setConfetti([]), 1400);
  }

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const rounds = getRegionRounds(region, picks, ap);
  const cl = COLORS[ap];
  const scores = {};
  PLAYERS.forEach(p => { scores[p] = Object.keys(picks[p] || {}).length; });
  const sorted = [...PLAYERS].sort((a, b) => scores[b] - scores[a]);
  const maxSc  = Math.max(...Object.values(scores), 1);
  const medals = ["\u{1F947}","\u{1F948}","\u{1F949}","4\uFE0F\u20E3","5\uFE0F\u20E3"];

  return (
    <div style={{ minHeight:"100vh", background:"#080810", color:"#fff", fontFamily:"'Bebas Neue',Impact,sans-serif", overflowX:"hidden", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@500;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:#FFD93D44;border-radius:2px;}
        @keyframes fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(140px) rotate(540deg);opacity:0}}
        @keyframes sh{0%,100%{background-position:0%}50%{background-position:100%}}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toast{0%,85%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        .tb{cursor:pointer;border:none;font-family:'Bebas Neue',Impact,sans-serif;transition:all .14s;}
        .tb:hover{filter:brightness(1.2);} .tb:active{transform:scale(.95);}
        .tr{cursor:pointer;border:none;transition:all .12s;font-family:'DM Sans',sans-serif;}
        .tr:hover{transform:translateX(2px);filter:brightness(1.12);} .tr:active{transform:scale(.97);}
      `}</style>

      {confetti.map(c => <div key={c.id} style={{ position:"fixed", top:"35%", left:`${c.x}%`, width:8, height:8, borderRadius:c.circle?"50%":"2px", background:c.c, animation:`fall .95s ease-in ${c.d}s both`, zIndex:9999, pointerEvents:"none" }} />)}
      {toast && <div style={{ position:"fixed", top:20, left:"50%", background:"#1a1a2e", border:`1px solid ${cl.bg}`, borderRadius:8, padding:"8px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:cl.bg, zIndex:9998, whiteSpace:"nowrap", animation:"toast 2.2s ease forwards", boxShadow:`0 4px 20px ${cl.glow}` }}>{toast}</div>}

      <div style={{ height:4, background:"linear-gradient(90deg,#FF6B6B,#FFD93D,#6BCB77,#4D96FF,#FF6FC8,#FF6B6B)", backgroundSize:"300%", animation:"sh 3s linear infinite" }} />

      <div style={{ padding:"18px 20px 4px", textAlign:"center", position:"relative" }}>
        <div style={{ fontSize:"clamp(44px,11vw,90px)", letterSpacing:"6px", lineHeight:1, background:"linear-gradient(90deg,#FFD93D,#FF6B6B,#FF6FC8,#FFD93D)", backgroundSize:"300%", animation:"sh 4s linear infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>K$ SHOWDOWN</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(10px,2.5vw,13px)", letterSpacing:"7px", color:"#333", marginTop:4 }}>MARCH MADNESS 2026</div>
        <div style={{ position:"absolute", top:18, right:20, display:"flex", alignItems:"center", gap:6, fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
          {syncing ? (<><div style={{ width:8, height:8, borderRadius:"50%", border:"2px solid #FFD93D", borderTopColor:"transparent", animation:"spin .7s linear infinite" }} /><span style={{ color:"#555" }}>syncing</span></>) : (<><div style={{ width:8, height:8, borderRadius:"50%", background:online?"#6BCB77":"#FF6B6B", animation:"pulse 2s infinite" }} /><span style={{ color:online?"#6BCB77":"#FF6B6B" }}>{online?"live":"offline"}</span></>)}
        </div>
      </div>

      {liveGames.length > 0 && (
        <div style={{ padding:"10px 20px", overflowX:"auto", borderBottom:"1px solid #111", whiteSpace:"nowrap" }}>
          <div style={{ display:"inline-flex", gap:8 }}>
            {liveGames.map((g, i) => {
              const comp=g.competitions?.[0], h=comp?.competitors?.find(t=>t.homeAway==="home"), a=comp?.competitors?.find(t=>t.homeAway==="away"), live=g.status?.type?.state==="in";
              return (<div key={i} style={{ display:"inline-block", background:live?"rgba(255,107,107,.1)":"rgba(255,255,255,.04)", border:live?"1px solid rgba(255,107,107,.4)":"1px solid #111", borderRadius:8, padding:"6px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:12, minWidth:100 }}>
                {live && <div style={{ color:"#FF6B6B", fontSize:9, letterSpacing:2, marginBottom:2 }}>● LIVE</div>}
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}><span style={{ color:"#555" }}>{a?.team?.abbreviation}</span><b>{a?.score||"-"}</b></div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}><span style={{ color:"#555" }}>{h?.team?.abbreviation}</span><b>{h?.score||"-"}</b></div>
              </div>);
            })}
          </div>
        </div>
      )}

      <div style={{ padding:"14px 20px 6px", display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {PLAYERS.map(p => { const c=COLORS[p],active=ap===p; return (<button key={p} className="tb" onClick={()=>setAp(p)} style={{ background:active?c.bg:"rgba(255,255,255,.06)", color:active?c.text:"#444", border:active?`2px solid ${c.bg}`:"2px solid transparent", borderRadius:40, padding:"8px 22px", fontSize:"clamp(15px,4vw,21px)", letterSpacing:"2px", transform:active?"translateY(-3px) scale(1.06)":"scale(1)", boxShadow:active?`0 6px 24px ${c.glow}`:"none" }}>{p}</button>); })}
      </div>

      <div style={{ display:"flex", padding:"8px 20px 0", gap:4, justifyContent:"center" }}>
        {["bracket","leaderboard"].map(t => (<button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"10px 30px", fontSize:"clamp(13px,3.5vw,18px)", letterSpacing:"3px", background:tab===t?"#FFD93D":"transparent", color:tab===t?"#111":"#333", borderRadius:t==="bracket"?"10px 0 0 0":"0 10px 0 0" }}>{t.toUpperCase()}</button>))}
      </div>
      <div style={{ height:2, background:"linear-gradient(90deg,#FFD93D55,#FF6B6B55,#FF6FC855,#4D96FF55)" }} />

      {tab==="bracket" && (
        <div style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
            {["East","West","South","Midwest"].map(r => (<button key={r} className="tb" onClick={()=>setRegion(r)} style={{ padding:"6px 18px", fontSize:"clamp(11px,3vw,15px)", letterSpacing:"2px", background:region===r?"#FF6B6B":"rgba(255,255,255,.05)", color:region===r?"#fff":"#444", borderRadius:6, border:region===r?"none":"1px solid #111" }}>{r.toUpperCase()}</button>))}
            <button className="tb" onClick={resetPlayer} style={{ marginLeft:"auto", padding:"6px 14px", fontSize:"clamp(10px,2.5vw,12px)", letterSpacing:"2px", background:"rgba(255,107,107,.12)", color:"#FF6B6B", border:"1px solid rgba(255,107,107,.3)", borderRadius:6 }}>RESET {ap}</button>
          </div>
          <div style={{ fontSize:"clamp(20px,6vw,40px)", letterSpacing:"4px", marginBottom:14, background:"linear-gradient(90deg,#FFD93D,#FF6B6B)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{region.toUpperCase()} REGION</div>
          <div style={{ overflowX:"auto", paddingBottom:16 }}>
            <div style={{ display:"flex", gap:8, minWidth:700, alignItems:"flex-start" }}>
              {rounds.map((games, ri) => {
                const gap = Math.pow(2,ri)*74-74+10;
                return (<div key={ri} style={{ flex:1, minWidth:105, display:"flex", flexDirection:"column" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"2px", color:"#333", marginBottom:8, textAlign:"center", height:32, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>{ROUND_NAMES[ri]}<br/><span style={{ color:"#FFD93D" }}>+{ROUND_PTS[ri]}pt</span></div>
                  <div style={{ display:"flex", flexDirection:"column" }}>
                    {games.map((game, gi) => (
                      <div key={game.id} style={{ marginTop:gi===0?0:`${gap}px`, display:"flex", flexDirection:"column", gap:2 }}>
                        {[game.tA, game.tB].map((team, ti) => {
                          if (!team) return <div key={ti} style={{ height:34, background:"rgba(255,255,255,.025)", border:"1px dashed #111", borderRadius:6, marginBottom:1 }} />;
                          const mp=picks[ap]?.[game.id]===team.n, otherP=PLAYERS.filter(p=>p!==ap&&picks[p]?.[game.id]===team.n);
                          return (<button key={ti} className="tr" onClick={()=>makePick(region,ri,gi,team.n)} style={{ background:mp?`linear-gradient(90deg,${cl.bg}ee,${cl.bg}88)`:"rgba(255,255,255,.05)", border:mp?`1.5px solid ${cl.bg}`:"1.5px solid #111", borderRadius:6, padding:"5px 8px", display:"flex", alignItems:"center", gap:5, color:mp?cl.text:"#bbb", width:"100%", boxShadow:mp?`0 2px 14px ${cl.glow}`:"none", textAlign:"left", marginBottom:1 }}>
                            <span style={{ fontSize:9, fontWeight:800, background:mp?"rgba(0,0,0,.25)":"#111", color:mp?cl.text:"#444", borderRadius:3, padding:"1px 5px", minWidth:18, textAlign:"center", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{team.s}</span>
                            <span style={{ fontSize:"clamp(8px,2vw,11px)", fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{team.n}</span>
                            <div style={{ display:"flex", gap:2, flexShrink:0 }}>{otherP.map(o=><div key={o} title={o} style={{ width:6, height:6, borderRadius:"50%", background:COLORS[o].bg }} />)}</div>
                            {mp && <span style={{ fontSize:10, flexShrink:0 }}>&#10003;</span>}
                          </button>);
                        })}
                      </div>
                    ))}
                  </div>
                </div>);
              })}
            </div>
          </div>
          <div style={{ marginTop:18, padding:"13px 16px", background:"rgba(255,255,255,.03)", border:"1px solid #111", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#444", lineHeight:1.7 }}>
            <span style={{ color:"#FFD93D", letterSpacing:2, fontSize:10 }}>HOW TO PLAY  </span>
            Select your name &rarr; tap teams to pick winners left to right. Colored dots = other players' picks. Picks sync live.
            Points: R64=1 &middot; R32=2 &middot; S16=4 &middot; E8=8 &middot; F4=16 &middot; &#127942;=32
          </div>
        </div>
      )}

      {tab==="leaderboard" && (
        <div style={{ padding:"18px 20px" }}>
          <div style={{ fontSize:"clamp(28px,8vw,58px)", letterSpacing:"4px", marginBottom:22, background:"linear-gradient(90deg,#FFD93D,#FF6FC8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>&#127942; STANDINGS</div>
          {sorted.map((pl, idx) => {
            const c=COLORS[pl], s=scores[pl], pc=Object.keys(picks[pl]||{}).length;
            return (<div key={pl} style={{ background:"rgba(255,255,255,.03)", border:`2px solid ${idx===0?c.bg:"#111"}`, borderRadius:16, padding:"16px 18px", marginBottom:10, position:"relative", overflow:"hidden", animation:`fu .3s ease ${idx*.07}s both` }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${(s/maxSc)*100}%`, background:`linear-gradient(90deg,${c.bg}18,transparent)`, transition:"width 1s ease" }} />
              <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative" }}>
                <div style={{ fontSize:"clamp(22px,5vw,34px)" }}>{medals[idx]}</div>
                <div style={{ width:50, height:50, borderRadius:"50%", background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"clamp(12px,3vw,17px)", color:c.text, fontWeight:900, boxShadow:`0 0 22px ${c.glow}`, flexShrink:0, letterSpacing:1 }}>{pl}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"clamp(20px,5vw,32px)", letterSpacing:"2px", color:idx===0?c.bg:"#fff" }}>{pl}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#444", marginTop:2 }}>{pc} picks made</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"clamp(28px,7vw,48px)", color:c.bg, lineHeight:1, letterSpacing:"2px" }}>{pc}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#333", letterSpacing:2 }}>PICKS</div>
                </div>
              </div>
              {pc>0 && <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap", fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
                {Object.entries(picks[pl]||{}).slice(0,7).map(([k,tn])=><span key={k} style={{ background:`${c.bg}1e`, border:`1px solid ${c.bg}44`, borderRadius:4, padding:"2px 10px", color:c.bg }}>{tn}</span>)}
                {pc>7&&<span style={{ color:"#333", padding:"2px 0" }}>+{pc-7} more</span>}
              </div>}
            </div>);
          })}
          <div style={{ marginTop:18, padding:"16px 18px", background:"rgba(255,217,61,.05)", border:"1px solid rgba(255,217,61,.18)", borderRadius:14, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#666", lineHeight:1.8 }}>
            <div style={{ color:"#FFD93D", letterSpacing:"3px", fontSize:11, marginBottom:8 }}>&#128197; KEY DATES</div>
            <div><span style={{ color:"#FF6B6B" }}>First Four:</span> Mar 17&ndash;18</div>
            <div><span style={{ color:"#FF6B6B" }}>Round of 64:</span> Mar 19&ndash;20</div>
            <div><span style={{ color:"#FF6B6B" }}>Round of 32:</span> Mar 21&ndash;22</div>
            <div><span style={{ color:"#FF6B6B" }}>Sweet 16 / Elite 8:</span> Mar 27&ndash;30</div>
            <div><span style={{ color:"#FF6B6B" }}>Final Four:</span> Apr 4 &middot; Indianapolis</div>
            <div><span style={{ color:"#FF6B6B" }}>Championship:</span> Apr 6</div>
            <div style={{ marginTop:10, color:"#444", fontSize:12 }}>Picks sync live across all devices. ESPN scores refresh every 30s.</div>
          </div>
        </div>
      )}

      <div style={{ textAlign:"center", padding:"20px", fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#1a1a1a", letterSpacing:"3px" }}>K$ SHOWDOWN &middot; MARCH MADNESS 2026</div>
    </div>
  );
}
