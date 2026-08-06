// server.js
// リアルタイムマルチプレイ .io系ゲーム サーバー
// PC / スマホ 混在でLAN内クロスプレイ対応

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Redis } = require('@upstash/redis');

const app = express();

// ===== 永続化(Upstash Redisが設定されていればそちらを優先、無ければローカルファイル) =====
// Renderなど無料ホスティングは再デプロイでローカルファイルが消えるため、
// 環境変数 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN を設定すると永続化される。
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
  console.log('✅ Upstash Redisに接続します(データは永続化されます)');
} else {
  console.log('ℹ️ Upstash Redis未設定のため、ローカルファイルにのみ保存します(再デプロイで消える場合があります)');
}
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// キャッシュを無効化(スマホ等でJS/CSSの更新が反映されない問題を防ぐ)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
}));

// ===== 隠しページ(拡張子なしのきれいなURLでアクセスできるように) =====
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});
app.get('/credits', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'credits.html'));
});
app.get('/omikuji', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'omikuji.html'));
});
app.get('/retro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'retro.html'));
});
app.get('/tos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tos.html'));
});
app.get('/api/stats', (req, res) => {
  res.json({
    totalGamesJoined: globalStats.totalGamesJoined,
    totalKills: globalStats.totalKills,
    totalDeaths: globalStats.totalDeaths,
    totalGoldenFoodEaten: globalStats.totalGoldenFoodEaten,
    totalRounds: globalStats.totalRounds,
    recordMass: globalStats.recordMass,
    recordHolderName: globalStats.recordHolderName,
    serverBootAt: globalStats.serverBootAt,
    currentPlayersOnline: players.size,
    currentWorldSize: Math.round(WORLD_SIZE),
    currentGameMode: gameMode,
    persistent: !!redis
  });
});

// ===== ゲーム設定 =====
let WORLD_SIZE = 3000;            // ワールドの一辺(プレイヤーの状況に応じて自動調整される)
const WORLD_SIZE_MIN = 2000;
const WORLD_SIZE_MAX = 9000;
const WORLD_BASE_SIZE = 2500;      // 誰もいなくても確保する基本サイズ
const TICK_RATE = 20;             // サーバー更新頻度 (Hz)
const TICK_MS = 1000 / TICK_RATE;
const BASE_RADIUS = 20;           // プレイヤー初期半径
let MAX_SPEED = 260;              // 最小サイズ時の速度(px/s)。管理者が変更可能
let FOOD_COUNT = 220;             // フィールド上のエサ最大数(管理者が変更可能)
const FOOD_COUNT_MIN = 20;
const FOOD_COUNT_MAX = 500;
const FOOD_RADIUS = 6;
let FOOD_GROWTH = 10;             // エサを食べた時に加算される「質量」(管理者が変更可能)
let RESPAWN_INVULN_MS = 1500;     // 復活後の無敵時間(管理者が変更可能)

// ===== キルストリーク実況 =====
const STREAK_TIMEOUT_MS = 8000; // この時間内に連続で倒すとストリーク継続
const STREAK_LABELS = {
  2: 'ダブルキル',
  3: 'トリプルキル',
  4: 'クアッドキル',
  5: 'ペンタキル',
  6: 'ゴッドライク'
};

// ===== 絵文字タウント =====
const EMOTE_TYPES = ['laugh', 'cry', 'angry', 'fire', 'thumbsup', 'skull', 'wow', 'cool', 'party', 'heart', 'wave', 'hundred'];
let EMOTE_COOLDOWN_MS = 1200; // 管理者が変更可能

// ===== ゴールデンフード(ランダムイベント) =====
let GOLDEN_FOOD_GROWTH = 150;        // 通常エサの15倍のスコア(管理者が変更可能)
const GOLDEN_FOOD_RADIUS = 16;
let GOLDEN_FOOD_LIFETIME_MS = 22000;     // 放置されると消える(管理者が変更可能)
let GOLDEN_FOOD_INTERVAL_MIN_MS = 40000; // 管理者が変更可能
let GOLDEN_FOOD_INTERVAL_MAX_MS = 80000; // 管理者が変更可能

// ===== 管理者チート =====
let MAX_PLAYER_CHEAT_MASS = 20000; // 「最大化」チートで即座に到達するスコア(管理者が変更可能)

// ===== パワーアップ(自分のスコアを消費するスピードブースト) =====
let BOOST_COST_RATIO = 0.15;    // 現在スコアのこの割合を消費(管理者が変更可能)
const BOOST_COST_MIN = 15;        // 最低消費コスト
let BOOST_DURATION_MS = 2500;   // ブースト持続時間(管理者が変更可能)
let BOOST_COOLDOWN_MS = 6000;   // 再使用までのクールダウン(管理者が変更可能)
let BOOST_SPEED_MULTIPLIER = 1.8; // 管理者が変更可能

// ===== 管理者設定 =====
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'karwak'; // 公開デプロイ時はRender等の環境変数で上書き推奨
const MAX_BOTS_PER_REQUEST = 20;
const BOT_NAME_POOL = ['ロボ', 'ボット', 'AI', 'メカ', 'ドロイド', 'サイボーグ', 'ユニット', 'ネオ'];
const ANNOUNCEMENT_MAX_LEN = 100;
let joinLocked = false;  // trueの間、管理者以外の新規参加を拒否する
let maxPlayers = 0;      // 0=無制限。指定人数に達すると新規参加を拒否する

// ===== アカウントシステム(登録/ログイン/ゲスト) =====
const USERS_FILE = path.join(__dirname, 'users.json');
const USERNAME_MIN = 2;
const USERNAME_MAX = 16;
const PASSWORD_MIN = 4;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30日間

/** @type {Object<string, {username: string, passwordHash: string, createdAt: number}>} キーは小文字化したユーザー名 */
let users = {};
/** @type {Map<string, {username: string, expiresAt: number}>} トークン→セッション情報(サーバー再起動でクリアされる) */
const sessions = new Map();

async function loadUsers() {
  if (redis) {
    try {
      const data = await redis.get('dotbattle:users');
      users = data && typeof data === 'object' ? data : {};
      return;
    } catch (e) {
      console.error('Redisからのユーザー読み込みに失敗しました:', e.message);
    }
  }
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('users.jsonの読み込みに失敗しました:', e.message);
    users = {};
  }
}
async function saveUsers() {
  if (redis) {
    try {
      await redis.set('dotbattle:users', users);
      return;
    } catch (e) {
      console.error('Redisへのユーザー保存に失敗しました:', e.message);
    }
  }
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('users.jsonの保存に失敗しました:', e.message);
  }
}

// ===== 全プレイヤー累計のグローバル統計(/stats ページ用) =====
const STATS_FILE = path.join(__dirname, 'globalStats.json');
const STATS_DEFAULTS = {
  totalGamesJoined: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalGoldenFoodEaten: 0,
  totalRounds: 0,
  recordMass: 0,
  recordHolderName: null,
  serverBootAt: Date.now()
};
let globalStats = Object.assign({}, STATS_DEFAULTS);
async function loadGlobalStats() {
  if (redis) {
    try {
      const data = await redis.get('dotbattle:globalStats');
      if (data && typeof data === 'object') globalStats = Object.assign({}, STATS_DEFAULTS, data);
      globalStats.serverBootAt = Date.now();
      return;
    } catch (e) {
      console.error('Redisからの統計読み込みに失敗しました:', e.message);
    }
  }
  try {
    if (fs.existsSync(STATS_FILE)) {
      globalStats = Object.assign({}, STATS_DEFAULTS, JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')));
    }
  } catch (e) {
    console.error('globalStats.jsonの読み込みに失敗しました:', e.message);
  }
  globalStats.serverBootAt = Date.now(); // 起動時刻は再起動のたびに更新(稼働時間表示用)
}
let statsSaveTimer = null;
function saveGlobalStats() {
  // 高頻度更新(キル等)がまとめて書き込まれるよう少し遅延させる
  if (statsSaveTimer) return;
  statsSaveTimer = setTimeout(async () => {
    statsSaveTimer = null;
    if (redis) {
      try {
        await redis.set('dotbattle:globalStats', globalStats);
        return;
      } catch (e) {
        console.error('Redisへの統計保存に失敗しました:', e.message);
      }
    }
    try {
      fs.writeFileSync(STATS_FILE, JSON.stringify(globalStats, null, 2), 'utf8');
    } catch (e) {
      console.error('globalStats.jsonの保存に失敗しました:', e.message);
    }
  }, 2000);
}

function createSession(username) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}
function getSessionUsername(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return s.username;
}
// 期限切れセッションを定期的に掃除
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now > s.expiresAt) sessions.delete(token);
  }
}, 60 * 60 * 1000);

// ===== ゲームモード / チーム =====
// 'ffa'(個人戦) | 'team'(チーム戦) | 'infection'(感染鬼ごっこ) | 'koth'(キングオブザヒル) | 'battle_royale'(バトルロイヤル)
let gameMode = 'ffa';
const TEAM_IDS = ['red', 'blue'];

