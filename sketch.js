// Junkissa Dive Web Port 5/7
// Codea Lite target: setup(), draw(), touched(touch)
// Goal: improve motif recognition while keeping gameplay and hit logic intact.

const JD = {};
const JD_WEB_PORT_VERSION = "5/7 Kissa Fortune Runtime Fix";

const STATE_TITLE = 0;
const STATE_PLAY = 1;
const STATE_RECEIPT = 2;

const PHASE_SHIFT_START = "SHIFT_START";
const PHASE_FORTUNE = "FORTUNE";
const PHASE_AIM = "AIM";
const PHASE_AIMING = "AIMING";
const PHASE_FLYING = "FLYING";
const PHASE_RESULT = "RESULT";

function setup() {
  JD.LOGICAL_W = 360;
  JD.LOGICAL_H = 640;
  jdInitText();
  jdInitVisualTheme();
  jdReadWebOptions();
  jdInstallRuntimeErrorHandlers();
  jdResetAll();
}


function draw() {
  let pushed = false;

  try {
    background(34, 25, 20);
    jdUpdateScale();

    pushMatrix();
    pushed = true;

    translate(JD.offsetX, JD.offsetY);
    scale(JD.scale);

    if (JD.shake > 0) {
      const s = 3;
      translate((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s);
      JD.shake = Math.max(0, JD.shake - DeltaTime);
    }

    jdAppUpdate(DeltaTime);
    jdAppDraw();

    popMatrix();
    pushed = false;
  } catch (error) {
    if (pushed) {
      try {
        popMatrix();
      } catch (_popError) {
      }
    }

    jdShowRuntimeError(error, "draw");
  }
}

function jdInstallRuntimeErrorHandlers() {
  if (JD.runtimeErrorHandlersInstalled) return;
  JD.runtimeErrorHandlersInstalled = true;

  if (typeof window === "undefined") return;

  window.addEventListener("error", function(event) {
    const message = event && event.error ? event.error : event.message;
    jdShowRuntimeError(message, "window.error");
  });

  window.addEventListener("unhandledrejection", function(event) {
    const reason = event && event.reason ? event.reason : "Unhandled Promise rejection";
    jdShowRuntimeError(reason, "promise");
  });
}

function jdShowRuntimeError(error, where) {
  const raw = error && error.stack ? error.stack : String(error);
  const message = "[" + where + "]\n" + raw;

  JD.runtimeErrorMessage = message;

  try {
    console.error(message);
  } catch (_consoleError) {
  }

  if (typeof document === "undefined") return;

  let box = document.getElementById("jd-runtime-error");
  if (!box) {
    box = document.createElement("div");
    box.id = "jd-runtime-error";
    box.style.position = "fixed";
    box.style.left = "10px";
    box.style.right = "10px";
    box.style.bottom = "10px";
    box.style.zIndex = "999999";
    box.style.maxHeight = "42vh";
    box.style.overflow = "auto";
    box.style.padding = "10px";
    box.style.borderRadius = "8px";
    box.style.background = "rgba(80, 0, 0, 0.92)";
    box.style.color = "#fff4dc";
    box.style.font = "12px monospace";
    box.style.whiteSpace = "pre-wrap";
    box.style.boxShadow = "0 4px 18px rgba(0,0,0,0.45)";
    document.body.appendChild(box);
  }

  box.textContent = "JUNKISSA ERROR\n" + message;
}



function touched(touch) {
  if (!jdAcceptPrimaryPointer(touch)) return;

  try {
    try {
      if (!JD.scale) jdUpdateScale();
      const p = jdToLogical(touch);

      if (JD.state === STATE_TITLE) {
        if (touch.state === ENDED) jdStartPlay();
        return;
      }

      if (JD.state === STATE_RECEIPT) {
        if (touch.state === ENDED && jdReceiptReady()) {
          if (p.x >= 70 && p.x <= 290 && p.y >= 70 && p.y <= 114) jdStartPlay();
        }
        return;
      }

      if (JD.state !== STATE_PLAY) return;

      if (jdDebugButtonHit(p.x, p.y) && touch.state === ENDED) {
        JD.debugMode = !JD.debugMode;
        return;
      }

      if (JD.gamePhase === PHASE_FORTUNE) return;

      if (!jdCanAcceptAimTouch()) return;

      if (touch.state === BEGAN) {
        jdBeginAimTouch(p);
      } else if (touch.state === MOVING) {
        jdUpdateAimTouch(p);
      } else if (touch.state === ENDED || touch.state === CANCELLED) {
        jdReleaseAimTouch(p, touch.state === CANCELLED);
      }
    } finally {
      jdClearPrimaryPointerIfDone(touch);
    }
  } catch (error) {
    jdShowRuntimeError(error, "touched");
  }
}


function jdInitVisualTheme() {
  JD.visual = {
    page: color(34, 25, 20),
    posterBg: color(238, 220, 188),
    posterBg2: color(229, 199, 158),
    wall: color(238, 219, 184),
    wallShade: color(205, 164, 116),
    wallLine: color(149, 93, 58),
    tableTop: color(49, 96, 72),
    tableLip: color(32, 64, 51),
    tableFront: color(38, 73, 58),
    tableStripe: color(244, 225, 190),
    wood: color(126, 73, 45),
    woodDark: color(75, 42, 31),
    cream: color(250, 239, 211),
    creamWarm: color(255, 244, 214),
    paper: color(249, 242, 218),
    ink: color(57, 42, 33),
    coffee: color(67, 35, 23),
    coffeeLight: color(111, 68, 42),
    soda: color(93, 211, 140),
    sodaLight: color(178, 246, 188),
    sodaDeep: color(47, 164, 104),
    cakeCream: color(255, 246, 231),
    cakeSponge: color(244, 201, 114),
    cakePink: color(242, 138, 153),
    red: color(204, 54, 51),
    redDeep: color(143, 41, 42),
    shadow: color(25, 18, 14),
    uiPanel: color(42, 31, 26),
    uiText: color(255, 245, 220),
    gold: color(238, 203, 122),
    glass: color(232, 250, 235),
    glassEdge: color(238, 252, 238),
    ice: color(205, 247, 214),
    plate: color(247, 237, 206),
    highlight: color(255, 251, 228)
  };
}
function jdC(name) {
  if (!JD.visual) jdInitVisualTheme();
  return JD.visual[name] || color(255, 255, 255);
}

function jdFill(name, alpha = null) {
  const c = jdC(name);
  fill(c.r, c.g, c.b, alpha === null ? c.a : alpha);
}

function jdStroke(name, alpha = null) {
  const c = jdC(name);
  stroke(c.r, c.g, c.b, alpha === null ? c.a : alpha);
}

function jdPosterShadow(x, y, w, h, a = 48, r = 0) {
  noStroke();
  jdFill("shadow", a);
  rect(x + 4, y - 4, w, h, r);
}

function jdReadWebOptions() {
  JD.webPortVersion = JD_WEB_PORT_VERSION;
  JD.webOptions = { debugDefault: false };

  if (typeof window === "undefined" || !window.location) return;

  const params = new URLSearchParams(window.location.search || "");
  JD.webOptions.debugDefault = params.get("debug") === "1" || params.get("debug") === "true";
}

function jdAcceptPrimaryPointer(touch) {
  const id = touch && touch.id !== undefined ? touch.id : "mouse";

  if (touch.state === BEGAN) {
    if (JD.activePointerId !== null && JD.activePointerId !== undefined) return false;
    JD.activePointerId = id;
    return true;
  }

  if (JD.activePointerId !== null && JD.activePointerId !== undefined && JD.activePointerId !== id) {
    return false;
  }

  return true;
}

function jdClearPrimaryPointerIfDone(touch) {
  if (!touch) return;
  if (touch.state === ENDED || touch.state === CANCELLED) JD.activePointerId = null;
}

function jdCancelActiveTouch() {
  JD.activePointerId = null;

  if (JD.dragging) {
    JD.dragging = false;
    JD.dragScreenStart = null;
    JD.dragScreenNow = null;
    if (JD.state === STATE_PLAY && JD.food && !JD.food.launched && !JD.food.resolved) {
      jdSetGamePhase(PHASE_AIM);
      jdSetCameraClose(false);
    }
  }
}

function jdInitText() {
  JD.text = {
    title: {
      jp: "純喫茶ダイブ",
      en: "JUNKISSA DIVE",
      sub: "RETRO CAFE SLINGSHOT",
      start: "TOUCH START"
    },
    ui: {
      shift: "MONDAY SHIFT",
      sales: "SALES",
      yen: "YEN",
      rest: "REST",
      item: "ITEM",
      pull: "PULL TO DIVE",
      dragging: "RELEASE TO SHOOT",
      fortuneSpin: "KISSA FORTUNE IS SPINNING"
    },
    fortune: {
      title: "KISSA FORTUNE",
      lucky: "LUCKY ITEM",
      luckySpin: "LUCKY ITEM...",
      chin: "CHIN!"
    },
    result: {
      dive: "DIVE!",
      land: "LAND!",
      stab: "SASARI!",
      floor: "FLOOR",
      out: "OUT...",
      perfect: "PERFECT CENTER"
    },
    receipt: {
      shop: "JUNKISSA YUMANIWA",
      title: "JUNKISSA DIVE",
      total: "TOTAL",
      rank: "RANK",
      tencho: "TENCHO:",
      oneMore: "ONE MORE SHIFT"
    },
    rank: {
      great: "KISSA NO HOSHI",
      good: "YUSHU NA BAITO",
      mid: "NAKANAKA BAITO",
      low: "MINARAI BAITO",
      bad: "KUBI SUNZEN"
    },
    manager: {
      diveMaster: "アンタ モウ ダイブショクニン",
      floorHeavy: "テーブルヲ フク トコロカラヤリナ",
      sold: "ミセハ マモッタ",
      default: "ナニガ オキタカハ キカナイ"
    },
    target: {
      coffee: "COFFEE",
      cake: "CAKE",
      melon: "MELON"
    },
    food: {
      CHERRY: "CHERRY",
      SUGAR: "SUGAR",
      STRAWBERRY: "STRAWBERRY"
    },
    shot: {
      power: "POWER",
      angle: "ANGLE",
      last: "LAST",
      yowame: "YOWAME",
      futsu: "FUTSU",
      tsuyome: "TSUYOME",
      yarisugi: "YARISUGI",
      low: "LOW",
      naname: "NANAME",
      high: "HIGH"
    }
  };
}

function jdT(path, fallback = "") {
  const parts = String(path).split(".");
  let node = JD.text;
  for (const part of parts) {
    if (!node || node[part] === undefined) return fallback;
    node = node[part];
  }
  return node;
}

function jdResetAll() {
  JD.state = STATE_TITLE;
  JD.gamePhase = PHASE_SHIFT_START;

  JD.scale = 1;
  JD.offsetX = 0;
  JD.offsetY = 0;

  JD.worldW = 980;
  JD.worldH = 640;
  JD.tableY = 164;
  JD.launcher = { x: 760, y: 248 };

  JD.gravity = 980;
  JD.shotPower = 10.2;
  JD.maxPull = 104;

  JD.camScreenX = JD.LOGICAL_W / 2;
  JD.camScreenY = 300;
  JD.cam = { x: 655, y: 252, zoom: 1, tx: 655, ty: 252, tz: 1 };

  JD.shake = 0;
  JD.particles = [];
  JD.floatTexts = [];
  JD.placedFoods = [];
  JD.debugMode = JD.webOptions ? !!JD.webOptions.debugDefault : false;
  JD.activePointerId = null;
  JD.lastTrail = null;
  JD.currentTrail = null;
  JD.lastTrailResult = "-";
  JD.lastPowerRatio = 0;
  JD.lastAngleName = "-";

  jdInitTables();
  jdResetShift();
}

function jdInitTables() {
  JD.priceBook = {
    "CHERRY_MELON SODA": { price: 600, name: "オウドウノ アカイヤツ", comment: "シュワット キマッタ" },
    "SUGAR_COFFEE": { price: 500, name: "イツモノ ヤツ", comment: "ニガミト アマミ" },
    "STRAWBERRY_CAKE": { price: 650, name: "シュヤクノ キカン", comment: "オマタセシマシタ" },
    "CHERRY_COFFEE": { price: 430, name: "ナゾノ サンミ", comment: "ミナカッタ コトニ シタ" },
    "CHERRY_CAKE": { price: 450, name: "イロドリ ダケ", comment: "ワルクハナイ" },
    "SUGAR_MELON SODA": { price: 480, name: "アマスギル ミドリ", comment: "トケキラナイ" },
    "SUGAR_CAKE": { price: 520, name: "ジャリジャリ ケーキ", comment: "ハカイリョクアリ" },
    "STRAWBERRY_COFFEE": { price: 420, name: "アサノ マチガイ", comment: "スッパニガイ" },
    "STRAWBERRY_MELON SODA": { price: 530, name: "アカト ミドリ", comment: "ミタメハ ヨイ" }
  };

  JD.foodCatalog = {
    CHERRY: {
      name: "CHERRY", jp: "チェリー", shape: "circle", r: 10,
      col: color(245, 55, 55), bounce: 0.68, groundFriction: 0.82,
      gravityScale: 0.90, airDrag: 0.999
    },
    SUGAR: {
      name: "SUGAR", jp: "カクザトウ", shape: "rect", w: 18, h: 18,
      col: color(255, 255, 244), bounce: 0.24, groundFriction: 0.58,
      gravityScale: 1.18, airDrag: 0.996
    },
    STRAWBERRY: {
      name: "STRAWBERRY", jp: "イチゴ", shape: "oval", w: 22, h: 25,
      col: color(245, 80, 105), bounce: 0.40, groundFriction: 0.70,
      gravityScale: 1.00, airDrag: 0.9975
    }
  };

  JD.fortuneNames = ["CHERRY", "SUGAR", "STRAWBERRY"];
}

function jdResetShift() {
  JD.totalSales = 0;
  JD.results = [];
  JD.throwIndex = 0;
  JD.receiptTimer = 0;
  JD.receiptLines = [];
  JD.placedFoods = [];
  JD.particles = [];
  JD.floatTexts = [];

  JD.targets = [
    { id: "COFFEE", label: "COFFEE", x: 500, y: JD.tableY + 48, w: 78, h: 76, kind: "coffee", isLiquid: true, col: color(58, 31, 18) },
    { id: "CAKE", label: "CAKE", x: 310, y: JD.tableY + 48, w: 92, h: 74, kind: "cake", isLiquid: false, col: color(252, 239, 229) },
    { id: "MELON SODA", label: "MELON", x: 120, y: JD.tableY + 82, w: 66, h: 158, kind: "melon", isLiquid: true, col: color(77, 226, 116) }
  ];

  JD.obstacles = [
    { kind: "spoon", x: 620, y: JD.tableY + 24, w: 62, h: 10 },
    { kind: "ticket", x: 400, y: JD.tableY + 38, w: 18, h: 54 },
    { kind: "coaster", x: 210, y: JD.tableY + 8, r: 18 }
  ];

  jdBuildFortuneQueue();

  JD.food = null;
  JD.dragging = false;
  JD.activePointerId = null;
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;
  JD.shiftStartTimer = 0.35;

  JD.pendingFood = null;
  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;
  JD.fortuneDuration = 0;
  JD.fortuneSelected = null;
  JD.fortuneDisplayName = null;
  JD.fortunePickedTimer = 0;

  JD.hitEffectTimer = 0;
  JD.hitEffectDuration = 0;
  JD.hitEffectLabel = null;
  JD.hitEffectPerfect = false;
  JD.perfectZoomActive = false;
  JD.hitZoomTimer = 0;

  jdSetCameraClose(true);
}

function jdBuildFortuneQueue() {
  const bag = ["CHERRY", "CHERRY", "SUGAR", "SUGAR", "STRAWBERRY"];
  jdShuffleArray(bag);
  JD.queue = bag.map((name) => jdCloneFoodDef(JD.foodCatalog[name]));
}

function jdCloneFoodDef(src) {
  return { ...src };
}

function jdShuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
}

