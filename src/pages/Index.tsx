import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Upgrade {
  id: string;
  name: string;
  desc: string;
  icon: string;
  baseCost: number;
  clickBonus: number;
  passiveBonus: number;
  level: number;
  maxLevel: number;
  emoji: string;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  unlocked: boolean;
  condition: (stats: GameStats) => boolean;
}

interface GameStats {
  totalClicks: number;
  totalEarned: number;
  balance: number;
  cpc: number;
  cps: number;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface AdBanner {
  title: string;
  desc: string;
  emoji: string;
  color: string;
}

interface LeaderEntry {
  name: string;
  clicks: number;
  balance: number;
  date: string;
}

const LEADERBOARD_KEY = "clicker_leaderboard";

const getLeaderboard = (): LeaderEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
  } catch { return []; }
};

const saveToLeaderboard = (clicks: number, balance: number) => {
  const name = localStorage.getItem("clicker_player_name") || "";
  if (!name) return;
  const board = getLeaderboard();
  const existing = board.findIndex((e) => e.name === name);
  const entry: LeaderEntry = { name, clicks, balance, date: new Date().toLocaleDateString("ru-RU") };
  if (existing >= 0) {
    board[existing] = entry;
  } else {
    board.push(entry);
  }
  board.sort((a, b) => b.balance - a.balance);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)));
};

// ─── Ads data ────────────────────────────────────────────────────────────────
const ADS: AdBanner[] = [
  { title: "Купи монеты за РЕАЛЬНЫЕ деньги!", desc: "Только сегодня — 1000 монет за 0 рублей 😂", emoji: "🤑", color: "from-yellow-500/20 to-orange-500/20" },
  { title: "Секрет богатства РАСКРЫТ!", desc: "Кликай быстрее. Это всё. Нет, правда.", emoji: "💡", color: "from-blue-500/20 to-cyan-500/20" },
  { title: "Одна странная монета исчезает!", desc: "Местные банкиры в шоке от этой техники клика", emoji: "🏦", color: "from-green-500/20 to-emerald-500/20" },
  { title: "ВНИМАНИЕ! Вы — наш 1 000 000-й игрок!", desc: "Ваш приз: ещё один клик. Поздравляем!", emoji: "🎉", color: "from-pink-500/20 to-purple-500/20" },
  { title: "Устали кликать руками?", desc: "Купите авто-кликер всего за ∞ монет!", emoji: "🤖", color: "from-purple-500/20 to-indigo-500/20" },
  { title: "Горячая акция от КликБанка™", desc: "Депозит монет под 999% годовых. Не банк.", emoji: "📈", color: "from-red-500/20 to-rose-500/20" },
];

// ─── Initial upgrades ─────────────────────────────────────────────────────────
const INITIAL_UPGRADES: Upgrade[] = [
  { id: "finger", name: "Золотой палец", desc: "+1 монета за клик", icon: "Hand", baseCost: 10, clickBonus: 1, passiveBonus: 0, level: 0, maxLevel: 20, emoji: "👆" },
  { id: "glove", name: "Перчатка хакера", desc: "+3 монеты за клик", icon: "Zap", baseCost: 75, clickBonus: 3, passiveBonus: 0, level: 0, maxLevel: 15, emoji: "🥊" },
  { id: "robot", name: "Мини-робот", desc: "+2 монеты/сек", icon: "Bot", baseCost: 150, clickBonus: 0, passiveBonus: 2, level: 0, maxLevel: 10, emoji: "🤖" },
  { id: "mine", name: "Монетная шахта", desc: "+5 монет/сек", icon: "Pickaxe", baseCost: 500, clickBonus: 0, passiveBonus: 5, level: 0, maxLevel: 8, emoji: "⛏️" },
  { id: "laser", name: "Лазерный клик", desc: "+10 монет за клик", icon: "Crosshair", baseCost: 1000, clickBonus: 10, passiveBonus: 0, level: 0, maxLevel: 10, emoji: "⚡" },
  { id: "factory", name: "Монетный завод", desc: "+20 монет/сек", icon: "Factory", baseCost: 3000, clickBonus: 0, passiveBonus: 20, level: 0, maxLevel: 5, emoji: "🏭" },
  { id: "crypto", name: "Крипто-майнер", desc: "+50 монет/сек", icon: "TrendingUp", baseCost: 10000, clickBonus: 0, passiveBonus: 50, level: 0, maxLevel: 5, emoji: "₿" },
  { id: "bank", name: "Монетный банк", desc: "+30 монет за клик", icon: "Landmark", baseCost: 25000, clickBonus: 30, passiveBonus: 10, level: 0, maxLevel: 3, emoji: "🏦" },
];

