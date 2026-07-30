// Junkissa Dive Web Port 1/7
// Codea Lite target: setup(), draw(), touched(touch)
// First goal: preserve the Codea prototype's movement and scene flow on web.

const JD = {};

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
  jdResetAll();
}

function draw() {
  background(20, 16, 14);
  jdUpdateScale();

  pushMatrix();
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
}

function touched(touch) {
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

  if (!jdCanAcceptAimTouch()) return;

  if (touch.state === BEGAN) {
    jdBeginAimTouch(p);
  } else if (touch.state === MOVING) {
    jdUpdateAimTouch(p);
  } else if (touch.state === ENDED || touch.state === CANCELLED) {
    jdReleaseAimTouch(p, touch.state === CANCELLED);
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
  JD.debugMode = false;
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
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;
  JD.shiftStartTimer = 0.35;

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
  if (JD.fortuneSpinning) return PHASE_FORTUNE;
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

function jdStartFortuneSpin(selectedFood) {
  JD.fortuneSpinning = true;
  JD.fortuneTimer = 0.75;
  JD.fortuneDuration = 0.75;
  JD.fortuneSelected = selectedFood;
  JD.fortuneDisplayName = selectedFood ? selectedFood.name : "CHERRY";
  JD.fortunePickedTimer = 0;
  jdSetGamePhase(PHASE_FORTUNE);
  jdSetCameraClose(false);
}

function jdCompleteFortuneSpin() {
  const src = JD.fortuneSelected;
  if (!src) return;

  JD.food = {
    ...src,
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

  JD.dragging = false;
  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;
  JD.fortunePickedTimer = 0.35;
  jdSetGamePhase(PHASE_AIM);
  jdSetCameraClose(false);
}

function jdUpdateFortune(dt) {
  if (JD.fortuneSpinning) {
    JD.fortuneTimer -= dt;
    if (JD.fortuneTimer > 0.16) {
      const names = JD.fortuneNames;
      const index = Math.floor(ElapsedTime * 18) % names.length;
      JD.fortuneDisplayName = names[index];
    } else if (JD.fortuneSelected) {
      JD.fortuneDisplayName = JD.fortuneSelected.name;
    }

    if (JD.fortuneTimer <= 0) jdCompleteFortuneSpin();
    return true;
  }

  if (JD.fortunePickedTimer > 0) JD.fortunePickedTimer -= dt;
  return false;
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
    const cy = JD.tableY + 58;
    const rx = 30 + pad.x * 0.25 + r * 0.75;
    const ry = 11 + pad.y * 0.20 + r * 0.55;
    const dx = f.x - cx;
    const dy = f.y - cy;
    inZone = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  } else if (t.kind === "cake") {
    const left = t.x - 44 - pad.x * 0.25;
    const right = t.x + 44 + pad.x * 0.25;
    const bottom = JD.tableY + 18;
    const top = JD.tableY + 82 + pad.y * 0.15;
    inZone = f.x + r * 0.80 > left && f.x - r * 0.80 < right && f.y + r * 0.90 > bottom && f.y - r * 0.35 < top;
  } else if (t.kind === "melon") {
    const left = t.x - 25 - pad.x * 0.12;
    const right = t.x + 25 + pad.x * 0.12;
    const bottom = JD.tableY + 24;
    const top = JD.tableY + 146 + pad.y * 0.12;
    inZone = f.x + r * 0.55 > left && f.x - r * 0.55 < right && f.y + r * 0.55 > bottom && f.y - r * 0.55 < top;
  }

  let entryOK = false;
  let reason = "ZONE OUT";
  if (inZone) {
    const entry = jdEntryDebugReason(f, t.kind);
    entryOK = entry.ok;
    reason = entry.reason;
  }

  return { target: t, inZone, entryOK, ok: inZone && entryOK, reason, speed: jdShotSpeed(f), vx: f.vx, vy: f.vy };
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
    f.x = jdClamp(f.x, t.x - 22, t.x + 22);
    f.y = jdClamp(f.y, JD.tableY + 53, JD.tableY + 64);
  } else if (t.kind === "cake") {
    if (JD.pendingCakeSasari) {
      f.x = jdClamp(f.x, t.x - 32, t.x + 32);
      f.y = jdClamp(f.y, JD.tableY + 60, JD.tableY + 74);
    } else {
      f.x = jdClamp(f.x, t.x - 36, t.x + 36);
      f.y = jdClamp(f.y, JD.tableY + 68, JD.tableY + 88);
    }
  } else if (t.kind === "melon") {
    f.x = jdClamp(f.x, t.x - 18, t.x + 18);
    f.y = jdClamp(f.y, JD.tableY + 46, JD.tableY + 126);
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
  if (target.kind === "coffee") return dx <= 6 && Math.abs(y - (JD.tableY + 58)) <= 5;
  if (target.kind === "cake") return dx <= 8 && Math.abs(y - (JD.tableY + 78)) <= 8;
  if (target.kind === "melon") return dx <= 6 && y >= JD.tableY + 72 && y <= JD.tableY + 124;
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
      jdCollideRect(t.x - 39, JD.tableY + 14, 8, 42, r, 0.52, "COFFEE_WALL_L");
      jdCollideRect(t.x + 31, JD.tableY + 14, 8, 42, r, 0.52, "COFFEE_WALL_R");
      jdCollideRect(t.x - 31, JD.tableY + 12, 62, 8, r, 0.40, "COFFEE_BOTTOM");
      jdCollideRect(t.x - 44, JD.tableY + 2, 88, 10, r, 0.38, "COFFEE_SAUCER");
    } else if (t.kind === "cake") {
      jdCollideRect(t.x - 54, JD.tableY + 18, 10, 44, r, 0.48, "CAKE_SIDE_L");
      jdCollideRect(t.x + 44, JD.tableY + 18, 10, 44, r, 0.48, "CAKE_SIDE_R");
    } else if (t.kind === "melon") {
      jdCollideRect(t.x - 35, JD.tableY + 18, 7, 120, r, 0.46, "MELON_WALL_L");
      jdCollideRect(t.x + 28, JD.tableY + 18, 7, 120, r, 0.46, "MELON_WALL_R");
      jdCollideRect(t.x - 30, JD.tableY + 8, 60, 10, r, 0.32, "MELON_BOTTOM");
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
  const t = JD.targets.find((target) => target.kind === "cake");
  if (!t) return false;
  const catchY = JD.tableY + 82;
  const crossed = prevY >= catchY && nowY <= catchY;
  if (!crossed) return false;
  const q = (prevY - catchY) / Math.max(0.0001, prevY - nowY);
  const hitX = prevX + (nowX - prevX) * q;
  if (hitX < t.x - 44 || hitX > t.x + 44) return false;
  f.x = hitX;
  f.y = catchY;
  JD.pendingCakeSasari = jdShouldCakeSasari(f);
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
  return JD.state === STATE_PLAY && JD.food && !JD.food.launched && !JD.food.resolved && !JD.fortuneSpinning && (JD.gamePhase === PHASE_AIM || JD.gamePhase === PHASE_AIMING);
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
  noStroke();
  fill(118, 76, 47);
  rect(0, 0, JD.LOGICAL_W, JD.LOGICAL_H);
  fill(92, 54, 34);
  rect(0, 0, JD.LOGICAL_W, 180);
  fill(160, 103, 59);
  rect(0, 160, JD.LOGICAL_W, 34);

  fill(255, 245, 225);
  textAlign(CENTER);
  font('"Hiragino Mincho ProN", "Yu Mincho", serif');
  fontSize(31);
  text(jdT("title.jp"), JD.LOGICAL_W / 2, 414);
  font('Courier-Bold');
  fontSize(16);
  text(jdT("title.en"), JD.LOGICAL_W / 2, 382);
  font('Courier');
  fontSize(13);
  text(jdT("title.sub"), JD.LOGICAL_W / 2, 356);
  jdDrawTinyCafePreview();
  fill(255, 255, 255, 150 + Math.sin(ElapsedTime * 5) * 70);
  font('Courier-Bold');
  fontSize(18);
  text(jdT("title.start"), JD.LOGICAL_W / 2, 104);
}

function jdDrawTinyCafePreview() {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  const y = 245;
  fill(88, 52, 34); rect(JD.LOGICAL_W / 2, y - 26, 250, 52);
  fill(245, 235, 210); ellipse(145, y + 10, 38, 18);
  fill(60, 32, 18); ellipse(145, y + 15, 35, 10);
  fill(245, 236, 225); ellipse(210, y + 10, 52, 16);
  fill(255, 245, 235); rect(210, y + 28, 38, 24);
  fill(235, 55, 70); ellipse(218, y + 43, 8);
  stroke(230, 250, 235); strokeWidth(2); noFill(); rect(270, y + 42, 36, 76);
  noStroke(); fill(66, 220, 116, 170); rect(270, y + 34, 28, 58);
  fill(255, 245, 220); ellipse(270, y + 82, 28, 18);
  fill(235, 45, 55); ellipse(278, y + 94, 7);
  fill(240, 55, 55); ellipse(82, y + 44, 15);
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

  fill(125, 80, 50); rect(0, 0, JD.worldW, JD.LOGICAL_H);
  fill(97, 59, 38, 55); rect(0, 372, JD.worldW, 3); rect(0, 302, JD.worldW, 2);
  fill(92, 55, 35); rect(0, 0, JD.worldW, JD.tableY - 28);
  fill(148, 94, 57); rect(0, JD.tableY - 14, JD.worldW, 28);
  fill(68, 40, 27); rect(0, JD.tableY - 16, JD.worldW, 4); rect(0, JD.tableY + 12, JD.worldW, 5);
  fill(70, 42, 28, 80);
  for (let x = 40; x <= JD.worldW; x += 120) rect(x, 0, 3, JD.tableY - 30);

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
    const dragWorld = jdScreenToWorldPoint(JD.dragScreenNow.x, JD.dragScreenNow.y);
    fx = dragWorld.x;
    fy = dragWorld.y;
    stroke(255, 244, 210, 220); strokeWidth(4); line(JD.launcher.x, JD.launcher.y, fx, fy); noStroke();
    jdDrawTrajectory(pull);
  }

  if (JD.food) {
    if (!(JD.food.resolved && JD.food.hideAfterResolve)) jdDrawFood(JD.food, fx, fy, 255, 1);
    if (JD.food.resolved && JD.food.label) {
      fill(255, 255, 255, 230);
      font('Courier-Bold'); fontSize(23); textAlign(CENTER);
      text(JD.food.label, JD.food.x, JD.food.y + 34);
    }
  }

  jdDrawParticles();
  jdDrawFloatTexts();
  jdDrawDebugWorld();
}

function jdDrawTarget(t) {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  fill(35, 18, 12, 60); ellipse(t.x, JD.tableY + 3, t.w + 20, 13);

  if (t.kind === "coffee") {
    fill(238, 225, 203); ellipse(t.x, JD.tableY + 8, 84, 16);
    fill(248, 237, 213); rect(t.x, JD.tableY + 35, 62, 42);
    fill(58, 31, 18); ellipse(t.x, JD.tableY + 57, 58, 18);
    stroke(94, 67, 47); strokeWidth(2); noFill(); rect(t.x, JD.tableY + 35, 62, 42); ellipse(t.x + 38, JD.tableY + 35, 20, 28);
    noStroke(); fill(255, 246, 222); font('Courier-Bold'); fontSize(9); textAlign(CENTER); text(jdT("target.coffee"), t.x, JD.tableY - 23);
  } else if (t.kind === "cake") {
    fill(246, 239, 229); ellipse(t.x, JD.tableY + 7, 92, 16);
    fill(255, 246, 235); rect(t.x, JD.tableY + 33, 62, 35);
    fill(255, 151, 169); rect(t.x, JD.tableY + 46, 62, 8);
    fill(252, 252, 248); rect(t.x, JD.tableY + 61, 62, 12);
    fill(228, 48, 62); ellipse(t.x + 9, JD.tableY + 74, 13);
    fill(255, 246, 222); font('Courier-Bold'); fontSize(9); textAlign(CENTER); text(jdT("target.cake"), t.x, JD.tableY - 23);
  } else if (t.kind === "melon") {
    stroke(230, 250, 235, 230); strokeWidth(3); noFill(); rect(t.x, JD.tableY + 76, 62, 132);
    noStroke(); fill(64, 224, 116, 178); rect(t.x, JD.tableY + 64, 50, 102);
    fill(142, 255, 176, 155); ellipse(t.x, JD.tableY + 116, 49, 16);
    fill(245, 255, 230, 160); ellipse(t.x - 13, JD.tableY + 47, 5); ellipse(t.x + 13, JD.tableY + 68, 4); ellipse(t.x - 2, JD.tableY + 92, 3);
    fill(255, 247, 220); ellipse(t.x, JD.tableY + 143, 43, 29);
    fill(236, 47, 58); ellipse(t.x + 8, JD.tableY + 160, 10);
    stroke(40, 88, 62, 230); strokeWidth(2); line(t.x + 8, JD.tableY + 164, t.x + 25, JD.tableY + 197); noStroke();
    fill(255, 246, 222); font('Courier-Bold'); fontSize(9); textAlign(CENTER); text(jdT("target.melon"), t.x, JD.tableY - 23);
  }
}

function jdDrawObstacle(o) {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  if (o.kind === "spoon") {
    stroke(222, 222, 212); strokeWidth(5); line(o.x - 32, o.y, o.x + 28, o.y + 3);
    noStroke(); fill(222, 222, 212); ellipse(o.x + 36, o.y + 5, 24, 10);
  } else if (o.kind === "ticket") {
    fill(105, 67, 43); rect(o.x, JD.tableY + 10, 36, 8);
    fill(232, 212, 174); rect(o.x, o.y, o.w, o.h);
    fill(118, 78, 52); font('Courier-Bold'); fontSize(8); textAlign(CENTER); text("BILL", o.x, o.y);
  } else if (o.kind === "coaster") {
    fill(151, 96, 57); ellipse(o.x, o.y, o.r * 2, o.r * 0.9);
    fill(112, 71, 43); ellipse(o.x, o.y + 2, o.r * 1.45, o.r * 0.48);
  }
}

function jdDrawLauncher() {
  rectMode(CENTER); ellipseMode(CENTER); noStroke();
  fill(59, 36, 28); ellipse(JD.launcher.x, JD.launcher.y, 58, 38);
  fill(26, 17, 14); ellipse(JD.launcher.x, JD.launcher.y, 40, 26);
  stroke(165, 245, 210); strokeWidth(4);
  line(JD.launcher.x + 12, JD.launcher.y + 8, JD.launcher.x - 4, JD.launcher.y - 8);
  line(JD.launcher.x - 4, JD.launcher.y - 8, JD.launcher.x - 15, JD.launcher.y - 8);
  line(JD.launcher.x + 12, JD.launcher.y - 8, JD.launcher.x - 4, JD.launcher.y + 8);
  line(JD.launcher.x - 4, JD.launcher.y + 8, JD.launcher.x - 15, JD.launcher.y + 8);
  noStroke();
}

function jdDrawFood(f, x, y, alpha = 255, scaleValue = 1) {
  pushMatrix();
  translate(x, y);
  scale(scaleValue);
  rectMode(CENTER); ellipseMode(CENTER); noStroke();
  fill(f.col.r, f.col.g, f.col.b, alpha);
  if (f.shape === "circle") {
    ellipse(0, 0, f.r * 2);
    fill(255, 255, 255, Math.floor(alpha * 0.38)); ellipse(-3, 4, 6);
  } else if (f.shape === "rect") {
    rect(0, 0, f.w, f.h);
    stroke(214, 214, 204, alpha); strokeWidth(2); noFill(); rect(0, 0, f.w, f.h); noStroke();
  } else if (f.shape === "oval") {
    ellipse(0, 0, f.w, f.h);
    fill(255, 220, 225, Math.floor(alpha * 0.45)); ellipse(-3, 4, 5);
  }
  popMatrix();
}

function jdDrawPlacedFoods() {
  for (const f of JD.placedFoods) {
    const age = ElapsedTime - (f.placedAt || 0);
    let sc = 1;
    if (age < 0.32) sc = 1 + Math.sin((age / 0.32) * Math.PI) * 0.26;
    jdDrawFood(f, f.x, f.y, f.alpha || 230, sc);
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
  fill(35, 22, 18, 180); rect(18, JD.LOGICAL_H - 86, JD.LOGICAL_W - 36, 66);
  fill(255, 243, 220); font('Courier-Bold'); fontSize(14); textAlign(CENTER);
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
    fill(255, 242, 215, 220); font('Courier-Bold'); fontSize(13); text("SHIFT START", JD.LOGICAL_W / 2, 92);
  } else if (JD.fortuneSpinning) {
    fill(255, 242, 215, 220); font('Courier-Bold'); fontSize(13); text(jdT("ui.fortuneSpin"), JD.LOGICAL_W / 2, 92);
  } else if (JD.food && !JD.food.launched && !JD.food.resolved) {
    fill(255, 242, 215, 220); font('Courier-Bold'); fontSize(13);
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
  rectMode(CENTER); ellipseMode(CENTER); textAlign(CENTER); noStroke();
  const cx = JD.LOGICAL_W / 2;
  const cy = 330;
  const active = JD.fortuneSpinning;
  const duration = JD.fortuneDuration || 0.75;
  const timer = JD.fortuneTimer || 0;
  const p = 1 - jdClamp(timer / duration, 0, 1);
  const pickedP = JD.fortunePickedTimer > 0 ? jdClamp(JD.fortunePickedTimer / 0.35, 0, 1) : 0;
  const boxPop = active ? Math.sin(Math.min(1, p * 2.2) * Math.PI) * 4 : pickedP * 3;

  fill(18, 14, 12, active ? 118 : 80); rect(cx, cy, 250, 216);
  fill(24, 15, 12, 170); rect(cx + 3, cy - 4, 166, 182 + boxPop);
  fill(132, 78, 45, 245); rect(cx, cy, 166, 182 + boxPop);
  fill(94, 52, 34, 240); rect(cx, cy - 67, 136, 34);
  fill(246, 224, 172, 245); rect(cx, cy + 66, 132, 24);
  fill(80, 42, 29, 250); font('Courier-Bold'); fontSize(12); text(jdT("fortune.title"), cx, cy + 64);
  fill(42, 24, 20, 255); ellipse(cx, cy + 10, 102, 102);
  fill(226, 205, 158, 255); ellipse(cx, cy + 10, 86, 86);
  fill(88, 50, 35, 255); ellipse(cx, cy + 10, 12, 12);

  stroke(96, 56, 40, 150); strokeWidth(2);
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 90) * Math.PI / 180;
    line(cx, cy + 10, cx + Math.cos(a) * 42, cy + 10 + Math.sin(a) * 42);
  }
  noStroke(); fill(58, 34, 26, 230); font('Courier-Bold'); fontSize(8);
  const labels = ["CHERRY", "SUGAR", "BERRY", "CHERRY", "SUGAR", "LUCK"];
  for (let i = 0; i < labels.length; i++) {
    const a = ((i) * 60 - 60) * Math.PI / 180;
    text(labels[i], cx + Math.cos(a) * 28, cy + 10 + Math.sin(a) * 28);
  }

  const spinAngle = active ? ElapsedTime * 16 + (1 - p) * 2.8 : -Math.PI / 2;
  stroke(190, 38, 42, 245); strokeWidth(4); line(cx, cy + 10, cx + Math.cos(spinAngle) * 38, cy + 10 + Math.sin(spinAngle) * 38);
  noStroke(); fill(235, 48, 58, 255); ellipse(cx, cy + 10, 10);

  const showName = JD.fortuneDisplayName || "CHERRY";
  fill(255, 248, 226, 230); font('Courier'); fontSize(10); text(active ? jdT("fortune.luckySpin") : jdT("fortune.lucky"), cx, cy - 38);
  fill(255, 255, 245, 255); font('Courier-Bold'); fontSize(active ? 18 : 20); text(showName, cx, cy - 58);
  if (!active) { fill(255, 230, 140, 220); fontSize(11); text(jdT("fortune.chin"), cx, cy - 88); }
}

function jdDrawReceipt() {
  rectMode(CORNER); ellipseMode(CENTER); noStroke();
  fill(38, 27, 23); rect(0, 0, JD.LOGICAL_W, JD.LOGICAL_H);
  const paperX = 28, paperY = 54, paperW = JD.LOGICAL_W - 56, paperH = 540;
  fill(246, 242, 228); rect(paperX, paperY, paperW, paperH);
  fill(220, 214, 198, 70); rect(paperX + paperW - 5, paperY, 5, paperH); rect(paperX, paperY, paperW, 4);

  textAlign(LEFT); fill(36, 36, 34); font('Courier'); fontSize(11);
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
    rectMode(CENTER); fill(168, 74, 50); rect(bx, by, bw, bh);
    textAlign(CENTER); fill(255, 248, 232); font('Courier-Bold'); fontSize(14); text(jdT("receipt.oneMore"), bx, by + 1);
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