function jdStartPlay() {
  jdResetShift();
  JD.state = STATE_PLAY;
  jdSetGamePhase(PHASE_SHIFT_START);
}

function jdSetGamePhase(phase) {
  JD.gamePhase = phase;
}

function jdExpectedGamePhase() {
  if (JD.state !== STATE_PLAY) return "-";
  if (JD.gamePhase === PHASE_FORTUNE || JD.fortuneSpinning || JD.pendingFood) return PHASE_FORTUNE;
  if (JD.food && JD.food.resolved) return PHASE_RESULT;
  if (JD.food && JD.food.launched) return PHASE_FLYING;
  if (JD.dragging) return PHASE_AIMING;
  if (JD.food) return PHASE_AIM;
  return JD.gamePhase || PHASE_SHIFT_START;
}

function jdSyncGamePhase() {
  if (JD.state === STATE_PLAY) JD.gamePhase = jdExpectedGamePhase();
}

function jdNextFood() {
  JD.throwIndex += 1;
  JD.dragging = false;
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;
  JD.hitZoomTimer = 0;
  JD.perfectZoomActive = false;
  JD.hitEffectTimer = 0;
  JD.pendingCakeSasari = false;

  if (JD.throwIndex > JD.queue.length) {
    JD.food = null;
    JD.receiptLines = jdMakeReceiptLines();
    JD.receiptTimer = 0;
    JD.state = STATE_RECEIPT;
    return;
  }

  JD.food = null;
  jdStartFortuneSpin(JD.queue[JD.throwIndex - 1]);
}