// ─── Achievements ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS_DEF: Omit<Achievement, "unlocked">[] = [
  { id: "first_click", name: "Первый клик!", desc: "Нажми на монету в первый раз", emoji: "🖱️", condition: (s) => s.totalClicks >= 1 },
  { id: "100_clicks", name: "Кликоман", desc: "100 кликов", emoji: "💪", condition: (s) => s.totalClicks >= 100 },
  { id: "1000_clicks", name: "Безумный кликер", desc: "1000 кликов", emoji: "🔥", condition: (s) => s.totalClicks >= 1000 },
  { id: "earn_100", name: "Первая сотня", desc: "Заработай 100 монет", emoji: "💰", condition: (s) => s.totalEarned >= 100 },
  { id: "earn_10k", name: "Тысячник", desc: "Заработай 10,000 монет", emoji: "💎", condition: (s) => s.totalEarned >= 10000 },
  { id: "earn_1m", name: "Миллионер", desc: "Заработай 1,000,000 монет", emoji: "👑", condition: (s) => s.totalEarned >= 1000000 },
  { id: "passive_10", name: "Пассивный доход", desc: "10+ монет в секунду", emoji: "⚙️", condition: (s) => s.cps >= 10 },
  { id: "cpc_10", name: "Сильный удар", desc: "10+ монет за клик", emoji: "⚡", condition: (s) => s.cpc >= 10 },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatNumber = (n: number): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toString();
};

