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

const app = express();
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

// ===== ゲーム設定 =====
let WORLD_SIZE = 3000;            // ワールドの一辺(プレイヤーの状況に応じて自動調整される)
const WORLD_SIZE_MIN = 2000;
const WORLD_SIZE_MAX = 9000;
const WORLD_BASE_SIZE = 2500;      // 誰もいなくても確保する基本サイズ
const TICK_RATE = 20;             // サーバー更新頻度 (Hz)
const TICK_MS = 1000 / TICK_RATE;
const BASE_RADIUS = 20;           // プレイヤー初期半径
const MAX_SPEED = 260;            // 最小サイズ時の速度(px/s)
let FOOD_COUNT = 220;             // フィールド上のエサ最大数(管理者が変更可能)
const FOOD_COUNT_MIN = 20;
const FOOD_COUNT_MAX = 500;
const FOOD_RADIUS = 6;
const FOOD_GROWTH = 10;           // エサを食べた時に加算される「質量」
const RESPAWN_INVULN_MS = 1500;   // 復活後の無敵時間

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
const EMOTE_TYPES = ['laugh', 'cry', 'angry', 'fire', 'thumbsup', 'skull'];
const EMOTE_COOLDOWN_MS = 1200;

// ===== ゴールデンフード(ランダムイベント) =====
const GOLDEN_FOOD_GROWTH = 150;      // 通常エサの15倍のスコア
const GOLDEN_FOOD_RADIUS = 16;
const GOLDEN_FOOD_LIFETIME_MS = 22000;   // 放置されると消える
const GOLDEN_FOOD_INTERVAL_MIN_MS = 40000;
const GOLDEN_FOOD_INTERVAL_MAX_MS = 80000;

// ===== パワーアップ(自分のスコアを消費するスピードブースト) =====
const BOOST_COST_RATIO = 0.15;    // 現在スコアのこの割合を消費
const BOOST_COST_MIN = 15;        // 最低消費コスト
const BOOST_DURATION_MS = 2500;   // ブースト持続時間
const BOOST_COOLDOWN_MS = 6000;   // 再使用までのクールダウン
const BOOST_SPEED_MULTIPLIER = 1.8;

// ===== 管理者設定 =====
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'karwak'; // 公開デプロイ時はRender等の環境変数で上書き推奨
const MAX_BOTS_PER_REQUEST = 20;
const BOT_NAME_POOL = ['ロボ', 'ボット', 'AI', 'メカ', 'ドロイド', 'サイボーグ', 'ユニット', 'ネオ'];
const ANNOUNCEMENT_MAX_LEN = 100;

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

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('users.jsonの読み込みに失敗しました:', e.message);
    users = {};
  }
}
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('users.jsonの保存に失敗しました:', e.message);
  }
}
loadUsers();

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

// ===== ランダムアイテム =====
const ITEM_TYPES = ['speed', 'shield', 'magnet', 'giant', 'mystery'];
const ITEM_RADIUS = 11;
const ITEM_MAX_COUNT = 8;
const ITEM_SPAWN_INTERVAL_MS = 3500;
let items = [];
let lastItemSpawnAt = 0;

// ===== マップギミック =====
let obstacles = [];   // 障害物(通れない)
let hazardZones = []; // 危険地帯(継続ダメージ)
let warpHoles = [];   // ワープホール(2個1組)

// ===== キングオブザヒル =====
const KOTH_SCORE_PER_SEC = 12;

// ===== バトルロイヤル =====
const STORM_DAMAGE_PER_SEC = 16;

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
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
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
function regenerateGimmicks() {
  obstacles = [];
  hazardZones = [];
  warpHoles = [];
  if (!gimmicksEnabled) return;

  for (let i = 0; i < 5; i++) {
    obstacles.push({
      id: 'obs' + i,
      x: rand(300, WORLD_SIZE - 300),
      y: rand(300, WORLD_SIZE - 300),
      r: rand(60, 140)
    });
  }
  for (let i = 0; i < 2; i++) {
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
    const token = data && data.token;
    const accountUsername = token ? getSessionUsername(token) : null;
    const name = accountUsername || (data && data.name);
    player = new Player(socket.id, name);
    player.accountUsername = accountUsername || null;
    if (gameMode === 'team') assignTeamBalanced(player);
    players.set(socket.id, player);
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
function computeBotAI(now) {
  const list = Array.from(players.values());
  for (const bot of list) {
    if (!bot.isBot || !bot.alive) continue;

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
    if (threat) {
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
    tryBotBoost(bot, now, !!threat, !!prey && bot.aiMode !== 'passive');
  }
}

// BOTにパワーアップ(スピードブースト)を使わせるかどうかを判断する
function tryBotBoost(bot, now, urgent, chasing) {
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

  // プレイヤーの人数・サイズに応じてワールドサイズを緩やかに自動調整
  const desiredWorldSize = computeDesiredWorldSize();
  WORLD_SIZE += (desiredWorldSize - WORLD_SIZE) * 0.01;

  // プレイヤー移動
  for (const p of players.values()) {
    if (!p.alive) continue;
    if (p.frozen) continue; // 管理者に凍結されている場合は動かない
    const infectedSpeedBonus = (gameMode === 'infection' && p.infected) ? 1.15 : 1;
    const boostMultiplier = now < p.boostUntil ? BOOST_SPEED_MULTIPLIER : 1;
    const speed = Math.max(MAX_SPEED * (BASE_RADIUS / p.radius), 60) * boostMultiplier * infectedSpeedBonus;
    p.x += p.dirX * speed * dt;
    p.y += p.dirY * speed * dt;
    p.x = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(WORLD_SIZE - p.radius, p.y));
  }

  // ===== マップギミック(障害物・危険地帯・ワープ) =====
  if (gimmicksEnabled) {
    for (const p of players.values()) {
      if (!p.alive) continue;
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
          p.mass = Math.max(0, p.mass - 8 * dt);
        }
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
  let storm = null;
  if (gameMode === 'battle_royale') {
    const roundStartTime = roundEndTime - roundDurationMs;
    const progress = (roundState === 'active' && roundDurationMs > 0)
      ? Math.min(1, Math.max(0, (now - roundStartTime) / roundDurationMs))
      : 0;
    const maxR = WORLD_SIZE * 0.48;
    const minR = Math.max(200, WORLD_SIZE * 0.08);
    storm = {
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      r: maxR - (maxR - minR) * progress
    };
    if (roundState === 'active') {
      for (const p of players.values()) {
        if (!p.alive) continue;
        const d = Math.hypot(p.x - storm.x, p.y - storm.y);
        if (d > storm.r) {
          p.mass = Math.max(0, p.mass - STORM_DAMAGE_PER_SEC * dt);
        }
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
        io.to(b.id).emit('eaten', { by: a.name });
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
      killStreak: (now - p.lastKillAt <= STREAK_TIMEOUT_MS) ? p.killStreak : 0
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
    obstacles,
    hazardZones,
    warpHoles,
    kothHill,
    storm,
    goldenFood: goldenFood ? { x: goldenFood.x, y: goldenFood.y } : null
  };
  io.emit('state', state);
}, TICK_MS);

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