function jdNowMs() {
  if (typeof performance !== "undefined" && performance && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function jdStartFortuneSpin(selectedFood) {
  JD.pendingFood = selectedFood ? jdCloneFoodDef(selectedFood) : null;
  JD.food = null;
  JD.dragging = false;
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;

  JD.fortuneSpinning = true;
  JD.fortuneTimer = 0.9;
  JD.fortuneDuration = 0.9;
  JD.fortuneSelected = JD.pendingFood;
  JD.fortuneDisplayName = JD.pendingFood ? JD.pendingFood.name : "CHERRY";
  JD.fortunePickedTimer = 0;

  jdSetGamePhase(PHASE_FORTUNE);
  jdSetCameraClose(false);
}

function jdCompleteFortuneSpin() {
  const src = JD.pendingFood || JD.fortuneSelected || JD.queue[Math.max(0, JD.throwIndex - 1)] || null;

  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;

  // 確定アイテムを少し長めに見せる
  JD.fortunePickedTimer = 0.9;

  JD.fortuneSelected = src;

  if (!src) {
    JD.pendingFood = null;
    jdSetGamePhase(PHASE_AIM);
    jdSetCameraClose(false);
    return;
  }

  JD.food = {
    ...jdCloneFoodDef(src),
    x: JD.launcher.x,
    y: JD.launcher.y,
    vx: 0,
    vy: 0,
    launched: false,
    resolved: false,
    resultTimer: 0,
    stillTimer: 0,
    label: "",
    resultLabel: "",
    hideAfterResolve: false,
    placedAt: 0
  };

  JD.pendingFood = null;
  jdSetGamePhase(PHASE_AIM);
  jdSetCameraClose(false);
}


function jdUpdateFortune(dt) {
  if (JD.fortunePickedTimer > 0) JD.fortunePickedTimer -= dt;
  if (JD.gamePhase !== PHASE_FORTUNE) return false;

  if (!JD.pendingFood && !JD.fortuneSelected) {
    jdSetGamePhase(PHASE_AIM);
    return false;
  }

  if (!JD.fortuneSpinning) {
    jdCompleteFortuneSpin();
    return true;
  }

  if (!Number.isFinite(JD.fortuneTimer)) JD.fortuneTimer = 0.9;
  JD.fortuneTimer -= dt;

  const names = JD.fortuneNames;
  if (JD.fortuneTimer > 0.20) {
    const spinRate = 20;
    const index = Math.floor((JD.fortuneDuration - JD.fortuneTimer) * spinRate) % names.length;
    JD.fortuneDisplayName = names[index];
  } else if (JD.pendingFood) {
    JD.fortuneDisplayName = JD.pendingFood.name;
  }

  if (JD.fortuneTimer <= 0) {
    jdCompleteFortuneSpin();
  }
  return true;
}

function jdAppUpdate(dt) {
  if (JD.state === STATE_PLAY) {
    if (JD.gamePhase === PHASE_SHIFT_START) {
      JD.shiftStartTimer -= dt;
      if (JD.shiftStartTimer <= 0) jdNextFood();
      return;
    }
    jdUpdatePlay(dt);
    jdSyncGamePhase();
  } else if (JD.state === STATE_RECEIPT) {
    jdUpdateReceipt(dt);
  }
}

function jdUpdatePlay(dt) {
  jdUpdateParticles(dt);
  jdUpdateFloatTexts(dt);
  if (jdUpdateFortune(dt)) return;

  if (!JD.food) return;

  if (JD.food.resolved) {
    JD.food.resultTimer -= dt;
    if (JD.food.resultTimer <= 0) jdNextFood();
    return;
  }

  if (!JD.food.launched) return;

  const f = JD.food;
  const r = jdFoodRadius(f);
  const prevX = f.x;
  const prevY = f.y;

  f.vy -= JD.gravity * (f.gravityScale || 1) * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  // 移動速度に応じて見た目の回転角を蓄積する
  // 着地後も visualAngle を消さない
  const spinSpeed = Math.hypot(f.vx, f.vy);
  const spinDirection = f.vx <= 0 ? 1 : -1;

  if (!Number.isFinite(f.visualAngle)) {
    f.visualAngle = 0;
  }

  f.visualAngle =
    (f.visualAngle + spinDirection * spinSpeed * dt * 0.18) % 360;

  f.vx *= f.airDrag || 0.998;
  f.vy *= f.airDrag || 0.998;

  JD.trailTick = (JD.trailTick || 0) + dt;
  if (JD.trailTick > 0.035) {
    JD.trailTick = 0;
    jdRecordTrailPoint(f.x, f.y, false);
  }

  if (jdCheckSweptMelon(prevX, prevY, f.x, f.y)) return;
  if (jdCheckSweptCake(prevX, prevY, f.x, f.y)) return;
  if (jdCheckTargets()) return;

  jdCheckTargetBodies();
  if (jdCheckTargets()) return;

  jdCheckObstacles();
  if (jdCheckTargets()) return;

  if (jdCheckStuckBounce(dt)) return;

  if (f.x < -40 || f.x > JD.worldW + 40 || f.y < 24) {
    jdResolve(null, "OUT");
    return;
  }

  if (f.y < JD.tableY + r) {
    f.y = JD.tableY + r;
    if (Math.abs(f.vy) > 95) f.vy = Math.abs(f.vy) * f.bounce * 0.42;
    else f.vy = 0;
    f.vx *= f.groundFriction;
    jdNoteBounce("TABLE", f.x, f.y, f.vx, f.vy);
    if (jdCheckTargets()) return;
  }

  const speed = jdShotSpeed(f);
  const nearTableOrObjects = f.y <= JD.tableY + r + 112;
  f.stillTimer = speed < 42 && nearTableOrObjects ? (f.stillTimer || 0) + dt : 0;

  if (f.stillTimer > 0.42) {
    if (jdCheckTargets()) return;
    jdResolve(null, "FLOOR");
    return;
  }

  if (Math.abs(f.vx) < 18 && Math.abs(f.vy) < 18 && f.y <= JD.tableY + r + 2) {
    jdResolve(null, "FLOOR");
  }
}

function jdCheckTargets() {
  if (!JD.food || JD.food.resolved) return false;
  for (const t of JD.targets) {
    if (jdTargetHit(JD.food, t)) {
      jdResolve(t, null);
      return true;
    }
  }
  return false;
}

function jdTargetHit(f, t) {
  const info = jdTargetDebugInfo(f, t);
  return info.ok;
}

function jdTargetDebugInfo(f, t) {
  const r = jdFoodRadius(f);
  const pad = jdTargetBonusPad(f.name, t.id);
  let inZone = false;

  if (t.kind === "coffee") {
    const cx = t.x;

    // 見た目のコーヒー液面に合わせて下へ移動
    const cy = JD.tableY + 43;

    const rx = 30 + pad.x * 0.25 + r * 0.75;
    const ry = 10 + pad.y * 0.20 + r * 0.55;

    const dx = f.x - cx;
    const dy = f.y - cy;

    inZone =
      (dx * dx) / (rx * rx) +
      (dy * dy) / (ry * ry) <= 1;

  } else if (t.kind === "cake") {
    const left = t.x - 44 - pad.x * 0.25;
    const right = t.x + 44 + pad.x * 0.25;

    // 下げたケーキ本体の高さに合わせる
    const bottom = JD.tableY + 7;
    const top = JD.tableY + 74 + pad.y * 0.15;

    inZone =
      f.x + r * 0.80 > left &&
      f.x - r * 0.80 < right &&
      f.y + r * 0.90 > bottom &&
      f.y - r * 0.35 < top;

  } else if (t.kind === "melon") {
    const left = t.x - 25 - pad.x * 0.12;
    const right = t.x + 25 + pad.x * 0.12;
    const bottom = JD.tableY + 24;
    const top = JD.tableY + 146 + pad.y * 0.12;

    inZone =
      f.x + r * 0.55 > left &&
      f.x - r * 0.55 < right &&
      f.y + r * 0.55 > bottom &&
      f.y - r * 0.55 < top;
  }

  let entryOK = false;
  let reason = "ZONE OUT";

  if (inZone) {
    const entry = jdEntryDebugReason(f, t.kind);
    entryOK = entry.ok;
    reason = entry.reason;
  }

  return {
    target: t,
    inZone,
    entryOK,
    ok: inZone && entryOK,
    reason,
    speed: jdShotSpeed(f),
    vx: f.vx,
    vy: f.vy
  };
}


function jdEntryDebugReason(f, targetKind) {
  const vx = f.vx || 0;
  const vy = f.vy || 0;
  const speed = jdShotSpeed(f);

  if (targetKind === "coffee") {
    if (Math.abs(vx) >= 520) return { ok: false, reason: "SIDE FAST" };
    if (speed >= 760) return { ok: false, reason: "TOO FAST" };
    if (vy >= 240) return { ok: false, reason: "UPWARD" };
    return { ok: true, reason: "OK" };
  }

  if (targetKind === "cake") {
    if (Math.abs(vx) >= 680) return { ok: false, reason: "SIDE FAST" };
    if (speed >= 980) return { ok: false, reason: "TOO FAST" };
    if (vy >= 300) return { ok: false, reason: "UPWARD" };
    return { ok: true, reason: "OK" };
  }

  if (targetKind === "melon") return { ok: true, reason: "OK" };
  return { ok: true, reason: "OK" };
}

function jdTargetBonusPad(foodName, targetId) {
  let x = 0;
  let y = 0;
  if (foodName === "SUGAR") { x += 5; y += 3; }
  if (foodName === "STRAWBERRY") { x += 3; y += 5; }
  if (targetId === "MELON SODA") { x += 3; y += 3; }
  return { x, y };
}

function jdResolve(t, missType) {
  if (!JD.food || JD.food.resolved) return;
  const f = JD.food;
  f.resolved = true;
  f.launched = false;
  f.vx = 0;
  f.vy = 0;
  f.resultTimer = 1.02;

  let res = {
    item: f.name,
    itemJp: f.jp,
    target: "TABLE",
    targetLabel: "テーブル",
    type: "FLOOR",
    price: 0,
    name: "ユカニ キエタ",
    comment: "ソウイウヒモ アル"
  };

  if (missType === "OUT") {
    res.type = "OUT";
    res.name = "キッチン ユキ";
    res.comment = "オキャクサマニハ ダセナイ";
    f.label = jdT("result.out", "OUT...");
    f.hideAfterResolve = false;
    jdFinishShotTrail("OUT");
    jdFreezeCamera();
  } else if (missType === "FLOOR") {
    res.type = "FLOOR";
    res.price = 80;
    res.name = "テーブル ドロップ";
    res.comment = "ヒロッタラ ハチワリ";
    f.label = jdT("result.floor", "FLOOR");
    f.hideAfterResolve = false;
    jdFinishShotTrail("FLOOR");
    jdFreezeCamera();
  } else if (t) {
    jdSnapFood(t);
    jdRecordTrailPoint(f.x, f.y, true);

    const cakeSasari = t.kind === "cake" && JD.pendingCakeSasari;
    res.target = t.id;
    res.targetLabel = t.label;
    res.type = cakeSasari ? "STAB" : (t.isLiquid ? "DIVE" : "LAND");

    const key = `${f.name}_${t.id}`;
    const p = JD.priceBook[key];
    if (p) {
      res.price = p.price;
      res.name = p.name;
      res.comment = p.comment;
    } else {
      res.price = 300;
      res.name = "キマグレ メニュー";
      res.comment = "ナゼカ ウレタ";
    }

    if (cakeSasari) f.label = jdT("result.stab", "SASARI!");
    else f.label = t.isLiquid ? jdT("result.dive", "DIVE!") : jdT("result.land", "LAND!");

    f.hideAfterResolve = true;
    jdRegisterPlacedFood(f, t);
    jdFinishShotTrail(res.type);
    jdStartHitZoom(f.x, f.y, t);
    jdSpawnSplash(f.x, f.y, t.isLiquid ? t.col : color(255, 235, 220));
    JD.shake = cakeSasari ? 0.07 : (t.isLiquid ? 0.08 : 0.04);
  }

  JD.results.push(res);
  JD.totalSales += res.price;
  jdSetGamePhase(PHASE_RESULT);
}

function jdSnapFood(t) {
  const f = JD.food;
  if (!f) return;

  if (t.kind === "coffee") {
    f.x = jdClamp(
      f.x,
      t.x - 22,
      t.x + 22
    );

    // コーヒー液面付近へ配置
    f.y = jdClamp(
      f.y,
      JD.tableY + 39,
      JD.tableY + 48
    );

  } else if (t.kind === "cake") {
    if (JD.pendingCakeSasari) {
      f.x = jdClamp(
        f.x,
        t.x - 32,
        t.x + 32
      );

      f.y = jdClamp(
        f.y,
        JD.tableY + 51,
        JD.tableY + 65
      );

    } else {
      f.x = jdClamp(
        f.x,
        t.x - 36,
        t.x + 36
      );

      // 下げたケーキ上面に自然に乗せる
      f.y = jdClamp(
        f.y,
        JD.tableY + 57,
        JD.tableY + 73
      );
    }

  } else if (t.kind === "melon") {
    f.x = jdClamp(
      f.x,
      t.x - 18,
      t.x + 18
    );

    f.y = jdClamp(
      f.y,
      JD.tableY + 46,
      JD.tableY + 126
    );
  }
}


function jdRegisterPlacedFood(f, target) {
  JD.placedFoods.push({
    name: f.name,
    jp: f.jp,
    shape: f.shape,
    r: f.r,
    w: f.w,
    h: f.h,
    col: f.col,

    x: f.x,
    y: f.y,

    // 飛行中に蓄積した角度を、設置後のコピーにも引き継ぐ
    visualAngle: Number.isFinite(f.visualAngle)
      ? f.visualAngle
      : 0,

    alpha: 230,
    targetKind: target ? target.kind : "",
    placedAt: ElapsedTime
  });
}


function jdStartHitZoom(x, y, target) {
  let label = JD.food && JD.food.label ? JD.food.label : "GOOD!";
  const perfect = jdShouldPerfectCenterHit(target, x, y, label);

  JD.hitEffectTimer = perfect ? 0.86 : 0.72;
  JD.hitEffectDuration = JD.hitEffectTimer;
  JD.hitEffectX = x;
  JD.hitEffectY = y;
  JD.hitEffectLabel = label;
  JD.hitEffectKind = target ? target.kind : "hit";
  JD.hitEffectPerfect = perfect;

  if (JD.food) {
    JD.food.resultLabel = label;
    JD.food.label = "";
    JD.food.resultTimer = Math.max(JD.food.resultTimer || 0, perfect ? 1.16 : 0.98);
  }

  if (perfect) {
    JD.perfectZoomActive = true;
    JD.hitZoomTimer = 0.62;
    JD.hitZoomX = x;
    JD.hitZoomY = y;
    JD.hitZoomLevel = jdPerfectZoomLevel(target);
    jdSetCameraHitZoom();
  } else {
    JD.perfectZoomActive = false;
    JD.hitZoomTimer = 0;
    jdFreezeCamera();
  }
}

function jdShouldPerfectCenterHit(target, x, y, label) {
  if (!target || label === "SASARI!") return false;

  const dx = Math.abs(x - target.x);

  if (target.kind === "coffee") {
    return (
      dx <= 6 &&
      Math.abs(
        y - (JD.tableY + 43)
      ) <= 5
    );
  }

  if (target.kind === "cake") {
    return (
      dx <= 8 &&
      Math.abs(
        y - (JD.tableY + 68)
      ) <= 7
    );
  }

  if (target.kind === "melon") {
    return (
      dx <= 6 &&
      y >= JD.tableY + 72 &&
      y <= JD.tableY + 124
    );
  }

  return false;
}


function jdPerfectZoomLevel(target) {
  if (!target) return 1.48;
  if (target.kind === "cake") return 1.60;
  if (target.kind === "coffee") return 1.52;
  if (target.kind === "melon") return 1.46;
  return 1.48;
}

function jdCheckTargetBodies() {
  const f = JD.food;
  if (!f || f.resolved) return;

  const r = jdFoodRadius(f);

  for (const t of JD.targets) {
    if (t.kind === "coffee") {
      // 下げたカップ形状に合わせて壁・底も下へ
      jdCollideRect(
        t.x - 39,
        JD.tableY + 7,
        8,
        38,
        r,
        0.52,
        "COFFEE_WALL_L"
      );

      jdCollideRect(
        t.x + 31,
        JD.tableY + 7,
        8,
        38,
        r,
        0.52,
        "COFFEE_WALL_R"
      );

      jdCollideRect(
        t.x - 31,
        JD.tableY + 7,
        62,
        7,
        r,
        0.40,
        "COFFEE_BOTTOM"
      );

      jdCollideRect(
        t.x - 44,
        JD.tableY + 1,
        88,
        9,
        r,
        0.38,
        "COFFEE_SAUCER"
      );

    } else if (t.kind === "cake") {
      // ケーキの側面全体に合うよう、高さと位置を再調整
      jdCollideRect(
        t.x - 54,
        JD.tableY + 7,
        10,
        62,
        r,
        0.48,
        "CAKE_SIDE_L"
      );

      jdCollideRect(
        t.x + 44,
        JD.tableY + 7,
        10,
        62,
        r,
        0.48,
        "CAKE_SIDE_R"
      );

    } else if (t.kind === "melon") {
      jdCollideRect(
        t.x - 35,
        JD.tableY + 18,
        7,
        120,
        r,
        0.46,
        "MELON_WALL_L"
      );

      jdCollideRect(
        t.x + 28,
        JD.tableY + 18,
        7,
        120,
        r,
        0.46,
        "MELON_WALL_R"
      );

      jdCollideRect(
        t.x - 30,
        JD.tableY + 8,
        60,
        10,
        r,
        0.32,
        "MELON_BOTTOM"
      );
    }
  }
}


function jdCheckObstacles() {
  const f = JD.food;
  if (!f || f.resolved) return;
  const r = jdFoodRadius(f);
  for (const o of JD.obstacles) {
    if (o.kind === "spoon") jdCollideSegment(o.x - 32, o.y, o.x + 30, o.y + 3, r + 5, 0.72, "OBSTACLE_SPOON");
    else if (o.kind === "ticket") jdCollideRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, r, 0.64, "OBSTACLE_BILL");
    else if (o.kind === "coaster") jdCollideCircle(o.x, o.y, o.r + r, 0.58, "OBSTACLE_COASTER");
  }
}

function jdCollideCircle(cx, cy, hitR, bounce, tag) {
  const f = JD.food;
  const dx = f.x - cx;
  const dy = f.y - cy;
  const d = Math.hypot(dx, dy);
  if (d > 0 && d < hitR) {
    const nx = dx / d;
    const ny = dy / d;
    const vxBefore = f.vx;
    const vyBefore = f.vy;
    f.x = cx + nx * hitR;
    f.y = cy + ny * hitR;
    const dot = f.vx * nx + f.vy * ny;
    if (dot < 0) {
      f.vx = (f.vx - 2 * dot * nx) * bounce;
      f.vy = (f.vy - 2 * dot * ny) * bounce;
      jdNoteBounce(tag, f.x, f.y, f.vx, f.vy, vxBefore, vyBefore);
    }
  }
}

function jdCollideRect(rx, ry, rw, rh, radius, bounce, tag) {
  const f = JD.food;
  const nx = jdClamp(f.x, rx, rx + rw);
  const ny = jdClamp(f.y, ry, ry + rh);
  const dx = f.x - nx;
  const dy = f.y - ny;
  const d = Math.hypot(dx, dy);
  if (d > 0 && d < radius) {
    const ux = dx / d;
    const uy = dy / d;
    const vxBefore = f.vx;
    const vyBefore = f.vy;
    f.x = nx + ux * radius;
    f.y = ny + uy * radius;
    const dot = f.vx * ux + f.vy * uy;
    if (dot < 0) {
      f.vx = (f.vx - 2 * dot * ux) * bounce;
      f.vy = (f.vy - 2 * dot * uy) * bounce;
      jdNoteBounce(tag, f.x, f.y, f.vx, f.vy, vxBefore, vyBefore);
    }
  }
}

function jdCollideSegment(ax, ay, bx, by, radius, bounce, tag) {
  const f = JD.food;
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 <= 0) return;
  const t = jdClamp(((f.x - ax) * abx + (f.y - ay) * aby) / len2, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = f.x - cx;
  const dy = f.y - cy;
  const d = Math.hypot(dx, dy);
  if (d > 0 && d < radius) {
    const nx = dx / d;
    const ny = dy / d;
    const vxBefore = f.vx;
    const vyBefore = f.vy;
    f.x = cx + nx * radius;
    f.y = cy + ny * radius;
    const dot = f.vx * nx + f.vy * ny;
    if (dot < 0) {
      f.vx = (f.vx - 2 * dot * nx) * bounce;
      f.vy = (f.vy - 2 * dot * ny) * bounce;
      jdNoteBounce(tag, f.x, f.y, f.vx, f.vy, vxBefore, vyBefore);
    }
  }
}

function jdNoteBounce(tag, x, y, vx, vy, vxBefore = 0, vyBefore = 0) {
  const last = JD.lastBounceInfo;
  if (last && Math.hypot(x - last.x, y - last.y) < 18 && ElapsedTime - last.time < 0.28) JD.bounceChain = (JD.bounceChain || 0) + 1;
  else JD.bounceChain = 0;

  JD.lastBounceInfo = { tag, x, y, vx, vy, vxBefore, vyBefore, time: ElapsedTime };
}

function jdCheckStuckBounce(dt) {
  const f = JD.food;
  if (!f || f.resolved) return false;
  const chain = JD.bounceChain || 0;
  const speed = jdShotSpeed(f);
  const near = f.y <= JD.tableY + jdFoodRadius(f) + 125;
  if (chain >= 8 && speed < 90 && near) JD.stuckBounceTimer = (JD.stuckBounceTimer || 0) + dt;
  else JD.stuckBounceTimer = 0;
  if ((JD.stuckBounceTimer || 0) > 0.35 || (chain >= 18 && speed < 130 && near)) {
    if (jdCheckTargets()) return true;
    jdResolve(null, "FLOOR");
    return true;
  }
  return false;
}

function jdCheckSweptCake(prevX, prevY, nowX, nowY) {
  const f = JD.food;

  if (!f || f.resolved || nowY >= prevY) return false;

  const t = JD.targets.find(
    target => target.kind === "cake"
  );

  if (!t) return false;

  // 下げたケーキ上面に合わせる
  const catchY = JD.tableY + 74;

  const crossed =
    prevY >= catchY &&
    nowY <= catchY;

  if (!crossed) return false;

  const q =
    (prevY - catchY) /
    Math.max(0.0001, prevY - nowY);

  const hitX =
    prevX +
    (nowX - prevX) * q;

  if (
    hitX < t.x - 44 ||
    hitX > t.x + 44
  ) {
    return false;
  }

  f.x = hitX;
  f.y = catchY;

  JD.pendingCakeSasari =
    jdShouldCakeSasari(f);

  jdResolve(t, null);

  return true;
}


function jdShouldCakeSasari(f) {
  const speed = jdShotSpeed(f);
  const vx = Math.abs(f.vx || 0);
  const vy = f.vy || 0;
  if (vy < -650 && speed > 760) return true;
  if (speed > 1000 && vy < -560 && vx < 420) return true;
  return false;
}

function jdCheckSweptMelon(prevX, prevY, nowX, nowY) {
  const f = JD.food;
  if (!f || f.resolved) return false;
  const t = JD.targets.find((target) => target.kind === "melon");
  if (!t) return false;

  const rect = jdMelonNoPassRect(t);
  const hit = jdSegmentRectFirstHit(prevX, prevY, nowX, nowY, rect.left, rect.bottom, rect.right, rect.top);
  if (!hit.ok) return false;

  const q = hit.t;
  const hx = prevX + (nowX - prevX) * q;
  const hy = prevY + (nowY - prevY) * q;

  const centerBand = hx >= t.x - 22 && hx <= t.x + 22 || nowX >= t.x - 22 && nowX <= t.x + 22 || prevX >= t.x - 22 && prevX <= t.x + 22;
  const opening = jdSegmentRectFirstHit(prevX, prevY, nowX, nowY, t.x - 33, JD.tableY + 116, t.x + 33, JD.tableY + 160).ok;
  const interiorDown = nowY < prevY && hy <= JD.tableY + 132 && hy >= JD.tableY + 28;

  if (!centerBand || !(opening || interiorDown)) return false;

  f.x = jdClamp(hx, t.x - 18, t.x + 18);
  f.y = jdClamp(hy, JD.tableY + 46, JD.tableY + 126);
  JD.pendingCakeSasari = false;
  jdResolve(t, null);
  return true;
}

function jdMelonNoPassRect(t) {
  const r = jdFoodRadius(JD.food);
  const pad = jdTargetBonusPad(JD.food ? JD.food.name : "", t.id);
  return {
    left: t.x - 25 - pad.x * 0.12 - r * 0.35,
    right: t.x + 25 + pad.x * 0.12 + r * 0.35,
    bottom: JD.tableY + 24 - r * 0.25,
    top: JD.tableY + 146 + pad.y * 0.12 + r * 0.25
  };
}

function jdSegmentRectFirstHit(x1, y1, x2, y2, left, bottom, right, top) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p, q) => {
    if (Math.abs(p) < 0.000001) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dx, x1 - left)) return { ok: false, t: null };
  if (!clip(dx, right - x1)) return { ok: false, t: null };
  if (!clip(-dy, y1 - bottom)) return { ok: false, t: null };
  if (!clip(dy, top - y1)) return { ok: false, t: null };
  return { ok: true, t: jdClamp(t0, 0, 1) };
}