// ===== 面白さ強化機能のON/OFF(管理者が切替) =====
let itemsEnabled = true;     // ランダムアイテム
let gimmicksEnabled = true;  // マップギミック(障害物/危険地帯/ワープ)
let effectsEnabled = true;   // 演出(パーティクル・画面揺れ・効果音)。キルフィードは常時表示
let iceEnabled = true;       // 氷ゾーン(滑る)
let gravityEnabled = true;   // 重力井戸(弱く引き寄せられる)
let knockbackEnabled = true; // パワーアップ中の体当たりで相手を弾き飛ばす
let killcamEnabled = true;   // 倒された時、一瞬相手の視点を映すキルカム
let titlesEnabled = true;    // 実績数に応じた称号表示
let fogEnabled = false;      // 視界の外を暗くする霧演出(デフォルトOFF、管理者が任意で有効化)
let themeLock = null;        // null=各自の設定に任せる / 'dark' / 'light' = 全員そのテーマに固定

// ===== 管理者チート機能用のグローバル状態 =====
let globalSpeedMultiplier = 1;   // 全員の移動速度倍率(管理者チート、0.3〜3倍)
let worldSizeOverride = null;    // nullなら自動調整、数値なら管理者がその広さに固定する

// ===== ランダムアイテム =====
const ITEM_TYPES = ['speed', 'shield', 'magnet', 'giant', 'mystery'];
let enabledItemTypes = new Set(ITEM_TYPES); // 管理者が種類ごとにON/OFFできる
const ITEM_RADIUS = 11;
let ITEM_MAX_COUNT = 8;             // 管理者が変更可能
let ITEM_SPAWN_INTERVAL_MS = 3500;  // 管理者が変更可能
let items = [];
let lastItemSpawnAt = 0;

// ===== マップギミック =====
let obstacles = [];   // 障害物(通れない)
let hazardZones = []; // 危険地帯(継続ダメージ)
let warpHoles = [];   // ワープホール(2個1組)
let hazardDamagePerSec = 8;      // 管理者が変更可能
let iceSlipperiness = 1;         // 氷の滑りやすさ倍率(管理者が変更可能、1が標準)
let gravityStrengthMultiplier = 1; // 重力井戸の強さ倍率(管理者が変更可能)
let knockbackStrength = 1;       // ノックバックの強さ倍率(管理者が変更可能)
let obstacleCount = 5;   // 管理者が変更可能(次回のギミック再生成から反映)
let hazardCount = 2;     // 管理者が変更可能
let iceCount = 2;        // 管理者が変更可能
let gravityCount = 1;    // 管理者が変更可能

// ===== キングオブザヒル =====
let KOTH_SCORE_PER_SEC = 12; // 管理者が変更可能

// ===== バトルロイヤル =====
let STORM_DAMAGE_PER_SEC = 16; // 管理者が変更可能

// ===== ラウンドシステム =====
let roundState = 'waiting'; // 'waiting' | 'active' | 'ended'
let roundNumber = 0;
let roundEndTime = 0;
let roundDurationMs = 3 * 60 * 1000; // デフォルト3分
let roundResultMessage = '';
const ROUND_DURATION_MIN_MS = 30 * 1000;
const ROUND_DURATION_MAX_MS = 60 * 60 * 1000;

const COLORS = [
  '#ff5566', '#33ccff', '#ffcc33', '#66ff99', '#cc66ff',
  '#ff9933', '#33ffcc', '#ff66cc', '#99ff33', '#3399ff'
];

/** @type {Map<string, Player>} */
const players = new Map();
/** @type {Set<string>} 管理者になっているsocket.idの集合 */
const adminSockets = new Set();
let food = [];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function massToRadius(mass) {
  // 質量(=score)から半径を算出。大きくなるほど増加が緩やかになる
  return BASE_RADIUS + Math.sqrt(mass) * 3.2;
}

function spawnFood() {
  return {
    id: 'f' + Math.random().toString(36).slice(2, 9),
    x: rand(FOOD_RADIUS, WORLD_SIZE - FOOD_RADIUS),
    y: rand(FOOD_RADIUS, WORLD_SIZE - FOOD_RADIUS),
    color: randomColor()
  };
}

function ensureFood() {
  while (food.length < FOOD_COUNT) {
    food.push(spawnFood());
  }
  if (food.length > FOOD_COUNT) {
    food.length = FOOD_COUNT;
  }
}
ensureFood();

// ===== ランダムアイテム =====
function spawnItem() {
  const pool = ITEM_TYPES.filter(t => enabledItemTypes.has(t));
  const type = pool.length ? pool[Math.floor(Math.random() * pool.length)] : ITEM_TYPES[0];
  return {
    id: 'i' + Math.random().toString(36).slice(2, 9),
    type,
    x: rand(ITEM_RADIUS + 20, WORLD_SIZE - ITEM_RADIUS - 20),
    y: rand(ITEM_RADIUS + 20, WORLD_SIZE - ITEM_RADIUS - 20)
  };
}

// アイテムの効果を適用し、実際に適用された種類を返す(mysteryはランダムに解決される)
function applyItemEffect(p, type) {
  const now = Date.now();
  let actualType = type;
  if (type === 'mystery') {
    const pool = ['speed', 'shield', 'magnet', 'giant'];
    actualType = pool[Math.floor(Math.random() * pool.length)];
  }
  switch (actualType) {
    case 'speed':
      p.boostUntil = Math.max(p.boostUntil, now + 3000);
      break;
    case 'shield':
      p.shieldUntil = Math.max(p.shieldUntil, now + 4000);
      break;
    case 'magnet':
      p.magnetUntil = Math.max(p.magnetUntil, now + 5000);
      break;
    case 'giant':
      p.mass += 150;
      break;
    default:
      break;
  }
  return actualType;
}

const ITEM_LABELS = {
  speed: '⚡スピードアップ',
  shield: '🛡️シールド',
  magnet: '🧲マグネット',
  giant: '💥巨大化',
  mystery: '❓ミステリー'
};

// ===== マップギミック =====
let iceZones = [];     // { id, x, y, r } 踏むと滑る(慣性が強くなる)
let gravityWells = []; // { id, x, y, r, strength } 弱く中心へ引き寄せられる

function regenerateGimmicks() {
  obstacles = [];
  hazardZones = [];
  warpHoles = [];
  iceZones = [];
  gravityWells = [];
  if (!gimmicksEnabled) return;

  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      id: 'obs' + i,
      x: rand(300, WORLD_SIZE - 300),
      y: rand(300, WORLD_SIZE - 300),
      r: rand(60, 140)
    });
  }
  for (let i = 0; i < hazardCount; i++) {
    hazardZones.push({
      id: 'haz' + i,
      x: rand(300, WORLD_SIZE - 300),
      y: rand(300, WORLD_SIZE - 300),
      r: rand(150, 250)
    });
  }
  const wa = { id: 'warpA', pairId: 'warpB', x: rand(200, WORLD_SIZE - 200), y: rand(200, WORLD_SIZE - 200) };
  const wb = { id: 'warpB', pairId: 'warpA', x: rand(200, WORLD_SIZE - 200), y: rand(200, WORLD_SIZE - 200) };
  warpHoles = [wa, wb];

  if (iceEnabled) {
    for (let i = 0; i < iceCount; i++) {
      iceZones.push({
        id: 'ice' + i,
        x: rand(300, WORLD_SIZE - 300),
        y: rand(300, WORLD_SIZE - 300),
        r: rand(180, 280)
      });
    }
  }
  if (gravityEnabled) {
    for (let i = 0; i < gravityCount; i++) {
      gravityWells.push({
        id: 'grav' + i,
        x: rand(400, WORLD_SIZE - 400),
        y: rand(400, WORLD_SIZE - 400),
        r: rand(220, 320),
        strength: rand(40, 70)
      });
    }
  }
}
regenerateGimmicks();

// ===== ゴールデンフード(ランダムイベント) =====
let goldenFood = null; // { id, x, y, expiresAt }
let nextGoldenFoodAt = Date.now() + rand(10000, 20000); // 起動後しばらくしたら最初の1個

function spawnGoldenFood() {
  goldenFood = {
    id: 'gf' + Math.random().toString(36).slice(2, 9),
    x: rand(100, WORLD_SIZE - 100),
    y: rand(100, WORLD_SIZE - 100),
    expiresAt: Date.now() + GOLDEN_FOOD_LIFETIME_MS
  };
  io.emit('announcement', {
    message: '✨ ゴールデンフードが出現! 見つけて一気にスコアアップしよう',
    from: '運営',
    duration: 5000
  });
}

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = (name || 'プレイヤー').toString().slice(0, 12);
    this.color = randomColor();
    this.mass = 0; // スコア兼成長値
    this.x = rand(200, WORLD_SIZE - 200);
    this.y = rand(200, WORLD_SIZE - 200);
    this.dirX = 0;
    this.dirY = 0;
    this.alive = true;
    this.spawnTime = Date.now();
    this.kills = 0;
    this.frozen = false;   // 管理者が移動を封じている場合true
    this.godMode = false;  // 管理者が常時無敵にしている場合true
    this.boostUntil = 0;         // このtime(ms)まで加速中
    this.boostCooldownUntil = 0; // このtime(ms)まで再使用不可
    this.team = null;            // 'red' | 'blue' | null(個人戦)
    this.accountUsername = null; // ログイン中のアカウント名(ゲストはnull)
    this.shieldUntil = 0;        // アイテムによる一時無敵
    this.magnetUntil = 0;        // アイテムによるエサ吸引
    this.warpCooldownUntil = 0;  // ワープ直後の連続ワープ防止
    this.infected = false;       // 感染鬼ごっこモードの「鬼」状態
    this.hillScore = 0;          // キングオブザヒルの獲得ポイント
    this.killStreak = 0;         // 連続撃破数(一定時間空くとリセット)
    this.lastKillAt = 0;
    this.lastEmoteAt = 0;        // 絵文字タウントの連投防止
    this.noclip = false;         // 管理者チート: 障害物をすり抜ける
    this.infiniteBoost = false;  // 管理者チート: パワーアップのコスト・クールダウン無視
    this.velX = 0;                // 実際の移動速度(氷ゾーンでの慣性計算用)
    this.velY = 0;
  }

  get radius() {
    return massToRadius(this.mass);
  }

  respawn() {
    this.mass = 0;
    this.x = rand(200, WORLD_SIZE - 200);
    this.y = rand(200, WORLD_SIZE - 200);
    this.alive = true;
    this.spawnTime = Date.now();
    this.boostUntil = 0;
    this.boostCooldownUntil = 0;
    this.shieldUntil = 0;
    this.magnetUntil = 0;
    this.hillScore = 0;
    this.killStreak = 0;
  }

  get invulnerable() {
    return this.godMode || this.shieldUntil > Date.now() || (Date.now() - this.spawnTime < RESPAWN_INVULN_MS);
  }
}

