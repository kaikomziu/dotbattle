// client.js
(() => {
  const socket = io();

  const lobby = document.getElementById('lobby');
  const gameUI = document.getElementById('gameUI');
  const nameInput = document.getElementById('nameInput');
  const lobbyTitle = document.getElementById('lobbyTitle');
  const joinBtn = document.getElementById('joinBtn');
  const connStatus = document.getElementById('connStatus');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreVal = document.getElementById('scoreVal');
  const scoreBox = document.getElementById('scoreBox');
  const joystickBase = document.getElementById('joystickBase');
  const joystickKnob = document.getElementById('joystickKnob');
  const leaderboard = document.getElementById('leaderboard');
  const deathMsg = document.getElementById('deathMsg');
  const deathText = document.getElementById('deathText');
  const respawnBtn = document.getElementById('respawnBtn');

  // 管理者関連の要素
  const adminGearBtn = document.getElementById('adminGearBtn');
  const adminModal = document.getElementById('adminModal');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminCancelBtn = document.getElementById('adminCancelBtn');
  const adminLoginMsg = document.getElementById('adminLoginMsg');
  const adminPanelToggle = document.getElementById('adminPanelToggle');
  const adminPanel = document.getElementById('adminPanel');
  const adminPanelClose = document.getElementById('adminPanelClose');
  const botCountInput = document.getElementById('botCountInput');
  const botModeSelect = document.getElementById('botModeSelect');
  const addBotBtn = document.getElementById('addBotBtn');
  const removeAllBotsBtn = document.getElementById('removeAllBotsBtn');
  const adminPlayerList = document.getElementById('adminPlayerList');
  const announceInput = document.getElementById('announceInput');
  const announceBtn = document.getElementById('announceBtn');
  const foodCountInput = document.getElementById('foodCountInput');
  const setFoodCountBtn = document.getElementById('setFoodCountBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const announcementBanner = document.getElementById('announcementBanner');
  const statWorldSize = document.getElementById('statWorldSize');
  const statFood = document.getElementById('statFood');
  const statPlayers = document.getElementById('statPlayers');
  const adminStats = document.getElementById('adminStats');
  const announceTargetSelect = document.getElementById('announceTargetSelect');
  const bulkScopeSelect = document.getElementById('bulkScopeSelect');
  const spectateBtn = document.getElementById('spectateBtn');
  const spectateBar = document.getElementById('spectateBar');
  const exitSpectateBtn = document.getElementById('exitSpectateBtn');
  const boostBtn = document.getElementById('boostBtn');
  const roundBar = document.getElementById('roundBar');
  const teamScoreBar = document.getElementById('teamScoreBar');
  const gameModeSelect = document.getElementById('gameModeSelect');
  const setGameModeBtn = document.getElementById('setGameModeBtn');
  const autoBalanceBtn = document.getElementById('autoBalanceBtn');
  const roundAdminStatus = document.getElementById('roundAdminStatus');
  const roundMinutesInput = document.getElementById('roundMinutesInput');
  const startRoundBtn = document.getElementById('startRoundBtn');
  const endRoundBtn = document.getElementById('endRoundBtn');
  const resetRoundBtn = document.getElementById('resetRoundBtn');
  const toggleItemsBtn = document.getElementById('toggleItemsBtn');
  const toggleGimmicksBtn = document.getElementById('toggleGimmicksBtn');
  const toggleEffectsBtn = document.getElementById('toggleEffectsBtn');

  // 管理者チート機能(全体)関連の要素
  const cheatGodModeAllBtn = document.getElementById('cheatGodModeAllBtn');
  const cheatGodModeOffAllBtn = document.getElementById('cheatGodModeOffAllBtn');
  const cheatKillAllBtn = document.getElementById('cheatKillAllBtn');
  const cheatClearFoodBtn = document.getElementById('cheatClearFoodBtn');
  const cheatGoldenFoodBtn = document.getElementById('cheatGoldenFoodBtn');
  const cheatSpeedInput = document.getElementById('cheatSpeedInput');
  const cheatSpeedApplyBtn = document.getElementById('cheatSpeedApplyBtn');
  const cheatSpeedStatus = document.getElementById('cheatSpeedStatus');
  const cheatWorldSizeInput = document.getElementById('cheatWorldSizeInput');
  const cheatWorldSizeApplyBtn = document.getElementById('cheatWorldSizeApplyBtn');
  const cheatWorldSizeAutoBtn = document.getElementById('cheatWorldSizeAutoBtn');
  const cheatWorldSizeStatus = document.getElementById('cheatWorldSizeStatus');
  const killFeed = document.getElementById('killFeed');
  const helpOpenBtn = document.getElementById('helpOpenBtn');
  const helpGameBtn = document.getElementById('helpGameBtn');
  const helpModal = document.getElementById('helpModal');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  const achievementsOpenBtn = document.getElementById('achievementsOpenBtn');
  const achievementsGameBtn = document.getElementById('achievementsGameBtn');
  const achievementsModal = document.getElementById('achievementsModal');
  const achievementsCloseBtn = document.getElementById('achievementsCloseBtn');
  const achievementsList = document.getElementById('achievementsList');
  const achievementToast = document.getElementById('achievementToast');

  // アカウント関連の要素
  const accountLoggedOutSection = document.getElementById('accountLoggedOutSection');
  const accountLoggedInSection = document.getElementById('accountLoggedInSection');
  const accountUsernameDisplay = document.getElementById('accountUsernameDisplay');
  const joinAsAccountBtn = document.getElementById('joinAsAccountBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginOpenBtn = document.getElementById('loginOpenBtn');
  const registerOpenBtn = document.getElementById('registerOpenBtn');
  const loginModal = document.getElementById('loginModal');
  const loginUsernameInput = document.getElementById('loginUsernameInput');
  const loginPasswordInput = document.getElementById('loginPasswordInput');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginCancelBtn = document.getElementById('loginCancelBtn');
  const loginMsg = document.getElementById('loginMsg');
  const switchToRegisterLink = document.getElementById('switchToRegisterLink');
  const registerModal = document.getElementById('registerModal');
  const registerUsernameInput = document.getElementById('registerUsernameInput');
  const registerPasswordInput = document.getElementById('registerPasswordInput');
  const registerPasswordConfirmInput = document.getElementById('registerPasswordConfirmInput');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const registerCancelBtn = document.getElementById('registerCancelBtn');
  const registerMsg = document.getElementById('registerMsg');
  const switchToLoginLink = document.getElementById('switchToLoginLink');
  const streakBanner = document.getElementById('streakBanner');
  const winnerBanner = document.getElementById('winnerBanner');
  const winnerName = document.getElementById('winnerName');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const minimapCtx = minimapCanvas.getContext('2d');
  const emoteBar = document.getElementById('emoteBar');

  // 個人設定関連の要素
  const settingsOpenBtn = document.getElementById('settingsOpenBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingWasdBtn = document.getElementById('settingWasdBtn');
  const settingWasdOnlyBtn = document.getElementById('settingWasdOnlyBtn');
  const settingSoundBtn = document.getElementById('settingSoundBtn');
  const settingShakeBtn = document.getElementById('settingShakeBtn');
  const settingParticlesBtn = document.getElementById('settingParticlesBtn');
  const settingMinimapBtn = document.getElementById('settingMinimapBtn');
  const settingFeedBtn = document.getElementById('settingFeedBtn');
  const accountSettingsLoggedIn = document.getElementById('accountSettingsLoggedIn');
  const accountSettingsLoggedOut = document.getElementById('accountSettingsLoggedOut');
  const changeUsernameInput = document.getElementById('changeUsernameInput');
  const changeUsernameBtn = document.getElementById('changeUsernameBtn');
  const changeUsernameMsg = document.getElementById('changeUsernameMsg');
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const changePasswordMsg = document.getElementById('changePasswordMsg');

  const EMOTE_ICONS = {
    laugh: '😂', cry: '😭', angry: '😡', fire: '🔥', thumbsup: '👍', skull: '💀',
    wow: '😮', cool: '😎', party: '🎉', heart: '❤️', wave: '👋', hundred: '💯'
  };

  const TEAM_COLORS = { red: '#ff5566', blue: '#3399ff' };
  const TEAM_LABELS = { red: '🔴レッド', blue: '🔵ブルー' };
  const MODE_LABELS = {
    ffa: '👤 個人戦',
    team: '🔴🔵 チーム戦',
    infection: '🧟 感染鬼ごっこ',
    koth: '👑 キングオブザヒル',
    battle_royale: '⚡ バトルロイヤル'
  };
  const GOLDEN_FOOD_GROWTH_CLIENT = 150; // サーバーのGOLDEN_FOOD_GROWTHと合わせる(表示専用)
  const ITEM_VISUALS = {
    speed: { color: '#33ccff', icon: '⚡' },
    shield: { color: '#66ff99', icon: '🛡️' },
    magnet: { color: '#cc66ff', icon: '🧲' },
    giant: { color: '#ff9933', icon: '💥' },
    mystery: { color: '#ffcc33', icon: '❓' }
  };

  // ========================================================
  // ===== 実績システム(Cookieに保存し、次回訪問時も引き継ぐ) =====
  // ========================================================
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
  function loadJSONCookie(name, fallback) {
    try {
      const raw = getCookie(name);
      return raw ? Object.assign({}, fallback, JSON.parse(raw)) : Object.assign({}, fallback);
    } catch (e) {
      return Object.assign({}, fallback);
    }
  }

  const achievementStats = loadJSONCookie('dotbattle_stats', {
    kills: 0, itemsCollected: 0, boostsUsed: 0, warpsUsed: 0, deaths: 0,
    roundWins: 0, gamesPlayed: 0, playSeconds: 0, itemTypes: {}
  });
  const achievementUnlocked = loadJSONCookie('dotbattle_unlocked', {});

  function saveAchievementStats() {
    setCookie('dotbattle_stats', JSON.stringify(achievementStats), 3650);
  }
  function saveAchievementUnlocked() {
    setCookie('dotbattle_unlocked', JSON.stringify(achievementUnlocked), 3650);
  }

  // 誰でも(管理者でなくても)通常プレイだけで全部解除できる実績一覧
  const ACHIEVEMENTS = [
    // --- 基本 ---
    { id: 'first_food', icon: '🍬', title: 'はじめの一歩', desc: '初めてエサを食べる', cat: '基本' },
    { id: 'first_kill', icon: '⚔️', title: '初捕食', desc: '誰かを1体飲み込む', cat: '基本' },
    { id: 'first_death', icon: '💀', title: '初めての被食', desc: '誰かに食べられる', cat: '基本' },
    { id: 'rank_1', icon: '🥇', title: '頂点に立つ', desc: 'ランキング1位になる', cat: '基本' },
    { id: 'spectate_once', icon: '👀', title: '観戦デビュー', desc: '観戦モードを使ってみる', cat: '基本' },
    { id: 'instant_death', icon: '😱', title: '秒殺', desc: '参加後2秒以内に食べられる', cat: '基本' },
    { id: 'full_lobby', icon: '🎉', title: '満員御礼', desc: '人間プレイヤーが5人以上いる中でプレイする', cat: '基本' },
    { id: 'golden_food', icon: '🌟', title: 'ラッキー', desc: 'ゴールデンフードを手に入れる', cat: '基本' },
    { id: 'kill_streak_double', icon: '🔥', title: '波に乗る', desc: 'ダブルキル以上のストリークを決める', cat: '基本' },
    { id: 'emote_used', icon: '😂', title: 'おしゃべり', desc: '絵文字タウントを使う', cat: '基本' },

    // --- スコア ---
    { id: 'mass_100', icon: '🌱', title: '成長中', desc: 'スコア100に到達', cat: 'スコア' },
    { id: 'mass_500', icon: '📈', title: '巨大化', desc: 'スコア500に到達', cat: 'スコア' },
    { id: 'mass_1000', icon: '🌑', title: '千の大台', desc: 'スコア1000に到達', cat: 'スコア' },
    { id: 'mass_2000', icon: '🌕', title: '超巨大化', desc: 'スコア2000に到達', cat: 'スコア' },
    { id: 'mass_5000', icon: '🌟', title: '化け物級', desc: 'スコア5000に到達', cat: 'スコア' },
    { id: 'mass_10000', icon: '🌌', title: '伝説級', desc: 'スコア10000に到達', cat: 'スコア' },

    // --- 撃破 ---
    { id: 'kill_5', icon: '🗡️', title: '荒くれ者', desc: '通算5体撃破', cat: '撃破', progressKey: 'kills', target: 5 },
    { id: 'kill_10', icon: '🏆', title: '大食漢', desc: '通算10体撃破', cat: '撃破', progressKey: 'kills', target: 10 },
    { id: 'kill_25', icon: '💪', title: '狩人', desc: '通算25体撃破', cat: '撃破', progressKey: 'kills', target: 25 },
    { id: 'kill_50', icon: '👹', title: '捕食者の頂点', desc: '通算50体撃破', cat: '撃破', progressKey: 'kills', target: 50 },
    { id: 'kill_100', icon: '😈', title: '破壊神', desc: '通算100体撃破', cat: '撃破', progressKey: 'kills', target: 100 },
    { id: 'kill_streak', icon: '🔥', title: '連続捕食', desc: '15秒以内に3体撃破する', cat: '撃破' },
    { id: 'giant_slayer', icon: '🐘', title: '実力差', desc: '自分の3倍以上の差をつけて捕食する', cat: '撃破' },
    { id: 'comeback', icon: '🔄', title: '大逆転', desc: 'スコア20以下から1000以上まで巻き返す', cat: '撃破' },

    // --- 被食・耐久 ---
    { id: 'death_10', icon: '😵', title: 'まだまだこれから', desc: '10回食べられる', cat: '耐久', progressKey: 'deaths', target: 10 },
    { id: 'death_30', icon: '🎯', title: '打たれ強い', desc: '30回食べられる', cat: '耐久', progressKey: 'deaths', target: 30 },
    { id: 'round_survive', icon: '🛡️', title: '無傷の生還', desc: '一度も食べられずにラウンドを終える', cat: '耐久' },

    // --- パワーアップ / アイテム ---
    { id: 'boost_1', icon: '⚡', title: '初速', desc: 'パワーアップを初めて使う', cat: 'アイテム' },
    { id: 'boost_10', icon: '🚀', title: 'スピードスター', desc: 'パワーアップを10回使用', cat: 'アイテム', progressKey: 'boostsUsed', target: 10 },
    { id: 'boost_30', icon: '💨', title: '光速', desc: 'パワーアップを30回使用', cat: 'アイテム', progressKey: 'boostsUsed', target: 30 },
    { id: 'warp_1', icon: '🌀', title: '初ワープ', desc: 'ワープホールを初めて使う', cat: 'アイテム' },
    { id: 'warp_5', icon: '🌌', title: 'ワープマスター', desc: 'ワープホールを5回使用', cat: 'アイテム', progressKey: 'warpsUsed', target: 5 },
    { id: 'warp_20', icon: '🛸', title: '空間の旅人', desc: 'ワープホールを20回使用', cat: 'アイテム', progressKey: 'warpsUsed', target: 20 },
    { id: 'item_speed', icon: '⚡', title: 'スピード体験', desc: 'スピードアップアイテムを取得', cat: 'アイテム' },
    { id: 'item_shield', icon: '🛡️', title: 'シールド体験', desc: 'シールドアイテムを取得', cat: 'アイテム' },
    { id: 'item_magnet', icon: '🧲', title: 'マグネット体験', desc: 'マグネットアイテムを取得', cat: 'アイテム' },
    { id: 'item_giant', icon: '💥', title: '巨大化体験', desc: '巨大化アイテムを取得', cat: 'アイテム' },
    { id: 'item_mystery', icon: '❓', title: 'ミステリー体験', desc: 'ミステリーアイテムを取得', cat: 'アイテム' },
    { id: 'item_complete', icon: '🎁', title: 'アイテムコンプリート', desc: '全種類のアイテムを取得する', cat: 'アイテム' },
    { id: 'item_10', icon: '📦', title: 'アイテムハンター', desc: 'アイテムを通算10個取得', cat: 'アイテム', progressKey: 'itemsCollected', target: 10 },
    { id: 'item_30', icon: '🏅', title: 'アイテムマスター', desc: 'アイテムを通算30個取得', cat: 'アイテム', progressKey: 'itemsCollected', target: 30 },

    // --- ラウンド/モード ---
    { id: 'round_win', icon: '🥇', title: '初勝利', desc: 'ラウンドで勝利する', cat: 'ラウンド' },
    { id: 'round_win_5', icon: '🏵️', title: '常勝', desc: 'ラウンドで5回勝利する', cat: 'ラウンド', progressKey: 'roundWins', target: 5 },
    { id: 'round_win_10', icon: '👑', title: 'チャンピオン', desc: 'ラウンドで10回勝利する', cat: 'ラウンド', progressKey: 'roundWins', target: 10 },
    { id: 'ffa_win', icon: '👤', title: '個人戦の覇者', desc: '個人戦モードのラウンドで優勝する', cat: 'ラウンド' },
    { id: 'team_win', icon: '🔴🔵', title: 'チームの勝利者', desc: 'チーム戦モードのラウンドで優勝する', cat: 'ラウンド' },
    { id: 'infection_survivor', icon: '🙂', title: '生存者', desc: '感染鬼ごっこで非感染のまま生き残る', cat: 'ラウンド' },
    { id: 'koth_king', icon: '👑', title: 'ヒルの王様', desc: 'キングオブザヒルで優勝する', cat: 'ラウンド' },
    { id: 'battle_royale_win', icon: '⚡', title: '最後の一人', desc: 'バトルロイヤルで優勝する', cat: 'ラウンド' },

    // --- プレイ実績 ---
    { id: 'games_5', icon: '🎮', title: '常連さん', desc: '5回プレイに参加する', cat: 'プレイ実績', progressKey: 'gamesPlayed', target: 5 },
    { id: 'games_20', icon: '🎫', title: 'ベテラン', desc: '20回プレイに参加する', cat: 'プレイ実績', progressKey: 'gamesPlayed', target: 20 },
    { id: 'playtime_10', icon: '⏱️', title: '10分プレイヤー', desc: '累計プレイ時間10分', cat: 'プレイ実績' },
    { id: 'playtime_60', icon: '⏳', title: '1時間プレイヤー', desc: '累計プレイ時間60分', cat: 'プレイ実績' },

    // --- 隠し要素(このゲームには秘密がまだあるらしい…見つけるまで内容は伏せられる) ---
    { id: 'hidden_stats', icon: '📊', title: '統計マニア', desc: '???', hint: 'サーバー統計の隠しページを見つけた', cat: '🎭 隠し要素' },
    { id: 'hidden_credits', icon: '🎬', title: '楽屋裏探検隊', desc: '???', hint: 'クレジットの隠しページを見つけた', cat: '🎭 隠し要素' },
    { id: 'hidden_omikuji', icon: '🎋', title: '占い師', desc: '???', hint: '隠しおみくじページで運勢を占った', cat: '🎭 隠し要素' },
    { id: 'hidden_daikichi', icon: '🎍', title: '強運の持ち主', desc: '???', hint: 'おみくじで大吉を引いた', cat: '🎭 隠し要素' },
    { id: 'hidden_retro', icon: '💾', title: '懐古厨', desc: '???', hint: '懐かしのホームページ風・隠しページを見つけた', cat: '🎭 隠し要素' },
    { id: 'hidden_tos', icon: '📜', title: '規約は読む派', desc: '???', hint: '謎の利用規約ページを最後まで読んだ', cat: '🎭 隠し要素' },
    { id: 'hidden_konami', icon: '🕹️', title: 'コマンド入力の達人', desc: '???', hint: 'ロビーで例のコマンドを入力した(PC:↑↑↓↓←→←→BA / スマホ:同じ向きに8回スワイプ→ダブルタップ)', cat: '🎭 隠し要素' },
    { id: 'hidden_logotap', icon: '👆', title: 'タップの魔術師', desc: '???', hint: 'ロビーのタイトルを連打した', cat: '🎭 隠し要素' },
    { id: 'hidden_midnight', icon: '🌙', title: '深夜の住人', desc: '???', hint: '深夜2時〜4時にプレイに参加した', cat: '🎭 隠し要素' },
    { id: 'hidden_namecode', icon: '🍬', title: '秘密のコードネーム', desc: '???', hint: '特定の名前で参加した', cat: '🎭 隠し要素' },
    { id: 'hidden_longpress', icon: '🖐️', title: '我慢比べ', desc: '???', hint: 'スコア表示を長押しした', cat: '🎭 隠し要素' },
    { id: 'hidden_secretroom', icon: '🎁', title: 'ヒミツの部屋', desc: '???', hint: 'ロビーの隅を連続でタップした', cat: '🎭 隠し要素' },
    { id: 'hidden_emotecombo', icon: '🎭', title: '感情のフルコース', desc: '???', hint: '12種類の絵文字を表示順にすべて使った(15秒以内)', cat: '🎭 隠し要素' },
    { id: 'hidden_minimap', icon: '🔭', title: 'ミニマップ凝視', desc: '???', hint: 'ミニマップを連続でタップした', cat: '🎭 隠し要素' },
    { id: 'hidden_leaderboard', icon: '📋', title: '本当の実力者', desc: '???', hint: 'ランキング表示を連続でタップした', cat: '🎭 隠し要素' },
    { id: 'hidden_afk', icon: '🗿', title: '置物', desc: '???', hint: '30秒間まったく動かなかった', cat: '🎭 隠し要素' },
    { id: 'hidden_adminname', icon: '🕵️', title: 'なりすまし未遂', desc: '???', hint: '管理者っぽい名前でログインを試みた', cat: '🎭 隠し要素' },

    // --- 物語の欠片(遊び進めるうちに、少しずつ明らかになっていく…) ---
    { id: 'hidden_story_1', icon: '📖', title: '第一の記憶・目覚め', desc: '???', hint: '初めて食べ物を口にした', cat: '📖 物語の欠片' },
    { id: 'hidden_story_2', icon: '📗', title: '第二の記憶・成長', desc: '???', hint: 'スコアを1000まで育てた', cat: '📖 物語の欠片' },
    { id: 'hidden_story_3', icon: '📙', title: '第三の記憶・捕食', desc: '???', hint: '初めて他のプレイヤーを飲み込んだ', cat: '📖 物語の欠片' },
    { id: 'hidden_story_4', icon: '📘', title: '第四の記憶・試練', desc: '???', hint: '一度も死なずにラウンドを生き延びた', cat: '📖 物語の欠片' },
    { id: 'hidden_story_5', icon: '📕', title: '第五の記憶・頂点', desc: '???', hint: 'ランキング1位になった', cat: '📖 物語の欠片' },
    { id: 'hidden_story_6', icon: '📓', title: '終章・真実', desc: '???', hint: 'ヒミツの部屋で最後のログを見つけた', cat: '📖 物語の欠片' },
    { id: 'hidden_story_true', icon: '🌈', title: '赤い点の真実', desc: '???', hint: '物語の欠片を6つすべて集めた(自分の色が虹色に輝くようになる)', cat: '📖 物語の欠片' },

    { id: 'hidden_allsecrets', icon: '🗝️', title: 'すべてを見た者', desc: '???', hint: '隠し要素の実績をすべて解除した', cat: '🎭 隠し要素' }
  ];
  const HIDDEN_SECRET_IDS = [
    'hidden_stats', 'hidden_credits', 'hidden_omikuji', 'hidden_daikichi', 'hidden_retro', 'hidden_tos',
    'hidden_konami', 'hidden_logotap', 'hidden_midnight', 'hidden_namecode', 'hidden_longpress',
    'hidden_secretroom', 'hidden_emotecombo', 'hidden_minimap', 'hidden_leaderboard', 'hidden_afk', 'hidden_adminname',
    'hidden_story_1', 'hidden_story_2', 'hidden_story_3', 'hidden_story_4', 'hidden_story_5', 'hidden_story_6', 'hidden_story_true'
  ];

  function unlockAchievement(id) {
    if (achievementUnlocked[id]) return;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;
    achievementUnlocked[id] = true;
    saveAchievementUnlocked();
    showAchievementToast(def);
    if (latestState.effectsEnabled) playSound('item');
    if (!achievementsModal.classList.contains('hidden')) renderAchievementsList();
    // 隠し要素をすべて集めたら特別な実績を解除
    if (HIDDEN_SECRET_IDS.includes(id) && HIDDEN_SECRET_IDS.every(hid => achievementUnlocked[hid])) {
      unlockAchievement('hidden_allsecrets');
    }
  }

  // 実績解除が連続しても順番に表示するトーストキュー
  let toastQueue = [];
  let toastShowing = false;
  function showAchievementToast(def) {
    toastQueue.push(def);
    if (!toastShowing) processToastQueue();
  }
  function processToastQueue() {
    if (toastQueue.length === 0) {
      toastShowing = false;
      return;
    }
    toastShowing = true;
    const def = toastQueue.shift();
    achievementToast.textContent = `🏆 実績解除: ${def.icon} ${def.title}`;
    achievementToast.classList.remove('hidden');
    setTimeout(() => {
      achievementToast.classList.add('hidden');
      setTimeout(processToastQueue, 250);
    }, 2600);
  }

  function renderAchievementsList() {
    const categories = [];
    for (const a of ACHIEVEMENTS) {
      if (!categories.includes(a.cat)) categories.push(a.cat);
    }
    let html = '';
    for (const cat of categories) {
      html += `<h4>${escapeHtml(cat)}</h4>`;
      for (const a of ACHIEVEMENTS.filter(x => x.cat === cat)) {
        const unlocked = !!achievementUnlocked[a.id];
        let desc = (unlocked && a.hint) ? a.hint : a.desc;
        if (!unlocked && a.progressKey) {
          desc += ` (現在 ${Math.min(achievementStats[a.progressKey] || 0, a.target)}/${a.target})`;
        }
        html += `<div class="achievement-item${unlocked ? ' unlocked' : ''}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-body">
            <div class="ach-title">${a.title}</div>
            <div class="ach-desc">${desc}</div>
          </div>
        </div>`;
      }
    }
    const unlockedCount = ACHIEVEMENTS.filter(a => achievementUnlocked[a.id]).length;
    achievementsList.innerHTML = `<p style="font-size:12px;color:#7c8aa3;margin-bottom:10px;">達成: ${unlockedCount} / ${ACHIEVEMENTS.length}</p>${html}`;
  }

  // ===== 実績判定ロジック =====
  let lifeStartTime = 0;   // 直近の参加/リスポーン時刻(秒殺判定用)
  let lifeMinMass = 0;     // 直近の生存中の最低スコア(大逆転判定用)
  let recentKillTimes = []; // 連続撃破判定用
  let diedThisRound = false; // ラウンド中に一度でも食べられたか
  let lastRoundStateSeen = null; // ラウンド状態の遷移検知用

  function checkMassAchievements(mass) {
    if (mass > 0) {
      unlockAchievement('first_food');
      unlockStoryFragment('hidden_story_1');
    }
    if (mass >= 100) unlockAchievement('mass_100');
    if (mass >= 500) unlockAchievement('mass_500');
    if (mass >= 1000) {
      unlockAchievement('mass_1000');
      unlockStoryFragment('hidden_story_2');
    }
    if (mass >= 2000) unlockAchievement('mass_2000');
    if (mass >= 5000) unlockAchievement('mass_5000');
    if (mass >= 10000) unlockAchievement('mass_10000');
    // 大逆転: 直近で20以下まで落ちてから1000以上に到達
    if (mass <= 20) {
      lifeMinMass = mass;
    } else if (lifeMinMass <= 20 && mass >= 1000) {
      unlockAchievement('comeback');
    }
  }

  function checkRankAchievement() {
    const alive = (latestState.players || []).filter(p => p.alive);
    if (alive.length < 2) return;
    const top = alive.reduce((best, p) => (p.mass > best.mass ? p : best), alive[0]);
    if (top.id === myId && top.mass > 0) {
      unlockAchievement('rank_1');
      unlockStoryFragment('hidden_story_5');
    }
  }

  function checkFullLobbyAchievement() {
    const humans = (latestState.players || []).filter(p => !p.isBot);
    if (humans.length >= 5 && humans.some(p => p.id === myId)) {
      unlockAchievement('full_lobby');
    }
  }

  function registerKill(aMass, bMass) {
    achievementStats.kills = (achievementStats.kills || 0) + 1;
    saveAchievementStats();
    unlockAchievement('first_kill');
    unlockStoryFragment('hidden_story_3');
    ['kill_5', 'kill_10', 'kill_25', 'kill_50', 'kill_100'].forEach(id => {
      const def = ACHIEVEMENTS.find(a => a.id === id);
      if (def && achievementStats.kills >= def.target) unlockAchievement(id);
    });
    if (typeof aMass === 'number' && typeof bMass === 'number' && bMass > 0 && aMass >= bMass * 3) {
      unlockAchievement('giant_slayer');
    }
    const now = Date.now();
    recentKillTimes.push(now);
    recentKillTimes = recentKillTimes.filter(t => now - t <= 15000);
    if (recentKillTimes.length >= 3) unlockAchievement('kill_streak');
  }
  function registerItemPickup(itemType) {
    achievementStats.itemsCollected = (achievementStats.itemsCollected || 0) + 1;
    if (itemType) {
      achievementStats.itemTypes = achievementStats.itemTypes || {};
      achievementStats.itemTypes[itemType] = true;
    }
    saveAchievementStats();
    if (achievementStats.itemsCollected >= 10) unlockAchievement('item_10');
    if (achievementStats.itemsCollected >= 30) unlockAchievement('item_30');
    const typeAchievementMap = { speed: 'item_speed', shield: 'item_shield', magnet: 'item_magnet', giant: 'item_giant', mystery: 'item_mystery' };
    if (typeAchievementMap[itemType]) unlockAchievement(typeAchievementMap[itemType]);
    const allTypes = ['speed', 'shield', 'magnet', 'giant', 'mystery'];
    if (allTypes.every(t => achievementStats.itemTypes && achievementStats.itemTypes[t])) {
      unlockAchievement('item_complete');
    }
  }
  function registerBoostUsed() {
    achievementStats.boostsUsed = (achievementStats.boostsUsed || 0) + 1;
    saveAchievementStats();
    unlockAchievement('boost_1');
    if (achievementStats.boostsUsed >= 10) unlockAchievement('boost_10');
    if (achievementStats.boostsUsed >= 30) unlockAchievement('boost_30');
  }
  function registerWarpUsed() {
    achievementStats.warpsUsed = (achievementStats.warpsUsed || 0) + 1;
    saveAchievementStats();
    unlockAchievement('warp_1');
    if (achievementStats.warpsUsed >= 5) unlockAchievement('warp_5');
    if (achievementStats.warpsUsed >= 20) unlockAchievement('warp_20');
  }
  function registerDeath() {
    achievementStats.deaths = (achievementStats.deaths || 0) + 1;
    saveAchievementStats();
    unlockAchievement('first_death');
    if (achievementStats.deaths >= 10) unlockAchievement('death_10');
    if (achievementStats.deaths >= 30) unlockAchievement('death_30');
    if (lifeStartTime && Date.now() - lifeStartTime <= 2000) unlockAchievement('instant_death');
    diedThisRound = true;
    lifeStartTime = Date.now();
    lifeMinMass = 0;
  }
  function registerRoundWin(mode) {
    achievementStats.roundWins = (achievementStats.roundWins || 0) + 1;
    saveAchievementStats();
    unlockAchievement('round_win');
    if (achievementStats.roundWins >= 5) unlockAchievement('round_win_5');
    if (achievementStats.roundWins >= 10) unlockAchievement('round_win_10');
    const modeAchievementMap = {
      ffa: 'ffa_win', team: 'team_win', infection: 'infection_survivor',
      koth: 'koth_king', battle_royale: 'battle_royale_win'
    };
    if (modeAchievementMap[mode]) unlockAchievement(modeAchievementMap[mode]);
    if (!diedThisRound) {
      unlockAchievement('round_survive');
      unlockStoryFragment('hidden_story_4');
    }
  }
  function registerGamePlayed() {
    achievementStats.gamesPlayed = (achievementStats.gamesPlayed || 0) + 1;
    saveAchievementStats();
    if (achievementStats.gamesPlayed >= 5) unlockAchievement('games_5');
    if (achievementStats.gamesPlayed >= 20) unlockAchievement('games_20');
  }

  // プレイ時間の積算(10秒ごとに加算し、Cookieへ保存)
  setInterval(() => {
    if (!joined || spectating) return;
    achievementStats.playSeconds = (achievementStats.playSeconds || 0) + 10;
    saveAchievementStats();
    if (achievementStats.playSeconds >= 600) unlockAchievement('playtime_10');
    if (achievementStats.playSeconds >= 3600) unlockAchievement('playtime_60');
  }, 10000);

  // ===== 遊び方 / 実績モーダルの開閉 =====
  function openHelpModal() { helpModal.classList.remove('hidden'); }
  function closeHelpModal() { helpModal.classList.add('hidden'); }
  helpOpenBtn.addEventListener('click', openHelpModal);
  helpGameBtn.addEventListener('click', openHelpModal);
  helpCloseBtn.addEventListener('click', closeHelpModal);
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeHelpModal(); });

  function openAchievementsModal() {
    renderAchievementsList();
    achievementsModal.classList.remove('hidden');
  }
  function closeAchievementsModal() { achievementsModal.classList.add('hidden'); }
  achievementsOpenBtn.addEventListener('click', openAchievementsModal);
  achievementsGameBtn.addEventListener('click', openAchievementsModal);
  achievementsCloseBtn.addEventListener('click', closeAchievementsModal);
  achievementsModal.addEventListener('click', (e) => { if (e.target === achievementsModal) closeAchievementsModal(); });

  // ========================================================
  // ===== アカウントシステム(登録 / ログイン / ゲスト) =====
  // ========================================================
  const TOKEN_KEY = 'dotbattle_token';
  let accountToken = null;
  let accountUsername = null;

  function getStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function storeToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { /* ストレージ不可時は無視(ゲスト扱い) */ }
  }
  function clearStoredToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* noop */ }
  }

  function showLoggedInUI(username) {
    accountUsername = username;
    accountUsernameDisplay.textContent = username;
    accountLoggedOutSection.classList.add('hidden');
    accountLoggedInSection.classList.remove('hidden');
  }
  function showLoggedOutUI() {
    accountUsername = null;
    accountLoggedInSection.classList.add('hidden');
    accountLoggedOutSection.classList.remove('hidden');
  }

  // ページ読み込み時に保存済みトークンがあれば自動ログインを試みる
  accountToken = getStoredToken();
  socket.on('connect', () => {
    if (accountToken) {
      socket.emit('resumeSession', { token: accountToken });
    }
  });
  socket.on('sessionResult', (res) => {
    if (res && res.success) {
      showLoggedInUI(res.username);
    } else {
      accountToken = null;
      clearStoredToken();
      showLoggedOutUI();
    }
  });

  // ----- モーダル開閉 -----
  function openLoginModal() {
    loginMsg.textContent = '';
    loginPasswordInput.value = '';
    loginModal.classList.remove('hidden');
  }
  function closeLoginModal() { loginModal.classList.add('hidden'); }
  function openRegisterModal() {
    registerMsg.textContent = '';
    registerPasswordInput.value = '';
    registerPasswordConfirmInput.value = '';
    registerModal.classList.remove('hidden');
  }
  function closeRegisterModal() { registerModal.classList.add('hidden'); }

  loginOpenBtn.addEventListener('click', openLoginModal);
  loginCancelBtn.addEventListener('click', closeLoginModal);
  loginModal.addEventListener('click', (e) => { if (e.target === loginModal) closeLoginModal(); });

  registerOpenBtn.addEventListener('click', openRegisterModal);
  registerCancelBtn.addEventListener('click', closeRegisterModal);
  registerModal.addEventListener('click', (e) => { if (e.target === registerModal) closeRegisterModal(); });

  switchToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeLoginModal();
    openRegisterModal();
  });
  switchToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeRegisterModal();
    openLoginModal();
  });

  // ----- ログイン -----
  function submitLogin() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;
    if (!username || !password) {
      loginMsg.textContent = 'ユーザー名とパスワードを入力してください';
      return;
    }
    checkAdminLikeName(username);
    socket.emit('login', { username, password });
  }
  loginSubmitBtn.addEventListener('click', submitLogin);
  loginPasswordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitLogin(); });
  loginUsernameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitLogin(); });

  socket.on('loginResult', (res) => {
    if (res.success) {
      accountToken = res.token;
      storeToken(res.token);
      showLoggedInUI(res.username);
      closeLoginModal();
    } else {
      loginMsg.textContent = res.message || 'ログインに失敗しました';
    }
  });

  // ----- 新規登録 -----
  function submitRegister() {
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value;
    const confirm = registerPasswordConfirmInput.value;
    if (!username || !password) {
      registerMsg.textContent = 'ユーザー名とパスワードを入力してください';
      return;
    }
    if (password !== confirm) {
      registerMsg.textContent = 'パスワードが一致しません';
      return;
    }
    checkAdminLikeName(username);
    socket.emit('register', { username, password });
  }
  registerSubmitBtn.addEventListener('click', submitRegister);
  registerPasswordConfirmInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitRegister(); });

  socket.on('registerResult', (res) => {
    if (res.success) {
      accountToken = res.token;
      storeToken(res.token);
      showLoggedInUI(res.username);
      closeRegisterModal();
    } else {
      registerMsg.textContent = res.message || '登録に失敗しました';
    }
  });

  // ----- ログアウト -----
  logoutBtn.addEventListener('click', () => {
    if (accountToken) socket.emit('logout', { token: accountToken });
    accountToken = null;
    clearStoredToken();
    showLoggedOutUI();
  });

  // ----- アカウントで参加 -----
  joinAsAccountBtn.addEventListener('click', () => {
    doJoin();
  });

  // ========================================================
  // ===== 個人設定(この端末のブラウザだけに保存、他人には影響しない) =====
  // ========================================================
  const SETTINGS_DEFAULTS = {
    wasdEnabled: true,
    wasdOnly: false,
    soundEnabled: true,
    shakeEnabled: true,
    particlesEnabled: true,
    minimapEnabled: true,
    feedEnabled: true
  };
  function loadSettings() {
    try {
      const raw = localStorage.getItem('dotbattle_settings');
      return raw ? Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(raw)) : Object.assign({}, SETTINGS_DEFAULTS);
    } catch (e) {
      return Object.assign({}, SETTINGS_DEFAULTS);
    }
  }
  const settings = loadSettings();
  function saveSettings() {
    try { localStorage.setItem('dotbattle_settings', JSON.stringify(settings)); } catch (e) { /* noop */ }
  }

  function setToggleBtnState(btn, on) {
    btn.textContent = on ? 'ON' : 'OFF';
    btn.classList.toggle('on', on);
    btn.classList.toggle('off', !on);
  }
  function refreshSettingsButtons() {
    setToggleBtnState(settingWasdBtn, settings.wasdEnabled);
    setToggleBtnState(settingWasdOnlyBtn, settings.wasdOnly);
    setToggleBtnState(settingSoundBtn, settings.soundEnabled);
    setToggleBtnState(settingShakeBtn, settings.shakeEnabled);
    setToggleBtnState(settingParticlesBtn, settings.particlesEnabled);
    setToggleBtnState(settingMinimapBtn, settings.minimapEnabled);
    setToggleBtnState(settingFeedBtn, settings.feedEnabled);
  }
  function bindSettingToggle(btn, key) {
    btn.addEventListener('click', () => {
      settings[key] = !settings[key];
      saveSettings();
      refreshSettingsButtons();
      if (key === 'minimapEnabled') {
        minimapCanvas.classList.toggle('hidden', !settings.minimapEnabled);
      }
      if (key === 'feedEnabled' && !settings.feedEnabled) {
        killFeed.innerHTML = '';
        feedItems.length = 0;
      }
    });
  }
  bindSettingToggle(settingWasdBtn, 'wasdEnabled');
  // WASD専用モードをONにする場合は、キーボード移動自体も強制的にONにする(でないと一切操作できなくなるため)
  settingWasdOnlyBtn.addEventListener('click', () => {
    settings.wasdOnly = !settings.wasdOnly;
    if (settings.wasdOnly) settings.wasdEnabled = true;
    dirX = 0;
    dirY = 0;
    pointerActive = false;
    if (settings.wasdOnly) joystickBase.classList.add('hidden');
    saveSettings();
    refreshSettingsButtons();
  });
  bindSettingToggle(settingSoundBtn, 'soundEnabled');
  bindSettingToggle(settingShakeBtn, 'shakeEnabled');
  bindSettingToggle(settingParticlesBtn, 'particlesEnabled');
  bindSettingToggle(settingMinimapBtn, 'minimapEnabled');
  bindSettingToggle(settingFeedBtn, 'feedEnabled');
  refreshSettingsButtons();
  if (!settings.minimapEnabled) minimapCanvas.classList.add('hidden');

  // ========================================================
  // ===== 隠し要素(このゲームにはまだ秘密があるらしい…) =====
  // ========================================================

  // 隠しページ(/stats /credits /omikuji /retro /tos)を訪れたかをlocalStorageのフラグで確認
  function checkHiddenPageFlags() {
    try {
      if (localStorage.getItem('dotbattle_visited_stats')) unlockAchievement('hidden_stats');
      if (localStorage.getItem('dotbattle_visited_credits')) unlockAchievement('hidden_credits');
      if (localStorage.getItem('dotbattle_visited_omikuji')) unlockAchievement('hidden_omikuji');
      if (localStorage.getItem('dotbattle_drew_daikichi')) unlockAchievement('hidden_daikichi');
      if (localStorage.getItem('dotbattle_visited_retro')) unlockAchievement('hidden_retro');
      if (localStorage.getItem('dotbattle_visited_tos')) unlockAchievement('hidden_tos');
    } catch (e) { /* noop */ }
  }
  // スクリプト全体(let/const宣言)の初期化が完了してから実行する
  setTimeout(checkHiddenPageFlags, 0);

  // ----- コナミコマンド(↑↑↓↓←→←→BA) -----
  const KONAMI_SEQUENCE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let konamiProgress = 0;
  window.addEventListener('keydown', (e) => {
    if (isTypingInField()) return;
    const key = e.key.toLowerCase();
    if (key === KONAMI_SEQUENCE[konamiProgress]) {
      konamiProgress++;
      if (konamiProgress === KONAMI_SEQUENCE.length) {
        konamiProgress = 0;
        unlockAchievement('hidden_konami');
        if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
        playSound('round');
      }
    } else {
      konamiProgress = (key === KONAMI_SEQUENCE[0]) ? 1 : 0;
    }
  });
  function spawnConfettiAtScreenCenter() {
    // ロビー等ゲーム外でも見えるよう、DOM側で簡易的な紙吹雪演出を出す
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      const colors = ['#ff5566', '#33ccff', '#ffcc33', '#66ff99', '#cc66ff', '#ff9933'];
      el.style.position = 'fixed';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-20px';
      el.style.width = '8px';
      el.style.height = '14px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.zIndex = '9999';
      el.style.pointerEvents = 'none';
      el.style.transition = `transform ${1.6 + Math.random()}s linear, opacity ${1.6 + Math.random()}s linear`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translateY(${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`;
        el.style.opacity = '0.2';
      });
      setTimeout(() => el.remove(), 3000);
    }
  }

  // ----- ロビータイトルの連打(10回/3秒以内でPC/スマホどちらでも発動) -----
  let logoTapTimes = [];
  if (lobbyTitle) {
    lobbyTitle.style.cursor = 'pointer';
    lobbyTitle.addEventListener('click', () => {
      const now = Date.now();
      logoTapTimes.push(now);
      logoTapTimes = logoTapTimes.filter(t => now - t <= 3000);
      if (logoTapTimes.length >= 10) {
        logoTapTimes = [];
        unlockAchievement('hidden_logotap');
        if (latestState.effectsEnabled) spawnConfettiAtScreenCenter();
      }
    });
  }

  // ----- スマホ用: スワイプでコナミコマンド相当(同じ8方向スワイプ+ダブルタップで完了) -----
  const SWIPE_KONAMI_SEQUENCE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  let swipeProgress = 0;
  let swipeStartX = 0, swipeStartY = 0, swipeStartT = 0;
  let swipeLastTapAt = 0;
  let swipeTapCount = 0;
  window.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeStartT = Date.now();
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    const dt = Date.now() - swipeStartT;
    const dx = touch.clientX - swipeStartX;
    const dy = touch.clientY - swipeStartY;
    const dist = Math.hypot(dx, dy);

    // コマンド入力完了後は、素早い2回タップで確定(キーボード版のB,Aに相当)
    if (swipeProgress === SWIPE_KONAMI_SEQUENCE.length) {
      if (dist < 24 && dt < 350) {
        const now = Date.now();
        swipeTapCount = (now - swipeLastTapAt < 500) ? swipeTapCount + 1 : 1;
        swipeLastTapAt = now;
        if (swipeTapCount >= 2) {
          swipeProgress = 0;
          swipeTapCount = 0;
          unlockAchievement('hidden_konami');
          if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
          playSound('round');
        }
        return;
      }
      swipeProgress = 0;
      return;
    }

    if (dist < 40 || dt > 800) return; // 小さすぎる/遅すぎる操作は無視(進行はリセットしない)

    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (dir === SWIPE_KONAMI_SEQUENCE[swipeProgress]) {
      swipeProgress++;
    } else {
      swipeProgress = (dir === SWIPE_KONAMI_SEQUENCE[0]) ? 1 : 0;
    }
  }, { passive: true });

  // ----- 秘密のコードネームで参加(隠し名前) -----
  const SECRET_NAME = 'ぱっくん';
  let secretRainbowSkin = false;
  function checkSecretName(name) {
    if (!name) return;
    if (name.trim() === SECRET_NAME) {
      if (!secretRainbowSkin) {
        secretRainbowSkin = true;
        unlockAchievement('hidden_namecode');
        if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
      }
    }
  }

  // ----- 管理者っぽい名前でログイン/登録を試す(ジョーク実績) -----
  const ADMIN_LIKE_NAMES = ['admin', '管理者', 'administrator', 'root', 'karwak'];
  function checkAdminLikeName(name) {
    if (!name) return;
    if (ADMIN_LIKE_NAMES.includes(name.trim().toLowerCase())) {
      unlockAchievement('hidden_adminname');
    }
  }

  // ----- スコア表示の長押し(PC:マウス / スマホ:タッチ 両対応、2秒) -----
  let longPressTimer = null;
  function startLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      unlockAchievement('hidden_longpress');
      if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
    }, 2000);
  }
  function cancelLongPress() {
    clearTimeout(longPressTimer);
  }
  if (scoreBox) {
    scoreBox.addEventListener('mousedown', startLongPress);
    scoreBox.addEventListener('mouseup', cancelLongPress);
    scoreBox.addEventListener('mouseleave', cancelLongPress);
    scoreBox.addEventListener('touchstart', startLongPress, { passive: true });
    scoreBox.addEventListener('touchend', cancelLongPress, { passive: true });
    scoreBox.addEventListener('touchcancel', cancelLongPress, { passive: true });
  }

  // ----- ロビー隅のヒミツのタップ判定(3回連続タップ/クリックで発動、URL不要のページ的な発見) -----
  const secretHotspot = document.getElementById('secretHotspot');
  const secretRoomModal = document.getElementById('secretRoomModal');
  const secretRoomCloseBtn = document.getElementById('secretRoomCloseBtn');
  let hotspotTapTimes = [];
  if (secretHotspot) {
    secretHotspot.addEventListener('click', () => {
      const now = Date.now();
      hotspotTapTimes.push(now);
      hotspotTapTimes = hotspotTapTimes.filter(t => now - t <= 2500);
      if (hotspotTapTimes.length >= 3) {
        hotspotTapTimes = [];
        unlockAchievement('hidden_secretroom');
        secretRoomModal.classList.remove('hidden');
        if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
        // 部屋を開いたら少し間を置いてから、隠されていたログ(物語の最終章)を表示する
        setTimeout(() => {
          secretRoomModal.classList.add('hidden');
          unlockStoryFragment('hidden_story_6');
        }, 1500);
      }
    });
  }
  if (secretRoomCloseBtn) {
    secretRoomCloseBtn.addEventListener('click', () => secretRoomModal.classList.add('hidden'));
  }
  if (secretRoomModal) {
    secretRoomModal.addEventListener('click', (e) => { if (e.target === secretRoomModal) secretRoomModal.classList.add('hidden'); });
  }

  // ============================================================
  // ----- 物語の欠片(遊び進めるうちに少しずつ明らかになる隠しストーリー) -----
  // 「赤い点」と呼ばれた、かつてこの世界の頂点にいた何者かの記録。
  // 6つの欠片をすべて集めると、真実が明らかになる。
  // ============================================================
  const storyModal = document.getElementById('storyModal');
  const storyModalProgress = document.getElementById('storyModalProgress');
  const storyModalTitle = document.getElementById('storyModalTitle');
  const storyModalText = document.getElementById('storyModalText');
  const storyModalCloseBtn = document.getElementById('storyModalCloseBtn');

  const STORY_FRAGMENTS = [
    {
      id: 'hidden_story_1', order: 1, icon: '📖', title: '第一の記憶・目覚め',
      text: 'ここは、どこだ。気づけば、ただの小さな点として、この世界に放り出されていた。\n誰もが点として生まれ、点として大きくなり、いつか点として消えていく——そういう掟が、この世界にはあるらしい。'
    },
    {
      id: 'hidden_story_2', order: 2, icon: '📗', title: '第二の記憶・成長',
      text: '大きくなるほど、世界が良く見えるようになった。\n同時に、大きくなった点ほど、誰かに狙われるようになることも知った。\nかつて、誰よりも大きく育った点がいたという——伝説のように語られる、「赤い点」の噂。'
    },
    {
      id: 'hidden_story_3', order: 3, icon: '📙', title: '第三の記憶・捕食',
      text: '己より小さな点を飲み込んだとき、妙な感覚があった。\n相手の記憶の欠片が、一瞬だけ流れ込んでくるような——そんな気がしたのだ。\n赤い点は、来る日も来る日もそれを繰り返し、やがて誰も敵わないほどの力を得たという。'
    },
    {
      id: 'hidden_story_4', order: 4, icon: '📘', title: '第四の記憶・試練',
      text: '一度も倒れることなく、ラウンドを生き延びた。\nこの世界のルールが、少しずつわかってくる気がする。\n赤い点も、幾多のラウンドを生き延びた末に、ついに誰も追いつけない領域へ達したそうだ。ただし——その代償もあったらしい。'
    },
    {
      id: 'hidden_story_5', order: 5, icon: '📕', title: '第五の記憶・頂点',
      text: 'ランキングの頂点に立ったとき、視界の端を赤い光がよぎった気がした。\nそれは幻だったのか、それとも——かつて頂点に立ち続けた「赤い点」が、まだこの世界のどこかで眠っている証なのか。'
    },
    {
      id: 'hidden_story_6', order: 6, icon: '📓', title: '終章・真実',
      text: 'ヒミツの部屋に隠されていたのは、小さなログファイルだった。\n\n『わたしは、点として生まれ、点として大きくなり、点としてすべてを飲み込んだ。\nだが最後に残ったのは、ただの寂しさだった。\n次にここへ来る者へ——大きくなることより、誰かと一緒に遊ぶことを、忘れないでほしい。』\n\n——赤い点より'
    }
  ];
  const STORY_TOTAL = STORY_FRAGMENTS.length;

  let storyTypeTimer = null;
  function playStoryTypewriter(text) {
    if (storyTypeTimer) clearInterval(storyTypeTimer);
    storyModalText.innerHTML = '<span class="cursor">▌</span>';
    let i = 0;
    storyTypeTimer = setInterval(() => {
      i++;
      const shown = text.slice(0, i);
      storyModalText.innerHTML = escapeHtml(shown).replace(/\n/g, '<br>') + '<span class="cursor">▌</span>';
      if (i >= text.length) {
        clearInterval(storyTypeTimer);
        storyTypeTimer = null;
      }
    }, 35);
  }

  // 物語の欠片を1つ解除する(まだ見つけていなければ、演出付きで表示する)
  function unlockStoryFragment(fragmentId) {
    if (achievementUnlocked[fragmentId]) return; // 既に見つけている欠片
    const frag = STORY_FRAGMENTS.find(f => f.id === fragmentId);
    if (!frag) return;
    unlockAchievement(fragmentId);
    storyModalProgress.textContent = `断片 ${frag.order} / ${STORY_TOTAL}`;
    storyModalTitle.textContent = `${frag.icon} ${frag.title}`;
    storyModal.classList.remove('hidden');
    playStoryTypewriter(frag.text);
    if (settings.particlesEnabled) spawnConfettiAtScreenCenter();

    // 6つすべて集まったら、真実の実績を解除して特別な演出を付与する
    const allFound = STORY_FRAGMENTS.every(f => achievementUnlocked[f.id]);
    if (allFound && !achievementUnlocked['hidden_story_true']) {
      setTimeout(() => {
        unlockAchievement('hidden_story_true');
        storyModalProgress.textContent = '真実';
        storyModalTitle.textContent = '🌈 赤い点の真実';
        storyModal.classList.remove('hidden');
        playStoryTypewriter('すべての記憶が繋がった。\n「赤い点」の正体は、この世界を遊び尽くした、かつての誰かだったのだろう。\nその魂は、今こうしてあなたの色に宿った。\n\n——あなたの点は、これからずっと虹色に輝き続ける。');
        if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
      }, 600);
    }
  }
  if (storyModalCloseBtn) {
    storyModalCloseBtn.addEventListener('click', () => {
      storyModal.classList.add('hidden');
      if (storyTypeTimer) { clearInterval(storyTypeTimer); storyTypeTimer = null; }
    });
  }
  if (storyModal) {
    storyModal.addEventListener('click', (e) => { if (e.target === storyModal) storyModalCloseBtn.click(); });
  }

  // ----- 絵文字コンボ(表示順どおりに😂😭😡🔥👍💀を押す) -----
  const EMOTE_COMBO_SEQUENCE = ['laugh', 'cry', 'angry', 'fire', 'thumbsup', 'skull', 'wow', 'cool', 'party', 'heart', 'wave', 'hundred'];
  let emoteComboProgress = [];
  let emoteComboTimer = null;
  function trackEmoteCombo(type) {
    emoteComboProgress.push(type);
    if (emoteComboProgress.length > EMOTE_COMBO_SEQUENCE.length) {
      emoteComboProgress = emoteComboProgress.slice(-EMOTE_COMBO_SEQUENCE.length);
    }
    if (emoteComboTimer) clearTimeout(emoteComboTimer);
    emoteComboTimer = setTimeout(() => { emoteComboProgress = []; }, 15000);
    if (emoteComboProgress.length === EMOTE_COMBO_SEQUENCE.length &&
        emoteComboProgress.every((t, i) => t === EMOTE_COMBO_SEQUENCE[i])) {
      emoteComboProgress = [];
      unlockAchievement('hidden_emotecombo');
      if (settings.particlesEnabled) spawnConfettiAtScreenCenter();
      playSound('round');
    }
  }

  // ----- ミニマップの連続タップ -----
  let minimapTapTimes = [];
  minimapCanvas.addEventListener('click', () => {
    const now = Date.now();
    minimapTapTimes.push(now);
    minimapTapTimes = minimapTapTimes.filter(t => now - t <= 2000);
    if (minimapTapTimes.length >= 4) {
      minimapTapTimes = [];
      unlockAchievement('hidden_minimap');
    }
  });

  // ----- ランキング表示の連続タップ(HUDは毎フレーム再描画されるためイベント委譲で監視) -----
  let leaderboardTapTimes = [];
  leaderboard.addEventListener('click', (e) => {
    if (!e.target.closest('h3')) return;
    const now = Date.now();
    leaderboardTapTimes.push(now);
    leaderboardTapTimes = leaderboardTapTimes.filter(t => now - t <= 2000);
    if (leaderboardTapTimes.length >= 4) {
      leaderboardTapTimes = [];
      unlockAchievement('hidden_leaderboard');
    }
  });

  // ----- 30秒間ノーアクションで「置物」実績(移動もパワーアップも絵文字も一切なし) -----
  let lastActionAt = Date.now();
  function markActivity() { lastActionAt = Date.now(); }
  setInterval(() => {
    if (joined && !spectating && Date.now() - lastActionAt >= 30000) {
      unlockAchievement('hidden_afk');
    }
  }, 2000);

  function openSettingsModal() {
    refreshSettingsButtons();
    accountSettingsLoggedIn.classList.toggle('hidden', !accountUsername);
    accountSettingsLoggedOut.classList.toggle('hidden', !!accountUsername);
    changeUsernameMsg.textContent = '';
    changePasswordMsg.textContent = '';
    settingsModal.classList.remove('hidden');
  }
  function closeSettingsModal() { settingsModal.classList.add('hidden'); }
  settingsOpenBtn.addEventListener('click', openSettingsModal);
  settingsCloseBtn.addEventListener('click', closeSettingsModal);
  settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettingsModal(); });

  // ----- アカウント設定: ユーザー名変更 -----
  changeUsernameBtn.addEventListener('click', () => {
    const newUsername = changeUsernameInput.value.trim();
    if (!newUsername) {
      changeUsernameMsg.textContent = '新しいユーザー名を入力してください';
      return;
    }
    socket.emit('changeUsername', { token: accountToken, newUsername });
  });
  socket.on('changeUsernameResult', (res) => {
    if (res.success) {
      accountUsername = res.username;
      accountUsernameDisplay.textContent = res.username;
      changeUsernameMsg.textContent = '✅ ユーザー名を変更しました';
      changeUsernameInput.value = '';
    } else {
      changeUsernameMsg.textContent = res.message || '変更に失敗しました';
    }
  });

  // ----- アカウント設定: パスワード変更 -----
  changePasswordBtn.addEventListener('click', () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    if (!currentPassword || !newPassword) {
      changePasswordMsg.textContent = '現在のパスワードと新しいパスワードを入力してください';
      return;
    }
    socket.emit('changePassword', { token: accountToken, currentPassword, newPassword });
  });
  socket.on('changePasswordResult', (res) => {
    if (res.success) {
      changePasswordMsg.textContent = '✅ パスワードを変更しました';
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
    } else {
      changePasswordMsg.textContent = res.message || '変更に失敗しました';
    }
  });

  // ----- ゲスト名を記憶して次回自動入力 -----
  try {
    const savedName = localStorage.getItem('dotbattle_guest_name');
    if (savedName) nameInput.value = savedName;
  } catch (e) { /* noop */ }

  let myId = null;
  let worldSize = 3000;
  let latestState = { players: [], food: [] };
  let joined = false;
  let spectating = false;
  let isAdmin = false;
  let lastAdminListRender = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ===== 接続状態表示 =====
  socket.on('connect', () => {
    connStatus.textContent = 'サーバーに接続しました。参加できます。';
    connStatus.classList.remove('err');
    joinBtn.disabled = false;
  });
  socket.on('disconnect', () => {
    connStatus.textContent = 'サーバーとの接続が切れました。';
    connStatus.classList.add('err');
    joinBtn.disabled = true;
  });
  socket.on('connect_error', () => {
    connStatus.textContent = '接続エラー。サーバーが起動しているか確認してください。';
    connStatus.classList.add('err');
  });

  socket.on('welcome', (data) => {
    myId = data.id;
    worldSize = data.worldSize;
    joined = true;
    spectating = !!data.spectate;
    lobby.classList.add('hidden');
    gameUI.classList.remove('hidden');
    deathMsg.classList.add('hidden');
    spectateBar.classList.toggle('hidden', !spectating);
    emoteBar.classList.toggle('hidden', spectating);
    updateAdminUIVisibility();
    updateBoostButton();
    if (spectating) {
      unlockAchievement('spectate_once');
    } else {
      registerGamePlayed();
      lifeStartTime = Date.now();
      lifeMinMass = 0;
      diedThisRound = false;
      const hour = new Date().getHours();
      if (hour >= 2 && hour < 4) unlockAchievement('hidden_midnight');
    }
  });

  socket.on('state', (state) => {
    latestState = state;
    if (typeof state.worldSize === 'number') {
      worldSize = state.worldSize;
    }
    updateHudStats();
    updateBoostButton();
    updateRoundAndTeamBar();
    const myPlayer = getMe();
    if (myPlayer) {
      checkMassAchievements(myPlayer.mass);
      checkRankAchievement();
      checkFullLobbyAchievement();
    }
    // 新しいラウンドが始まったら「無傷生還」判定をリセット
    if (state.round && state.round.state === 'active' && lastRoundStateSeen !== 'active') {
      diedThisRound = false;
    }
    if (state.round) lastRoundStateSeen = state.round.state;

    // 管理者一覧は毎フレーム描画すると操作しづらいため1秒間隔に間引く。
    // また入力欄にフォーカス中は上書きしないようにする。
    if (isAdmin && !adminPanel.classList.contains('hidden')) {
      const now = Date.now();
      const focusInsideList = adminPlayerList.contains(document.activeElement);
      if (now - lastAdminListRender > 1000 && !focusInsideList) {
        lastAdminListRender = now;
        renderAdminPlayerList();
        renderAdminStats();
        refreshAnnounceTargets();
        renderRoundAdminStatus();
      }
    }
  });

  // ===== HUDの数値表示 =====
  function updateHudStats() {
    const s = latestState;
    if (statWorldSize) statWorldSize.textContent = s.worldSize ? Math.round(s.worldSize) : '-';
    if (statFood) statFood.textContent = `${s.food ? s.food.length : 0}/${s.foodCount || '-'}`;
    if (statPlayers) {
      const humans = s.players ? s.players.filter(p => !p.isBot).length : 0;
      const bots = s.players ? s.players.filter(p => p.isBot).length : 0;
      statPlayers.textContent = `${humans}人 (BOT${bots})`;
    }
  }

  // ===== ラウンド状況 / チームスコアのHUD表示 =====
  function formatMMSS(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateRoundAndTeamBar() {
    const round = latestState.round;
    if (round && round.state !== 'waiting') {
      roundBar.classList.remove('hidden');
      if (round.state === 'active') {
        const remain = round.endTime - Date.now();
        roundBar.textContent = `🏁 ラウンド${round.number} 残り ${formatMMSS(remain)}`;
      } else {
        roundBar.textContent = `🏁 ${round.resultMessage || 'ラウンド終了'}`;
      }
    } else {
      roundBar.classList.add('hidden');
    }

    const mode = latestState.gameMode;
    if (mode === 'team') {
      const totals = { red: 0, blue: 0 };
      for (const p of latestState.players || []) {
        if (p.team === 'red') totals.red += p.mass;
        else if (p.team === 'blue') totals.blue += p.mass;
      }
      teamScoreBar.classList.remove('hidden');
      teamScoreBar.innerHTML = `
        <span class="team-chip red">🔴 ${Math.round(totals.red)}</span>
        <span class="team-chip blue">🔵 ${Math.round(totals.blue)}</span>
      `;
    } else if (mode === 'infection') {
      const players = latestState.players || [];
      const infected = players.filter(p => p.infected).length;
      const survivors = players.length - infected;
      teamScoreBar.classList.remove('hidden');
      teamScoreBar.innerHTML = `
        <span class="team-chip blue">🙂 生存 ${survivors}</span>
        <span class="team-chip red">🧟 感染 ${infected}</span>
      `;
    } else if (mode === 'koth') {
      const top = [...(latestState.players || [])].sort((a, b) => (b.hillScore || 0) - (a.hillScore || 0))[0];
      teamScoreBar.classList.remove('hidden');
      teamScoreBar.innerHTML = top
        ? `<span class="team-chip red">👑 ${escapeHtml(top.name)}: ${Math.round(top.hillScore || 0)}pt</span>`
        : '';
    } else {
      teamScoreBar.classList.add('hidden');
    }
  }

  socket.on('eaten', (data) => {
    deathText.textContent = `${data.by} に飲み込まれました…`;
    deathMsg.classList.remove('hidden');
    if (latestState.effectsEnabled) {
      triggerShake(28, 600);
      triggerFlash('#ff2244', 650, 0.48);
      triggerImpactLines();
      playSound('death');
      spawnParticles(lastMyPos.x, lastMyPos.y, lastMyColor, 60);
      spawnShards(lastMyPos.x, lastMyPos.y, lastMyColor, 24);
      spawnShockwave(lastMyPos.x, lastMyPos.y, '#ff2244', 320);
      spawnFloatingText(lastMyPos.x, lastMyPos.y, 'K.O.', '#ff4455', 30);
    }
    registerDeath();
  });

  socket.on('warped', () => {
    registerWarpUsed();
  });

  socket.on('roundWin', (data) => {
    registerRoundWin(data && data.mode);
    const me = getMe();
    winnerName.textContent = me ? me.name : '';
    winnerBanner.classList.remove('hidden');
    if (winnerBannerTimer) clearTimeout(winnerBannerTimer);
    winnerBannerTimer = setTimeout(() => winnerBanner.classList.add('hidden'), 3600);
    if (latestState.effectsEnabled) {
      playSound('round');
      triggerFlash('#ffee66', 1100, 0.3);
      triggerShake(12, 600);
      spawnConfetti();
      const camSrc = me || getSpectateCameraTarget();
      const camX = camSrc ? camSrc.x : worldSize / 2;
      const camY = camSrc ? camSrc.y : worldSize / 2;
      launchFireworks(camX, camY, computeZoom(camSrc));
    }
  });
  let winnerBannerTimer = null;

  // ===== 紙吹雪(ラウンド優勝時) =====
  let confetti = [];
  function spawnConfetti() {
    if (!settings.particlesEnabled) return;
    const colors = ['#ff5566', '#33ccff', '#ffcc33', '#66ff99', '#cc66ff', '#ff9933'];
    for (let i = 0; i < 120; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 120,
        vy: 160 + Math.random() * 180,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }
    if (confetti.length > 400) confetti.splice(0, confetti.length - 400);
  }

  socket.on('kicked', () => {
    alert('管理者によってキックされました。');
    location.reload();
  });

  // ===== キルフィード + パーティクル演出 =====
  socket.on('feedEvent', (data) => {
    if (!data || !data.text) return;
    pushFeedItem(data.text, data.kind);
    const isMe = data.aId === myId || data.pId === myId;
    if (latestState.effectsEnabled) {
      const color = data.kind === 'kill' ? '#ff5566' : data.kind === 'infect' ? '#cc66ff' : data.kind === 'golden' ? '#ffdd33' : '#ffcc33';
      if (typeof data.x === 'number' && typeof data.y === 'number') {
        spawnParticles(data.x, data.y, color, data.kind === 'kill' ? 30 : data.kind === 'golden' ? 44 : 16);
        spawnShockwave(data.x, data.y, color, data.kind === 'golden' ? 120 : data.kind === 'kill' ? 95 : 55);
        if (data.kind === 'kill') {
          spawnShards(data.x, data.y, color, 14);
          spawnFloatingText(data.x, data.y, 'KILL!', '#ff5566', 22);
        } else if (data.kind === 'golden') {
          spawnFloatingText(data.x, data.y, `+${GOLDEN_FOOD_GROWTH_CLIENT}✨`, '#ffdd33', 24);
        }
      }
      if (data.kind === 'kill') playSound('kill');
      else if (data.kind === 'item') playSound('item');
      else if (data.kind === 'golden') playSound('golden');

      if (isMe) {
        if (data.kind === 'kill') {
          triggerZoomPunch(0.16);
          triggerFlash('#ffcc33', 300, 0.22);
          triggerImpactLines();
        } else if (data.kind === 'golden') {
          triggerZoomPunch(0.22);
          triggerFlash('#ffee66', 550, 0.38);
          triggerImpactLines();
        }
      }
    }
    if (data.kind === 'kill' && data.aId === myId) registerKill(data.aMass, data.bMass);
    if (data.kind === 'item' && data.pId === myId) registerItemPickup(data.itemType);
    if (data.kind === 'golden' && data.pId === myId) unlockAchievement('golden_food');
  });

  const feedItems = [];
  const FEED_ICONS = { kill: '⚔️', infect: '🧟', item: '🎁', golden: '🌟' };
  function pushFeedItem(text, kind) {
    if (!settings.feedEnabled) return;
    const el = document.createElement('div');
    el.className = `feed-item ${kind || ''}`;
    el.textContent = `${FEED_ICONS[kind] || '📢'} ${text}`;
    killFeed.appendChild(el);
    feedItems.push(el);
    if (feedItems.length > 6) {
      const old = feedItems.shift();
      old.remove();
    }
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(() => {
        el.remove();
        const idx = feedItems.indexOf(el);
        if (idx >= 0) feedItems.splice(idx, 1);
      }, 400);
    }, 4500);
  }

  // ===== 画面揺れ =====
  let shakeUntil = 0;
  let shakeMagnitude = 0;
  function triggerShake(magnitude, durationMs) {
    if (!settings.shakeEnabled) return;
    shakeMagnitude = magnitude;
    shakeUntil = Date.now() + durationMs;
  }

  // 自分の直近の位置/色(被食演出などで参照する)
  let lastMyPos = { x: 0, y: 0 };
  let lastMyColor = '#ff5566';

  // ===== パーティクル =====
  let particles = [];
  function spawnParticles(x, y, color, count) {
    if (!settings.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
    if (particles.length > 500) {
      particles.splice(0, particles.length - 500);
    }
  }
  // 減速せずゆっくり漂う、細かい残像用パーティクル(ブーストの尾など)
  function spawnTrailParticle(x, y, color) {
    if (!settings.particlesEnabled) return;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      trail: true,
      color
    });
    if (particles.length > 500) particles.shift();
  }

  // ===== 画面フラッシュ =====
  let flashColor = null;
  let flashStartAt = 0;
  let flashEndAt = 0;
  function triggerFlash(color, durationMs, peakAlpha) {
    if (!settings.shakeEnabled) return;
    flashColor = color;
    flashStartAt = Date.now();
    flashEndAt = Date.now() + durationMs;
    flashPeakAlpha = peakAlpha || 0.35;
  }
  let flashPeakAlpha = 0.35;

  // ===== 衝撃波リング =====
  let shockwaves = [];
  function spawnShockwave(x, y, color, maxRadius) {
    if (!settings.particlesEnabled) return;
    shockwaves.push({ x, y, color, maxRadius, startAt: Date.now(), durationMs: 550 });
  }

  // ===== カメラパンチ(キル時などのズームキック) =====
  let zoomPunch = 0;
  function triggerZoomPunch(amount) {
    if (!settings.shakeEnabled) return;
    zoomPunch = Math.min(0.45, zoomPunch + amount);
  }

  // ===== インパクトの放射線(自分に効果があった瞬間だけ表示) =====
  let impactLines = null; // { startAt }
  function triggerImpactLines() {
    if (!settings.shakeEnabled) return;
    impactLines = { startAt: Date.now() };
  }

  // ===== 破片パーティクル(被食などの派手な爆発用) =====
  let shards = [];
  function spawnShards(x, y, color, count) {
    if (!settings.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      shards.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 14,
        color,
        life: 1
      });
    }
    if (shards.length > 300) shards.splice(0, shards.length - 300);
  }

  // ===== フローティングテキスト(KILL!/+150 など浮かび上がる文字) =====
  let floatingTexts = [];
  function spawnFloatingText(x, y, text, color, size) {
    if (!settings.particlesEnabled) return;
    floatingTexts.push({ x, y, text, color, size: size || 20, startAt: Date.now(), durationMs: 1100 });
  }

  // ===== 花火(ラウンド優勝演出、既存のパーティクル/衝撃波を組み合わせて表現) =====
  function spawnFireworkBurst(x, y, color) {
    spawnParticles(x, y, color, 55);
    spawnShockwave(x, y, color, 160);
  }
  function launchFireworks(camX, camY, zoom) {
    const fireColors = ['#ff5566', '#33ccff', '#ffcc33', '#66ff99', '#cc66ff', '#ff9933'];
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const wx = camX + (Math.random() - 0.5) * (canvas.width / Math.max(zoom, 0.1)) * 0.7;
        const wy = camY + (Math.random() - 0.5) * (canvas.height / Math.max(zoom, 0.1)) * 0.5;
        spawnFireworkBurst(wx, wy, fireColors[Math.floor(Math.random() * fireColors.length)]);
        if (latestState.effectsEnabled) playSound('item');
      }, i * 260);
    }
  }

  // ===== 効果音(Web Audio APIで自前合成、外部ファイル不要) =====
  let audioCtx = null;
  function ensureAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }
  function playTone(freq, startT, dur, type, vol, ac) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startT);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, startT + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(startT);
    osc.stop(startT + dur + 0.02);
  }
  function playSound(kind, opt) {
    if (!settings.soundEnabled) return;
    const ac = ensureAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;
    if (kind === 'kill') {
      // チャイム + 低音のインパクト
      playTone(140, now, 0.14, 'triangle', 0.3, ac);
      playTone(520, now, 0.08, 'sine', 0.2, ac);
      playTone(780, now + 0.06, 0.14, 'sine', 0.2, ac);
      return;
    }
    if (kind === 'death') {
      playTone(220, now, 0.12, 'sawtooth', 0.16, ac);
      playTone(140, now + 0.08, 0.28, 'sawtooth', 0.18, ac);
      return;
    }
    if (kind === 'item') {
      playTone(660, now, 0.06, 'sine', 0.16, ac);
      playTone(990, now + 0.05, 0.1, 'sine', 0.16, ac);
      return;
    }
    if (kind === 'golden') {
      // きらめくアルペジオ
      [880, 1108, 1318, 1760].forEach((f, i) => playTone(f, now + i * 0.05, 0.18, 'sine', 0.14, ac));
      return;
    }
    if (kind === 'streak') {
      const streak = Math.min(6, (opt && opt.streak) || 2);
      const base = 440;
      for (let i = 0; i < streak; i++) {
        playTone(base * Math.pow(1.19, i), now + i * 0.07, 0.16, 'square', 0.13, ac);
      }
      return;
    }
    if (kind === 'boost') {
      playTone(440, now, 0.1, 'sine', 0.15, ac);
      playTone(660, now + 0.05, 0.08, 'sine', 0.1, ac);
      return;
    }
    if (kind === 'round') {
      [392, 523, 659, 784].forEach((f, i) => playTone(f, now + i * 0.09, 0.22, 'triangle', 0.18, ac));
      return;
    }
    // フォールバック
    playTone(660, now, 0.08, 'sine', 0.15, ac);
  }

  // ===== 管理者からの全体アナウンス =====
  let announceHideTimer = null;
  socket.on('announcement', (data) => {
    if (!data || !data.message) return;
    announcementBanner.textContent = `📢 ${data.message}`;
    announcementBanner.classList.remove('hidden');
    if (announceHideTimer) clearTimeout(announceHideTimer);
    announceHideTimer = setTimeout(() => {
      announcementBanner.classList.add('hidden');
    }, data.duration || 6000);
  });

  function doGuestJoin() {
    const name = nameInput.value.trim() || 'プレイヤー' + Math.floor(Math.random() * 1000);
    try { localStorage.setItem('dotbattle_guest_name', name); } catch (e) { /* noop */ }
    checkSecretName(name);
    checkAdminLikeName(name);
    socket.emit('join', { name });
  }
  // ログイン中ならアカウントで、ゲストならゲストとして(再)参加する
  function doJoin() {
    if (accountUsername && accountToken) {
      socket.emit('join', { token: accountToken });
    } else {
      doGuestJoin();
    }
  }

  joinBtn.addEventListener('click', doGuestJoin);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doGuestJoin();
  });
  respawnBtn.addEventListener('click', () => {
    deathMsg.classList.add('hidden');
    doJoin();
  });

  // ===== 観戦モード =====
  spectateBtn.addEventListener('click', () => {
    socket.emit('spectate');
  });
  exitSpectateBtn.addEventListener('click', () => {
    // 観戦をやめてロビーに戻り、名前を入力してプレイに参加できるようにする
    spectating = false;
    joined = false;
    spectateBar.classList.add('hidden');
    gameUI.classList.add('hidden');
    lobby.classList.remove('hidden');
  });

  // ===== パワーアップ(自分のスコアを消費してスピードアップ) =====
  boostBtn.addEventListener('click', () => {
    if (joined && !spectating && !boostBtn.disabled) {
      socket.emit('useBoost');
      if (latestState.effectsEnabled) playSound('boost');
      registerBoostUsed();
      markActivity();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && joined && !spectating && !boostBtn.disabled) {
      e.preventDefault();
      socket.emit('useBoost');
      if (latestState.effectsEnabled) playSound('boost');
      registerBoostUsed();
      markActivity();
    }
  });

  // ===== 絵文字タウント =====
  const EMOTE_ORDER = ['laugh', 'cry', 'angry', 'fire', 'thumbsup', 'skull', 'wow', 'cool', 'party', 'heart', 'wave', 'hundred'];
  function sendEmote(type) {
    if (joined && !spectating) {
      socket.emit('emote', { type });
      unlockAchievement('emote_used');
      markActivity();
      trackEmoteCombo(type);
    }
  }
  emoteBar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-emote]');
    if (btn) sendEmote(btn.dataset.emote);
  });
  window.addEventListener('keydown', (e) => {
    if (isTypingInField()) return;
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= 0 && idx < EMOTE_ORDER.length && joined && !spectating) {
      sendEmote(EMOTE_ORDER[idx]);
    }
  });

  // id -> { type, expiresAt } 直近に絵文字を出したプレイヤー(キャンバス描画用)
  const activeEmotes = {};
  socket.on('emoteShown', (data) => {
    if (!data || !data.id) return;
    activeEmotes[data.id] = { type: data.type, expiresAt: Date.now() + 2200 };
  });

  // ===== キルストリーク実況 =====
  let streakTimer = null;
  const STREAK_COLORS = {
    2: '#ffaa33', 3: '#ff6a00', 4: '#ff3355', 5: '#cc44ff', 6: '#ff2288'
  };
  socket.on('streakAnnounce', (data) => {
    if (!data) return;
    const streakColor = STREAK_COLORS[Math.min(6, data.streak)] || '#ff6a00';
    streakBanner.textContent = `🔥 ${data.name} ${data.label}!`;
    streakBanner.style.color = streakColor;
    streakBanner.style.fontSize = `${Math.min(40, 24 + data.streak * 3)}px`;
    streakBanner.style.textShadow = `0 0 12px ${streakColor}, 0 0 30px ${streakColor}`;
    streakBanner.classList.remove('hidden');
    // 再アニメーションのため一度リフローさせる
    streakBanner.style.animation = 'none';
    void streakBanner.offsetWidth;
    streakBanner.style.animation = '';
    if (streakTimer) clearTimeout(streakTimer);
    streakTimer = setTimeout(() => streakBanner.classList.add('hidden'), 2400);
    if (latestState.effectsEnabled) {
      playSound('streak', { streak: data.streak });
      if (data.id === myId) {
        triggerFlash(streakColor, 550, 0.32 + data.streak * 0.03);
        triggerShake(10 + data.streak * 2, 400);
        triggerZoomPunch(0.14 + data.streak * 0.02);
        triggerImpactLines();
        if (data.streak >= 4) spawnConfetti();
      }
    }
    if (data.id === myId) unlockAchievement('kill_streak_double');
  });

  function updateBoostButton() {
    if (spectating || !joined) {
      boostBtn.classList.add('hidden');
      return;
    }
    boostBtn.classList.remove('hidden');
    const me = getMe();
    if (!me) return;
    const now = Date.now();
    const onCooldown = me.boostCooldownUntil && me.boostCooldownUntil > now;
    if (me.boosted) {
      boostBtn.textContent = '⚡ ブースト中!';
      boostBtn.disabled = true;
    } else if (onCooldown) {
      const remain = Math.max(0, (me.boostCooldownUntil - now) / 1000).toFixed(1);
      boostBtn.textContent = `⏳ ${remain}s`;
      boostBtn.disabled = true;
    } else {
      const cost = Math.max(15, Math.round(me.mass * 0.15));
      boostBtn.textContent = `⚡ パワーアップ (-${cost})`;
      boostBtn.disabled = me.mass < cost;
    }
  }

  // ===== 管理者ログイン =====
  function openAdminModal() {
    adminLoginMsg.textContent = '';
    adminPasswordInput.value = '';
    adminModal.classList.remove('hidden');
    adminPasswordInput.focus();
  }
  function closeAdminModal() {
    adminModal.classList.add('hidden');
  }

  adminGearBtn.addEventListener('click', () => {
    if (isAdmin) {
      // すでに管理者なら、ゲーム中はパネル開閉、ロビーでは通知のみ
      if (joined) {
        adminPanel.classList.toggle('hidden');
      }
      return;
    }
    openAdminModal();
  });
  adminCancelBtn.addEventListener('click', closeAdminModal);
  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModal();
  });

  function submitAdminLogin() {
    const password = adminPasswordInput.value;
    if (!password) return;
    socket.emit('adminLogin', { password });
  }
  adminLoginBtn.addEventListener('click', submitAdminLogin);
  adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAdminLogin();
  });

  socket.on('adminLoginResult', (res) => {
    if (res.success) {
      isAdmin = true;
      adminLoginMsg.textContent = '';
      closeAdminModal();
      adminGearBtn.classList.add('is-admin');
      adminGearBtn.title = '管理者パネルを開く';
      updateAdminUIVisibility();
    } else {
      adminLoginMsg.textContent = res.message || 'ログインに失敗しました';
    }
  });

  function updateAdminUIVisibility() {
    if (isAdmin && joined) {
      adminPanelToggle.classList.remove('hidden');
    } else {
      adminPanelToggle.classList.add('hidden');
      adminPanel.classList.add('hidden');
    }
  }

  adminPanelToggle.addEventListener('click', () => {
    adminPanel.classList.toggle('hidden');
    if (!adminPanel.classList.contains('hidden')) {
      renderAdminPlayerList();
      renderAdminStats();
      refreshAnnounceTargets();
      renderRoundAdminStatus();
    }
  });
  adminPanelClose.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
  });

  addBotBtn.addEventListener('click', () => {
    const count = Math.max(1, Math.min(20, parseInt(botCountInput.value) || 1));
    const mode = botModeSelect.value;
    socket.emit('admin:addBots', { count, mode });
  });

  removeAllBotsBtn.addEventListener('click', () => {
    socket.emit('admin:removeAllBots');
  });

  function submitAnnounce() {
    const message = announceInput.value.trim();
    if (!message) return;
    const targetId = announceTargetSelect ? announceTargetSelect.value : 'all';
    socket.emit('admin:broadcast', { message, targetId });
    announceInput.value = '';
  }
  announceBtn.addEventListener('click', submitAnnounce);
  announceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnnounce();
  });

  setFoodCountBtn.addEventListener('click', () => {
    const count = parseInt(foodCountInput.value);
    if (!isFinite(count)) return;
    socket.emit('admin:setFoodCount', { count });
  });

  resetAllBtn.addEventListener('click', () => {
    if (confirm('全員のスコアをリセットして復活させます。よろしいですか?')) {
      socket.emit('admin:resetAllScores');
    }
  });

  // ===== ゲームモード切替 / チーム分け =====
  setGameModeBtn.addEventListener('click', () => {
    socket.emit('admin:setGameMode', { mode: gameModeSelect.value });
  });
  autoBalanceBtn.addEventListener('click', () => {
    socket.emit('admin:autoBalanceTeams');
  });

  // ===== ラウンド管理 =====
  startRoundBtn.addEventListener('click', () => {
    const minutes = parseFloat(roundMinutesInput.value);
    socket.emit('admin:startRound', { minutes: isFinite(minutes) && minutes > 0 ? minutes : undefined });
  });
  endRoundBtn.addEventListener('click', () => {
    socket.emit('admin:endRound');
  });
  resetRoundBtn.addEventListener('click', () => {
    socket.emit('admin:resetRound');
  });

  function renderRoundAdminStatus() {
    if (!roundAdminStatus) return;
    const round = latestState.round;
    const modeLabel = MODE_LABELS[latestState.gameMode] || '👤 個人戦';
    if (gameModeSelect && document.activeElement !== gameModeSelect) {
      gameModeSelect.value = latestState.gameMode || 'ffa';
    }
    let roundLine = 'ラウンド: 待機中';
    if (round) {
      if (round.state === 'active') {
        roundLine = `ラウンド${round.number} 進行中 (残り ${formatMMSS(round.endTime - Date.now())})`;
      } else if (round.state === 'ended') {
        roundLine = `ラウンド${round.number} 終了 — ${round.resultMessage || ''}`;
      }
    }
    roundAdminStatus.innerHTML = `モード: ${modeLabel}<br>${roundLine}`;
    updateFeatureToggleButtons();
  }

  // ===== 面白さ強化機能のON/OFFトグル =====
  function updateFeatureToggleButtons() {
    setToggleBtn(toggleItemsBtn, latestState.itemsEnabled, 'アイテム');
    setToggleBtn(toggleGimmicksBtn, latestState.gimmicksEnabled, 'ギミック');
    setToggleBtn(toggleEffectsBtn, latestState.effectsEnabled, '演出/効果音');
    if (cheatSpeedStatus) {
      const m = typeof latestState.globalSpeedMultiplier === 'number' ? latestState.globalSpeedMultiplier : 1;
      cheatSpeedStatus.textContent = `現在の速度倍率: ${m.toFixed(1)}倍`;
    }
    if (cheatWorldSizeStatus) {
      cheatWorldSizeStatus.textContent = (latestState.worldSizeOverride != null)
        ? `現在: ${Math.round(latestState.worldSizeOverride)} に固定中`
        : '現在: 自動調整';
    }
  }
  function setToggleBtn(btn, enabled, label) {
    if (!btn) return;
    btn.textContent = `${label}: ${enabled ? 'ON' : 'OFF'}`;
    btn.classList.toggle('on', !!enabled);
    btn.classList.toggle('off', !enabled);
  }
  toggleItemsBtn.addEventListener('click', () => {
    socket.emit('admin:setItemsEnabled', { enabled: !latestState.itemsEnabled });
  });
  toggleGimmicksBtn.addEventListener('click', () => {
    socket.emit('admin:setGimmicksEnabled', { enabled: !latestState.gimmicksEnabled });
  });
  toggleEffectsBtn.addEventListener('click', () => {
    socket.emit('admin:setEffectsEnabled', { enabled: !latestState.effectsEnabled });
  });

  // ===== チート機能(全体) =====
  if (cheatGodModeAllBtn) {
    cheatGodModeAllBtn.addEventListener('click', () => socket.emit('admin:setGlobalGodMode', { on: true }));
  }
  if (cheatGodModeOffAllBtn) {
    cheatGodModeOffAllBtn.addEventListener('click', () => socket.emit('admin:setGlobalGodMode', { on: false }));
  }
  if (cheatKillAllBtn) {
    cheatKillAllBtn.addEventListener('click', () => {
      if (confirm('全員を即deathさせます。よろしいですか?')) socket.emit('admin:killAll');
    });
  }
  if (cheatClearFoodBtn) {
    cheatClearFoodBtn.addEventListener('click', () => socket.emit('admin:clearFood'));
  }
  if (cheatGoldenFoodBtn) {
    cheatGoldenFoodBtn.addEventListener('click', () => socket.emit('admin:forceGoldenFood'));
  }
  if (cheatSpeedApplyBtn) {
    cheatSpeedApplyBtn.addEventListener('click', () => {
      const multiplier = parseFloat(cheatSpeedInput.value);
      if (isFinite(multiplier)) socket.emit('admin:setGlobalSpeedMultiplier', { multiplier });
    });
  }
  if (cheatWorldSizeApplyBtn) {
    cheatWorldSizeApplyBtn.addEventListener('click', () => {
      const size = parseInt(cheatWorldSizeInput.value);
      if (isFinite(size)) socket.emit('admin:setWorldSizeOverride', { size });
    });
  }
  if (cheatWorldSizeAutoBtn) {
    cheatWorldSizeAutoBtn.addEventListener('click', () => socket.emit('admin:setWorldSizeOverride', { clear: true }));
  }

  // ===== 一括操作(対象: 全員 / 人間のみ / BOTのみ) =====
  document.querySelectorAll('button[data-bulk]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bulk;
      const scope = bulkScopeSelect ? bulkScopeSelect.value : 'all';
      socket.emit('admin:bulkAction', { scope, action, amount: 300 });
    });
  });

  // イベント委譲でプレイヤー/BOT一覧のボタンを処理
  adminPlayerList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.dataset.action === 'kick') {
      socket.emit('admin:kickPlayer', { id });
    } else if (btn.dataset.action === 'boost') {
      socket.emit('admin:boostPlayer', { id, amount: 300 });
    } else if (btn.dataset.action === 'remove') {
      socket.emit('admin:removeBot', { id });
    } else if (btn.dataset.action === 'respawn') {
      socket.emit('admin:forceRespawn', { id });
    } else if (btn.dataset.action === 'freeze') {
      socket.emit('admin:toggleFreeze', { id });
    } else if (btn.dataset.action === 'god') {
      socket.emit('admin:toggleGodMode', { id });
    } else if (btn.dataset.action === 'setmass') {
      const row = btn.closest('.admin-list-item');
      const input = row && row.querySelector('.mass-input');
      const amount = input ? parseInt(input.value) : NaN;
      if (isFinite(amount)) socket.emit('admin:setMass', { id, amount });
    } else if (btn.dataset.action === 'maxout') {
      socket.emit('admin:maxPlayer', { id });
    } else if (btn.dataset.action === 'instakill') {
      socket.emit('admin:instaKill', { id });
    } else if (btn.dataset.action === 'teleport') {
      socket.emit('admin:teleportRandom', { id });
    } else if (btn.dataset.action === 'noclip') {
      socket.emit('admin:toggleNoclip', { id });
    } else if (btn.dataset.action === 'infboost') {
      socket.emit('admin:toggleInfiniteBoost', { id });
    } else if (btn.dataset.action === 'recolor') {
      socket.emit('admin:recolorPlayer', { id });
    } else if (btn.dataset.action === 'rename') {
      const row = btn.closest('.admin-list-item');
      const input = row && row.querySelector('.rename-input');
      const name = input ? input.value.trim() : '';
      if (name) socket.emit('admin:renamePlayer', { id, name });
      if (input) input.value = '';
    }
  });
  adminPlayerList.addEventListener('change', (e) => {
    const modeSel = e.target.closest('select[data-action="mode"]');
    if (modeSel) {
      socket.emit('admin:setBotMode', { id: modeSel.dataset.id, mode: modeSel.value });
      return;
    }
    const teamSel = e.target.closest('select[data-action="setteam"]');
    if (teamSel) {
      socket.emit('admin:setPlayerTeam', { id: teamSel.dataset.id, team: teamSel.value });
    }
  });
  adminPlayerList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const massInput = e.target.closest('.mass-input');
    if (massInput) {
      const row = massInput.closest('.admin-list-item');
      const btn = row && row.querySelector('button[data-action="setmass"]');
      if (btn) btn.click();
      return;
    }
    const renameInput = e.target.closest('.rename-input');
    if (renameInput) {
      const row = renameInput.closest('.admin-list-item');
      const btn = row && row.querySelector('button[data-action="rename"]');
      if (btn) btn.click();
    }
  });

  function renderAdminStats() {
    if (!adminStats) return;
    const s = latestState;
    const humans = s.players ? s.players.filter(p => !p.isBot) : [];
    const bots = s.players ? s.players.filter(p => p.isBot) : [];
    adminStats.innerHTML = `
      ワールドサイズ: ${s.worldSize ? Math.round(s.worldSize) : '-'} (自動調整中)<br>
      エサ: ${s.food ? s.food.length : 0} / ${s.foodCount || '-'}<br>
      人間プレイヤー: ${humans.length}人 ／ BOT: ${bots.length}体
    `;
    if (foodCountInput && document.activeElement !== foodCountInput && s.foodCount) {
      foodCountInput.placeholder = `現在: ${s.foodCount} (20〜500)`;
    }
  }

  // アナウンス送信先セレクトを現在の人間プレイヤー一覧で更新(選択中の値は維持)
  function refreshAnnounceTargets() {
    if (!announceTargetSelect) return;
    if (announceTargetSelect === document.activeElement) return; // 操作中は上書きしない
    const prev = announceTargetSelect.value;
    const humans = (latestState.players || []).filter(p => !p.isBot);
    let html = '<option value="all">全員に送る</option>';
    for (const p of humans) {
      html += `<option value="${p.id}">${escapeHtml(p.name)}${p.id === myId ? '(自分)' : ''}に送る</option>`;
    }
    announceTargetSelect.innerHTML = html;
    // 以前選んでいた宛先がまだ存在すれば復元
    if ([...announceTargetSelect.options].some(o => o.value === prev)) {
      announceTargetSelect.value = prev;
    }
  }

  function renderAdminPlayerList() {
    const items = [...latestState.players].sort((a, b) => b.mass - a.mass);
    if (items.length === 0) {
      adminPlayerList.innerHTML = '<p style="font-size:12px;color:#7c8aa3;">参加者がいません</p>';
      return;
    }
    let html = '';
    for (const p of items) {
      const tag = p.isBot ? '<span class="tag">🤖BOT</span>' : (p.id === myId ? '<span class="tag" style="color:#66ff99;">自分</span>' : '');
      const teamTag = p.team ? ` ${TEAM_LABELS[p.team] || ''}` : '';
      const statusTags = (p.frozen ? ' ❄️' : '') + (p.godMode ? ' ⭐' : '') + (!p.alive ? ' 💀' : '')
        + (p.infected ? ' 🧟' : '') + (latestState.gameMode === 'koth' ? ` 👑${Math.round(p.hillScore || 0)}pt` : '');
      html += `<div class="admin-list-item">
        <div class="row1"><span>${tag}${escapeHtml(p.name)}${teamTag}${statusTags}</span><span>質量:${p.mass}</span></div>
        <div class="row2">`;
      if (p.isBot) {
        html += `<select data-action="mode" data-id="${p.id}">
          <option value="passive"${p.aiMode === 'passive' ? ' selected' : ''}>おとなしい</option>
          <option value="normal"${p.aiMode === 'normal' ? ' selected' : ''}>ふつう</option>
          <option value="aggressive"${p.aiMode === 'aggressive' ? ' selected' : ''}>凶暴</option>
        </select>
        <button class="boost" data-action="boost" data-id="${p.id}">+300</button>
        <button class="danger" data-action="remove" data-id="${p.id}">削除</button>`;
      } else {
        html += `<button class="boost" data-action="boost" data-id="${p.id}">+300</button>
        <button class="danger" data-action="kick" data-id="${p.id}">キック</button>`;
      }
      html += `</div>
        <div class="row2">
          <button data-action="respawn" data-id="${p.id}">🔄リスポーン</button>
          <button class="${p.frozen ? 'active' : ''}" data-action="freeze" data-id="${p.id}">${p.frozen ? '❄️解凍' : '❄️凍結'}</button>
          <button class="${p.godMode ? 'active' : ''}" data-action="god" data-id="${p.id}">${p.godMode ? '⭐解除' : '⭐無敵'}</button>
        </div>
        <div class="row2">
          <input class="mass-input" type="number" placeholder="スコア" value="${p.mass}" />
          <button data-action="setmass" data-id="${p.id}">設定</button>
        </div>
        <div class="row2">
          <select data-action="setteam" data-id="${p.id}">
            <option value=""${!p.team ? ' selected' : ''}>チームなし</option>
            <option value="red"${p.team === 'red' ? ' selected' : ''}>🔴レッド</option>
            <option value="blue"${p.team === 'blue' ? ' selected' : ''}>🔵ブルー</option>
          </select>
        </div>
        <div class="row2 cheat-row">
          <button class="cheat" data-action="maxout" data-id="${p.id}">🚀最大化</button>
          <button class="danger" data-action="instakill" data-id="${p.id}">💀即death</button>
          <button class="cheat" data-action="teleport" data-id="${p.id}">🌀ワープ</button>
        </div>
        <div class="row2 cheat-row">
          <button class="cheat${p.noclip ? ' active' : ''}" data-action="noclip" data-id="${p.id}">${p.noclip ? '🧱すり抜けOFF' : '🧱すり抜けON'}</button>
          <button class="cheat${p.infiniteBoost ? ' active' : ''}" data-action="infboost" data-id="${p.id}">${p.infiniteBoost ? '⚡無限BOOST解除' : '⚡無限BOOST付与'}</button>
        </div>
        <div class="row2 cheat-row">
          <input class="rename-input" type="text" maxlength="12" placeholder="新しい名前" />
          <button class="cheat" data-action="rename" data-id="${p.id}">✏️改名</button>
          <button class="cheat" data-action="recolor" data-id="${p.id}">🎨色</button>
        </div>
      </div>`;
    }
    adminPlayerList.innerHTML = html;
  }

  // ===== 入力(PC:マウス / スマホ:タッチ) 画面中心からの方向で統一 =====
  let dirX = 0;
  let dirY = 0;
  let pointerActive = false;

  function updateDirFromClient(clientX, clientY) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    const deadzone = 12;
    if (len < deadzone) {
      dirX = 0;
      dirY = 0;
      return;
    }
    // 中心から離れるほど強く入力(最大距離で正規化)
    const maxDist = Math.min(window.innerWidth, window.innerHeight) / 2;
    const power = Math.min(len / maxDist, 1);
    dirX = (dx / len) * power;
    dirY = (dy / len) * power;
  }

  canvas.addEventListener('mousemove', (e) => {
    updateDirFromClient(e.clientX, e.clientY);
  });
  canvas.addEventListener('mousedown', (e) => {
    pointerActive = true;
    updateDirFromClient(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    pointerActive = false;
  });

  // ===== スマホ用バーチャルジョイスティック =====
  // 指を置いた場所にジョイスティックが浮かび上がり、そこからの相対移動で操作する
  // (画面中央基準より直感的で、片手操作しやすい)
  const JOYSTICK_MAX_RADIUS = 55;
  let joystickTouchId = null;
  let joystickOriginX = 0;
  let joystickOriginY = 0;

  function showJoystickAt(x, y) {
    joystickOriginX = x;
    joystickOriginY = y;
    joystickBase.style.left = `${x}px`;
    joystickBase.style.top = `${y}px`;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    joystickBase.classList.remove('hidden');
  }
  function updateJoystickKnob(clientX, clientY) {
    let dx = clientX - joystickOriginX;
    let dy = clientY - joystickOriginY;
    const len = Math.hypot(dx, dy);
    const clampedLen = Math.min(len, JOYSTICK_MAX_RADIUS);
    if (len > 0) {
      dx = (dx / len) * clampedLen;
      dy = (dy / len) * clampedLen;
    }
    joystickKnob.style.transform = `translate(${dx - 24}px, ${dy - 24}px)`;
    const deadzone = 6;
    if (clampedLen < deadzone) {
      dirX = 0;
      dirY = 0;
      return;
    }
    const power = clampedLen / JOYSTICK_MAX_RADIUS;
    const nlen = Math.hypot(dx, dy) || 1;
    dirX = (dx / nlen) * power;
    dirY = (dy / nlen) * power;
  }
  function hideJoystick() {
    joystickBase.classList.add('hidden');
    joystickTouchId = null;
    pointerActive = false;
    dirX = 0;
    dirY = 0;
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (settings.wasdOnly) return; // WASD専用モード中はタッチ移動を無効化
    if (joystickTouchId !== null) return; // 既に操作中の指があれば無視(絵文字連打などとの誤操作防止)
    const t = e.changedTouches[0];
    joystickTouchId = t.identifier;
    pointerActive = true;
    showJoystickAt(t.clientX, t.clientY);
    updateJoystickKnob(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joystickTouchId === null) return;
    const t = Array.from(e.changedTouches).find(x => x.identifier === joystickTouchId);
    if (!t) return;
    updateJoystickKnob(t.clientX, t.clientY);
  }, { passive: false });

  function onJoystickTouchEnd(e) {
    const ended = Array.from(e.changedTouches).some(t => t.identifier === joystickTouchId);
    if (ended) hideJoystick();
  }
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    onJoystickTouchEnd(e);
  }, { passive: false });
  canvas.addEventListener('touchcancel', (e) => {
    onJoystickTouchEnd(e);
  }, { passive: false });

  // ===== PC: WASD / 矢印キーでの移動 =====
  const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
  const keysPressed = new Set();

  function isTypingInField() {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  }

  function computeKeyboardDir() {
    let dx = 0, dy = 0;
    if (keysPressed.has('w') || keysPressed.has('arrowup')) dy -= 1;
    if (keysPressed.has('s') || keysPressed.has('arrowdown')) dy += 1;
    if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx -= 1;
    if (keysPressed.has('d') || keysPressed.has('arrowright')) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  window.addEventListener('keydown', (e) => {
    if (isTypingInField() || !settings.wasdEnabled) return;
    const key = e.key.toLowerCase();
    if (MOVE_KEYS.has(key)) {
      keysPressed.add(key);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key.toLowerCase());
  });
  // タブ切り替えなどでkeyupを取りこぼした時のための保険
  window.addEventListener('blur', () => {
    keysPressed.clear();
  });

  // 一定間隔でサーバーに入力を送信(観戦中は送らない。WASD入力があればそちらを優先)
  setInterval(() => {
    if (!joined || spectating) return;
    if (settings.wasdEnabled && keysPressed.size > 0) {
      const kd = computeKeyboardDir();
      socket.emit('input', { dx: kd.dx, dy: kd.dy });
      if (kd.dx !== 0 || kd.dy !== 0) markActivity();
    } else {
      socket.emit('input', { dx: dirX, dy: dirY });
      if (dirX !== 0 || dirY !== 0) markActivity();
    }
  }, 50);

  // ===== 描画 =====
  function getMe() {
    return latestState.players.find(p => p.id === myId);
  }

  // 観戦中は現在の1位プレイヤーをカメラが自動追尾する
  function getSpectateCameraTarget() {
    const alive = latestState.players.filter(p => p.alive);
    if (alive.length === 0) return null;
    return alive.reduce((best, p) => (p.mass > best.mass ? p : best), alive[0]);
  }

  // 画面の短辺にこの世界単位数が写るように正規化する(PC/スマホで同じ視野になる)
  const REFERENCE_VIEW_SIZE = 1000;
  const BASE_RADIUS_CLIENT = 20; // サーバーのBASE_RADIUSと合わせる

  function computeZoom(me) {
    const minDim = Math.min(canvas.width, canvas.height);
    const deviceZoom = minDim / REFERENCE_VIEW_SIZE;
    const r = me ? me.r : BASE_RADIUS_CLIENT;
    // 自分が大きくなるほどズームアウトして、画面を占領しすぎないようにする
    const sizeFactor = Math.sqrt(BASE_RADIUS_CLIENT / Math.max(r, BASE_RADIUS_CLIENT));
    const zoom = deviceZoom * sizeFactor;
    return Math.max(deviceZoom * 0.28, Math.min(deviceZoom, zoom));
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!joined) return;

    const me = getMe();
    const camSource = me || (spectating ? getSpectateCameraTarget() : null);
    const camX = camSource ? camSource.x : worldSize / 2;
    const camY = camSource ? camSource.y : worldSize / 2;

    // カメラパンチ(キル・ゴールデン取得・ストリーク時に一瞬ズームインする演出)
    zoomPunch *= 0.86;
    if (zoomPunch < 0.001) zoomPunch = 0;
    const zoom = computeZoom(camSource) * (1 + zoomPunch);

    if (me) {
      lastMyPos.x = me.x;
      lastMyPos.y = me.y;
      lastMyColor = me.color;
    }

    ctx.fillStyle = '#12192a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // 画面揺れ(被捕食時などの演出)
    const nowMs = Date.now();
    if (shakeUntil > nowMs) {
      const decay = Math.min(1, (shakeUntil - nowMs) / 400);
      const mag = shakeMagnitude * decay;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    const offsetX = canvas.width / 2 - camX * zoom;
    const offsetY = canvas.height / 2 - camY * zoom;
    const toX = (x) => x * zoom + offsetX;
    const toY = (y) => y * zoom + offsetY;

    // グリッド背景(ワールド座標で100単位ごと)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const gridWorldSize = 100;
    const worldLeft = camX - canvas.width / 2 / zoom;
    const worldTop = camY - canvas.height / 2 / zoom;
    const startWX = Math.floor(worldLeft / gridWorldSize) * gridWorldSize;
    const startWY = Math.floor(worldTop / gridWorldSize) * gridWorldSize;
    const worldRight = camX + canvas.width / 2 / zoom;
    const worldBottom = camY + canvas.height / 2 / zoom;
    for (let x = startWX; x < worldRight + gridWorldSize; x += gridWorldSize) {
      const sx = toX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();
    }
    for (let y = startWY; y < worldBottom + gridWorldSize; y += gridWorldSize) {
      const sy = toY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(canvas.width, sy);
      ctx.stroke();
    }

    // ワールド境界
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(toX(0), toY(0), worldSize * zoom, worldSize * zoom);

    // ===== マップギミック =====
    if (latestState.gimmicksEnabled) {
      // 危険地帯(下敷き)
      for (const hz of latestState.hazardZones || []) {
        const x = toX(hz.x), y = toY(hz.y), r = hz.r * zoom;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,80,40,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,40,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // 障害物
      for (const ob of latestState.obstacles || []) {
        const x = toX(ob.x), y = toY(ob.y), r = ob.r * zoom;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#4a5468';
        ctx.fill();
        ctx.strokeStyle = '#2c3444';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      // ワープホール
      for (const w of latestState.warpHoles || []) {
        const x = toX(w.x), y = toY(w.y), r = 26 * zoom;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80,220,255,0.35)';
        ctx.fill();
        ctx.strokeStyle = '#33ccff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // ===== キングオブザヒル =====
    if (latestState.kothHill) {
      const h = latestState.kothHill;
      const x = toX(h.x), y = toY(h.y), r = h.r * zoom;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,204,51,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,204,51,0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,204,51,0.9)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 ヒル', x, y - r - 12);
    }

    // ===== バトルロイヤルの安全地帯(ストーム境界) =====
    if (latestState.storm) {
      const s = latestState.storm;
      const x = toX(s.x), y = toY(s.y), r = s.r * zoom;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,60,60,0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ===== ランダムアイテム =====
    if (latestState.itemsEnabled) {
      for (const it of latestState.items || []) {
        const x = toX(it.x), y = toY(it.y);
        if (x < -30 || x > canvas.width + 30 || y < -30 || y > canvas.height + 30) continue;
        const visual = ITEM_VISUALS[it.type] || ITEM_VISUALS.mystery;
        const pulse = 1 + Math.sin(nowMs / 200 + it.x) * 0.12;
        const r = 13 * zoom * pulse;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = visual.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.font = `${Math.max(12, 14 * zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(visual.icon, x, y);
      }
    }

    // ゴールデンフード(ランダムイベント) — 光の柱+回転する星のオーラ+きらめき粒子
    if (latestState.goldenFood) {
      const gf = latestState.goldenFood;
      const x = toX(gf.x), y = toY(gf.y);
      const pulse = 1 + Math.sin(nowMs / 150) * 0.18;
      const r = 18 * zoom * pulse;

      // 光の柱
      const beamW = r * 1.3;
      const beamGrad = ctx.createLinearGradient(x, y - r * 9, x, y);
      beamGrad.addColorStop(0, 'rgba(255,221,51,0)');
      beamGrad.addColorStop(1, 'rgba(255,221,51,0.35)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(x - beamW / 2, y - r * 9, beamW, r * 9);

      const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.4);
      glow.addColorStop(0, 'rgba(255,221,51,0.6)');
      glow.addColorStop(1, 'rgba(255,221,51,0)');
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // 回転する星の粒
      for (let k = 0; k < 4; k++) {
        const ang = nowMs / 400 + (k * Math.PI) / 2;
        const sx = x + Math.cos(ang) * r * 2;
        const sy = y + Math.sin(ang) * r * 2;
        ctx.font = `${Math.max(8, 10 * zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.8;
        ctx.fillText('✨', sx, sy);
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffdd33';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff8cc';
      ctx.stroke();
      ctx.font = `${Math.max(14, 18 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌟', x, y);
    }

    // エサ
    for (const f of latestState.food) {
      const x = toX(f.x);
      const y = toY(f.y);
      const r = 6 * zoom;
      if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
    }

    // プレイヤー(自分以外を先に描画、自分を最後に前面へ)
    const sorted = [...latestState.players].filter(p => p.alive)
      .sort((a, b) => a.r - b.r);

    // 現在のリーダー(2人以上いる時のみ演出対象にする)
    let leaderId = null;
    if (sorted.length >= 2) {
      const isKothMode = latestState.gameMode === 'koth';
      const leader = sorted.reduce((best, p) => {
        const score = isKothMode ? (p.hillScore || 0) : p.mass;
        const bestScore = isKothMode ? (best.hillScore || 0) : best.mass;
        return score > bestScore ? p : best;
      }, sorted[0]);
      if ((isKothMode ? leader.hillScore : leader.mass) > 0) leaderId = leader.id;
    }

    for (const p of sorted) {
      const x = toX(p.x);
      const y = toY(p.y);
      const r = p.r * zoom;

      // ブースト中は移動の軌跡に薄い残像を残す(見た目が派手になる)
      if (p.boosted && Math.random() < 0.55) {
        spawnTrailParticle(p.x, p.y, p.color);
      }

      // 現在のリーダーには回転する虹色オーラを表示(二重リング+回転する光の粒)
      if (p.id === leaderId) {
        const pulse = 1 + Math.sin(nowMs / 220) * 0.1;
        const hue = (nowMs / 8) % 360;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(nowMs / 900);
        ctx.beginPath();
        ctx.setLineDash([8, 7]);
        ctx.arc(0, 0, r * 1.55 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${hue}, 95%, 62%)`;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.85 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${(hue + 120) % 360}, 95%, 62%)`;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // オーラを回る光の粒
        for (let k = 0; k < 3; k++) {
          const ang = nowMs / 500 + (k * Math.PI * 2) / 3;
          const px = Math.cos(ang) * r * 1.55 * pulse;
          const py = Math.sin(ang) * r * 1.55 * pulse;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${(hue + k * 60) % 360}, 100%, 70%)`;
          ctx.fill();
        }
        ctx.restore();
        ctx.font = `${Math.max(14, 17 * zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', x, y - r * 1.85 - 14);
      }

      // 隠し要素で虹色スキンを獲得した自分には、小さな輝く粒のリングを表示する
      // (物語をすべて読み終えた「赤い点の真実」、または秘密のコードネーム参加で獲得)
      if (p.id === myId && (secretRainbowSkin || achievementUnlocked['hidden_story_true'])) {
        const hue2 = (nowMs / 6) % 360;
        ctx.save();
        ctx.translate(x, y);
        for (let k = 0; k < 6; k++) {
          const ang = -nowMs / 400 + (k * Math.PI * 2) / 6;
          const px = Math.cos(ang) * r * 1.2;
          const py = Math.sin(ang) * r * 1.2;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${(hue2 + k * 60) % 360}, 100%, 72%)`;
          ctx.shadowColor = `hsl(${(hue2 + k * 60) % 360}, 100%, 60%)`;
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.restore();
      }

      // パワーアップ中は炎のように揺らぐ二重リングを表示
      if (p.boosted) {
        const flick = 1 + Math.sin(nowMs / 60 + p.x) * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.25 * flick, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,220,80,0.75)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, r * 1.45 * flick, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,120,40,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // シールド中は青いリングを表示
      if (p.shielded) {
        ctx.beginPath();
        ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(102,255,255,0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // マグネット中は紫のリングを表示
      if (p.magnet) {
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(204,102,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      let displayColor = p.color;
      if (latestState.gameMode === 'infection' && p.infected) {
        displayColor = '#7a2e8c'; // 感染者は毒々しい紫色
      } else if (latestState.gameMode === 'team' && p.team && TEAM_COLORS[p.team]) {
        displayColor = TEAM_COLORS[p.team];
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = displayColor;
      ctx.globalAlpha = p.invulnerable ? 0.5 : 1;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = p.id === myId ? '#ffffff' : (camSource && p.id === camSource.id && spectating ? '#ffcc33' : 'rgba(0,0,0,0.35)');
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(11, Math.min(20, r / 2))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const infectedTag = (latestState.gameMode === 'infection' && p.infected) ? '🧟' : '';
      const namePrefix = p.isBot ? '🤖' : (infectedTag || (p.accountUsername ? '🔑' : ''));
      ctx.fillText(namePrefix + p.name, x, y);

      // 絵文字タウントの吹き出し
      const emote = activeEmotes[p.id];
      if (emote) {
        if (emote.expiresAt < nowMs) {
          delete activeEmotes[p.id];
        } else {
          const remain = emote.expiresAt - nowMs;
          const bubbleY = y - r - 26;
          const pop = remain > 1900 ? (2200 - remain) / 300 : 1; // 出現時に少しポップさせる
          ctx.save();
          ctx.globalAlpha = Math.min(1, remain / 400);
          ctx.beginPath();
          ctx.arc(x, bubbleY, 16 * Math.min(1, pop), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(20,26,40,0.85)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.font = `${18 * Math.min(1, pop)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(EMOTE_ICONS[emote.type] || '❓', x, bubbleY);
          ctx.restore();
        }
      }
    }

    // ===== パーティクル更新・描画 =====
    if (particles.length) {
      const dtP = 1 / 60;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dtP;
        pt.y += pt.vy * dtP;
        pt.vx *= 0.94;
        pt.vy *= 0.94;
        pt.life -= dtP / 0.6;
        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const px = toX(pt.x), py = toY(pt.y);
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, 4 * zoom * pt.life), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // ===== 衝撃波リング更新・描画 =====
    if (shockwaves.length) {
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        const t = (nowMs - sw.startAt) / sw.durationMs;
        if (t >= 1) {
          shockwaves.splice(i, 1);
          continue;
        }
        const r = sw.maxRadius * t * zoom;
        const sx = toX(sw.x), sy = toY(sw.y);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, 5 * (1 - t));
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // ===== 破片(回転する多角形の爆散デブリ) =====
    if (shards.length) {
      const dtS = 1 / 60;
      for (let i = shards.length - 1; i >= 0; i--) {
        const sh = shards[i];
        sh.x += sh.vx * dtS;
        sh.y += sh.vy * dtS;
        sh.vx *= 0.92;
        sh.vy *= 0.92;
        sh.vy += 40 * dtS; // 重力で少し落ちる
        sh.rot += sh.vrot * dtS;
        sh.life -= dtS / 0.7;
        if (sh.life <= 0) {
          shards.splice(i, 1);
          continue;
        }
        const sx = toX(sh.x), sy = toY(sh.y);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sh.rot);
        ctx.globalAlpha = Math.max(0, sh.life);
        ctx.fillStyle = sh.color;
        const s = sh.size * zoom * sh.life;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // ===== フローティングテキスト(KILL!/取得スコアなど) =====
    if (floatingTexts.length) {
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        const t = (nowMs - ft.startAt) / ft.durationMs;
        if (t >= 1) {
          floatingTexts.splice(i, 1);
          continue;
        }
        const fx = toX(ft.x);
        const fy = toY(ft.y) - t * 46 * zoom;
        const pop = t < 0.15 ? t / 0.15 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4);
        ctx.font = `900 ${Math.max(12, ft.size * zoom * pop)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(ft.text, fx, fy);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, fx, fy);
        ctx.restore();
      }
    }

    ctx.restore();

    // ===== 画面フラッシュ(ワールド変換の外=画面全体に固定) =====
    if (flashColor && nowMs < flashEndAt) {
      const total = flashEndAt - flashStartAt;
      const remain = total > 0 ? (flashEndAt - nowMs) / total : 0;
      ctx.fillStyle = flashColor;
      ctx.globalAlpha = Math.max(0, remain) * flashPeakAlpha;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    // ===== インパクトの放射線(自分に効果が起きた瞬間だけ、画面中央から) =====
    if (impactLines) {
      const t = (nowMs - impactLines.startAt) / 220;
      if (t >= 1) {
        impactLines = null;
      } else {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const lineCount = 16;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t) * 0.55;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        const inner = Math.min(canvas.width, canvas.height) * (0.14 + t * 0.1);
        const outer = inner + Math.min(canvas.width, canvas.height) * (0.28 + t * 0.25);
        for (let i = 0; i < lineCount; i++) {
          const ang = (i / lineCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
          ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ===== 紙吹雪(ラウンド優勝演出、画面固定) =====
    if (confetti.length) {
      const dtC = 1 / 60;
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx * dtC;
        c.y += c.vy * dtC;
        c.vy += 220 * dtC;
        c.rot += c.vrot * dtC;
        c.life -= dtC / 3.2;
        if (c.life <= 0 || c.y > canvas.height + 30) {
          confetti.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = Math.min(1, c.life * 2);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // HUD更新
    if (me) {
      scoreVal.textContent = me.mass;
    } else if (spectating) {
      scoreVal.textContent = camSource ? `${camSource.name}を観戦中` : '観戦中';
    }
    updateLeaderboard();
    drawMinimap(camX, camY);
  }

  // ===== ミニマップ =====
  function drawMinimap(camX, camY) {
    if (!settings.minimapEnabled) return;
    const size = minimapCanvas.width;
    minimapCtx.clearRect(0, 0, size, size);
    minimapCtx.fillStyle = 'rgba(10,16,28,0.4)';
    minimapCtx.fillRect(0, 0, size, size);

    const scale = size / worldSize;
    const toMiniX = (x) => x * scale;
    const toMiniY = (y) => y * scale;

    // 現在見えている範囲を示す枠
    const viewW = (canvas.width / computeZoom(getMe() || getSpectateCameraTarget())) * scale;
    const viewH = (canvas.height / computeZoom(getMe() || getSpectateCameraTarget())) * scale;
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(toMiniX(camX) - viewW / 2, toMiniY(camY) - viewH / 2, viewW, viewH);

    // ギミック(ざっくり)
    if (latestState.gimmicksEnabled) {
      minimapCtx.fillStyle = 'rgba(120,130,150,0.5)';
      for (const ob of latestState.obstacles || []) {
        minimapCtx.beginPath();
        minimapCtx.arc(toMiniX(ob.x), toMiniY(ob.y), Math.max(1.5, ob.r * scale), 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // ゴールデンフード
    if (latestState.goldenFood) {
      minimapCtx.fillStyle = '#ffdd33';
      minimapCtx.beginPath();
      minimapCtx.arc(toMiniX(latestState.goldenFood.x), toMiniY(latestState.goldenFood.y), 3.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // プレイヤー
    for (const p of latestState.players) {
      if (!p.alive) continue;
      let color = p.isBot ? '#8899aa' : (p.id === myId ? '#ffffff' : '#66aaff');
      if (latestState.gameMode === 'team' && p.team && TEAM_COLORS[p.team]) color = TEAM_COLORS[p.team];
      minimapCtx.fillStyle = color;
      minimapCtx.beginPath();
      minimapCtx.arc(toMiniX(p.x), toMiniY(p.y), p.id === myId ? 4 : 2.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    minimapCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    minimapCtx.strokeRect(0, 0, size, size);
  }

  function updateLeaderboard() {
    const isKoth = latestState.gameMode === 'koth';
    const scoreOf = (p) => (isKoth ? (p.hillScore || 0) : p.mass);
    const top = [...latestState.players]
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .slice(0, 5);
    let html = `<h3>🏆 ランキング${isKoth ? '(ヒルpt)' : ''}</h3><ol>`;
    for (const p of top) {
      const cls = p.id === myId ? ' class="me"' : '';
      const tag = p.isBot ? '🤖' : (p.accountUsername ? '🔑' : '');
      const teamTag = (latestState.gameMode === 'team' && p.team) ? (p.team === 'red' ? '🔴' : '🔵') : '';
      const infectedTag = (latestState.gameMode === 'infection' && p.infected) ? '🧟' : '';
      html += `<li${cls}>${teamTag}${infectedTag}${tag}${escapeHtml(p.name)} - ${Math.round(scoreOf(p))}</li>`;
    }
    html += '</ol>';
    leaderboard.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  requestAnimationFrame(draw);
})();