function jdBeginAimTouch(p) {
  const f = JD.food;
  if (!f) return;
  const foodScreen = jdWorldToScreen(f.x, f.y);
  const d = Math.hypot(p.x - foodScreen.x, p.y - foodScreen.y);
  if (d < 64) {
    JD.dragging = true;
    JD.dragScreenStart = jdWorldToScreen(JD.launcher.x, JD.launcher.y);
    JD.dragScreenNow = { x: p.x, y: p.y };
    jdSetGamePhase(PHASE_AIMING);
    jdSetCameraOverview();
  }
}

function jdUpdateAimTouch(p) {
  if (!JD.dragging) return;
  JD.dragScreenNow = { x: p.x, y: p.y };
  jdSetCameraOverview();
}

function jdReleaseAimTouch(p, cancelled) {
  if (!JD.dragging) return;
  JD.dragging = false;
  JD.dragScreenNow = { x: p.x, y: p.y };
  if (cancelled) {
    JD.dragScreenStart = null;
    JD.dragScreenNow = null;
    jdSetGamePhase(PHASE_AIM);
    jdSetCameraClose(false);
    return;
  }

  const pull = jdGetScreenPull();
  const dist = Math.hypot(pull.x, pull.y);
  if (dist < 8) {
    JD.dragScreenStart = null;
    JD.dragScreenNow = null;
    jdSetGamePhase(PHASE_AIM);
    jdSetCameraClose(false);
    return;
  }

  const f = JD.food;
  f.x = JD.launcher.x;
  f.y = JD.launcher.y;
  f.vx = pull.x * JD.shotPower;
  f.vy = pull.y * JD.shotPower;
  f.launched = true;
  f.stillTimer = 0;

  JD.currentTrail = [];
  JD.trailTick = 0;
  jdRecordTrailPoint(f.x, f.y, true);
  JD.lastPowerRatio = jdClamp(dist / JD.maxPull, 0, 1);
  JD.lastAngleName = jdAngleName(pull);
  JD.shake = 0.045;
  jdSetGamePhase(PHASE_FLYING);
  jdSetCameraFollowFood();
}

function jdCanAcceptAimTouch() {
  return JD.state === STATE_PLAY
    && JD.food
    && !JD.food.launched
    && !JD.food.resolved
    && !JD.fortuneSpinning
    && !(JD.fortunePickedTimer > 0)
    && (JD.gamePhase === PHASE_AIM || JD.gamePhase === PHASE_AIMING);
}


function jdGetScreenPull() {
  if (!JD.dragScreenStart || !JD.dragScreenNow) return { x: 0, y: 0 };
  let x = JD.dragScreenStart.x - JD.dragScreenNow.x;
  let y = JD.dragScreenStart.y - JD.dragScreenNow.y;
  const len = Math.hypot(x, y);
  if (len > JD.maxPull) {
    x = (x / len) * JD.maxPull;
    y = (y / len) * JD.maxPull;
  }
  return { x, y };
}

function jdRecordTrailPoint(x, y, forced) {
  if (!JD.currentTrail) JD.currentTrail = [];
  if (!forced && JD.currentTrail.length > 0) {
    const last = JD.currentTrail[JD.currentTrail.length - 1];
    if (Math.hypot(x - last.x, y - last.y) < 2) return;
  }
  JD.currentTrail.push({ x, y });
  if (JD.currentTrail.length > 30) JD.currentTrail.shift();
}

function jdFinishShotTrail(result) {
  JD.lastTrail = JD.currentTrail ? JD.currentTrail.slice() : null;
  JD.currentTrail = null;
  JD.lastTrailResult = result || "-";
}

function jdAppDraw() {
  if (JD.state === STATE_TITLE) jdDrawTitle();
  else if (JD.state === STATE_PLAY) jdDrawPlay();
  else if (JD.state === STATE_RECEIPT) jdDrawReceipt();
}