class Bot extends Player {
  constructor(name, mode) {
    const id = 'bot-' + Math.random().toString(36).slice(2, 9);
    super(id, name || (BOT_NAME_POOL[Math.floor(Math.random() * BOT_NAME_POOL.length)] + Math.floor(Math.random() * 900)));
    this.isBot = true;
    // 'passive'(エサだけ食べて逃げる) / 'normal'(隙あらば捕食) / 'aggressive'(積極的に狩る)
    this.aiMode = (mode === 'passive' || mode === 'aggressive') ? mode : 'normal';
    const a = rand(0, Math.PI * 2);
    this.wanderDirX = Math.cos(a);
    this.wanderDirY = Math.sin(a);
    this.nextWanderChange = 0;
  }
}

function isAdmin(socket) {
  return adminSockets.has(socket.id);
}

// 管理者チートで特定プレイヤーを即座に退場させる(誰にもスコアは渡らない、通常の捕食とは別扱い)
function adminEliminate(p, reasonLabel) {
  if (!p || !p.alive) return;
  p.alive = false;
  globalStats.totalDeaths += 1;
  saveGlobalStats();
  io.to(p.id).emit('eaten', { by: reasonLabel || '管理者の力' });
  io.emit('feedEvent', {
    kind: 'kill',
    text: `⚡ ${p.name} が管理者チートで退場させられた`,
    x: p.x,
    y: p.y
  });
}

// プレイヤー/BOTの人数・最大サイズ・合計質量からワールドの「あるべき広さ」を見積もる
function computeDesiredWorldSize() {
  let totalMass = 0;
  let maxRadius = BASE_RADIUS;
  let aliveCount = 0;
  for (const p of players.values()) {
    if (!p.alive) continue;
    totalMass += p.mass;
    if (p.radius > maxRadius) maxRadius = p.radius;
    aliveCount++;
  }
  const desired = WORLD_BASE_SIZE
    + aliveCount * 150       // 参加者が多いほど広く
    + maxRadius * 10         // 一番大きい個体に合わせて広く
    + Math.sqrt(totalMass) * 15; // 全体の質量が多いほど広く
  return Math.max(WORLD_SIZE_MIN, Math.min(WORLD_SIZE_MAX, desired));
}

function addBots(count, mode, namePrefix) {
  const n = Math.max(1, Math.min(MAX_BOTS_PER_REQUEST, parseInt(count) || 1));
  const created = [];
  for (let i = 0; i < n; i++) {
    const name = namePrefix ? `${namePrefix}${n > 1 ? i + 1 : ''}`.slice(0, 12) : undefined;
    const bot = new Bot(name, mode);
    if (gameMode === 'team') assignTeamBalanced(bot);
    players.set(bot.id, bot);
    created.push(bot.id);
  }
  return created;
}

// ===== チーム分け =====
function countTeamMembers() {
  const counts = { red: 0, blue: 0 };
  for (const p of players.values()) {
    if (p.team === 'red') counts.red++;
    else if (p.team === 'blue') counts.blue++;
  }
  return counts;
}

// 現在人数が少ない方のチームに割り当てる(バランス重視)
function assignTeamBalanced(p) {
  const counts = countTeamMembers();
  p.team = counts.red <= counts.blue ? 'red' : 'blue';
}

// ===== 感染鬼ごっこ =====
// 全員の感染状態をリセットし、ランダムに1人を最初の「鬼」にする
function assignPatientZero() {
  const all = Array.from(players.values());
  all.forEach(p => { p.infected = false; });
  if (all.length > 0) {
    all[Math.floor(Math.random() * all.length)].infected = true;
  }
}

// 全員をシャッフルして均等に振り分け直す
function autoBalanceAllTeams() {
  const all = Array.from(players.values());
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i];
    all[i] = all[j];
    all[j] = tmp;
  }
  all.forEach((p, idx) => {
    p.team = TEAM_IDS[idx % 2];
  });
}

// ===== ラウンド管理 =====
function startRound(durationMs) {
  if (isFinite(durationMs) && durationMs > 0) {
    roundDurationMs = Math.max(ROUND_DURATION_MIN_MS, Math.min(ROUND_DURATION_MAX_MS, Math.round(durationMs)));
  }
  roundNumber++;
  roundState = 'active';
  roundEndTime = Date.now() + roundDurationMs;
  roundResultMessage = '';
  for (const p of players.values()) {
    p.respawn();
  }
  if (gameMode === 'infection') {
    assignPatientZero();
  }
  if (gameMode === 'koth') {
    for (const p of players.values()) p.hillScore = 0;
  }
  io.emit('announcement', {
    message: `🏁 ラウンド${roundNumber} 開始! (${Math.round(roundDurationMs / 60000 * 10) / 10}分)`,
    from: '運営',
    duration: 5000
  });
}

function finishRound() {
  if (roundState !== 'active') return;
  roundState = 'ended';
  globalStats.totalRounds += 1;
  saveGlobalStats();
  let resultMsg;
  const winnerIds = []; // 実績解除通知を送る相手(勝者/生存者)

  if (gameMode === 'team') {
    const totals = { red: 0, blue: 0 };
    for (const p of players.values()) {
      if (p.team === 'red') totals.red += p.mass;
      else if (p.team === 'blue') totals.blue += p.mass;
    }
    let winner;
    if (totals.red === totals.blue) {
      winner = '引き分け';
    } else {
      const winTeam = totals.red > totals.blue ? 'red' : 'blue';
      winner = winTeam === 'red' ? '🔴レッドチームの勝利' : '🔵ブルーチームの勝利';
      for (const p of players.values()) {
        if (p.team === winTeam) winnerIds.push(p.id);
      }
    }
    resultMsg = `ラウンド${roundNumber}終了! ${winner} (赤${Math.round(totals.red)} - 青${Math.round(totals.blue)})`;
  } else if (gameMode === 'infection') {
    const survivors = Array.from(players.values()).filter(p => p.alive && !p.infected);
    resultMsg = survivors.length > 0
      ? `ラウンド${roundNumber}終了! 生存者の勝利🎉 (${survivors.map(p => p.name).join('、')})`
      : `ラウンド${roundNumber}終了! 🧟 鬼の勝利(全員感染)`;
    survivors.forEach(p => winnerIds.push(p.id));
  } else if (gameMode === 'koth') {
    let top = null;
    for (const p of players.values()) {
      if (!top || (p.hillScore || 0) > (top.hillScore || 0)) top = p;
    }
    resultMsg = top
      ? `ラウンド${roundNumber}終了! 👑 ヒルの王者: ${top.name} (${Math.round(top.hillScore || 0)}pt)`
      : `ラウンド${roundNumber}終了!`;
    if (top) winnerIds.push(top.id);
  } else {
    // 'ffa' と 'battle_royale' は最終スコアが一番高い人の勝ち
    let top = null;
    for (const p of players.values()) {
      if (!top || p.mass > top.mass) top = p;
    }
    resultMsg = top
      ? `ラウンド${roundNumber}終了! 優勝: ${top.name} (スコア${Math.round(top.mass)})`
      : `ラウンド${roundNumber}終了!`;
    if (top) winnerIds.push(top.id);
  }
  roundResultMessage = resultMsg;
  io.emit('announcement', { message: resultMsg, from: '運営', duration: 9000 });

  // 実績判定用: 勝者/生存者にだけ通知
  for (const id of winnerIds) {
    const targetSocket = io.sockets.sockets.get(id);
    if (targetSocket) targetSocket.emit('roundWin', { mode: gameMode });
  }
}