const upgradeCost = (u: Upgrade) => Math.floor(u.baseCost * Math.pow(1.6, u.level));

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Index() {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const [activeTab, setActiveTab] = useState<"shop" | "stats" | "leaderboard" | "settings" | "about">("shop");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>(getLeaderboard());
  const [playerName, setPlayerName] = useState(localStorage.getItem("clicker_player_name") || "");
  const [nameInput, setNameInput] = useState("");
  const [clickAnim, setClickAnim] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(
    ACHIEVEMENTS_DEF.map((a) => ({ ...a, unlocked: false }))
  );
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [adBanner, setAdBanner] = useState<AdBanner | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [adTimer, setAdTimer] = useState(120);

  const floatIdRef = useRef(0);
  const coinRef = useRef<HTMLButtonElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const cpc = 1 + upgrades.reduce((s, u) => s + u.clickBonus * u.level, 0);
  const cps = upgrades.reduce((s, u) => s + u.passiveBonus * u.level, 0);

  // ─── Sound ─────────────────────────────────────────────────────────────────
  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { void e; }
  }, [soundEnabled]);

  // ─── Passive income ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cps === 0) return;
    const interval = setInterval(() => {
      setBalance((b) => b + cps / 10);
      setTotalEarned((t) => t + cps / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  // ─── Ad timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setAdTimer((t) => {
        if (t <= 1) {
          const ad = ADS[Math.floor(Math.random() * ADS.length)];
          setAdBanner(ad);
          setTimeout(() => setAdBanner(null), 7000);
          return 120;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Achievements check ─────────────────────────────────────────────────────
  useEffect(() => {
    const stats: GameStats = { totalClicks, totalEarned, balance, cpc, cps };
    setAchievements((prev) =>
      prev.map((a) => {
        if (!a.unlocked && a.condition(stats)) {
          setTimeout(() => {
            setNewAchievement({ ...a, unlocked: true });
            setTimeout(() => setNewAchievement(null), 3500);
          }, 100);
          return { ...a, unlocked: true };
        }
        return a;
      })
    );
  }, [totalClicks, totalEarned, balance, cpc, cps]);

  // ─── Click handler ──────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setBalance((b) => b + cpc);
    setTotalEarned((t) => t + cpc);
    setTotalClicks((t) => t + 1);
    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 300);
    playClick();

    if (particlesEnabled) {
      const rect = coinRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = floatIdRef.current++;
        setFloatTexts((prev) => [...prev, { id, x, y, value: cpc }]);
        setTimeout(() => setFloatTexts((prev) => prev.filter((f) => f.id !== id)), 1000);
      }
    }
  }, [cpc, playClick, particlesEnabled]);

  // ─── Save to leaderboard ─────────────────────────────────────────────────────
  const submitScore = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem("clicker_player_name", name);
    setPlayerName(name);
    saveToLeaderboard(totalClicks, Math.floor(balance));
    setLeaderboard(getLeaderboard());
    setNameInput("");
  }, [nameInput, totalClicks, balance]);

  // ─── Buy upgrade ────────────────────────────────────────────────────────────
  const buyUpgrade = useCallback((id: string) => {
    setUpgrades((prev) =>
      prev.map((u) => {
        if (u.id !== id || u.level >= u.maxLevel) return u;
        const cost = upgradeCost(u);
        if (balance < cost) return u;
        setBalance((b) => b - cost);
        return { ...u, level: u.level + 1 };
      })
    );
  }, [balance]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen grid-bg font-golos text-white overflow-hidden relative">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-spin-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-lg shadow-lg">
              🪙
            </div>
            <div>
              <h1 className="font-oswald text-xl font-bold neon-text-yellow tracking-wide leading-none">КЛИКЕР</h1>
              <p className="text-xs text-white/40 leading-none mt-0.5">Нажимай — богатей</p>
            </div>
          </div>

          <div className="flex items-center gap-6 animate-fade-in-up">
            <div className="text-center">
              <div className="font-oswald text-2xl font-bold neon-text-yellow">{formatNumber(balance)}</div>
              <div className="text-xs text-white/40">монет</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/10" />
            <div className="hidden sm:flex flex-col items-center">
              <div className="text-sm font-semibold text-purple-300">{formatNumber(cps)}/с</div>
              <div className="text-xs text-white/40">пассивно</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/10" />
            <div className="hidden sm:flex flex-col items-center">
              <div className="text-sm font-semibold text-cyan-300">{formatNumber(cpc)}/клик</div>
              <div className="text-xs text-white/40">доход</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* ─── Left sidebar ─────────────────────────────────────────────────── */}
        <aside className="lg:w-72 flex flex-col gap-3 animate-slide-in-left">

          {/* Nav tabs */}
          <nav className="glass-card rounded-2xl p-1.5 flex lg:flex-col gap-1">
            {([
              { key: "shop", label: "Магазин", emoji: "🛒" },
              { key: "stats", label: "Статистика", emoji: "📊" },
              { key: "leaderboard", label: "Топ игроков", emoji: "🏆" },
              { key: "settings", label: "Настройки", emoji: "⚙️" },
              { key: "about", label: "О разработчиках", emoji: "👥" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left border ${
                  activeTab === tab.key
                    ? "tab-active"
                    : "border-transparent hover:bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span className="text-base">{tab.emoji}</span>
                <span>{tab.label}</span>
                {tab.key === "stats" && (
                  <span className="ml-auto text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-md">
                    {unlockedCount}/{achievements.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="glass-card rounded-2xl p-4 flex-1 overflow-y-auto scrollbar-thin max-h-[500px] lg:max-h-[600px]">

            {/* SHOP */}
            {activeTab === "shop" && (
              <div className="space-y-2">
                <h2 className="font-oswald text-lg font-bold text-purple-300 mb-3">🛒 Магазин улучшений</h2>
                {upgrades.map((u) => {
                  const cost = upgradeCost(u);
                  const canBuy = balance >= cost && u.level < u.maxLevel;
                  const maxed = u.level >= u.maxLevel;
                  return (
                    <button
                      key={u.id}
                      onClick={() => buyUpgrade(u.id)}
                      disabled={!canBuy}
                      className={`upgrade-btn w-full rounded-xl p-3 text-left ${maxed ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none mt-0.5">{u.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-white truncate">{u.name}</span>
                            {maxed ? (
                              <span className="text-xs text-yellow-400 font-bold shrink-0">МАКС</span>
                            ) : (
                              <span className={`text-xs font-bold shrink-0 ${canBuy ? "neon-text-yellow" : "text-white/40"}`}>
                                🪙 {formatNumber(cost)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50 mt-0.5">{u.desc}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(u.maxLevel, 10) }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1 rounded-full ${i < Math.min(u.level, 10) ? "bg-purple-400" : "bg-white/10"}`}
                                  style={{ width: `${Math.max(4, 80 / Math.min(u.maxLevel, 10))}px` }}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-white/40">{u.level}/{u.maxLevel}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STATS */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <h2 className="font-oswald text-lg font-bold text-purple-300">📊 Статистика</h2>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Всего монет", value: formatNumber(totalEarned), emoji: "💰" },
                    { label: "Всего кликов", value: formatNumber(totalClicks), emoji: "🖱️" },
                    { label: "Монет/клик", value: formatNumber(cpc), emoji: "⚡" },
                    { label: "Монет/сек", value: formatNumber(cps), emoji: "⚙️" },
                  ].map((s) => (
                    <div key={s.label} className="glass-card-purple rounded-xl p-3 text-center">
                      <div className="text-xl">{s.emoji}</div>
                      <div className="font-oswald text-lg font-bold neon-text-yellow mt-1">{s.value}</div>
                      <div className="text-xs text-white/40">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white/70 mb-2">🏆 Достижения</h3>
                  <div className="space-y-1.5">
                    {achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                          a.unlocked ? "glass-card-purple" : "bg-white/3 opacity-50"
                        }`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <div>
                          <div className={`text-xs font-semibold ${a.unlocked ? "text-white" : "text-white/40"}`}>{a.name}</div>
                          <div className="text-xs text-white/40">{a.desc}</div>
                        </div>
                        {a.unlocked && <Icon name="CheckCircle" size={14} className="ml-auto text-green-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="space-y-4">
                <h2 className="font-oswald text-lg font-bold text-purple-300">🏆 Топ игроков</h2>

                {/* Submit score */}
                <div className="glass-card-purple rounded-xl p-4 space-y-3">
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider">Записать счёт</div>
                  {playerName ? (
                    <div className="text-sm text-white/70">Игрок: <span className="text-yellow-300 font-bold">{playerName}</span></div>
                  ) : null}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ваш никнейм..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitScore()}
                      className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={submitScore}
                      disabled={!nameInput.trim()}
                      className="px-3 py-2 rounded-lg bg-purple-500/30 border border-purple-500/50 text-purple-200 text-sm font-semibold hover:bg-purple-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ✓
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      saveToLeaderboard(totalClicks, Math.floor(balance));
                      setLeaderboard(getLeaderboard());
                    }}
                    disabled={!playerName}
                    className="w-full py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🪙 Обновить мой счёт
                  </button>
                </div>

                {/* Top by balance */}
                <div>
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">💰 По балансу</div>
                  {leaderboard.length === 0 ? (
                    <div className="text-xs text-white/30 text-center py-4">Пока никого нет. Будь первым!</div>
                  ) : (
                    <div className="space-y-1.5">
                      {leaderboard.slice(0, 10).map((entry, i) => (
                        <div
                          key={entry.name}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                            entry.name === playerName ? "glass-card-purple border border-purple-400/30" : "glass-card"
                          }`}
                        >
                          <span className="font-oswald text-base font-bold w-6 text-center" style={{
                            color: i === 0 ? "#facc15" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3e" : "rgba(255,255,255,0.4)"
                          }}>
                            {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{entry.name}</div>
                            <div className="text-xs text-white/40">{entry.date}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold neon-text-yellow">{formatNumber(entry.balance)}</div>
                            <div className="text-xs text-white/30">{formatNumber(entry.clicks)} кл.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top by clicks */}
                <div>
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">🖱️ По кликам</div>
                  {leaderboard.length === 0 ? (
                    <div className="text-xs text-white/30 text-center py-4">Пока никого нет. Будь первым!</div>
                  ) : (
                    <div className="space-y-1.5">
                      {[...leaderboard].sort((a, b) => b.clicks - a.clicks).slice(0, 10).map((entry, i) => (
                        <div
                          key={entry.name}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                            entry.name === playerName ? "glass-card-purple border border-purple-400/30" : "glass-card"
                          }`}
                        >
                          <span className="font-oswald text-base font-bold w-6 text-center" style={{
                            color: i === 0 ? "#facc15" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3e" : "rgba(255,255,255,0.4)"
                          }}>
                            {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{entry.name}</div>
                            <div className="text-xs text-white/40">{entry.date}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-cyan-300">{formatNumber(entry.clicks)}</div>
                            <div className="text-xs text-white/30">кликов</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <h2 className="font-oswald text-lg font-bold text-purple-300">⚙️ Настройки</h2>
                {[
                  { label: "Звук кликов", desc: "Звуковые эффекты при нажатии", value: soundEnabled, setter: setSoundEnabled, emoji: "🔊" },
                  { label: "Анимации частиц", desc: "Числа и эффекты при клике", value: particlesEnabled, setter: setParticlesEnabled, emoji: "✨" },
                ].map((s) => (
                  <div key={s.label} className="glass-card-purple rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{s.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.label}</div>
                        <div className="text-xs text-white/40">{s.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => s.setter((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${s.value ? "bg-purple-500" : "bg-white/15"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${s.value ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (confirm("Сбросить весь прогресс?")) {
                      setBalance(0);
                      setTotalEarned(0);
                      setTotalClicks(0);
                      setUpgrades(INITIAL_UPGRADES);
                      setAchievements(ACHIEVEMENTS_DEF.map((a) => ({ ...a, unlocked: false })));
                    }
                  }}
                  className="w-full rounded-xl py-3 text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  🗑️ Сбросить прогресс
                </button>
                <div className="glass-card rounded-xl p-3 text-center">
                  <div className="text-xs text-white/30">Реклама через</div>
                  <div className="font-oswald text-2xl neon-text-purple">{adTimer}с</div>
                </div>
              </div>
            )}

            {/* ABOUT */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <h2 className="font-oswald text-lg font-bold text-purple-300">👥 О разработчиках</h2>
                <div className="glass-card-purple rounded-2xl p-4 text-center">
                  <div className="text-4xl mb-2">🚀</div>
                  <div className="font-oswald text-xl font-bold neon-text-yellow">КЛИКЕР v1.0</div>
                  <div className="text-xs text-white/50 mt-1">Браузерная игра-кликер</div>
                </div>
                {[
                  { name: "Were", role: "Разработчик", emoji: "💻", gradient: "from-purple-500 to-indigo-600" },
                  { name: "Polly", role: "Помощник", emoji: "🌟", gradient: "from-pink-500 to-rose-600" },
                ].map((dev) => (
                  <div key={dev.name} className="flex items-center gap-3 glass-card rounded-xl p-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${dev.gradient} flex items-center justify-center text-lg`}>
                      {dev.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{dev.name}</div>
                      <div className="text-xs text-white/40">{dev.role}</div>
                    </div>
                  </div>
                ))}
                <div className="glass-card rounded-xl p-3 text-center">
                  <div className="text-xs text-white/40 leading-relaxed">
                    Сделано с ❤️ и бесконечными кликами.<br />
                    Ни одна монета не пострадала.
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main click area ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in-up py-8">
          <div className="text-center">
            <h2 className="font-oswald text-3xl font-bold text-white/80 tracking-wider">НАЖИМАЙ</h2>
            <p className="text-sm text-white/30 mt-1">
              +{formatNumber(cpc)} за клик {cps > 0 ? `• ${formatNumber(cps)}/сек` : ""}
            </p>
          </div>

          {/* Coin button */}
          <div className="relative">
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: "-16px",
                background: "radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)",
                transition: "opacity 0.1s",
                opacity: clickAnim ? 1 : 0.5,
              }}
            />
            <div className="absolute rounded-full border border-yellow-400/10 animate-spin-slow pointer-events-none" style={{ inset: "-24px" }} />

            <button
              ref={coinRef}
              onClick={handleClick}
              className="relative coin-btn w-52 h-52 sm:w-64 sm:h-64 rounded-full flex items-center justify-center text-7xl sm:text-8xl select-none focus:outline-none"
            >
              <span className="drop-shadow-2xl" style={{ textShadow: "0 0 30px rgba(250,204,21,0.5)" }}>🪙</span>

              {floatTexts.map((f) => (
                <span
                  key={f.id}
                  className="absolute pointer-events-none font-oswald font-bold text-yellow-300 animate-float-up"
                  style={{ left: f.x, top: f.y, fontSize: "1.1rem", textShadow: "0 0 10px rgba(250,204,21,0.8)", zIndex: 10 }}
                >
                  +{formatNumber(f.value)}
                </span>
              ))}
            </button>
          </div>

          {/* Mini stats */}
          <div className="flex gap-4 sm:gap-8">
            {[
              { label: "Баланс", value: formatNumber(balance), color: "text-yellow-400", emoji: "💰" },
              { label: "Кликов", value: formatNumber(totalClicks), color: "text-cyan-400", emoji: "🖱️" },
              { label: "Заработано", value: formatNumber(totalEarned), color: "text-purple-400", emoji: "📈" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-2xl px-4 py-3 text-center min-w-[90px]">
                <div className="text-base">{s.emoji}</div>
                <div className={`font-oswald text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>

          {upgrades.some((u) => u.level > 0) && (
            <div className="glass-card rounded-2xl px-5 py-3 text-center animate-fade-in-up">
              <div className="text-xs text-white/40 mb-1">Активные улучшения</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {upgrades.filter((u) => u.level > 0).map((u) => (
                  <span key={u.id} className="text-lg" title={`${u.name} ур.${u.level}`}>{u.emoji}</span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Achievement popup ───────────────────────────────────────────────── */}
      {newAchievement && (
        <div className="fixed bottom-24 right-4 z-50 animate-ad-slide-in">
          <div className="glass-card-purple neon-border-purple rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl max-w-xs">
            <span className="text-3xl">{newAchievement.emoji}</span>
            <div>
              <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Достижение!</div>
              <div className="text-sm font-bold text-white">{newAchievement.name}</div>
              <div className="text-xs text-white/50">{newAchievement.desc}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ad banner ───────────────────────────────────────────────────────── */}
      {adBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-ad-slide-in w-[calc(100%-2rem)] max-w-md">
          <div className={`bg-gradient-to-r ${adBanner.color} glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/10 shadow-2xl`}>
            <span className="text-3xl shrink-0">{adBanner.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Реклама</div>
              <div className="text-sm font-bold text-white truncate">{adBanner.title}</div>
              <div className="text-xs text-white/60 truncate">{adBanner.desc}</div>
            </div>
            <button
              onClick={() => setAdBanner(null)}
              className="shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <Icon name="X" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}