function jdDrawTitle() {
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  jdFill("posterBg");
  rect(0, 0, JD.LOGICAL_W, JD.LOGICAL_H);

  jdFill("posterBg2", 70);
  rect(0, 0, JD.LOGICAL_W, 148);
  jdFill("tableTop", 235);
  rect(0, 0, JD.LOGICAL_W, 138);
  jdFill("tableLip", 235);
  rect(0, 134, JD.LOGICAL_W, 9);

  jdFill("red", 230);
  rect(0, 458, JD.LOGICAL_W, 10);
  jdFill("wood", 85);
  rect(0, 470, JD.LOGICAL_W, 4);

  // poster registration dots
  jdFill("redDeep", 175); ellipse(38, 532, 8, 8);
  jdFill("redDeep", 175); ellipse(JD.LOGICAL_W - 38, 532, 8, 8);

  jdDrawTinyCafePreview();

  fill(60, 42, 31, 245);
  textAlign(CENTER);
  font('"Hiragino Mincho ProN", "Yu Mincho", serif');
  fontSize(31);
  text(jdT("title.jp"), JD.LOGICAL_W / 2, 414);

  jdFill("redDeep", 230);
  font('Courier-Bold');
  fontSize(16);
  text(jdT("title.en"), JD.LOGICAL_W / 2, 382);

  fill(84, 62, 48, 220);
  font('Courier');
  fontSize(12);
  text(jdT("title.sub"), JD.LOGICAL_W / 2, 356);

  const pulse = 150 + Math.sin(ElapsedTime * 4.6) * 48;
  jdFill("uiPanel", 218);
  rectMode(CENTER);
  rect(JD.LOGICAL_W / 2, 104, 182, 40, 18);
  jdFill("uiText", pulse);
  font('Courier-Bold');
  fontSize(16);
  text(jdT("title.start"), JD.LOGICAL_W / 2, 104);
}

function jdDrawTinyCafePreview() {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  const y = 248;

  jdPosterShadow(JD.LOGICAL_W / 2, y - 26, 252, 58, 38, 18);
  jdFill("tableTop");
  rect(JD.LOGICAL_W / 2, y - 26, 252, 58, 20);
  jdFill("tableLip");
  rect(JD.LOGICAL_W / 2, y - 53, 252, 6, 2);

  // coffee
  jdFill("cream"); ellipse(105, y + 3, 52, 16);
  jdFill("highlight", 235); rect(105, y + 23, 36, 28, 9);
  jdFill("coffee"); ellipse(105, y + 38, 34, 11);
  jdFill("woodDark", 110); ellipse(130, y + 23, 17, 22);

  // cake
  jdFill("cream"); ellipse(180, y + 3, 66, 15);
  jdFill("cakeSponge"); rect(180, y + 27, 46, 23, 5);
  jdFill("cakeCream"); rect(180, y + 37, 46, 10, 5);
  jdFill("cakePink"); rect(180, y + 27, 46, 7, 3);
  jdFill("red"); ellipse(190, y + 51, 9, 9);

  // melon soda
  jdFill("glass", 105); rect(262, y + 42, 40, 82, 7);
  jdFill("soda", 205); rect(262, y + 34, 30, 58, 6);
  jdFill("sodaLight", 145); ellipse(262, y + 64, 30, 12);
  jdFill("cream", 240); ellipse(262, y + 88, 28, 18);
  jdFill("red"); ellipse(271, y + 100, 8, 8);

  jdFill("red"); ellipse(72, y + 42, 15, 15);
}

function jdDrawPlay() {
  jdUpdateCamera(DeltaTime);
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();
  fill(20, 16, 14); rect(0, 0, JD.LOGICAL_W, JD.LOGICAL_H);

  pushMatrix();
  jdApplyCamera();
  jdDrawWorld();
  popMatrix();

  jdDrawPlayUI();
  jdDrawShotMeter();
  jdDrawDebugScreen();
  jdDrawFortuneMachine();
}

function jdDrawWorld() {
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  // Poster-like cafe wall
  jdFill("wall");
  rect(0, 0, JD.worldW, JD.LOGICAL_H);
  jdFill("wallShade", 32);
  rect(0, 372, JD.worldW, 112);
  jdFill("redDeep", 150);
  rect(0, 374, JD.worldW, 5);
  jdFill("wallLine", 55);
  rect(0, 304, JD.worldW, 2);
  rect(0, 446, JD.worldW, 2);

  // quiet poster grain / cafe panels
  jdFill("highlight", 18);
  for (let x = 30; x <= JD.worldW; x += 120) {
    rect(x, JD.tableY + 84, 54, 126, 18);
  }

  // table front and top
  jdFill("tableFront");
  rect(0, 0, JD.worldW, JD.tableY - 30);
  jdFill("tableTop");
  rect(0, JD.tableY - 16, JD.worldW, 32);
  jdFill("tableLip");
  rect(0, JD.tableY - 18, JD.worldW, 5);
  rect(0, JD.tableY + 11, JD.worldW, 6);

  jdFill("tableStripe", 20);
  for (let x = 40; x <= JD.worldW; x += 118) rect(x, 0, 4, JD.tableY - 32);

  jdDrawLastShotGhost();
  for (const t of JD.targets) {
    jdDrawHitZone(t);
    jdDrawTarget(t);
  }
  for (const o of JD.obstacles) jdDrawObstacle(o);
  jdDrawPlacedFoods();
  jdDrawLauncher();

  let fx = JD.food ? JD.food.x : JD.launcher.x;
  let fy = JD.food ? JD.food.y : JD.launcher.y;

  if (JD.dragging && JD.food && !JD.food.launched && !JD.food.resolved) {
    const pull = jdGetScreenPull();
    const dragWorld = jdScreenToWorldPoint(
      JD.dragScreenNow.x,
      JD.dragScreenNow.y
    );

    fx = dragWorld.x;
    fy = dragWorld.y;

    const anchorX =
      JD.launcher.x + 20;

    const upperAnchorY =
      JD.launcher.y + 18;

    const lowerAnchorY =
      JD.launcher.y - 18;

    // 二本の赤茶色のゴム紐
    jdStroke("redDeep", 245);
    strokeWidth(5);

    line(
      anchorX,
      upperAnchorY,
      fx + 3,
      fy + 5
    );

    line(
      anchorX,
      lowerAnchorY,
      fx + 3,
      fy - 5
    );

    // ゴム表面の細いハイライト
    jdStroke("red", 145);
    strokeWidth(1.5);

    line(
      anchorX,
      upperAnchorY + 1,
      fx + 3,
      fy + 6
    );

    line(
      anchorX,
      lowerAnchorY + 1,
      fx + 3,
      fy - 4
    );

    noStroke();

    // 引っ張った食材の後ろに小さな受け布
    jdFill("woodDark", 205);
    rect(
      fx + 5,
      fy,
      13,
      24,
      5
    );

    jdFill("wood", 135);
    rect(
      fx + 3,
      fy,
      6,
      18,
      3
    );

    jdDrawTrajectory(pull);
  }

  if (JD.food) {
    if (!(JD.food.resolved && JD.food.hideAfterResolve)) jdDrawFood(JD.food, fx, fy, 255, 1);
    if (JD.food.resolved && JD.food.label) {
      jdFill("highlight", 230);
      font('Courier-Bold'); fontSize(23); textAlign(CENTER);
      text(JD.food.label, JD.food.x, JD.food.y + 34);
    }
  }

  jdDrawParticles();
  jdDrawFloatTexts();
  jdDrawDebugWorld();
}

function jdDrawTargetLabel(label, x, y) {
  // Final polish: hide target labels under the items.
  // The silhouettes are now readable enough on their own.
  return;
}

function jdDrawPlate(x, y, w, h, alpha = 235) {
  jdFill("shadow", 38);
  ellipse(x + 6, y - 4, w, h * 0.62);
  jdFill("plate", alpha);
  ellipse(x, y, w, h);
  jdFill("highlight", 74);
  ellipse(x - w * 0.11, y + h * 0.10, w * 0.58, h * 0.36);
}

function jdDrawCoffeeTarget(t) {
  // Low saucer, then a softer cafe cup. Keep it cup-like, not vase-like.
  jdDrawPlate(t.x, JD.tableY + 7, 94, 19, 245);
  jdFill("soda", 56);
  ellipse(t.x, JD.tableY + 7, 58, 9);
  jdFill("plate", 238);
  ellipse(t.x, JD.tableY + 8, 74, 12);

  // cup body lowered more clearly so it visibly sits on the saucer
  jdFill("creamWarm", 255);
  rect(t.x, JD.tableY + 29, 60, 36, 11);
  jdFill("highlight", 68);
  rect(t.x - 18, JD.tableY + 29, 7, 24, 4);

  // handle: lighter and a touch smaller
  jdFill("creamWarm", 235);
  ellipse(t.x + 35, JD.tableY + 28, 18, 25);
  jdFill("wall", 255);
  ellipse(t.x + 35, JD.tableY + 28, 9, 16);

  // lip and coffee surface: sit directly on the body, with no pinched neck
  jdFill("creamWarm", 255);
  ellipse(t.x, JD.tableY + 43, 66, 15);
  jdFill("coffee", 255);
  ellipse(t.x, JD.tableY + 43, 54, 10.5);
  jdFill("coffeeLight", 34);
  ellipse(t.x - 8, JD.tableY + 44, 22, 3.5);

  jdDrawTargetLabel(jdT("target.coffee"), t.x, JD.tableY - 23);
}

function jdDrawCakeTarget(t) {
  jdDrawPlate(t.x, JD.tableY + 7, 102, 20, 242);

  // shortcake body lowered more clearly so it reads as resting on the plate
  jdFill("cakeSponge", 250);
  rect(t.x, JD.tableY + 20, 68, 28, 5);
  jdFill("cakeCream", 255);
  rect(t.x, JD.tableY + 34, 68, 8, 4);
  jdFill("cakePink", 215);
  rect(t.x, JD.tableY + 29, 68, 7, 3);
  jdFill("cakeSponge", 245);
  rect(t.x, JD.tableY + 45, 68, 15, 5);
  jdFill("cakeCream", 255);
  rect(t.x, JD.tableY + 57, 68, 9, 5);

  // cream dollops only
  for (const dx of [-22, 0, 22]) {
    jdFill("cakeCream", 250);
    ellipse(t.x + dx, JD.tableY + 67, 16, 13);
    jdFill("highlight", 82);
    ellipse(t.x + dx - 4, JD.tableY + 70, 5, 3.5);
  }

  jdDrawTargetLabel(jdT("target.cake"), t.x, JD.tableY - 23);
}

function jdDrawSmallStrawberry(x, y, sc = 1) {
  pushMatrix();
  translate(x, y);
  scale(sc);
  noStroke();

  // smaller, simpler, and a little cuter
  jdFill("red", 255);
  ellipse(-3.5, 3, 10.5, 11.5);
  ellipse(3.5, 3, 10.5, 11.5);
  ellipse(0, -2.5, 14, 16);
  jdFill("redDeep", 82);
  ellipse(0, -6.5, 8, 6.5);

  jdFill("tableTop", 225);
  ellipse(-4, 10, 5.5, 2.8);
  ellipse(0, 11, 5.5, 2.8);
  ellipse(4, 10, 5.5, 2.8);

  // fewer seeds
  jdFill("cream", 180);
  ellipse(-3.5, 3.5, 1.8, 2.2);
  ellipse(2.5, 4.5, 1.8, 2.2);
  ellipse(-1.0, -1.0, 1.8, 2.2);
  ellipse(3.5, -2.5, 1.8, 2.2);

  jdFill("highlight", 115);
  ellipse(-4, 6, 2.8, 2.8);
  popMatrix();
}