io.on('connection', (socket) => {
  let player = null;

  // ===== アカウント登録 =====
  socket.on('register', (data) => {
    const rawUsername = (data && data.username || '').toString().trim();
    const password = (data && data.password || '').toString();
    const key = rawUsername.toLowerCase();

    if (rawUsername.length < USERNAME_MIN || rawUsername.length > USERNAME_MAX) {
      socket.emit('registerResult', { success: false, message: `ユーザー名は${USERNAME_MIN}〜${USERNAME_MAX}文字にしてください` });
      return;
    }
    if (password.length < PASSWORD_MIN) {
      socket.emit('registerResult', { success: false, message: `パスワードは${PASSWORD_MIN}文字以上にしてください` });
      return;
    }
    if (users[key]) {
      socket.emit('registerResult', { success: false, message: 'そのユーザー名は既に使われています' });
      return;
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    users[key] = { username: rawUsername, passwordHash, createdAt: Date.now() };
    saveUsers();
    const token = createSession(rawUsername);
    socket.emit('registerResult', { success: true, token, username: rawUsername });
  });

  // ===== ログイン =====
  socket.on('login', (data) => {
    const rawUsername = (data && data.username || '').toString().trim();
    const password = (data && data.password || '').toString();
    const key = rawUsername.toLowerCase();
    const user = users[key];
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      socket.emit('loginResult', { success: false, message: 'ユーザー名またはパスワードが違います' });
      return;
    }
    const token = createSession(user.username);
    socket.emit('loginResult', { success: true, token, username: user.username });
  });

  // ===== セッション再開(自動ログイン) =====
  socket.on('resumeSession', (data) => {
    const token = data && data.token;
    const username = token ? getSessionUsername(token) : null;
    if (username) {
      socket.emit('sessionResult', { success: true, username });
    } else {
      socket.emit('sessionResult', { success: false });
    }
  });

  socket.on('logout', (data) => {
    const token = data && data.token;
    if (token) sessions.delete(token);
  });

  // ===== ユーザー名の変更 =====
  socket.on('changeUsername', (data) => {
    const token = data && data.token;
    const currentUsername = token ? getSessionUsername(token) : null;
    if (!currentUsername) {
      socket.emit('changeUsernameResult', { success: false, message: 'ログインし直してください' });
      return;
    }
    const newUsername = (data && data.newUsername || '').toString().trim();
    if (newUsername.length < USERNAME_MIN || newUsername.length > USERNAME_MAX) {
      socket.emit('changeUsernameResult', { success: false, message: `ユーザー名は${USERNAME_MIN}〜${USERNAME_MAX}文字にしてください` });
      return;
    }
    const oldKey = currentUsername.toLowerCase();
    const newKey = newUsername.toLowerCase();
    if (newKey !== oldKey && users[newKey]) {
      socket.emit('changeUsernameResult', { success: false, message: 'そのユーザー名は既に使われています' });
      return;
    }
    const user = users[oldKey];
    if (!user) {
      socket.emit('changeUsernameResult', { success: false, message: 'アカウントが見つかりません' });
      return;
    }
    delete users[oldKey];
    user.username = newUsername;
    users[newKey] = user;
    saveUsers();
    // セッション・現在参加中のプレイヤー名も更新
    const session = sessions.get(token);
    if (session) session.username = newUsername;
    if (player && player.accountUsername === currentUsername) {
      player.accountUsername = newUsername;
      player.name = newUsername;
    }
    socket.emit('changeUsernameResult', { success: true, username: newUsername });
  });

  // ===== パスワードの変更 =====
  socket.on('changePassword', (data) => {
    const token = data && data.token;
    const currentUsername = token ? getSessionUsername(token) : null;
    if (!currentUsername) {
      socket.emit('changePasswordResult', { success: false, message: 'ログインし直してください' });
      return;
    }
    const currentPassword = (data && data.currentPassword || '').toString();
    const newPassword = (data && data.newPassword || '').toString();
    const user = users[currentUsername.toLowerCase()];
    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      socket.emit('changePasswordResult', { success: false, message: '現在のパスワードが違います' });
      return;
    }
    if (newPassword.length < PASSWORD_MIN) {
      socket.emit('changePasswordResult', { success: false, message: `新しいパスワードは${PASSWORD_MIN}文字以上にしてください` });
      return;
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    saveUsers();
    socket.emit('changePasswordResult', { success: true });
  });

  socket.on('join', (data) => {
    if (!players.has(socket.id)) {
      if (joinLocked && !isAdmin(socket)) {
        socket.emit('joinRejected', { message: '現在、新規参加はロックされています(管理者が解除するまでお待ちください)' });
        return;
      }
      if (maxPlayers > 0 && players.size >= maxPlayers) {
        socket.emit('joinRejected', { message: `満員です(最大${maxPlayers}人)` });
        return;
      }
    }
    const token = data && data.token;
    const accountUsername = token ? getSessionUsername(token) : null;
    const name = accountUsername || (data && data.name);
    player = new Player(socket.id, name);
    player.accountUsername = accountUsername || null;
    if (gameMode === 'team') assignTeamBalanced(player);
    players.set(socket.id, player);
    globalStats.totalGamesJoined += 1;
    saveGlobalStats();
    socket.emit('welcome', {
      id: socket.id,
      worldSize: WORLD_SIZE,
      isAdmin: isAdmin(socket),
      spectate: false,
      accountUsername: accountUsername || null
    });
  });

  // ===== 観戦モード(プレイヤーとしては参加せず状態だけ受信する) =====
  socket.on('spectate', () => {
    player = null;
    players.delete(socket.id); // 万が一プレイヤーとして参加済みなら退出させる
    socket.emit('welcome', {
      id: socket.id,
      worldSize: WORLD_SIZE,
      isAdmin: isAdmin(socket),
      spectate: true
    });
  });

  // ===== パワーアップ(自分のスコアを消費して一時的にスピードアップ) =====
  socket.on('useBoost', () => {
    if (!player || !player.alive) return;
    const now = Date.now();
    if (player.infiniteBoost) {
      // 管理者チートでコスト・クールダウン無視の無限ブーストが有効なプレイヤー
      player.boostUntil = now + BOOST_DURATION_MS;
      player.boostCooldownUntil = now;
      return;
    }
    if (now < player.boostCooldownUntil) return; // クールダウン中
    const cost = Math.max(BOOST_COST_MIN, Math.round(player.mass * BOOST_COST_RATIO));
    if (player.mass < cost) return; // スコアが足りない
    player.mass -= cost;
    player.boostUntil = now + BOOST_DURATION_MS;
    player.boostCooldownUntil = now + BOOST_COOLDOWN_MS;
  });

  // ===== 絵文字タウント =====
  socket.on('emote', (data) => {
    if (!player || !player.alive) return;
    const type = data && data.type;
    if (!EMOTE_TYPES.includes(type)) return;
    const now = Date.now();
    if (now - player.lastEmoteAt < EMOTE_COOLDOWN_MS) return;
    player.lastEmoteAt = now;
    io.emit('emoteShown', { id: player.id, type });
  });

  socket.on('input', (data) => {
    if (!player || !data) return;
    let { dx, dy } = data;
    if (typeof dx !== 'number' || typeof dy !== 'number') return;
    // 正規化(不正な巨大値対策)
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    if (!isFinite(dx) || !isFinite(dy)) return;
    player.dirX = dx;
    player.dirY = dy;
  });

  // ===== 管理者ログイン =====
  socket.on('adminLogin', (data) => {
    const password = data && data.password;
    if (typeof password === 'string' && password === ADMIN_PASSWORD) {
      adminSockets.add(socket.id);
      socket.emit('adminLoginResult', { success: true });
    } else {
      socket.emit('adminLoginResult', { success: false, message: 'パスワードが違います' });
    }
  });

  // ===== 管理者操作(すべてisAdminチェック必須) =====
  socket.on('admin:addBots', (data) => {
    if (!isAdmin(socket)) return;
    addBots(data && data.count, data && data.mode, data && data.name);
  });

  socket.on('admin:removeBot', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p && p.isBot) players.delete(p.id);
  });

  socket.on('admin:removeAllBots', () => {
    if (!isAdmin(socket)) return;
    for (const [id, p] of players) {
      if (p.isBot) players.delete(id);
    }
  });

  socket.on('admin:setBotMode', (data) => {
    if (!isAdmin(socket)) return;
    const mode = data && data.mode;
    if (!['passive', 'normal', 'aggressive'].includes(mode)) return;
    if (data.id === 'all') {
      for (const p of players.values()) {
        if (p.isBot) p.aiMode = mode;
      }
    } else {
      const p = players.get(data && data.id);
      if (p && p.isBot) p.aiMode = mode;
    }
  });

  socket.on('admin:kickPlayer', (data) => {
    if (!isAdmin(socket)) return;
    const target = players.get(data && data.id);
    if (!target) return;
    if (target.isBot) {
      players.delete(target.id);
      return;
    }
    const targetSocket = io.sockets.sockets.get(target.id);
    if (targetSocket) {
      targetSocket.emit('kicked');
      targetSocket.disconnect(true);
    }
    players.delete(target.id);
  });

  socket.on('admin:boostPlayer', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p) return;
    const amount = Math.max(-100000, Math.min(100000, Number(data && data.amount) || 0));
    p.mass = Math.max(0, p.mass + amount);
  });

  socket.on('admin:setMass', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p) return;
    const amount = Number(data && data.amount);
    if (!isFinite(amount)) return;
    p.mass = Math.max(0, Math.min(1000000, amount));
  });

  socket.on('admin:forceRespawn', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p) p.respawn();
  });

  socket.on('admin:toggleFreeze', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p) return;
    p.frozen = !p.frozen;
    if (p.frozen) {
      p.dirX = 0;
      p.dirY = 0;
    }
  });

  socket.on('admin:toggleGodMode', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p) p.godMode = !p.godMode;
  });

  socket.on('admin:setFoodCount', (data) => {
    if (!isAdmin(socket)) return;
    const count = parseInt(data && data.count);
    if (!isFinite(count)) return;
    FOOD_COUNT = Math.max(FOOD_COUNT_MIN, Math.min(FOOD_COUNT_MAX, count));
  });

  socket.on('admin:resetAllScores', () => {
    if (!isAdmin(socket)) return;
    for (const p of players.values()) {
      p.respawn();
    }
  });

  // ============================================================
  // ===== 管理者チート機能(個人向け) =====
  // ============================================================
  socket.on('admin:maxPlayer', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p || !p.alive) return;
    p.mass = MAX_PLAYER_CHEAT_MASS;
    p.shieldUntil = Date.now() + 8000;
    io.emit('feedEvent', { kind: 'item', text: `⚡ ${p.name} が管理者チートで最大化した!`, x: p.x, y: p.y });
  });

  socket.on('admin:instaKill', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    adminEliminate(p, '管理者の力');
  });

  socket.on('admin:killAll', () => {
    if (!isAdmin(socket)) return;
    for (const p of players.values()) {
      if (p.alive) adminEliminate(p, '管理者の力');
    }
  });

  socket.on('admin:teleportRandom', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p || !p.alive) return;
    p.x = rand(200, WORLD_SIZE - 200);
    p.y = rand(200, WORLD_SIZE - 200);
  });

  socket.on('admin:toggleNoclip', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p) p.noclip = !p.noclip;
  });

  socket.on('admin:toggleInfiniteBoost', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p) p.infiniteBoost = !p.infiniteBoost;
  });

  socket.on('admin:renamePlayer', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p) return;
    const name = (data && data.name || '').toString().trim().slice(0, 12);
    if (!name) return;
    p.name = name;
  });

  socket.on('admin:recolorPlayer', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (p) p.color = randomColor();
  });

  // ============================================================
  // ===== 管理者チート機能(全体向け) =====
  // ============================================================
  socket.on('admin:setGlobalGodMode', (data) => {
    if (!isAdmin(socket)) return;
    const on = !!(data && data.on);
    for (const p of players.values()) p.godMode = on;
  });

  socket.on('admin:clearFood', () => {
    if (!isAdmin(socket)) return;
    food = [];
  });

  socket.on('admin:forceGoldenFood', () => {
    if (!isAdmin(socket)) return;
    spawnGoldenFood();
  });

  socket.on('admin:setGlobalSpeedMultiplier', (data) => {
    if (!isAdmin(socket)) return;
    const m = Number(data && data.multiplier);
    if (!isFinite(m)) return;
    globalSpeedMultiplier = Math.max(0.3, Math.min(3, m));
  });

  socket.on('admin:setWorldSizeOverride', (data) => {
    if (!isAdmin(socket)) return;
    if (data && data.clear) {
      worldSizeOverride = null;
      return;
    }
    const size = Number(data && data.size);
    if (!isFinite(size)) return;
    worldSizeOverride = Math.max(WORLD_SIZE_MIN, Math.min(WORLD_SIZE_MAX, size));
  });

  socket.on('admin:broadcast', (data) => {
    if (!isAdmin(socket)) return;
    const message = (data && data.message || '').toString().trim().slice(0, ANNOUNCEMENT_MAX_LEN);
    if (!message) return;
    const fromName = (player && player.name) || '管理者';
    const duration = Math.max(2000, Math.min(20000, parseInt(data && data.duration) || 6000));
    const targetId = data && data.targetId;
    const payload = { message, from: fromName, duration };
    if (targetId && targetId !== 'all') {
      // 選択した特定のプレイヤーのみに表示(BOTには送れない)
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) targetSocket.emit('announcement', payload);
    } else {
      // 全員に表示
      io.emit('announcement', payload);
    }
  });

  // ===== 一括操作(対象: 全員 / BOTのみ / 人間のみ) =====
  socket.on('admin:bulkAction', (data) => {
    if (!isAdmin(socket)) return;
    const scope = (data && data.scope) || 'all'; // 'all' | 'bots' | 'humans'
    const action = data && data.action;
    const amount = Math.max(-100000, Math.min(100000, Number(data && data.amount) || 300));
    for (const p of players.values()) {
      if (scope === 'bots' && !p.isBot) continue;
      if (scope === 'humans' && p.isBot) continue;
      switch (action) {
        case 'boost':
          p.mass = Math.max(0, p.mass + amount);
          break;
        case 'freeze':
          p.frozen = true;
          p.dirX = 0;
          p.dirY = 0;
          break;
        case 'unfreeze':
          p.frozen = false;
          break;
        case 'respawn':
          p.respawn();
          break;
        default:
          break;
      }
    }
  });

  // ===== ゲームモード切替 =====
  socket.on('admin:setGameMode', (data) => {
    if (!isAdmin(socket)) return;
    const mode = data && data.mode;
    const validModes = ['ffa', 'team', 'infection', 'koth', 'battle_royale'];
    if (!validModes.includes(mode)) return;
    gameMode = mode;
    if (mode === 'team') {
      // チーム未設定の全員に自動でチームを割り当てる
      for (const p of players.values()) {
        if (!p.team) assignTeamBalanced(p);
      }
    } else {
      for (const p of players.values()) p.team = null;
    }
    if (mode === 'infection') {
      assignPatientZero();
    } else {
      for (const p of players.values()) p.infected = false;
    }
    if (mode === 'koth') {
      for (const p of players.values()) p.hillScore = 0;
    }
    const modeLabels = {
      ffa: '👤 個人戦',
      team: '🔴🔵 チーム戦',
      infection: '🧟 感染鬼ごっこ',
      koth: '👑 キングオブザヒル',
      battle_royale: '⚡ バトルロイヤル'
    };
    io.emit('announcement', {
      message: `${modeLabels[mode]}に切り替わりました`,
      from: '運営',
      duration: 5000
    });
  });

  socket.on('admin:autoBalanceTeams', () => {
    if (!isAdmin(socket)) return;
    autoBalanceAllTeams();
  });

  socket.on('admin:setPlayerTeam', (data) => {
    if (!isAdmin(socket)) return;
    const p = players.get(data && data.id);
    if (!p) return;
    const team = data && data.team;
    p.team = (team === 'red' || team === 'blue') ? team : null;
  });

  // ===== 面白さ強化機能のON/OFF =====
  socket.on('admin:setItemsEnabled', (data) => {
    if (!isAdmin(socket)) return;
    itemsEnabled = !!(data && data.enabled);
    if (!itemsEnabled) items = [];
  });

  socket.on('admin:setGimmicksEnabled', (data) => {
    if (!isAdmin(socket)) return;
    gimmicksEnabled = !!(data && data.enabled);
    regenerateGimmicks();
  });

  socket.on('admin:setEffectsEnabled', (data) => {
    if (!isAdmin(socket)) return;
    effectsEnabled = !!(data && data.enabled);
  });

  socket.on('admin:setIceEnabled', (data) => {
    if (!isAdmin(socket)) return;
    iceEnabled = !!(data && data.enabled);
    regenerateGimmicks();
  });

  socket.on('admin:setGravityEnabled', (data) => {
    if (!isAdmin(socket)) return;
    gravityEnabled = !!(data && data.enabled);
    regenerateGimmicks();
  });

  socket.on('admin:setKnockbackEnabled', (data) => {
    if (!isAdmin(socket)) return;
    knockbackEnabled = !!(data && data.enabled);
  });

  socket.on('admin:setKillcamEnabled', (data) => {
    if (!isAdmin(socket)) return;
    killcamEnabled = !!(data && data.enabled);
  });

  socket.on('admin:setTitlesEnabled', (data) => {
    if (!isAdmin(socket)) return;
    titlesEnabled = !!(data && data.enabled);
  });

  socket.on('admin:setFogEnabled', (data) => {
    if (!isAdmin(socket)) return;
    fogEnabled = !!(data && data.enabled);
  });

  socket.on('admin:setThemeLock', (data) => {
    if (!isAdmin(socket)) return;
    const mode = data && data.mode;
    themeLock = (mode === 'dark' || mode === 'light') ? mode : null;
  });

  // ============================================================
  // ===== 管理者による詳細パラメータ調整(ほぼ全ての数値を変更可能) =====
  // ============================================================
  function num(v, fallback, min, max) {
    const n = Number(v);
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  socket.on('admin:setBasicParams', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.foodGrowth !== undefined) FOOD_GROWTH = num(data.foodGrowth, FOOD_GROWTH, 1, 1000);
    if (data.maxSpeed !== undefined) MAX_SPEED = num(data.maxSpeed, MAX_SPEED, 50, 2000);
    if (data.respawnInvulnMs !== undefined) RESPAWN_INVULN_MS = num(data.respawnInvulnMs, RESPAWN_INVULN_MS, 0, 30000);
    if (data.emoteCooldownMs !== undefined) EMOTE_COOLDOWN_MS = num(data.emoteCooldownMs, EMOTE_COOLDOWN_MS, 0, 30000);
    if (data.maxCheatMass !== undefined) MAX_PLAYER_CHEAT_MASS = num(data.maxCheatMass, MAX_PLAYER_CHEAT_MASS, 100, 10000000);
  });

  socket.on('admin:setBoostParams', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.costRatio !== undefined) BOOST_COST_RATIO = num(data.costRatio, BOOST_COST_RATIO, 0, 1);
    if (data.durationMs !== undefined) BOOST_DURATION_MS = num(data.durationMs, BOOST_DURATION_MS, 200, 30000);
    if (data.cooldownMs !== undefined) BOOST_COOLDOWN_MS = num(data.cooldownMs, BOOST_COOLDOWN_MS, 0, 60000);
    if (data.speedMultiplier !== undefined) BOOST_SPEED_MULTIPLIER = num(data.speedMultiplier, BOOST_SPEED_MULTIPLIER, 1, 10);
  });

  socket.on('admin:setGoldenFoodParams', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.growth !== undefined) GOLDEN_FOOD_GROWTH = num(data.growth, GOLDEN_FOOD_GROWTH, 1, 100000);
    if (data.lifetimeMs !== undefined) GOLDEN_FOOD_LIFETIME_MS = num(data.lifetimeMs, GOLDEN_FOOD_LIFETIME_MS, 2000, 300000);
    if (data.intervalMinMs !== undefined) GOLDEN_FOOD_INTERVAL_MIN_MS = num(data.intervalMinMs, GOLDEN_FOOD_INTERVAL_MIN_MS, 1000, 600000);
    if (data.intervalMaxMs !== undefined) GOLDEN_FOOD_INTERVAL_MAX_MS = num(data.intervalMaxMs, GOLDEN_FOOD_INTERVAL_MAX_MS, GOLDEN_FOOD_INTERVAL_MIN_MS, 900000);
  });

  socket.on('admin:setItemParams', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.maxCount !== undefined) ITEM_MAX_COUNT = Math.round(num(data.maxCount, ITEM_MAX_COUNT, 0, 100));
    if (data.spawnIntervalMs !== undefined) ITEM_SPAWN_INTERVAL_MS = num(data.spawnIntervalMs, ITEM_SPAWN_INTERVAL_MS, 200, 60000);
  });

  socket.on('admin:setItemTypeEnabled', (data) => {
    if (!isAdmin(socket)) return;
    const type = data && data.type;
    if (!ITEM_TYPES.includes(type)) return;
    if (data.enabled) enabledItemTypes.add(type);
    else enabledItemTypes.delete(type);
  });

  socket.on('admin:setGimmickStrength', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.hazardDamage !== undefined) hazardDamagePerSec = num(data.hazardDamage, hazardDamagePerSec, 0, 500);
    if (data.iceSlipperiness !== undefined) iceSlipperiness = num(data.iceSlipperiness, iceSlipperiness, 0.1, 10);
    if (data.gravityStrength !== undefined) gravityStrengthMultiplier = num(data.gravityStrength, gravityStrengthMultiplier, 0, 10);
    if (data.knockbackStrength !== undefined) knockbackStrength = num(data.knockbackStrength, knockbackStrength, 0, 10);
    if (data.stormDamage !== undefined) STORM_DAMAGE_PER_SEC = num(data.stormDamage, STORM_DAMAGE_PER_SEC, 0, 500);
    if (data.kothScoreRate !== undefined) KOTH_SCORE_PER_SEC = num(data.kothScoreRate, KOTH_SCORE_PER_SEC, 0, 500);
  });

  socket.on('admin:setGimmickCounts', (data) => {
    if (!isAdmin(socket)) return;
    if (!data) return;
    if (data.obstacles !== undefined) obstacleCount = Math.round(num(data.obstacles, obstacleCount, 0, 30));
    if (data.hazards !== undefined) hazardCount = Math.round(num(data.hazards, hazardCount, 0, 20));
    if (data.ice !== undefined) iceCount = Math.round(num(data.ice, iceCount, 0, 20));
    if (data.gravity !== undefined) gravityCount = Math.round(num(data.gravity, gravityCount, 0, 10));
    regenerateGimmicks();
  });

  socket.on('admin:setJoinLocked', (data) => {
    if (!isAdmin(socket)) return;
    joinLocked = !!(data && data.locked);
  });

  socket.on('admin:setMaxPlayers', (data) => {
    if (!isAdmin(socket)) return;
    const n = parseInt(data && data.count);
    maxPlayers = isFinite(n) && n > 0 ? Math.min(200, n) : 0;
  });

  // ===== ラウンド管理 =====
  socket.on('admin:startRound', (data) => {
    if (!isAdmin(socket)) return;
    const minutes = Number(data && data.minutes);
    startRound(isFinite(minutes) && minutes > 0 ? minutes * 60000 : NaN);
  });

  socket.on('admin:endRound', () => {
    if (!isAdmin(socket)) return;
    finishRound();
  });

  socket.on('admin:resetRound', () => {
    if (!isAdmin(socket)) return;
    roundState = 'waiting';
    roundResultMessage = '';
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    adminSockets.delete(socket.id);
  });
});

// ===== BOTのAI思考 =====
// バトルロイヤルの縮小する安全地帯(ストーム)の現在の円を計算する。
// メインループとBOT AIの両方から呼ばれるので、ここを1箇所にまとめておくことで
// 新しくモードやギミックを足すときもBOT側の対応漏れが起きにくくなる。
function getStormState(now) {
  if (gameMode !== 'battle_royale') return null;
  const roundStartTime = roundEndTime - roundDurationMs;
  const progress = (roundState === 'active' && roundDurationMs > 0)
    ? Math.min(1, Math.max(0, (now - roundStartTime) / roundDurationMs))
    : 0;
  const maxR = WORLD_SIZE * 0.48;
  const minR = Math.max(200, WORLD_SIZE * 0.08);
  return {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    r: maxR - (maxR - minR) * progress
  };
}

function computeBotAI(now) {
  const list = Array.from(players.values());
  // バトルロイヤルの安全地帯(ストーム)を先に取得しておく。他モードではnullになるだけなので無害。
  const storm = getStormState(now);
  const STORM_RETURN_MARGIN = 80; // 縮小円の際に来た時点で早めに中心へ戻り始める余裕

  for (const bot of list) {
    if (!bot.isBot || !bot.alive) continue;

    // バトルロイヤルで安全地帯の外(または際)にいる場合は、生存のため中心へ戻ることを最優先にする
    let outsideStorm = false;
    let stormDx = 0, stormDy = 0;
    if (storm && roundState === 'active') {
      const sd = Math.hypot(bot.x - storm.x, bot.y - storm.y);
      if (sd > storm.r - STORM_RETURN_MARGIN) {
        outsideStorm = true;
        stormDx = storm.x - bot.x;
        stormDy = storm.y - bot.y;
      }
    }

    let threat = null, threatDist = Infinity;
    let prey = null, preyDist = Infinity;
    const huntRadius = bot.aiMode === 'aggressive' ? 480 : 220;

    for (const other of list) {
      if (other.id === bot.id || !other.alive) continue;
      if (gameMode === 'team' && bot.team && other.team === bot.team) continue; // 味方は無視
      const d = Math.hypot(other.x - bot.x, other.y - bot.y);
      if (gameMode === 'infection') {
        // 感染鬼ごっこ: 鬼は非感染者を追い、非感染者は鬼から逃げる
        if (bot.infected) {
          if (!other.infected && d < 500 && d < preyDist) {
            prey = other;
            preyDist = d;
          }
        } else if (other.infected && d < 350 && d < threatDist) {
          threat = other;
          threatDist = d;
        }
        continue;
      }
      if (other.mass > bot.mass && d < 320 && d < threatDist) {
        threat = other;
        threatDist = d;
      }
      if (bot.mass > other.mass && d < huntRadius && d < preyDist) {
        prey = other;
        preyDist = d;
      }
    }

    let dx = 0, dy = 0;
    if (outsideStorm) {
      // 安全地帯の外(または際)にいる間は、まず中心へ戻ることを最優先にする
      dx = stormDx;
      dy = stormDy;
      // 至近距離に天敵がいれば、逃げる方向も少し混ぜて無防備に突っ込まないようにする
      if (threat) {
        dx += (bot.x - threat.x) * 0.5;
        dy += (bot.y - threat.y) * 0.5;
      }
    } else if (threat) {
      // 天敵から逃げる(全モード共通)
      dx = bot.x - threat.x;
      dy = bot.y - threat.y;
    } else if (prey && (gameMode === 'infection' || bot.aiMode !== 'passive')) {
      // 獲物を追う(感染モードの鬼はaiModeに関係なく追いかける)
      dx = prey.x - bot.x;
      dy = prey.y - bot.y;
    } else {
      // 一番近いエサへ向かう
      let nf = null, nfDist = Infinity;
      for (const f of food) {
        const d = Math.hypot(f.x - bot.x, f.y - bot.y);
        if (d < nfDist) {
          nfDist = d;
          nf = f;
        }
      }
      if (nf && nfDist < 700) {
        dx = nf.x - bot.x;
        dy = nf.y - bot.y;
      } else {
        // 何もなければランダムに徘徊
        if (now > bot.nextWanderChange) {
          const a = rand(0, Math.PI * 2);
          bot.wanderDirX = Math.cos(a);
          bot.wanderDirY = Math.sin(a);
          bot.nextWanderChange = now + rand(1500, 3500);
        }
        dx = bot.wanderDirX;
        dy = bot.wanderDirY;
      }
    }

    // 目標方向を単位ベクトル化
    const tlen = Math.hypot(dx, dy);
    let dirX = tlen > 0.001 ? dx / tlen : 0;
    let dirY = tlen > 0.001 ? dy / tlen : 0;

    // 障害物回避: 近くにある障害物から反発力を加えて、壁に突っかかり続けないようにする
    if (gimmicksEnabled && obstacles.length) {
      let avoidX = 0, avoidY = 0;
      for (const ob of obstacles) {
        const odx = bot.x - ob.x, ody = bot.y - ob.y;
        const odist = Math.hypot(odx, ody);
        const avoidRadius = ob.r + bot.radius + 90;
        if (odist < avoidRadius && odist > 0.001) {
          const strength = (avoidRadius - odist) / avoidRadius;
          avoidX += (odx / odist) * strength;
          avoidY += (ody / odist) * strength;
        }
      }
      if (avoidX !== 0 || avoidY !== 0) {
        // 回避を優先しつつ元の目標方向にも進もうとする
        dirX += avoidX * 2;
        dirY += avoidY * 2;
        const flen = Math.hypot(dirX, dirY);
        if (flen > 0.001) {
          dirX /= flen;
          dirY /= flen;
        }
      }
    }

    bot.dirX = dirX;
    bot.dirY = dirY;

    // BOTのパワーアップ使用(天敵から逃走中は必ず、獲物を追跡中はまれに使う)
    tryBotBoost(bot, now, outsideStorm || !!threat, !!prey && bot.aiMode !== 'passive');
  }
}