function jdDrawMelonTarget(t) {
  // foot and stem
  jdFill("shadow", 34);
  ellipse(t.x + 8, JD.tableY + 1, 72, 13);
  jdFill("glass", 145);
  ellipse(t.x, JD.tableY + 5, 56, 14);
  jdFill("glass", 112);
  rect(t.x, JD.tableY + 25, 13, 40, 6);
  jdFill("glass", 160);
  ellipse(t.x, JD.tableY + 30, 34, 11);

  // glass outer silhouette
  jdFill("glass", 72);
  rect(t.x, JD.tableY + 80, 66, 126, 15);
  jdFill("glassEdge", 100);
  rect(t.x - 29, JD.tableY + 80, 5, 118, 3);
  jdFill("glassEdge", 115);
  rect(t.x + 29, JD.tableY + 80, 5, 118, 3);
  jdFill("glassEdge", 145);
  ellipse(t.x, JD.tableY + 143, 62, 19);

  // straw: deeper insertion so it clearly enters the drink
  jdStroke("redDeep", 210);
  strokeWidth(2.2);
  line(t.x + 5, JD.tableY + 86, t.x + 30, JD.tableY + 204);
  noStroke();

  // soda body: lifted more clearly so the fill sits higher in the glass
  jdFill("soda", 210);
  rect(t.x, JD.tableY + 76, 42, 92, 9);
  jdFill("sodaDeep", 60);
  rect(t.x + 9, JD.tableY + 72, 16, 82, 7);
  jdFill("sodaLight", 150);
  ellipse(t.x, JD.tableY + 122, 41, 12);
  jdFill("highlight", 68);
  ellipse(t.x - 10, JD.tableY + 116, 14, 6);

  // ice cubes, simplified and contained
  jdDrawIceCube(t.x - 12, JD.tableY + 94, 16, -18, 105);
  jdDrawIceCube(t.x + 9, JD.tableY + 75, 18, 12, 88);
  jdDrawIceCube(t.x - 3, JD.tableY + 56, 16, 6, 66);

  // bubbles
  jdFill("highlight", 185);
  ellipse(t.x - 16, JD.tableY + 59, 3.5, 3.5);
  ellipse(t.x + 15, JD.tableY + 83, 3, 3);
  ellipse(t.x + 6, JD.tableY + 99, 4, 4);
  ellipse(t.x - 4, JD.tableY + 116, 3, 3);

  // ice cream: resting on the soda, not floating above it
  jdFill("creamWarm", 252);
  ellipse(t.x, JD.tableY + 123, 46, 33);
  jdFill("highlight", 130);
  ellipse(t.x - 10, JD.tableY + 130, 17, 8);
  jdFill("plate", 80);
  ellipse(t.x + 7, JD.tableY + 117, 22, 9);

  jdDrawTargetLabel(jdT("target.melon"), t.x, JD.tableY - 23);
}

function jdDrawIceCube(x, y, size, deg, alpha) {
  pushMatrix();
  translate(x, y);
  rotate(deg);
  rectMode(CENTER);
  noStroke();
  jdFill("ice", alpha);
  rect(0, 0, size, size * 1.08, 4);
  jdFill("highlight", alpha * 0.45);
  rect(-size * 0.18, size * 0.18, size * 0.42, size * 0.25, 3);
  popMatrix();
}

function jdDrawCherryGarnish(x, y, sc = 1) {
  pushMatrix();
  translate(x, y);
  scale(sc);
  noStroke();
  jdFill("red", 255);
  ellipse(0, 0, 12, 12);
  jdFill("highlight", 140);
  ellipse(-3, 3, 3, 3);
  jdStroke("tableTop", 220);
  strokeWidth(2);
  line(1, 6, -2, 16);
  noStroke();
  popMatrix();
}

function jdDrawTarget(t) {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  jdFill("shadow", 38);
  ellipse(t.x + 5, JD.tableY + 1, t.w + 26, 13);

  if (t.kind === "coffee") {
    jdDrawCoffeeTarget(t);
  } else if (t.kind === "cake") {
    jdDrawCakeTarget(t);
  } else if (t.kind === "melon") {
    jdDrawMelonTarget(t);
  }
}

function jdDrawFood(
  f,
  x,
  y,
  alpha = 255,
  scaleValue = 1
) {
  pushMatrix();

  translate(x, y);

  // 飛行中に蓄積した角度を、状態に関係なく描画へ反映する
  // 発射前の食材は visualAngle が未設定なので 0 度のまま
  const visualAngle = Number.isFinite(f.visualAngle)
    ? f.visualAngle
    : 0;

  rotate(visualAngle);

  scale(scaleValue);

  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();

  if (f.shape === "circle") {
    // チェリー
    jdFill("red", alpha);
    ellipse(
      -1,
      -1,
      f.r * 1.85,
      f.r * 1.75
    );

    jdFill(
      "redDeep",
      alpha * 0.22
    );

    ellipse(
      2,
      -5,
      f.r * 1.05,
      f.r * 0.60
    );

    jdFill(
      "highlight",
      Math.floor(alpha * 0.44)
    );

    ellipse(
      -4,
      4,
      4.2,
      4
    );

    jdFill(
      "redDeep",
      Math.floor(alpha * 0.50)
    );

    ellipse(
      1,
      7,
      4,
      2.2
    );

    jdStroke(
      "tableTop",
      Math.floor(alpha * 0.92)
    );

    strokeWidth(1.7);

    line(
      2,
      8,
      10,
      21
    );

    noStroke();

  } else if (f.shape === "rect") {
    // 角砂糖
    jdFill("cream", alpha);

    rect(
      0,
      0,
      f.w,
      f.h,
      3.5
    );

    jdFill(
      "highlight",
      Math.floor(alpha * 0.50)
    );

    rect(
      -3.5,
      4,
      f.w * 0.44,
      f.h * 0.30,
      2.5
    );

    jdFill(
      "wallShade",
      Math.floor(alpha * 0.22)
    );

    rect(
      3.5,
      -3.5,
      f.w * 0.30,
      f.h * 0.35,
      2.5
    );

    jdFill(
      "creamWarm",
      Math.floor(alpha * 0.55)
    );

    ellipse(
      -4,
      -4,
      2.5,
      2.5
    );

  } else if (f.shape === "oval") {
    // いちご
    jdFill("red", alpha);

    ellipse(
      -3.5,
      3,
      f.w * 0.42,
      f.h * 0.40
    );

    ellipse(
      3.5,
      3,
      f.w * 0.42,
      f.h * 0.40
    );

    ellipse(
      0,
      -3,
      f.w * 0.62,
      f.h * 0.60
    );

    jdFill(
      "redDeep",
      alpha * 0.18
    );

    ellipse(
      1,
      -7,
      f.w * 0.36,
      f.h * 0.24
    );

    jdFill(
      "tableTop",
      Math.floor(alpha * 0.88)
    );

    ellipse(
      -4.5,
      8.5,
      5.5,
      2.8
    );

    ellipse(
      0,
      9.5,
      5.5,
      2.8
    );

    ellipse(
      4.5,
      8.5,
      5.5,
      2.8
    );

    jdFill(
      "cream",
      Math.floor(alpha * 0.76)
    );

    ellipse(
      -4,
      3.5,
      2,
      2.5
    );

    ellipse(
      2.5,
      4,
      2,
      2.5
    );

    ellipse(
      -1.5,
      -1,
      2,
      2.5
    );

    ellipse(
      3.5,
      -2.5,
      2,
      2.5
    );

    jdFill(
      "highlight",
      Math.floor(alpha * 0.34)
    );

    ellipse(
      -4,
      5.5,
      3.5,
      3.5
    );
  }

  popMatrix();
}



function jdDrawObstacle(o) {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  if (o.kind === "spoon") {
    jdStroke("highlight", 215); strokeWidth(5); line(o.x - 32, o.y, o.x + 28, o.y + 3);
    noStroke(); jdFill("highlight", 215); ellipse(o.x + 36, o.y + 5, 24, 10);
    jdFill("shadow", 36); ellipse(o.x + 5, o.y - 5, 76, 6);
  } else if (o.kind === "ticket") {
    jdFill("woodDark", 90); rect(o.x, JD.tableY + 10, 38, 8, 2);
    jdFill("paper"); rect(o.x, o.y, o.w, o.h, 3);
    jdFill("red", 60); rect(o.x, o.y + 15, o.w - 5, 4, 2);
  } else if (o.kind === "coaster") {
    // small wooden coaster between melon soda and cake
    jdFill("shadow", 32); ellipse(o.x + 4, o.y - 3, o.r * 2.3, o.r * 0.58);
    jdFill("wood", 230); ellipse(o.x, o.y, o.r * 2.05, o.r * 0.62);
    jdFill("woodDark", 120); ellipse(o.x, o.y + 1, o.r * 1.42, o.r * 0.34);
    jdFill("highlight", 44); ellipse(o.x - 4, o.y + 3, o.r * 1.1, o.r * 0.18);
    jdFill("redDeep", 70); ellipse(o.x + 1, o.y + 1, o.r * 0.64, o.r * 0.16);
  }
}

function jdDrawLauncher() {
  const x = JD.launcher.x;
  const y = JD.launcher.y;

  const ready =
    JD.food &&
    !JD.food.launched &&
    !JD.food.resolved &&
    !JD.dragging &&
    !(JD.fortunePickedTimer > 0);

  const pulse =
    0.5 +
    0.5 * Math.sin(ElapsedTime * 3.2);

  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();

  // 卓上に落ちる影
  jdFill("shadow", 48);
  ellipse(x + 5, y - 16, 78, 22);

  // 木製の台座
  jdFill("woodDark", 255);
  ellipse(x, y - 7, 72, 36);

  jdFill("wood", 255);
  ellipse(x - 2, y - 3, 66, 31);

  // 木目
  jdStroke("woodDark", 105);
  strokeWidth(2);
  line(x - 25, y - 1, x + 21, y - 7);
  line(x - 17, y + 5, x + 16, y + 1);
  noStroke();

  // 食材を受ける小さな白い皿
  jdFill("shadow", 32);
  ellipse(x + 2, y - 1, 34, 14);

  jdFill("plate", 250);
  ellipse(x, y + 2, 32, 14);

  jdFill("highlight", 90);
  ellipse(x - 3, y + 4, 19, 6);

  // 上下の真鍮クリップ
  jdFill("woodDark", 225);
  rect(x + 20, y + 15, 9, 24, 4);
  rect(x + 20, y - 15, 9, 24, 4);

  jdFill("gold", 255);
  ellipse(x + 20, y + 18, 13, 13);
  ellipse(x + 20, y - 18, 13, 13);

  jdFill("highlight", 125);
  ellipse(x + 17, y + 20, 4, 4);
  ellipse(x + 17, y - 16, 4, 4);

  // 待機中のゴム紐
  // ドラッグ中は、後段で食材位置まで伸ばして描画する
  if (!JD.dragging) {
    jdStroke("redDeep", 235);
    strokeWidth(4);

    line(
      x + 20,
      y + 18,
      x + 5,
      y + 6
    );

    line(
      x + 20,
      y - 18,
      x + 5,
      y - 6
    );

    jdStroke("red", 92);
    strokeWidth(1.5);

    line(
      x + 20,
      y + 19,
      x + 5,
      y + 7
    );

    line(
      x + 20,
      y - 17,
      x + 5,
      y - 5
    );

    noStroke();
  }

  // 操作可能な時だけ、後方へ控えめな引っ張りガイド
  if (ready) {
    const guideAlpha =
      52 +
      pulse * 74;

    jdFill(
      "creamWarm",
      guideAlpha * 0.34
    );

    rect(
      x + 66,
      y,
      76,
      32,
      10
    );

    // 点線
    jdFill(
      "highlight",
      guideAlpha
    );

    for (let i = 0; i < 4; i++) {
      const dotX =
        x + 35 + i * 11;

      ellipse(
        dotX,
        y,
        3.5 + pulse * 1.2
      );
    }

    // 小さな「>」で右へ引くことを示す
    jdStroke(
      "redDeep",
      guideAlpha + 40
    );

    strokeWidth(2.5);

    line(
      x + 73,
      y + 7,
      x + 82,
      y
    );

    line(
      x + 82,
      y,
      x + 73,
      y - 7
    );

    noStroke();

    // 伝票風の小さな表示
    jdFill(
      "paper",
      155 + pulse * 45
    );

    rect(
      x + 60,
      y - 23,
      43,
      16,
      3
    );

    jdFill(
      "ink",
      175 + pulse * 55
    );

    font("Courier-Bold");
    fontSize(8);
    textAlign(CENTER);

    text(
      "PULL",
      x + 60,
      y - 25
    );
  }
}