// BOTにパワーアップ(スピードブースト)を使わせるかどうかを判断する
function tryBotBoost(bot, now, urgent, chasing) {
  if (bot.infiniteBoost) {
    // 管理者チートでBOTに無限ブーストを付与している場合(コスト・クールダウン無視)
    if (urgent || chasing || Math.random() < 0.2) {
      bot.boostUntil = now + BOOST_DURATION_MS;
      bot.boostCooldownUntil = now;
    }
    return;
  }
  if (now < bot.boostCooldownUntil) return;
  const cost = Math.max(BOOST_COST_MIN, Math.round(bot.mass * BOOST_COST_RATIO));
  if (bot.mass < cost) return;
  if (!urgent) {
    if (!chasing) return;
    if (Math.random() > 0.03) return; // 追跡中のみ低確率で使用(乱発防止)
  }
  bot.mass -= cost;
  bot.boostUntil = now + BOOST_DURATION_MS;
  bot.boostCooldownUntil = now + BOOST_COOLDOWN_MS;
}

// ===== ゲームループ =====
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 0.1);
  lastTick = now;

  // BOTの思考(移動方向を決定)
  computeBotAI(now);

  // ラウンド終了判定
  if (roundState === 'active' && now >= roundEndTime) {
    finishRound();
  }

  // プレイヤーの人数・サイズに応じてワールドサイズを緩やかに自動調整(管理者が固定値を指定している場合はそれを優先)
  const desiredWorldSize = worldSizeOverride !== null ? worldSizeOverride : computeDesiredWorldSize();
  WORLD_SIZE += (desiredWorldSize - WORLD_SIZE) * 0.01;

  // プレイヤー移動(氷ゾーンの上では慣性が強くなり滑るようになる)
  for (const p of players.values()) {
    if (!p.alive) continue;
    if (p.frozen) continue; // 管理者に凍結されている場合は動かない
    const infectedSpeedBonus = (gameMode === 'infection' && p.infected) ? 1.15 : 1;
    const boostMultiplier = now < p.boostUntil ? BOOST_SPEED_MULTIPLIER : 1;
    const speed = Math.max(MAX_SPEED * (BASE_RADIUS / p.radius), 60) * boostMultiplier * infectedSpeedBonus * globalSpeedMultiplier;
    const targetVelX = p.dirX * speed;
    const targetVelY = p.dirY * speed;
    const onIce = gimmicksEnabled && iceEnabled && !p.noclip
      && iceZones.some(z => Math.hypot(p.x - z.x, p.y - z.y) < z.r);
    if (onIce) {
      // dtに関わらず一定の滑らかさになる指数補間。iceSlipperinessが大きいほど滑りやすくなる
      const ease = Math.min(1, (1 - Math.pow(0.002, dt)) / Math.max(iceSlipperiness, 0.1));
      p.velX += (targetVelX - p.velX) * ease;
      p.velY += (targetVelY - p.velY) * ease;
    } else {
      // 通常時は即座に目標速度へ(従来通りの操作感を維持)
      p.velX = targetVelX;
      p.velY = targetVelY;
    }
    p.x += p.velX * dt;
    p.y += p.velY * dt;
    p.x = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.y));
  }

  // ===== マップギミック(障害物・危険地帯・ワープ) =====
  if (gimmicksEnabled) {
    for (const p of players.values()) {
      if (!p.alive) continue;
      if (p.noclip) continue; // 管理者チート: 障害物・危険地帯・ワープホールをすべて無視してすり抜ける
      // 障害物: めり込んだ分だけ押し出す
      for (const ob of obstacles) {
        const dx = p.x - ob.x, dy = p.y - ob.y;
        const d = Math.hypot(dx, dy);
        const minDist = ob.r + p.radius;
        if (d < minDist && d > 0.001) {
          const push = minDist - d;
          p.x += (dx / d) * push;
          p.y += (dy / d) * push;
        }
      }
      p.x = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.y));
      // 危険地帯: 継続ダメージ
      for (const hz of hazardZones) {
        const d = Math.hypot(p.x - hz.x, p.y - hz.y);
        if (d < hz.r) {
          p.mass = Math.max(0, p.mass - hazardDamagePerSec * dt);
        }
      }
      // 重力井戸: 範囲内にいる間、弱く中心へ引き寄せられる
      if (gravityEnabled) {
        for (const gw of gravityWells) {
          const dx = gw.x - p.x, dy = gw.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < gw.r && d > 1) {
            const pull = gw.strength * gravityStrengthMultiplier * dt;
            p.x += (dx / d) * pull;
            p.y += (dy / d) * pull;
          }
        }
        p.x = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.y));
      }
      // ワープホール
      if (now > p.warpCooldownUntil) {
        for (const w of warpHoles) {
          const d = Math.hypot(p.x - w.x, p.y - w.y);
          if (d < ITEM_RADIUS + p.radius * 0.3) {
            const pair = warpHoles.find(x => x.id === w.pairId);
            if (pair) {
              p.x = pair.x;
              p.y = pair.y;
              p.warpCooldownUntil = now + 1500;
              const targetSocket = io.sockets.sockets.get(p.id);
              if (targetSocket) targetSocket.emit('warped');
            }
            break;
          }
        }
      }
    }
  }

  // ===== キングオブザヒル: ヒル上にいる間ポイント加算 =====
  let kothHill = null;
  if (gameMode === 'koth') {
    kothHill = {
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      r: Math.min(400, WORLD_SIZE * 0.15)
    };
    if (roundState === 'active') {
      for (const p of players.values()) {
        if (!p.alive) continue;
        const d = Math.hypot(p.x - kothHill.x, p.y - kothHill.y);
        if (d < kothHill.r) {
          p.hillScore = (p.hillScore || 0) + KOTH_SCORE_PER_SEC * dt;
        }
      }
    }
  }

  // ===== バトルロイヤル: 縮小する安全地帯の外にいるとダメージ =====
  const storm = getStormState(now);
  if (storm && roundState === 'active') {
    for (const p of players.values()) {
      if (!p.alive) continue;
      const d = Math.hypot(p.x - storm.x, p.y - storm.y);
      if (d > storm.r) {
        p.mass = Math.max(0, p.mass - STORM_DAMAGE_PER_SEC * dt);
      }
    }
  }

  // ===== ランダムアイテム: 生成と取得判定 =====
  if (itemsEnabled) {
    if (now - lastItemSpawnAt > ITEM_SPAWN_INTERVAL_MS && items.length < ITEM_MAX_COUNT) {
      lastItemSpawnAt = now;
      items.push(spawnItem());
    }
    for (const p of players.values()) {
      if (!p.alive) continue;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const d = Math.hypot(p.x - it.x, p.y - it.y);
        if (d < p.radius + ITEM_RADIUS) {
          items.splice(i, 1);
          const applied = applyItemEffect(p, it.type);
          io.emit('feedEvent', {
            kind: 'item',
            text: `${p.name} が ${ITEM_LABELS[applied] || applied} を取得!`,
            x: p.x,
            y: p.y,
            pId: p.id,
            itemType: applied
          });
        }
      }
    }
    // マグネット: 周囲のエサを引き寄せる
    for (const p of players.values()) {
      if (!p.alive || p.magnetUntil <= now) continue;
      for (const f of food) {
        const dx = p.x - f.x, dy = p.y - f.y;
        const d = Math.hypot(dx, dy);
        if (d < 350 && d > 1) {
          const pull = 220 * dt;
          f.x += (dx / d) * pull;
          f.y += (dy / d) * pull;
        }
      }
    }
  } else if (items.length) {
    items = [];
  }

  // エサ捕食判定
  for (const p of players.values()) {
    if (!p.alive) continue;
    for (let i = food.length - 1; i >= 0; i--) {
      const f = food[i];
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < p.radius) {
        food.splice(i, 1);
        p.mass += FOOD_GROWTH;
      }
    }
  }
  ensureFood();

  // ===== ゴールデンフード: 生成/期限切れ/取得判定 =====
  if (goldenFood && now > goldenFood.expiresAt) {
    goldenFood = null;
  }
  if (!goldenFood && now > nextGoldenFoodAt) {
    spawnGoldenFood();
    nextGoldenFoodAt = now + rand(GOLDEN_FOOD_INTERVAL_MIN_MS, GOLDEN_FOOD_INTERVAL_MAX_MS);
  }
  if (goldenFood) {
    for (const p of players.values()) {
      if (!p.alive || !goldenFood) continue;
      const d = Math.hypot(p.x - goldenFood.x, p.y - goldenFood.y);
      if (d < p.radius + GOLDEN_FOOD_RADIUS) {
        p.mass += GOLDEN_FOOD_GROWTH;
        globalStats.totalGoldenFoodEaten += 1;
        saveGlobalStats();
        io.emit('feedEvent', {
          kind: 'golden',
          text: `🌟 ${p.name} がゴールデンフードを手に入れた! (+${GOLDEN_FOOD_GROWTH})`,
          x: p.x,
          y: p.y,
          pId: p.id
        });
        goldenFood = null;
        nextGoldenFoodAt = now + rand(GOLDEN_FOOD_INTERVAL_MIN_MS, GOLDEN_FOOD_INTERVAL_MAX_MS);
      }
    }
  }

  // プレイヤー同士の判定(捕食 または 感染)
  const list = Array.from(players.values()).filter(p => p.alive);
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const a = list[i];
      const b = list[j];
      if (!a.alive || !b.alive) continue;
      if (a.invulnerable || b.invulnerable) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);

      if (gameMode === 'infection') {
        // 感染鬼ごっこ: 鬼(a)が非感染者(b)に触れたら感染させる(質量は変化しない)
        if (a.infected && !b.infected && d < a.radius + b.radius * 0.5) {
          b.infected = true;
          io.emit('feedEvent', { kind: 'infect', text: `🧟 ${b.name} が感染した!`, x: b.x, y: b.y, aId: a.id, bId: b.id });
        }
        continue;
      }

      if (gameMode === 'team' && a.team && a.team === b.team) continue; // 味方は捕食できない
      if (a.mass <= b.mass) continue; // スコアが自分より下の相手だけ捕食可能
      if (d < a.radius - b.radius * 0.4) {
        // aがbを捕食 → bのスコアをそのまま加算
        const aMassBeforeKill = a.mass;
        const bMassBeforeKill = b.mass;
        a.mass += b.mass;
        a.kills += 1;
        b.alive = false;
        globalStats.totalKills += 1;
        globalStats.totalDeaths += 1;
        saveGlobalStats();
        io.to(b.id).emit('eaten', { by: a.name, byId: a.id, byX: a.x, byY: a.y });
        io.emit('feedEvent', {
          kind: 'kill',
          text: `${a.name} が ${b.name} を飲み込んだ! (+${Math.round(b.mass)})`,
          x: b.x,
          y: b.y,
          aId: a.id,
          bId: b.id,
          aMass: aMassBeforeKill,
          bMass: bMassBeforeKill
        });

        // ===== キルストリーク実況 =====
        if (now - a.lastKillAt > STREAK_TIMEOUT_MS) {
          a.killStreak = 0;
        }
        a.killStreak += 1;
        a.lastKillAt = now;
        const streakLabel = STREAK_LABELS[Math.min(a.killStreak, 6)];
        if (streakLabel) {
          io.emit('streakAnnounce', { id: a.id, name: a.name, streak: a.killStreak, label: streakLabel });
        }

        setTimeout(() => {
          if (players.has(b.id)) {
            b.respawn();
          }
        }, 800);
      }
    }
  }

  // ===== ノックバック: パワーアップ中に体当たりすると相手を弾き飛ばす =====
  if (knockbackEnabled) {
    const aliveList = Array.from(players.values()).filter(p => p.alive);
    for (let i = 0; i < aliveList.length; i++) {
      for (let j = i + 1; j < aliveList.length; j++) {
        const a = aliveList[i], b = aliveList[j];
        if (a.noclip || b.noclip) continue;
        if (gameMode === 'team' && a.team && a.team === b.team) continue;
        const aBoosted = now < a.boostUntil;
        const bBoosted = now < b.boostUntil;
        if (!aBoosted && !bBoosted) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (d < minDist && d > 0.001) {
          const push = (minDist - d) * 0.5 * knockbackStrength;
          const nx = dx / d, ny = dy / d;
          const aPush = bBoosted ? push * 1.4 : push * 0.6;
          const bPush = aBoosted ? push * 1.4 : push * 0.6;
          a.x = Math.max(a.radius, Math.min(WORLD_SIZE - a.radius, a.x - nx * aPush));
          a.y = Math.max(a.radius, Math.min(WORLD_SIZE - a.radius, a.y - ny * aPush));
          b.x = Math.max(b.radius, Math.min(WORLD_SIZE - b.radius, b.x + nx * bPush));
          b.y = Math.max(b.radius, Math.min(WORLD_SIZE - b.radius, b.y + ny * bPush));
        }
      }
    }
  }

  // 歴代最高スコアの更新チェック(/stats ページ用)
  for (const p of players.values()) {
    if (p.alive && p.mass > globalStats.recordMass) {
      globalStats.recordMass = Math.round(p.mass);
      globalStats.recordHolderName = p.name;
      saveGlobalStats();
    }
  }

  // 状態をブロードキャスト
  const state = {
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      x: Math.round(p.x),
      y: Math.round(p.y),
      r: Math.round(p.radius),
      color: p.color,
      mass: Math.round(p.mass),
      alive: p.alive,
      invulnerable: p.invulnerable,
      kills: p.kills,
      isBot: !!p.isBot,
      aiMode: p.aiMode || null,
      frozen: !!p.frozen,
      godMode: !!p.godMode,
      boosted: now < p.boostUntil,
      boostCooldownUntil: p.boostCooldownUntil,
      team: p.team || null,
      accountUsername: p.accountUsername || null,
      shielded: p.shieldUntil > now,
      magnet: p.magnetUntil > now,
      infected: !!p.infected,
      hillScore: Math.round(p.hillScore || 0),
      killStreak: (now - p.lastKillAt <= STREAK_TIMEOUT_MS) ? p.killStreak : 0,
      noclip: !!p.noclip,
      infiniteBoost: !!p.infiniteBoost
    })),
    food: food.map(f => ({ id: f.id, x: f.x, y: f.y, color: f.color })),
    foodCount: FOOD_COUNT,
    worldSize: Math.round(WORLD_SIZE),
    gameMode,
    round: {
      state: roundState,
      number: roundNumber,
      endTime: roundEndTime,
      durationMs: roundDurationMs,
      resultMessage: roundResultMessage
    },
    items: items.map(it => ({ id: it.id, type: it.type, x: it.x, y: it.y })),
    itemsEnabled,
    gimmicksEnabled,
    effectsEnabled,
    iceEnabled,
    gravityEnabled,
    knockbackEnabled,
    killcamEnabled,
    titlesEnabled,
    fogEnabled,
    themeLock,
    obstacles,
    hazardZones,
    warpHoles,
    iceZones,
    gravityWells,
    kothHill,
    storm,
    goldenFood: goldenFood ? { x: goldenFood.x, y: goldenFood.y } : null,
    globalSpeedMultiplier,
    worldSizeOverride,
    params: {
      foodGrowth: FOOD_GROWTH,
      maxSpeed: MAX_SPEED,
      respawnInvulnMs: RESPAWN_INVULN_MS,
      emoteCooldownMs: EMOTE_COOLDOWN_MS,
      maxCheatMass: MAX_PLAYER_CHEAT_MASS,
      boostCostRatio: BOOST_COST_RATIO,
      boostDurationMs: BOOST_DURATION_MS,
      boostCooldownMs: BOOST_COOLDOWN_MS,
      boostSpeedMultiplier: BOOST_SPEED_MULTIPLIER,
      goldenFoodGrowth: GOLDEN_FOOD_GROWTH,
      goldenFoodLifetimeMs: GOLDEN_FOOD_LIFETIME_MS,
      goldenFoodIntervalMinMs: GOLDEN_FOOD_INTERVAL_MIN_MS,
      goldenFoodIntervalMaxMs: GOLDEN_FOOD_INTERVAL_MAX_MS,
      itemMaxCount: ITEM_MAX_COUNT,
      itemSpawnIntervalMs: ITEM_SPAWN_INTERVAL_MS,
      enabledItemTypes: Array.from(enabledItemTypes),
      hazardDamagePerSec,
      iceSlipperiness,
      gravityStrengthMultiplier,
      knockbackStrength,
      stormDamagePerSec: STORM_DAMAGE_PER_SEC,
      kothScoreRate: KOTH_SCORE_PER_SEC,
      obstacleCount,
      hazardCount,
      iceCount,
      gravityCount,
      joinLocked,
      maxPlayers
    }
  };
  io.emit('state', state);
}, TICK_MS);

// ===== 隠し404ページ(どのルートにもマッチしなかった場合) =====
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

(async () => {
  await loadUsers();
  await loadGlobalStats();

  server.listen(PORT, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    const lanIPs = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          lanIPs.push(net.address);
        }
      }
    }
    console.log('====================================');
    console.log(' マルチプレイゲーム サーバー起動完了');
    console.log('====================================');
    console.log(`PCから: http://localhost:${PORT}`);
    if (lanIPs.length) {
      console.log('スマホから(同じWi-Fiに接続して):');
      lanIPs.forEach(ip => console.log(`  http://${ip}:${PORT}`));
    } else {
      console.log('LAN IPが見つかりませんでした。`ipconfig`で確認してください。');
    }
    console.log('====================================');
  });
})();