function jdDrawPlacedFoods() {
  for (const f of JD.placedFoods) {
    const age =
      ElapsedTime -
      (f.placedAt || 0);

    let sc = 1;

    if (age < 0.32) {
      sc =
        1 +
        Math.sin(
          (age / 0.32) *
          Math.PI
        ) *
        0.26;
    }

    // 古い設置データでも安全に描画できるよう補完
    if (!Number.isFinite(f.visualAngle)) {
      f.visualAngle = 0;
    }

    jdDrawFood(
      f,
      f.x,
      f.y,
      f.alpha || 230,
      sc
    );
  }

  jdDrawHitEffectWorld();
}


function jdDrawHitEffectWorld() {
  if (!JD.hitEffectTimer || JD.hitEffectTimer <= 0) return;
  if (!JD.food || !JD.food.resolved) return;
  JD.hitEffectTimer -= DeltaTime || 0.016;
  const duration = JD.hitEffectDuration || 0.72;
  const t = 1 - jdClamp(JD.hitEffectTimer / duration, 0, 1);
  const x = JD.hitEffectX;
  const y = JD.hitEffectY;
  const perfect = JD.hitEffectPerfect;

  ellipseMode(CENTER); rectMode(CENTER);
  noStroke();
  const spotAlpha = (perfect ? 120 : 88) * (1 - t);
  fill(255, 245, 205, Math.max(0, spotAlpha)); ellipse(x, y, 86 + 18 * t, 44 + 12 * t);

  noFill();
  strokeWidth(perfect ? 4 : 3);
  stroke(255, 245, 215, (perfect ? 220 : 170) * (1 - t)); ellipse(x, y, 28 + (perfect ? 70 : 58) * t, 18 + (perfect ? 44 : 36) * t);
  strokeWidth(2); stroke(255, 255, 255, (perfect ? 170 : 110) * (1 - t)); ellipse(x, y, 18 + (perfect ? 50 : 40) * t, 12 + (perfect ? 32 : 26) * t);

  const pop = Math.sin(Math.min(1, t * 1.6) * Math.PI);
  const labelSize = perfect ? 26 + pop * 8 : 24 + pop * 7;
  const alpha = Math.max(0, 240 * (1 - Math.max(0, t - 0.76) / 0.24));
  noStroke(); fill(255, 255, 255, alpha); font('Courier-Bold'); fontSize(labelSize); textAlign(CENTER);
  text(JD.hitEffectLabel || "GOOD!", x, y + 42 + pop * 5);
  if (perfect) { fontSize(10); fill(255, 245, 210, alpha * 0.82); text(jdT("result.perfect"), x, y + 66 + pop * 5); }
}

function jdDrawTrajectory(pull) {
  const vx = pull.x * JD.shotPower;
  const vy = pull.y * JD.shotPower;
  const g = JD.gravity * ((JD.food && JD.food.gravityScale) || 1);
  for (let i = 1; i <= 8; i++) {
    const t = i * 0.055;
    const px = JD.launcher.x + vx * t;
    const py = JD.launcher.y + vy * t - 0.5 * g * t * t;
    if (px > -20 && px < JD.worldW + 20 && py > 0 && py < JD.worldH) {
      fill(255, 255, 255, Math.max(24, 150 - i * 14));
      noStroke(); ellipse(px, py, 4);
    }
  }
}

function jdDrawLastShotGhost() {
  if (!JD.lastTrail || JD.lastTrail.length < 2) return;
  noFill(); stroke(255, 242, 215, 62); strokeWidth(3);
  for (let i = 1; i < JD.lastTrail.length; i++) {
    const a = JD.lastTrail[i - 1];
    const b = JD.lastTrail[i];
    line(a.x, a.y, b.x, b.y);
  }
  noStroke();
}

function jdDrawParticles() {
  noStroke();
  for (const p of JD.particles) {
    fill(p.col.r, p.col.g, p.col.b, 230 * p.life);
    ellipse(p.x, p.y, p.size * p.life);
  }
}

function jdSpawnSplash(x, y, c) {
  for (let i = 0; i < 22; i++) {
    JD.particles.push({
      x, y,
      vx: -95 + Math.random() * 190,
      vy: 35 + Math.random() * 145,
      life: 1,
      size: 3 + Math.random() * 5,
      col: c
    });
  }
}

function jdUpdateParticles(dt) {
  for (let i = JD.particles.length - 1; i >= 0; i--) {
    const p = JD.particles[i];
    p.life -= dt * 1.75;
    p.vy -= 520 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) JD.particles.splice(i, 1);
  }
}

function jdDrawFloatTexts() {}
function jdUpdateFloatTexts(_dt) { JD.floatTexts.length = 0; }

function jdDrawPlayUI() {
  rectMode(CORNER); noStroke();
  jdFill("uiPanel", 214); rect(18, JD.LOGICAL_H - 86, JD.LOGICAL_W - 36, 66, 16);
  jdFill("redDeep", 190); rect(30, JD.LOGICAL_H - 35, JD.LOGICAL_W - 60, 3, 2);
  jdFill("uiText", 245); font('Courier-Bold'); fontSize(14); textAlign(CENTER);
  text(`${jdT("ui.shift")}     ${jdT("ui.sales")} ${JD.totalSales} ${jdT("ui.yen")}`, JD.LOGICAL_W / 2, JD.LOGICAL_H - 42);
  font('Courier'); fontSize(12);
  let rest = JD.queue.length - JD.throwIndex + 1;
  if (rest < 0) rest = 0;
  let itemName = "-";
  if (JD.fortuneSpinning) itemName = "FORTUNE...";
  else if (JD.food) itemName = JD.food.name;
  else if (JD.fortuneDisplayName) itemName = JD.fortuneDisplayName;
  text(`${jdT("ui.rest")} ${rest} / ${jdT("ui.item")} ${itemName}`, JD.LOGICAL_W / 2, JD.LOGICAL_H - 64);

  if (JD.gamePhase === PHASE_SHIFT_START) {
    jdFill("ink", 225); font('Courier-Bold'); fontSize(13); text("SHIFT START", JD.LOGICAL_W / 2, 92);
  } else if (JD.fortuneSpinning) {
    jdFill("ink", 225); font('Courier-Bold'); fontSize(13); text(jdT("ui.fortuneSpin"), JD.LOGICAL_W / 2, 92);
  } else if (JD.food && !JD.food.launched && !JD.food.resolved) {
    jdFill("ink", 225); font('Courier-Bold'); fontSize(13);
    text(JD.dragging ? jdT("ui.dragging") : jdT("ui.pull"), JD.LOGICAL_W / 2, 92);
  }

  jdDrawDebugButton();
}

function jdDrawShotMeter() {
  if (!JD.food || JD.food.launched || JD.food.resolved || JD.fortuneSpinning) return;
  const y = 26;
  font('Courier-Bold'); fontSize(10); textAlign(CENTER);
  fill(255, 242, 215, 165);
  text(`${jdT("shot.last")}  ${jdPowerName(JD.lastPowerRatio)} / ${JD.lastAngleName}`, JD.LOGICAL_W / 2, y);
}

function jdDrawFortuneMachine() {
  if (!JD.fortuneSpinning && !(JD.fortunePickedTimer > 0)) return;

  rectMode(CENTER);
  ellipseMode(CENTER);
  textAlign(CENTER);
  noStroke();

  const cx = JD.LOGICAL_W / 2;
  const cy = 328;

  const active = JD.fortuneSpinning;
  const duration = JD.fortuneDuration || 0.9;
  const timer = JD.fortuneTimer || 0;

  const p = 1 - jdClamp(timer / duration, 0, 1);
  const pickedP = JD.fortunePickedTimer > 0
    ? jdClamp(JD.fortunePickedTimer / 0.9, 0, 1)
    : 0;

  const bodyPop = active
    ? Math.sin(Math.min(1, p * 1.8) * Math.PI) * 1.3
    : pickedP;

  const wheelRot = active
    ? (JD.fortuneDuration - timer) * 900
    : 0;

  const blink = active
    ? 0.84 + 0.16 * Math.sin(ElapsedTime * 12)
    : 1;

  // 木製本体
  const bodyW = 156;
  const bodyH = 226 + bodyPop;

  jdFill("shadow", active ? 78 : 62);
  rect(cx + 4, cy - 8, bodyW + 8, bodyH + 8, 24);

  jdFill("woodDark", 210);
  rect(cx + 3, cy - 3, bodyW, bodyH, 22);

  jdFill("wood", 252);
  rect(cx, cy, bodyW - 8, bodyH - 8, 20);

  jdFill("wallShade", 34);
  rect(cx - 36, cy, 7, bodyH - 44, 4);

  jdFill("highlight", 28);
  rect(cx + 36, cy, 5, bodyH - 48, 4);

  // KISSA FORTUNE札
  const signY = cy + 72;

  jdFill("redDeep", 242);
  rect(cx, signY, 118, 26, 10);

  jdFill("gold", 220 + 20 * blink);
  ellipse(cx - 46, signY, 6, 6);
  ellipse(cx + 46, signY, 6, 6);

  jdFill("paper", 250);
  font("Courier-Bold");
  fontSize(10);
  text(jdT("fortune.title"), cx, signY + 1);

  // ルーレット
  const wheelCy = cy - 4;

  jdFill("uiPanel", 255);
  ellipse(cx, wheelCy, 96, 96);

  jdFill("gold", 248);
  ellipse(cx, wheelCy, 82, 82);

  jdFill("cream", 248);
  ellipse(cx, wheelCy, 68, 68);

  jdFill("paper", 36);
  ellipse(cx - 7, wheelCy + 9, 17, 44);

  pushMatrix();
  translate(cx, wheelCy);
  rotate(wheelRot);

  jdStroke("woodDark", 112);
  strokeWidth(1.8);

  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 90) * Math.PI / 180;

    line(
      0,
      0,
      Math.cos(a) * 34,
      Math.sin(a) * 34
    );
  }

  noStroke();
  jdFill("ink", 218);
  font("Courier-Bold");
  fontSize(7.2);

  const labels = [
    "CHERRY",
    "SUGAR",
    "BERRY",
    "CHERRY",
    "SUGAR",
    "LUCK"
  ];

  for (let i = 0; i < labels.length; i++) {
    const a = (i * 60 - 60) * Math.PI / 180;

    text(
      labels[i],
      Math.cos(a) * 22,
      Math.sin(a) * 22 - 1
    );
  }

  popMatrix();

  // 固定ポインタ
  jdStroke("red", 250);
  strokeWidth(4);
  line(cx, wheelCy + 44, cx, wheelCy + 34);

  noStroke();
  jdFill("red", 250);
  ellipse(cx, wheelCy + 43, 7, 7);

  jdFill("woodDark", 255);
  ellipse(cx, wheelCy, 9, 9);

  // 回転中は結果を表示しない
  if (active) return;

  const showName =
    JD.fortuneDisplayName ||
    (JD.food ? JD.food.name : "CHERRY");

  const nameLength = showName.length;

  // 文字数に応じて枠幅を調整
  const paperW = jdClamp(
    44 + nameLength * 8.2,
    94,
    bodyW - 18
  );

  const paperH = 32;

  // 木製本体内に収めつつ、ルーレットの少し下に配置
  const paperY = cy - 72;

  let nameSize = 17;

  if (nameLength >= 10) {
    nameSize = 14;
  } else if (nameLength >= 8) {
    nameSize = 15;
  }

  jdFill("paper", 252);
  rect(cx, paperY, paperW, paperH, 9);

  jdFill("redDeep", 230);
  font("Courier-Bold");
  fontSize(nameSize);
  text(showName, cx, paperY - 1);
}




function jdDrawReceipt() {
  rectMode(CORNER); ellipseMode(CENTER); noStroke();
  jdFill("posterBg"); rect(0, 0, JD.LOGICAL_W, JD.LOGICAL_H);
  jdFill("tableFront"); rect(0, 0, JD.LOGICAL_W, 116);
  const paperX = 28, paperY = 54, paperW = JD.LOGICAL_W - 56, paperH = 540;
  jdFill("shadow", 55); rect(paperX + 4, paperY - 4, paperW, paperH, 4);
  jdFill("paper"); rect(paperX, paperY, paperW, paperH, 4);
  jdFill("wallShade", 54); rect(paperX + paperW - 5, paperY, 5, paperH, 2); rect(paperX, paperY + paperH - 4, paperW, 4, 2);
  jdFill("redDeep", 180); rect(paperX, paperY + paperH - 35, paperW, 5, 0);

  textAlign(LEFT); jdFill("ink"); font('Courier'); fontSize(11);
  const x = paperX + 22;
  let y = paperY + paperH - 42;
  const lineH = 17;
  const showCount = Math.floor(JD.receiptTimer / 0.08);
  for (let i = 0; i < JD.receiptLines.length; i++) {
    if (i < showCount) text(JD.receiptLines[i], x, y);
    y -= lineH;
  }

  if (jdReceiptReady()) {
    const bx = JD.LOGICAL_W / 2, by = 92, bw = 220, bh = 44;
    rectMode(CENTER); jdFill("redDeep", 240); rect(bx, by, bw, bh, 16);
    textAlign(CENTER); jdFill("uiText"); font('Courier-Bold'); fontSize(14); text(jdT("receipt.oneMore"), bx, by + 1);
  }
}

function jdUpdateReceipt(dt) { JD.receiptTimer += dt; }
function jdReceiptReady() { return JD.receiptTimer / 0.08 >= JD.receiptLines.length; }

function jdMakeReceiptLines() {
  const lines = [];
  lines.push(jdT("receipt.shop"));
  lines.push(jdT("receipt.title"));
  lines.push("------------------------");
  for (let i = 0; i < JD.results.length; i++) {
    const r = JD.results[i];
    lines.push(`${i + 1} ${r.item || "-"} > ${r.targetLabel || r.target || "-"}  ${r.price || 0}Y`);
    lines.push(`  ${r.name || "KIMAGURE MENU"}`);
  }
  lines.push("------------------------");
  lines.push(`${jdT("receipt.total")}        ${JD.totalSales}Y`);
  lines.push("");
  lines.push(jdT("receipt.rank"));
  lines.push(jdRankName());
  lines.push("");
  lines.push(jdT("receipt.tencho"));
  lines.push(jdManagerCommentShort());
  return lines;
}

function jdRankName() {
  if (JD.totalSales >= 2600) return jdT("rank.great");
  if (JD.totalSales >= 2000) return jdT("rank.good");
  if (JD.totalSales >= 1200) return jdT("rank.mid");
  if (JD.totalSales >= 500) return jdT("rank.low");
  return jdT("rank.bad");
}

function jdManagerCommentShort() {
  let diveCount = 0;
  let floorCount = 0;
  for (const r of JD.results) {
    if (r.type === "DIVE") diveCount++;
    if (r.type === "FLOOR" || r.type === "OUT") floorCount++;
  }
  if (diveCount >= 4) return jdT("manager.diveMaster");
  if (floorCount >= 3) return jdT("manager.floorHeavy");
  if (JD.totalSales >= 2000) return jdT("manager.sold");
  return jdT("manager.default");
}

function jdDrawHitZone(t) {
  if (!JD.debugMode) return;
  rectMode(CORNER); ellipseMode(CENTER);
  noFill(); strokeWidth(2); stroke(255, 90, 70, 120);
  if (t.kind === "coffee") {
    rect(t.x - 39, JD.tableY + 14, 8, 42); rect(t.x + 31, JD.tableY + 14, 8, 42); rect(t.x - 31, JD.tableY + 12, 62, 8); rect(t.x - 44, JD.tableY + 2, 88, 10);
    noStroke(); fill(80, 255, 150, 75); ellipse(t.x, JD.tableY + 58, 82, 34);
  } else if (t.kind === "cake") {
    rect(t.x - 54, JD.tableY + 18, 10, 44); rect(t.x + 44, JD.tableY + 18, 10, 44);
    noStroke(); fill(80, 255, 150, 75); rect(t.x - 48, JD.tableY + 18, 96, 70);
  } else if (t.kind === "melon") {
    rect(t.x - 35, JD.tableY + 18, 7, 120); rect(t.x + 28, JD.tableY + 18, 7, 120); rect(t.x - 30, JD.tableY + 8, 60, 10);
    const np = jdMelonNoPassRect(t); noStroke(); fill(90, 190, 255, 42); rect(np.left, np.bottom, np.right - np.left, np.top - np.bottom);
  }
}

function jdDrawDebugButton() {
  rectMode(CORNER); noStroke();
  fill(JD.debugMode ? 70 : 55, JD.debugMode ? 150 : 42, JD.debugMode ? 90 : 36, 220);
  rect(306, JD.LOGICAL_H - 38, 50, 32);
  fill(255, 245, 224, 230); font('Courier-Bold'); fontSize(12); textAlign(CENTER); text("DBG", 331, JD.LOGICAL_H - 22);
}

function jdDebugButtonHit(x, y) { return x >= 306 && x <= 356 && y >= JD.LOGICAL_H - 38 && y <= JD.LOGICAL_H - 6; }

function jdDrawDebugWorld() {
  if (!JD.debugMode) return;
  fill(255, 245, 224, 180); font('Courier-Bold'); fontSize(9); textAlign(CENTER);
  text(`PHASE ${JD.gamePhase}`, JD.cam.x, JD.cam.y + 210);
}

function jdDrawDebugScreen() {
  if (!JD.debugMode) return;
  rectMode(CORNER); noStroke(); fill(28, 18, 14, 175); rect(16, 144, 328, 92);
  fill(255, 245, 224, 220); font('Courier-Bold'); fontSize(10); textAlign(LEFT);
  text(`SCENE PLAY  PHASE ${JD.gamePhase}`, 26, 216);
  text(`${JD.webPortVersion || "WEB"}`, 26, 154);
  if (JD.food) {
    text(`FOOD ${JD.food.name}  vx ${Math.round(JD.food.vx || 0)}  vy ${Math.round(JD.food.vy || 0)}`, 26, 194);
    const best = jdBestTargetDebugInfo();
    if (best) text(`NEAR ${best.target.label}  ${best.inZone ? "IN" : "OUT"}  ${best.reason}`, 26, 172);
  }
}

function jdBestTargetDebugInfo() {
  if (!JD.food) return null;
  let best = null;
  let bestD = Infinity;
  for (const t of JD.targets) {
    const info = jdTargetDebugInfo(JD.food, t);
    const d = Math.hypot(JD.food.x - t.x, JD.food.y - t.y);
    if (d < bestD) { bestD = d; best = info; }
  }
  return best;
}

function jdUpdateCamera(dt) {
  if (JD.state === STATE_PLAY) {
    if (JD.dragging) jdSetCameraOverview();
    else if (JD.perfectZoomActive && JD.hitZoomTimer > 0) { JD.hitZoomTimer -= dt; jdSetCameraHitZoom(); }
    else if (JD.food && JD.food.launched) jdSetCameraFollowFood();
    else if (JD.food && JD.food.resolved) jdFreezeCamera();
    else jdSetCameraClose(false);
  }
  let k = 7.5;
  if (JD.dragging) k = 11;
  else if (JD.perfectZoomActive && JD.hitZoomTimer > 0) k = 12.5;
  const a = Math.min(1, dt * k);
  JD.cam.x += (JD.cam.tx - JD.cam.x) * a;
  JD.cam.y += (JD.cam.ty - JD.cam.y) * a;
  JD.cam.zoom += (JD.cam.tz - JD.cam.zoom) * a;
}

function jdSetCameraClose(instant) {
  JD.cam.tx = JD.launcher.x - 105;
  JD.cam.ty = 252;
  JD.cam.tz = 1;
  if (instant) { JD.cam.x = JD.cam.tx; JD.cam.y = JD.cam.ty; JD.cam.zoom = JD.cam.tz; }
}

function jdSetCameraOverview() { JD.cam.tx = 515; JD.cam.ty = 285; JD.cam.tz = 0.42; }

function jdSetCameraFollowFood() {
  if (!JD.food) return jdSetCameraOverview();
  let lead = 0;
  if (JD.food.vx < -30) lead = -72;
  else if (JD.food.vx > 30) lead = 40;
  JD.cam.tz = 0.86;
  JD.cam.tx = jdClampCameraX(JD.food.x + lead, JD.cam.tz);
  JD.cam.ty = jdClamp(JD.food.y, 215, 355);
}

function jdSetCameraHitZoom() {
  const x = JD.hitZoomX || (JD.food && JD.food.x) || JD.cam.x;
  const y = JD.hitZoomY || (JD.food && JD.food.y) || JD.cam.y;
  const z = JD.hitZoomLevel || 1.48;
  JD.camScreenX = JD.LOGICAL_W / 2;
  JD.camScreenY = 292;
  JD.cam.tz = z;
  JD.cam.tx = jdClampCameraX(x, z);
  JD.cam.ty = jdClamp(y + 8, 175, 365);
}

function jdFreezeCamera() { JD.cam.tx = JD.cam.x; JD.cam.ty = JD.cam.y; JD.cam.tz = JD.cam.zoom; }
function jdClampCameraX(x, zoom) {
  const viewW = JD.LOGICAL_W / zoom;
  if (viewW >= JD.worldW) return JD.worldW / 2;
  return jdClamp(x, viewW / 2, JD.worldW - viewW / 2);
}
function jdApplyCamera() { translate(JD.camScreenX, JD.camScreenY); scale(JD.cam.zoom); translate(-JD.cam.x, -JD.cam.y); }
function jdWorldToScreen(x, y) { return { x: (x - JD.cam.x) * JD.cam.zoom + JD.camScreenX, y: (y - JD.cam.y) * JD.cam.zoom + JD.camScreenY }; }
function jdScreenToWorldPoint(x, y) { return { x: (x - JD.camScreenX) / JD.cam.zoom + JD.cam.x, y: (y - JD.camScreenY) / JD.cam.zoom + JD.cam.y }; }

function jdUpdateScale() {
  const sx = WIDTH / JD.LOGICAL_W;
  const sy = HEIGHT / JD.LOGICAL_H;
  JD.scale = Math.min(sx, sy);
  JD.offsetX = (WIDTH - JD.LOGICAL_W * JD.scale) / 2;
  JD.offsetY = (HEIGHT - JD.LOGICAL_H * JD.scale) / 2;
}

function jdToLogical(touch) { return { x: (touch.x - JD.offsetX) / JD.scale, y: (touch.y - JD.offsetY) / JD.scale }; }
function jdFoodRadius(f) { if (!f) return 10; return f.r || Math.max(f.w || 18, f.h || 18) / 2; }
function jdShotSpeed(f) { return Math.hypot(f.vx || 0, f.vy || 0); }
function jdClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function jdPowerName(r) { if (r < 0.33) return jdT("shot.yowame"); if (r < 0.62) return jdT("shot.futsu"); if (r < 0.86) return jdT("shot.tsuyome"); return jdT("shot.yarisugi"); }
function jdAngleName(pull) { const a = Math.atan2(pull.y, Math.abs(pull.x)) * 180 / Math.PI; if (a < 22) return jdT("shot.low"); if (a < 48) return jdT("shot.naname"); return jdT("shot.high"); }


// Web-only stability hooks. They are no-ops in the Codea mental model, but useful in browsers.
if (typeof window !== "undefined") {
  window.addEventListener("blur", jdCancelActiveTouch);
  window.addEventListener("pagehide", jdCancelActiveTouch);
}
