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
    background(27, 20, 18);
    jdUpdateScale();

    pushMatrix();
    pushed = true;

    translate(JD.offsetX, JD.offsetY);
    scale(JD.scale);

    if (
      JD.shake > 0
    ) {
      const duration =
        Math.max(
          0.001,
          JD.shakeDuration ||
          JD.shake
        );

      const progress =
        jdClamp(
          JD.shake /
          duration,
          0,
          1
        );

      // 最初だけ強く、すぐ静かになる
      const strength =
        (
          JD.shakeStrength ||
          3
        ) *
        progress *
        progress;

      const shakeX =
        (
          Math.random() *
          2 -
          1
        ) *
        strength;

      // 縦揺れを少し弱くし、
      // 視認性を保ちながら衝撃だけ伝える
      const shakeY =
        (
          Math.random() *
          2 -
          1
        ) *
        strength *
        0.68;

      translate(
        shakeX,
        shakeY
      );

      JD.shake =
        Math.max(
          0,
          JD.shake -
          DeltaTime
        );
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
      if (!JD.scale) {
        jdUpdateScale();
      }

      const p =
        jdToLogical(touch);

      // iOS Safariではユーザー操作内で
      // AudioContextを開始する必要がある
      if (
        touch.state === BEGAN ||
        touch.state === ENDED
      ) {
        jdEnsureAudio();
      }

      // タイトル画面
      if (
        JD.state ===
        STATE_TITLE
      ) {
        if (
          touch.state === ENDED &&
          !(JD.titleExitTimer > 0)
        ) {
          JD.titleExitDuration =
            JD.motion &&
            Number.isFinite(
              JD.motion.titleFade
            )
              ? JD.motion.titleFade
              : 0.62;

          JD.titleExitTimer =
            JD.titleExitDuration;

          jdPlaySound("open");
        }

        return;
      }

      // レシート画面
      if (
        JD.state ===
        STATE_RECEIPT
      ) {
        if (
          touch.state === ENDED &&
          jdReceiptReady() &&
          p.x >= 70 &&
          p.x <= 290 &&
          p.y >= 70 &&
          p.y <= 114
        ) {
          jdStartPlay();
        }

        return;
      }

      if (
        JD.state !==
        STATE_PLAY
      ) {
        return;
      }

      // 開店導入
      if (
        JD.gamePhase ===
        PHASE_SHIFT_START
      ) {
        if (
          touch.state ===
          ENDED
        ) {
          const duration =
            Number.isFinite(
              JD.shiftStartDuration
            )
              ? JD.shiftStartDuration
              : 7.4;

          const elapsed =
            duration -
            (
              Number.isFinite(
                JD.shiftStartTimer
              )
                ? JD.shiftStartTimer
                : duration
            );

          let nextElapsed;

          if (
            elapsed < 1.7
          ) {
            nextElapsed = 1.7;

          } else if (
            elapsed < 5.2
          ) {
            nextElapsed = 5.2;

          } else {
            nextElapsed =
              duration;
          }

          JD.shiftStartTimer =
            Math.max(
              0,
              duration -
              nextElapsed
            );
        }

        return;
      }

      if (
        jdDebugButtonHit(
          p.x,
          p.y
        ) &&
        touch.state ===
        ENDED
      ) {
        JD.debugMode =
          !JD.debugMode;

        return;
      }

      if (
        JD.gamePhase ===
        PHASE_FORTUNE
      ) {
        return;
      }

      if (
        !jdCanAcceptAimTouch()
      ) {
        return;
      }

      if (
        touch.state ===
        BEGAN
      ) {
        jdBeginAimTouch(p);

      } else if (
        touch.state ===
        MOVING
      ) {
        jdUpdateAimTouch(p);

      } else if (
        touch.state ===
          ENDED ||
        touch.state ===
          CANCELLED
      ) {
        jdReleaseAimTouch(
          p,
          touch.state ===
            CANCELLED
        );
      }

    } finally {
      jdClearPrimaryPointerIfDone(
        touch
      );
    }

  } catch (error) {
    jdShowRuntimeError(
      error,
      "touched"
    );
  }
}



function jdInitVisualTheme() {
  JD.visual = {
    // 画面外・夜の空気
    page: color(27, 20, 18),

    // ポスター・タイトル背景
    // 明るいベージュから、少し古びた紙色へ
    posterBg: color(224, 199, 158),
    posterBg2: color(203, 163, 113),

    // 店内壁
    // 新しいカフェの白壁ではなく、照明で飴色に見える壁
    wall: color(210, 178, 132),
    wallShade: color(160, 112, 73),
    wallLine: color(111, 66, 45),

    // カウンター
    // 鮮やかな緑を抑え、夜の深いモスグリーンへ
    tableTop: color(46, 77, 59),
    tableLip: color(25, 47, 39),
    tableFront: color(31, 58, 47),
    tableStripe: color(197, 169, 125),

    // 木材
    // 茶色を少し赤く、重くする
    wood: color(112, 59, 39),
    woodDark: color(57, 31, 27),

    // クリーム・紙類
    // 真っ白を避けて、生成りと古紙へ
    cream: color(239, 222, 184),
    creamWarm: color(246, 224, 180),
    paper: color(235, 219, 184),

    // 文字
    ink: color(48, 34, 29),

    // 飲食物
    coffee: color(52, 27, 21),
    coffeeLight: color(89, 50, 34),

    // メロンソーダは鮮やかさを少し抑え、
    // 暗い店内でも光って見える程度に残す
    soda: color(77, 181, 117),
    sodaLight: color(159, 222, 170),
    sodaDeep: color(38, 127, 81),

    cakeCream: color(245, 229, 203),
    cakeSponge: color(214, 164, 82),
    cakePink: color(207, 105, 119),

    // 赤は昭和ポスターの朱色寄り
    red: color(177, 48, 43),
    redDeep: color(111, 33, 34),

    // 影は真っ黒ではなく、赤みのある濃茶
    shadow: color(29, 18, 16),

    // UI
    uiPanel: color(38, 27, 24),
    uiText: color(241, 224, 188),

    // 真鍮
    gold: color(207, 166, 83),

    // ガラス・氷
    // 青白さを減らし、店内照明になじませる
    glass: color(211, 229, 210),
    glassEdge: color(227, 237, 218),
    ice: color(181, 220, 190),

    plate: color(232, 216, 179),

    // ハイライトも真っ白ではなく暖色
    highlight: color(246, 230, 190)
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

function jdEnsureAudio() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!JD.audioContext) {
    try {
      JD.audioContext =
        new AudioContextClass();

      JD.audioMaster =
        JD.audioContext.createGain();

      JD.audioMaster.gain.value =
        0.44;

      JD.audioMaster.connect(
        JD.audioContext.destination
      );

      JD.soundLastPlayed = {};
    } catch (_error) {
      JD.audioContext = null;
      JD.audioMaster = null;
      return null;
    }
  }

  if (
    JD.audioContext.state ===
    "suspended"
  ) {
    try {
      JD.audioContext.resume();
    } catch (_error) {
      // 再開できなくてもゲームは続行
    }
  }

  return JD.audioContext;
}

function jdSoundCanPlay(
  key,
  cooldown = 0.04
) {
  const now =
    jdNowMs();

  if (!JD.soundLastPlayed) {
    JD.soundLastPlayed = {};
  }

  const last =
    JD.soundLastPlayed[key] ||
    0;

  if (
    now - last <
    cooldown * 1000
  ) {
    return false;
  }

  JD.soundLastPlayed[key] =
    now;

  return true;
}

function jdPlayTone(options = {}) {
  const ctx =
    jdEnsureAudio();

  if (
    !ctx ||
    !JD.audioMaster
  ) {
    return;
  }

  const now =
    ctx.currentTime;

  const delay =
    Math.max(
      0,
      options.delay || 0
    );

  const start =
    now + delay;

  const duration =
    Math.max(
      0.025,
      options.duration || 0.10
    );

  const frequency =
    Math.max(
      40,
      options.frequency || 440
    );

  const endFrequency =
    Math.max(
      40,
      options.endFrequency ||
      frequency
    );

  const volume =
    Math.max(
      0.0001,
      options.volume || 0.08
    );

  const oscillator =
    ctx.createOscillator();

  const gain =
    ctx.createGain();

  oscillator.type =
    options.type ||
    "sine";

  oscillator.frequency.setValueAtTime(
    frequency,
    start
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    endFrequency,
    start + duration
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.008
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration
  );

  oscillator.connect(gain);
  gain.connect(JD.audioMaster);

  oscillator.start(start);
  oscillator.stop(
    start + duration + 0.02
  );
}

function jdPlayNoise(options = {}) {
  const ctx =
    jdEnsureAudio();

  if (
    !ctx ||
    !JD.audioMaster
  ) {
    return;
  }

  const duration =
    Math.max(
      0.025,
      options.duration || 0.08
    );

  const sampleCount =
    Math.max(
      1,
      Math.floor(
        ctx.sampleRate *
        duration
      )
    );

  const buffer =
    ctx.createBuffer(
      1,
      sampleCount,
      ctx.sampleRate
    );

  const data =
    buffer.getChannelData(0);

  for (
    let i = 0;
    i < sampleCount;
    i++
  ) {
    const fade =
      1 -
      i /
      sampleCount;

    data[i] =
      (
        Math.random() *
        2 -
        1
      ) *
      fade;
  }

  const source =
    ctx.createBufferSource();

  const filter =
    ctx.createBiquadFilter();

  const gain =
    ctx.createGain();

  source.buffer = buffer;

  filter.type =
    options.filterType ||
    "bandpass";

  filter.frequency.value =
    options.frequency ||
    1200;

  filter.Q.value =
    options.q ||
    0.8;

  gain.gain.value =
    options.volume ||
    0.035;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(JD.audioMaster);

  source.start(
    ctx.currentTime +
    Math.max(
      0,
      options.delay || 0
    )
  );
}

function jdPlaySound(name) {
  if (
    !jdSoundCanPlay(
      name,
      name === "receipt_print"
        ? 0.07
        : 0.04
    )
  ) {
    return;
  }

  switch (name) {
    // タイトル・開店
    case "open":
      jdPlayTone({
        frequency: 660,
        endFrequency: 880,
        duration: 0.12,
        volume: 0.055,
        type: "sine"
      });

      jdPlayTone({
        frequency: 990,
        endFrequency: 1180,
        duration: 0.16,
        volume: 0.038,
        delay: 0.08,
        type: "sine"
      });
      break;

    // Fortune登場
    case "fortune_in":
      jdPlayTone({
        frequency: 145,
        endFrequency: 205,
        duration: 0.18,
        volume: 0.055,
        type: "triangle"
      });

      jdPlayNoise({
        duration: 0.08,
        frequency: 540,
        volume: 0.022
      });
      break;

    // Fortune確定
    case "fortune_pick":
      jdPlayTone({
        frequency: 520,
        endFrequency: 520,
        duration: 0.07,
        volume: 0.065,
        type: "square"
      });

      jdPlayTone({
        frequency: 780,
        endFrequency: 720,
        duration: 0.13,
        volume: 0.042,
        delay: 0.055,
        type: "triangle"
      });
      break;

    // 素材札
    case "ticket":
      jdPlayNoise({
        duration: 0.09,
        frequency: 1750,
        q: 0.55,
        volume: 0.028
      });
      break;

    // 発射
    case "launch":
      jdPlayTone({
        frequency: 185,
        endFrequency: 95,
        duration: 0.13,
        volume: 0.075,
        type: "triangle"
      });

      jdPlayNoise({
        duration: 0.055,
        frequency: 900,
        volume: 0.026
      });
      break;

    // コーヒー成功
    case "hit_coffee":
      jdPlayTone({
        frequency: 205,
        endFrequency: 150,
        duration: 0.14,
        volume: 0.066,
        type: "sine"
      });

      jdPlayNoise({
        duration: 0.07,
        frequency: 520,
        volume: 0.018
      });
      break;

    // ケーキ成功
    case "hit_cake":
      jdPlayTone({
        frequency: 310,
        endFrequency: 245,
        duration: 0.11,
        volume: 0.060,
        type: "triangle"
      });
      break;

    // メロンソーダ成功
    case "hit_melon":
      jdPlayTone({
        frequency: 610,
        endFrequency: 840,
        duration: 0.13,
        volume: 0.052,
        type: "sine"
      });

      jdPlayTone({
        frequency: 920,
        endFrequency: 1120,
        duration: 0.10,
        volume: 0.027,
        delay: 0.07,
        type: "sine"
      });
      break;

    // ケーキへ刺さる
    case "hit_stab":
      jdPlayTone({
        frequency: 420,
        endFrequency: 165,
        duration: 0.09,
        volume: 0.068,
        type: "square"
      });

      jdPlayNoise({
        duration: 0.045,
        frequency: 1300,
        volume: 0.027
      });
      break;

    // テーブル落下
    case "drop":
      jdPlayTone({
        frequency: 120,
        endFrequency: 75,
        duration: 0.13,
        volume: 0.060,
        type: "triangle"
      });
      break;

    // 画面外
    case "out":
      jdPlayTone({
        frequency: 190,
        endFrequency: 92,
        duration: 0.23,
        volume: 0.042,
        type: "sine"
      });
      break;

    // レシートが置かれる
    case "receipt_drop":
      jdPlayNoise({
        duration: 0.15,
        frequency: 1450,
        q: 0.6,
        volume: 0.035
      });

      jdPlayTone({
        frequency: 155,
        endFrequency: 120,
        duration: 0.08,
        volume: 0.028,
        delay: 0.07,
        type: "triangle"
      });
      break;

    // 印字
    case "receipt_print":
      jdPlayTone({
        frequency: 1180,
        endFrequency: 920,
        duration: 0.035,
        volume: 0.022,
        type: "square"
      });

      jdPlayNoise({
        duration: 0.028,
        frequency: 2100,
        volume: 0.013
      });
      break;

    // THANK YOU
    case "receipt_finish":
      jdPlayTone({
        frequency: 520,
        endFrequency: 620,
        duration: 0.10,
        volume: 0.040,
        type: "sine"
      });

      jdPlayTone({
        frequency: 780,
        endFrequency: 820,
        duration: 0.12,
        volume: 0.032,
        delay: 0.09,
        type: "sine"
      });
      break;

    // 再シフトボタン
    case "button_ready":
      jdPlayTone({
        frequency: 440,
        endFrequency: 550,
        duration: 0.11,
        volume: 0.043,
        type: "triangle"
      });
      break;
  }
}


function jdPosterShadow(
  x,
  y,
  w,
  h,
  alpha = 40,
  radius = 0
) {
  noStroke();
  jdFill("shadow", alpha);

  rect(
    x + 4,
    y - 4,
    w,
    h,
    radius
  );
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
  // ==================================================
  // シフト結果
  // ==================================================

  JD.totalSales = 0;
  JD.results = [];
  JD.throwIndex = 0;

  JD.receiptTimer = 0;
  JD.receiptLines = [];

  // レシート演出はタイマーから算出するため、
  // 再シフト時に前回の途中状態を残さない。
  JD.receiptPrintLine = null;
  JD.receiptPrintStage = -1;

  // ==================================================
  // 画面上に残るオブジェクト
  // ==================================================

  JD.placedFoods = [];
  JD.particles = [];
  JD.floatTexts = [];

  // ==================================================
  // ターゲット
  // ==================================================

  JD.targets = [
    {
      id: "COFFEE",
      label: "COFFEE",
      x: 500,
      y: JD.tableY + 48,
      w: 78,
      h: 76,
      kind: "coffee",
      isLiquid: true,
      col: color(58, 31, 18)
    },
    {
      id: "CAKE",
      label: "CAKE",
      x: 310,
      y: JD.tableY + 48,
      w: 92,
      h: 74,
      kind: "cake",
      isLiquid: false,
      col: color(252, 239, 229)
    },
    {
      id: "MELON SODA",
      label: "MELON",
      x: 120,
      y: JD.tableY + 82,
      w: 66,
      h: 158,
      kind: "melon",
      isLiquid: true,
      col: color(77, 226, 116)
    }
  ];

  // ==================================================
  // 障害物
  // ==================================================

  JD.obstacles = [
    {
      kind: "spoon",
      x: 620,
      y: JD.tableY + 24,
      w: 62,
      h: 10
    },
    {
      kind: "ticket",
      x: 400,
      y: JD.tableY + 38,
      w: 18,
      h: 54
    },
    {
      kind: "coaster",
      x: 210,
      y: JD.tableY + 8,
      r: 18
    }
  ];

  // 新しいシフト用の素材順
  jdBuildFortuneQueue();

  // ==================================================
  // 現在の素材・タッチ操作
  // ==================================================

  JD.food = null;

  JD.dragging = false;
  JD.activePointerId = null;
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;

  JD.shiftStartTimer = 0.35;

  // 素材札の登場演出
  JD.itemTicketTimer = 0;

  // ==================================================
  // Fortune
  // ==================================================

  JD.pendingFood = null;
  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;
  JD.fortuneDuration = 0;
  JD.fortuneSelected = null;
  JD.fortuneDisplayName = null;
  JD.fortunePickedTimer = 0;

  // ==================================================
  // 発射軌跡・前回ショット情報
  // ==================================================

  JD.lastTrail = null;
  JD.currentTrail = null;
  JD.lastTrailResult = "-";
  JD.trailTick = 0;

  JD.lastPowerRatio = 0;
  JD.lastAngleName = "-";

  // ==================================================
  // 衝突・連続反射の履歴
  // ==================================================

  JD.lastBounceInfo = null;
  JD.bounceChain = 0;
  JD.stuckBounceTimer = 0;
  JD.pendingCakeSasari = false;

  // ==================================================
  // 命中・ズーム演出
  // ==================================================

  JD.hitEffectTimer = 0;
  JD.hitEffectDuration = 0;
  JD.hitEffectX = 0;
  JD.hitEffectY = 0;
  JD.hitEffectLabel = null;
  JD.hitEffectKind = null;
  JD.hitEffectPerfect = false;

  JD.perfectZoomActive = false;
  JD.hitZoomTimer = 0;
  JD.hitZoomX = 0;
  JD.hitZoomY = 0;
  JD.hitZoomLevel = 1;

  // ==================================================
  // その他の一時演出
  // ==================================================

  JD.shake = 0;
  JD.shakeDuration = 0;
  JD.shakeStrength = 0;
  JD.hitStopTimer = 0;

  // シフト内の一度きり効果音を初期化
  JD.itemTicketSoundPlayed = false;
  JD.soundLastPlayed = {};

  // 初期カメラへ戻す
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

  JD.state =
    STATE_PLAY;

  jdSetGamePhase(
    PHASE_SHIFT_START
  );

  // ==================================================
  // 純喫茶ダイヴ共通の「呼吸」
  //
  // short  : 小さな札・UIの出入り
  // medium : 画面・カメラ・紙の移動
  // hold   : 内容を読ませる時間
  // ==================================================

  JD.motion = {
    short: 0.46,
    medium: 0.68,
    hold: 1.10,

    titleFade: 0.62,
    shiftFade: 0.68,
    shiftDuration: 7.40,

    fortuneSpin: 1.15,
    fortuneEnter: 0.46,
    fortuneExit: 0.46,
    fortuneHold: 1.10,

    itemTicketEnter: 0.46,

    hitNormal: 0.74,
    hitPerfect: 0.90,
    hitResultNormal: 1.02,
    hitResultPerfect: 1.18,

    receiptBackdrop: 0.78,
    receiptDropDelay: 0.08,
    receiptDrop: 0.62,
    receiptButtonDelay: 0.78
  };

  // 開店導入
  JD.shiftStartDuration =
    JD.motion.shiftDuration;

  JD.shiftStartTimer =
    JD.shiftStartDuration;

  JD.shiftFadeInDuration =
    JD.motion.shiftFade;

  JD.shiftFadeInTimer =
    JD.shiftFadeInDuration;

  // 前回のタイトル・導入演出を初期化
  JD.titleExitTimer = 0;
  JD.titleExitDuration = 0;

  // 前回の素材札演出を初期化
  JD.itemTicketTimer = 0;

  // 前回のFortune表示状態を初期化
  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;
  JD.fortuneDuration = 0;
  JD.fortunePickedTimer = 0;
  JD.fortuneDisplayName = null;
  JD.fortuneSelected = null;
  JD.pendingFood = null;

  // 前回の結果画面演出を初期化
  JD.receiptTimer = 0;

  // 店内全景から開始
  JD.cam.x = 515;
  JD.cam.y = 285;
  JD.cam.zoom = 0.42;

  JD.cam.tx = 515;
  JD.cam.ty = 285;
  JD.cam.tz = 0.42;
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
  JD.pendingFood =
    selectedFood
      ? jdCloneFoodDef(
          selectedFood
        )
      : null;

  JD.food = null;
  JD.dragging = false;
  JD.dragScreenStart = null;
  JD.dragScreenNow = null;

  const spinDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.fortuneSpin
    )
      ? JD.motion.fortuneSpin
      : 1.15;

  JD.fortuneSpinning = true;
  JD.fortuneTimer =
    spinDuration;

  JD.fortuneDuration =
    spinDuration;

  JD.fortuneSelected =
    JD.pendingFood;

  JD.fortuneDisplayName =
    JD.pendingFood
      ? JD.pendingFood.name
      : "CHERRY";

  JD.fortunePickedTimer = 0;

  jdPlaySound(
    "fortune_in"
  );

  jdSetGamePhase(
    PHASE_FORTUNE
  );

  jdSetCameraClose(false);
}


function jdCompleteFortuneSpin() {
  const src =
    JD.pendingFood ||
    JD.fortuneSelected ||
    JD.queue[
      Math.max(
        0,
        JD.throwIndex - 1
      )
    ] ||
    null;

  JD.fortuneSpinning = false;
  JD.fortuneTimer = 0;

  // 確定結果を一呼吸見せてから退場
  JD.fortunePickedTimer =
    JD.motion &&
    Number.isFinite(
      JD.motion.fortuneHold
    )
      ? JD.motion.fortuneHold
      : 1.10;

  JD.fortuneSelected = src;

  jdPlaySound(
    "fortune_pick"
  );

  if (!src) {
    JD.pendingFood = null;

    jdSetGamePhase(
      PHASE_AIM
    );

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

  jdSetGamePhase(
    PHASE_AIM
  );

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

  if (
    !Number.isFinite(
      JD.fortuneTimer
    )
  ) {
    JD.fortuneTimer =
      JD.motion &&
      Number.isFinite(
        JD.motion.fortuneSpin
      )
        ? JD.motion.fortuneSpin
        : 1.15;
  }
  JD.fortuneTimer -= dt;

  const names = JD.fortuneNames;
  if (JD.fortuneTimer > 0.24) {
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
  if (
    JD.state ===
    STATE_TITLE
  ) {
    if (
      JD.titleExitTimer > 0
    ) {
      JD.titleExitTimer -=
        dt;

      if (
        JD.titleExitTimer <=
        0
      ) {
        JD.titleExitTimer =
          0;

        jdStartPlay();
      }
    }

    return;
  }

  if (
    JD.state ===
    STATE_PLAY
  ) {
    if (
      JD.gamePhase ===
      PHASE_SHIFT_START
    ) {
      if (
        !Number.isFinite(
          JD.shiftStartDuration
        )
      ) {
        JD.shiftStartDuration =
          7.4;
      }

      if (
        !Number.isFinite(
          JD.shiftStartTimer
        )
      ) {
        JD.shiftStartTimer =
          JD.shiftStartDuration;
      }

      JD.shiftStartTimer -=
        dt;

      if (
        JD.shiftStartTimer <=
        0
      ) {
        JD.shiftStartTimer =
          0;

        jdNextFood();
      }

      return;
    }

    jdUpdatePlay(dt);
    jdSyncGamePhase();

  } else if (
    JD.state ===
    STATE_RECEIPT
  ) {
    jdUpdateReceipt(dt);
  }
}



function jdUpdatePlay(dt) {
  // 命中直後だけ世界を短く止める。
  // UIやレシートでは使わず、成功時だけの手応えに限定。
  if (
    JD.hitStopTimer > 0
  ) {
    JD.hitStopTimer =
      Math.max(
        0,
        JD.hitStopTimer -
        dt
      );

    return;
  }

  jdUpdateParticles(dt);
  jdUpdateFloatTexts(dt);

  if (
    jdUpdateFortune(dt)
  ) {
    return;
  }

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
    jdSpawnSplash(
      f.x,
      f.y,
      t.isLiquid
        ? t.col
        : color(
            255,
            235,
            220
          ),
      t.kind,
      cakeSasari
    );
    if (
      cakeSasari
    ) {
      // 刺さった瞬間は短く鋭い
      JD.shake = 0.085;
      JD.shakeDuration = 0.085;
      JD.shakeStrength = 5.2;

    } else if (
      JD.hitEffectPerfect
    ) {
      // PERFECTは強いが長引かせない
      JD.shake = 0.095;
      JD.shakeDuration = 0.095;
      JD.shakeStrength = 5.8;

    } else if (
      t.kind === "melon"
    ) {
      JD.shake = 0.075;
      JD.shakeDuration = 0.075;
      JD.shakeStrength = 4.0;

    } else if (
      t.kind === "coffee"
    ) {
      JD.shake = 0.070;
      JD.shakeDuration = 0.070;
      JD.shakeStrength = 3.4;

    } else {
      // ケーキへの通常着地
      JD.shake = 0.060;
      JD.shakeDuration = 0.060;
      JD.shakeStrength = 2.8;
    }
  }

  if (
    res.type === "OUT"
  ) {
    jdPlaySound("out");

  } else if (
    res.type === "FLOOR"
  ) {
    jdPlaySound("drop");

  } else if (
    res.type === "STAB"
  ) {
    jdPlaySound("hit_stab");

  } else if (
    t &&
    t.kind === "coffee"
  ) {
    jdPlaySound("hit_coffee");

  } else if (
    t &&
    t.kind === "cake"
  ) {
    jdPlaySound("hit_cake");

  } else if (
    t &&
    t.kind === "melon"
  ) {
    jdPlaySound("hit_melon");
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
  let label =
    JD.food &&
    JD.food.label
      ? JD.food.label
      : "GOOD!";

  const perfect =
    jdShouldPerfectCenterHit(
      target,
      x,
      y,
      label
    );

  // 通常成功は約2〜3フレーム、
  // PERFECTは約4フレームだけ止める
  JD.hitStopTimer =
    perfect
      ? 0.064
      : 0.042;

  const normalDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.hitNormal
    )
      ? JD.motion.hitNormal
      : 0.74;

  const perfectDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.hitPerfect
    )
      ? JD.motion.hitPerfect
      : 0.90;

  JD.hitEffectTimer =
    perfect
      ? perfectDuration
      : normalDuration;

  JD.hitEffectDuration =
    JD.hitEffectTimer;

  JD.hitEffectX = x;
  JD.hitEffectY = y;
  JD.hitEffectLabel = label;

  JD.hitEffectKind =
    target
      ? target.kind
      : "hit";

  JD.hitEffectPerfect =
    perfect;

  if (JD.food) {
    JD.food.resultLabel =
      label;

    JD.food.label = "";

    const normalResult =
      JD.motion &&
      Number.isFinite(
        JD.motion.hitResultNormal
      )
        ? JD.motion.hitResultNormal
        : 1.02;

    const perfectResult =
      JD.motion &&
      Number.isFinite(
        JD.motion.hitResultPerfect
      )
        ? JD.motion.hitResultPerfect
        : 1.18;

    JD.food.resultTimer =
      Math.max(
        JD.food.resultTimer || 0,
        perfect
          ? perfectResult
          : normalResult
      );
  }

  if (perfect) {
    JD.perfectZoomActive = true;

    JD.hitZoomTimer =
      JD.motion &&
      Number.isFinite(
        JD.motion.medium
      )
        ? JD.motion.medium
        : 0.68;

    JD.hitZoomX = x;
    JD.hitZoomY = y;

    JD.hitZoomLevel =
      jdPerfectZoomLevel(
        target
      );

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
  JD.shake = 0.055;
  JD.shakeDuration = 0.055;
  JD.shakeStrength =
    1.6 +
    JD.lastPowerRatio *
    1.5;

  jdPlaySound(
    "launch"
  );

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

  rect(
    0,
    0,
    JD.LOGICAL_W,
    JD.LOGICAL_H
  );

  jdFill(
    "posterBg2",
    70
  );

  rect(
    0,
    0,
    JD.LOGICAL_W,
    148
  );

  jdFill(
    "tableTop",
    235
  );

  rect(
    0,
    0,
    JD.LOGICAL_W,
    138
  );

  jdFill(
    "tableLip",
    235
  );

  rect(
    0,
    134,
    JD.LOGICAL_W,
    9
  );

  jdFill(
    "red",
    230
  );

  rect(
    0,
    458,
    JD.LOGICAL_W,
    10
  );

  jdFill(
    "wood",
    85
  );

  rect(
    0,
    470,
    JD.LOGICAL_W,
    4
  );

  // ポスターの登録点
  jdFill(
    "redDeep",
    175
  );

  ellipse(
    38,
    532,
    8,
    8
  );

  ellipse(
    JD.LOGICAL_W - 38,
    532,
    8,
    8
  );

  jdDrawTinyCafePreview();

  fill(
    60,
    42,
    31,
    245
  );

  textAlign(CENTER);

  font(
    '"Hiragino Mincho ProN", "Yu Mincho", serif'
  );

  fontSize(31);

  text(
    "純喫茶ダイヴ",
    JD.LOGICAL_W / 2,
    414
  );

  jdFill(
    "redDeep",
    230
  );

  font("Courier-Bold");
  fontSize(16);

  text(
    "JUNKISSA DIVE",
    JD.LOGICAL_W / 2,
    382
  );

  fill(
    84,
    62,
    48,
    220
  );

  font(
    '"Hiragino Mincho ProN", "Yu Mincho", serif'
  );

  fontSize(12);

  text(
    "喫茶店の一日を、指先で。",
    JD.LOGICAL_W / 2,
    356
  );

  const pulse =
    150 +
    Math.sin(
      ElapsedTime * 4.6
    ) * 48;

  jdFill(
    "uiPanel",
    218
  );

  rectMode(CENTER);

  rect(
    JD.LOGICAL_W / 2,
    104,
    182,
    40,
    18
  );

  jdFill(
    "uiText",
    pulse
  );

  font(
    '"Hiragino Mincho ProN", "Yu Mincho", serif'
  );

  fontSize(15);

  text(
    "タップして開店",
    JD.LOGICAL_W / 2,
    104
  );

  // タップ後の暗転
  if (
    JD.titleExitTimer > 0
  ) {
    const duration =
      Number.isFinite(
        JD.titleExitDuration
      )
        ? JD.titleExitDuration
        : 0.58;

    const progress =
      1 -
      jdClamp(
        JD.titleExitTimer /
          duration,
        0,
        1
      );

    rectMode(CORNER);
    noStroke();

    fill(
      24,
      17,
      15,
      255 * progress
    );

    rect(
      -80,
      -80,
      JD.LOGICAL_W + 160,
      JD.LOGICAL_H + 160
    );
  }
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
  jdUpdateCamera(
    DeltaTime
  );

  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  fill(
    31,
    23,
    20
  );

  rect(
    -60,
    -60,
    JD.LOGICAL_W + 120,
    JD.LOGICAL_H + 120
  );

  pushMatrix();

  jdApplyCamera();
  jdDrawCafeWideBackdrop();
  jdDrawWorld();

  popMatrix();

  jdDrawPlayUI();
  jdDrawShotMeter();
  jdDrawDebugScreen();
  jdDrawFortuneMachine();

  if (
    JD.gamePhase !==
    PHASE_SHIFT_START
  ) {
    return;
  }

  const duration =
    Number.isFinite(
      JD.shiftStartDuration
    )
      ? JD.shiftStartDuration
      : 7.4;

  const timer =
    Number.isFinite(
      JD.shiftStartTimer
    )
      ? JD.shiftStartTimer
      : duration;

  const elapsed =
    duration - timer;

  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  textAlign(CENTER);

  // タイトルから喫茶店へのフェードイン
  if (
    JD.shiftFadeInTimer > 0
  ) {
    JD.shiftFadeInTimer =
      Math.max(
        0,
        JD.shiftFadeInTimer -
          DeltaTime
      );
  }

  const fadeDuration =
    Number.isFinite(
      JD.shiftFadeInDuration
    )
      ? JD.shiftFadeInDuration
      : 0.72;

  const fadeAlpha =
    JD.shiftFadeInTimer > 0
      ? 255 *
        jdClamp(
          JD.shiftFadeInTimer /
            fadeDuration,
          0,
          1
        )
      : 0;

  // 導入中の暖色暗幕
  let veilAlpha = 50;

  if (
    elapsed < 0.45
  ) {
    veilAlpha =
      50 *
      (
        elapsed /
        0.45
      );

  } else if (
    elapsed > 6.45
  ) {
    veilAlpha =
      50 *
      jdClamp(
        (
          7.25 -
          elapsed
        ) / 0.8,
        0,
        1
      );
  }

  fill(
    39,
    27,
    22,
    veilAlpha
  );

  rect(
    JD.LOGICAL_W / 2,
    JD.LOGICAL_H / 2,
    JD.LOGICAL_W + 180,
    JD.LOGICAL_H + 180
  );

  if (
    fadeAlpha > 0
  ) {
    fill(
      24,
      17,
      15,
      fadeAlpha
    );

    rect(
      JD.LOGICAL_W / 2,
      JD.LOGICAL_H / 2,
      JD.LOGICAL_W + 200,
      JD.LOGICAL_H + 200
    );
  }

  // -----------------------------------------------
  // 開店
  // -----------------------------------------------

  if (
    elapsed < 1.85
  ) {
    const enterT =
      jdClamp(
        elapsed / 0.42,
        0,
        1
      );

    const lifeT =
      jdClamp(
        elapsed / 1.85,
        0,
        1
      );

    const alpha =
      245 *
      Math.sin(
        lifeT *
        Math.PI
      );

    const scaleIn =
      0.94 +
      0.06 *
      (
        1 -
        Math.pow(
          1 - enterT,
          3
        )
      );

    pushMatrix();

    translate(
      JD.LOGICAL_W / 2,
      348
    );

    scale(
      scaleIn
    );

    jdFill(
      "shadow",
      34 * enterT
    );

    rect(
      4,
      -4,
      154,
      58,
      6
    );

    jdFill(
      "paper",
      240 * enterT
    );

    rect(
      0,
      0,
      154,
      58,
      6
    );

    jdFill(
      "redDeep",
      alpha
    );

    font(
      '"Hiragino Mincho ProN", "Yu Mincho", serif'
    );

    fontSize(25);

    text(
      "開店",
      0,
      7
    );

    jdFill(
      "ink",
      alpha * 0.72
    );

    font("Courier");
    fontSize(8);

    text(
      "本日のシフトを始めます",
      0,
      -16
    );

    popMatrix();
  }

  // -----------------------------------------------
  // 本日の注文票
  // -----------------------------------------------

  if (
    elapsed >= 1.45 &&
    elapsed < 5.45
  ) {
    const enterT =
      jdClamp(
        (
          elapsed -
          1.45
        ) / 0.42,
        0,
        1
      );

    const leaveT =
      jdClamp(
        (
          5.45 -
          elapsed
        ) / 0.48,
        0,
        1
      );

    const alpha =
      Math.min(
        enterT,
        leaveT
      );

    const cardY =
      342 +
      (
        1 -
        enterT
      ) * 16;

    const cardW = 218;
    const cardH = 172;

    jdFill(
      "shadow",
      40 * alpha
    );

    rect(
      JD.LOGICAL_W / 2 + 4,
      cardY - 4,
      cardW,
      cardH,
      6
    );

    jdFill(
      "paper",
      244 * alpha
    );

    rect(
      JD.LOGICAL_W / 2,
      cardY,
      cardW,
      cardH,
      6
    );

    jdFill(
      "redDeep",
      185 * alpha
    );

    rect(
      JD.LOGICAL_W / 2,
      cardY + 70,
      cardW - 18,
      3,
      2
    );

    jdFill(
      "ink",
      235 * alpha
    );

    font(
      '"Hiragino Mincho ProN", "Yu Mincho", serif'
    );

    fontSize(17);

    text(
      "本日のご注文",
      JD.LOGICAL_W / 2,
      cardY + 48
    );

    jdFill(
      "ink",
      160 * alpha
    );

    font("Courier");
    fontSize(8);

    text(
      "月曜日のシフト",
      JD.LOGICAL_W / 2,
      cardY + 29
    );

    jdFill(
      "ink",
      62 * alpha
    );

    for (
      let x =
        JD.LOGICAL_W / 2 - 88;
      x <=
        JD.LOGICAL_W / 2 + 88;
      x += 8
    ) {
      rect(
        x,
        cardY + 15,
        4,
        1
      );
    }

    textAlign(LEFT);

    jdFill(
      "ink",
      225 * alpha
    );

    font("Courier-Bold");
    fontSize(11);

    text(
      "・コーヒー",
      JD.LOGICAL_W / 2 - 72,
      cardY - 7
    );

    text(
      "・ケーキ",
      JD.LOGICAL_W / 2 - 72,
      cardY - 30
    );

    text(
      "・メロンソーダ",
      JD.LOGICAL_W / 2 - 72,
      cardY - 53
    );

    textAlign(RIGHT);

    jdFill(
      "redDeep",
      220 * alpha
    );

    fontSize(12);

    text(
      "全5回",
      JD.LOGICAL_W / 2 + 76,
      cardY - 53
    );

    textAlign(CENTER);
  }

  // 「カウンターへどうぞ」は表示しない
  rectMode(CORNER);
}



function jdDrawCafeWideBackdrop() {
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  const left = -180;
  const width = JD.worldW + 360;

  // ==================================================
  // 店全体の基礎背景
  // ==================================================

  // カウンター下まで続く店内
  jdFill("tableFront");
  rect(
    left,
    -520,
    width,
    JD.tableY + 40
  );

  // 高い店内壁
  jdFill("wall");
  rect(
    left,
    JD.tableY,
    width,
    960
  );

  // 壁上部をわずかに暗くし、
  // 照明が落ちる場所との明暗差を作る
  jdFill("wallShade", 24);
  rect(
    left,
    640,
    width,
    470
  );

  // 天井付近だけをもう一段暗くする。
  // 下側の広い余白は明るく残し、料理と軌道を見やすくする。
  jdFill("woodDark", 12);
  rect(
    left,
    900,
    width,
    210
  );

  // 壁の見切り
  jdFill("redDeep", 135);
  rect(
    left,
    540,
    width,
    6
  );

  jdFill("wallLine", 42);
  rect(
    left,
    531,
    width,
    2
  );

  // ==================================================
  // 左上：静かな遠い夜景
  // ==================================================

  const windowX = 88;
  const windowY = 690;
  const windowW = 300;
  const windowH = 250;

  // 窓の影
  jdFill("shadow", 60);
  rect(
    windowX + 7,
    windowY - 7,
    windowW,
    windowH,
    8
  );

  // 木枠
  jdFill("woodDark");
  rect(
    windowX,
    windowY,
    windowW,
    windowH,
    7
  );

  // 夜空
  fill(29, 36, 52);
  rect(
    windowX + 14,
    windowY + 14,
    windowW - 28,
    windowH - 28,
    3
  );

  // 夜空の淡い層
  fill(42, 46, 60, 150);
  rect(
    windowX + 14,
    windowY + 94,
    windowW - 28,
    55
  );

  fill(53, 51, 59, 105);
  rect(
    windowX + 14,
    windowY + 48,
    windowW - 28,
    47
  );

  // 遠くの建物群
  fill(23, 26, 34, 245);

  rect(
    windowX + 20,
    windowY + 20,
    48,
    76
  );

  rect(
    windowX + 65,
    windowY + 20,
    66,
    105
  );

  rect(
    windowX + 126,
    windowY + 20,
    42,
    68
  );

  rect(
    windowX + 164,
    windowY + 20,
    72,
    118
  );

  rect(
    windowX + 231,
    windowY + 20,
    37,
    84
  );

  // 遠くの灯りを少数だけ置く
  fill(235, 198, 120, 150);

  rect(
    windowX + 82,
    windowY + 78,
    10,
    13,
    1
  );

  rect(
    windowX + 109,
    windowY + 52,
    9,
    12,
    1
  );

  rect(
    windowX + 182,
    windowY + 92,
    10,
    14,
    1
  );

  rect(
    windowX + 215,
    windowY + 58,
    9,
    12,
    1
  );

  fill(178, 211, 199, 95);

  rect(
    windowX + 41,
    windowY + 53,
    8,
    11,
    1
  );

  rect(
    windowX + 247,
    windowY + 68,
    8,
    12,
    1
  );

  // 遠い町の水平線
  fill(18, 22, 29, 230);
  rect(
    windowX + 14,
    windowY + 20,
    windowW - 28,
    15
  );

  // 窓桟
  jdFill("wood");
  rect(
    windowX + windowW / 2 - 5,
    windowY + 8,
    10,
    windowH - 16
  );

  rect(
    windowX + 8,
    windowY + 121,
    windowW - 16,
    10
  );

  // ガラスの反射は控えめに
  jdFill("highlight", 18);

  rect(
    windowX + 35,
    windowY + 155,
    4,
    55,
    3
  );

  rect(
    windowX + 181,
    windowY + 160,
    3,
    43,
    3
  );

  // ==================================================
  // 中央：古い壁時計
  // ==================================================

  const clockX = 510;
  const clockY = 795;

  // 時計本体と同じ輪郭の切り絵影
  jdFill("shadow", 42);
  ellipse(
    clockX + 4,
    clockY - 4,
    92,
    92
  );

  jdFill("woodDark");
  ellipse(
    clockX,
    clockY,
    92,
    92
  );

  jdFill("creamWarm");
  ellipse(
    clockX,
    clockY,
    74,
    74
  );

  jdStroke("ink", 190);
  strokeWidth(3);

  line(
    clockX,
    clockY,
    clockX - 4,
    clockY + 25
  );

  line(
    clockX,
    clockY,
    clockX + 20,
    clockY + 8
  );

  strokeWidth(2);

  line(
    clockX,
    clockY + 31,
    clockX,
    clockY + 25
  );

  line(
    clockX + 31,
    clockY,
    clockX + 25,
    clockY
  );

  line(
    clockX,
    clockY - 31,
    clockX,
    clockY - 25
  );

  line(
    clockX - 31,
    clockY,
    clockX - 25,
    clockY
  );

  noStroke();

  jdFill("redDeep");
  ellipse(
    clockX,
    clockY,
    7
  );

  // ==================================================
  // 右上：メニューボード
  // ==================================================

  const menuX = 650;
  const menuY = 690;
  const menuW = 245;
  const menuH = 220;

  // 黒板本体と同じ輪郭の切り絵影
  jdFill("shadow", 44);
  rect(
    menuX + 4,
    menuY - 4,
    menuW,
    menuH,
    7
  );

  jdFill("woodDark");
  rect(
    menuX,
    menuY,
    menuW,
    menuH,
    7
  );

  fill(44, 55, 48);
  rect(
    menuX + 12,
    menuY + 12,
    menuW - 24,
    menuH - 24,
    3
  );

  textAlign(CENTER);

  jdFill("creamWarm", 220);
  font("Courier-Bold");
  fontSize(18);

  text(
    "TODAY'S MENU",
    menuX + menuW / 2,
    menuY + 176
  );

  jdFill("creamWarm", 165);
  font("Courier");
  fontSize(12);

  text(
    "COFFEE ........ 500",
    menuX + menuW / 2,
    menuY + 138
  );

  text(
    "MELON SODA .... 600",
    menuX + menuW / 2,
    menuY + 108
  );

  text(
    "CAKE .......... 650",
    menuX + menuW / 2,
    menuY + 78
  );

  jdFill("red", 190);
  font("Courier-Bold");
  fontSize(11);

  text(
    "SPECIAL : DIVE",
    menuX + menuW / 2,
    menuY + 42
  );

  // ==================================================
  // 天井とペンダントライト
  // ==================================================

  jdFill("woodDark");
  rect(
    left,
    1015,
    width,
    34
  );

  jdFill("wood", 110);
  rect(
    left,
    1011,
    width,
    5
  );

  const lightXs = [
    245,
    600,
    855
  ];

  for (const lx of lightXs) {
    jdStroke("woodDark", 210);
    strokeWidth(4);

    line(
      lx,
      1018,
      lx,
      930
    );

    noStroke();

    // 壁へ落ちる暖かな光。
    // 輪郭の強い円ではなく、下へ広がる層として描く。
    fill(255, 221, 158, 9);
    ellipse(
      lx,
      770,
      270,
      330
    );

    fill(255, 224, 164, 13);
    ellipse(
      lx,
      820,
      220,
      250
    );

    fill(255, 229, 176, 18);
    ellipse(
      lx,
      865,
      148,
      142
    );

    fill(255, 237, 196, 23);
    ellipse(
      lx,
      894,
      86,
      70
    );

    // シェードの下だけを少し明るくして、
    // 電球が灯っていることを伝える
    fill(255, 230, 177, 26);
    ellipse(
      lx,
      902,
      54,
      34
    );

    // 赤茶色のシェード
    jdFill("redDeep");
    ellipse(
      lx,
      920,
      69,
      31
    );

    // シェード上部の金具
    jdFill("woodDark", 230);
    rect(
      lx - 6,
      919,
      12,
      19,
      4
    );

    // 暖色の電球
    jdFill("creamWarm", 245);
    ellipse(
      lx,
      906,
      26,
      13
    );

    // 電球中心の小さなハイライト
    jdFill("highlight", 135);
    ellipse(
      lx - 3,
      909,
      9,
      5
    );
  }

  // ==================================================
  // 下側：カウンター収納
  // ==================================================

  const cabinetTop = 118;
  const cabinetBottom = -250;
  const cabinetH =
    cabinetTop -
    cabinetBottom;

  jdFill("tableFront");
  rect(
    left,
    cabinetBottom,
    width,
    cabinetH
  );

  jdFill("tableLip");
  rect(
    left,
    cabinetTop - 12,
    width,
    13
  );

  jdFill("tableStripe", 48);
  rect(
    left,
    cabinetTop - 18,
    width,
    4
  );

  // 収納扉だけを整然と並べる
  for (
    let x = -95;
    x < JD.worldW + 90;
    x += 165
  ) {
    jdFill("tableLip", 110);
    rect(
      x + 8,
      cabinetBottom + 22,
      141,
      cabinetH - 54,
      7
    );

    jdFill("tableTop", 165);
    rect(
      x + 15,
      cabinetBottom + 29,
      127,
      cabinetH - 68,
      5
    );

    noFill();
    jdStroke("tableStripe", 36);
    strokeWidth(3);

    rect(
      x + 28,
      cabinetBottom + 47,
      101,
      cabinetH - 104,
      4
    );

    noStroke();

    jdFill("gold", 190);
    ellipse(
      x + 78,
      cabinetBottom + cabinetH - 63,
      16,
      8
    );
  }

  // ==================================================
  // 足元の床
  // ==================================================

  const floorTop =
    cabinetBottom;

  fill(46, 37, 34);
  rect(
    left,
    -520,
    width,
    floorTop + 520
  );

  const tile = 72;

  for (
    let row = 0;
    row < 4;
    row++
  ) {
    for (
      let col = -3;
      col < 18;
      col++
    ) {
      const tx =
        col * tile;

      const ty =
        -520 +
        row * tile;

      if (
        (row + col) % 2 === 0
      ) {
        fill(67, 55, 49);
      } else {
        fill(39, 46, 43);
      }

      rect(
        tx,
        ty,
        tile,
        tile
      );
    }
  }

  stroke(
    236,
    218,
    184,
    24
  );

  strokeWidth(2);

  for (
    let x = -216;
    x <= JD.worldW + 216;
    x += tile
  ) {
    line(
      x,
      -520,
      x,
      floorTop
    );
  }

  for (
    let y = -520;
    y <= floorTop;
    y += tile
  ) {
    line(
      left,
      y,
      left + width,
      y
    );
  }

  noStroke();

  // ==================================================
  // 中央下：丸椅子
  // ==================================================

  // 床との接地影。
  // 椅子の脚より先に描き、空間に置かれている感覚を出す。
  jdFill("shadow", 42);
  ellipse(
    494,
    -307,
    178,
    25
  );

  jdFill("shadow", 22);
  ellipse(
    494,
    -302,
    112,
    13
  );

  jdStroke("woodDark", 235);
  strokeWidth(9);

  line(
    466,
    -40,
    425,
    -298
  );

  line(
    522,
    -40,
    560,
    -298
  );

  jdStroke("gold", 115);
  strokeWidth(4);

  line(
    438,
    -224,
    548,
    -224
  );

  noStroke();

  jdFill("redDeep");
  ellipse(
    494,
    -21,
    142,
    36
  );

  jdFill("woodDark", 215);
  ellipse(
    494,
    -17,
    118,
    24
  );
}




function jdDrawWorld() {
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  // 端末比率やズームアウト量が変わっても、
  // 背景とテーブルの端が画面内へ出ないよう左右に延長する
  const visualLeft = -360;
  const visualRight = JD.worldW + 360;
  const visualWidth =
    visualRight -
    visualLeft;

  // Poster-like cafe wall
  jdFill("wall");
  rect(
    visualLeft,
    0,
    visualWidth,
    JD.LOGICAL_H
  );

  jdFill("wallShade", 32);
  rect(
    visualLeft,
    372,
    visualWidth,
    112
  );

  jdFill("redDeep", 150);
  rect(
    visualLeft,
    374,
    visualWidth,
    5
  );

  jdFill("wallLine", 55);
  rect(
    visualLeft,
    304,
    visualWidth,
    2
  );

  rect(
    visualLeft,
    446,
    visualWidth,
    2
  );

  // quiet poster grain / cafe panels
  jdFill("highlight", 18);

  for (
    let x = visualLeft + 30;
    x <= visualRight;
    x += 120
  ) {
    rect(
      x,
      JD.tableY + 84,
      54,
      126,
      18
    );
  }

  // table front and top
  jdFill("tableFront");
  rect(
    visualLeft,
    0,
    visualWidth,
    JD.tableY - 30
  );

  jdFill("tableTop");
  rect(
    visualLeft,
    JD.tableY - 16,
    visualWidth,
    32
  );

  jdFill("tableLip");
  rect(
    visualLeft,
    JD.tableY - 18,
    visualWidth,
    5
  );

  rect(
    visualLeft,
    JD.tableY + 11,
    visualWidth,
    6
  );

  jdFill("tableStripe", 20);

  for (
    let x = visualLeft + 40;
    x <= visualRight;
    x += 118
  ) {
    rect(
      x,
      0,
      4,
      JD.tableY - 32
    );
  }

  jdDrawLastShotGhost();
  for (const t of JD.targets) {
    jdDrawHitZone(t);
    jdDrawTarget(t);
  }
  for (const o of JD.obstacles) jdDrawObstacle(o);
  jdDrawPlacedFoods();
  jdDrawLauncher();
  jdDrawLauncherItemTicket();

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

function jdDrawPlate(
  x,
  y,
  w,
  h,
  alpha = 235
) {
  // 右下へ寄せた薄い接地影
  jdFill("shadow", 34);
  ellipse(
    x + 5,
    y - 3,
    w,
    h * 0.68
  );

  // 皿本体
  jdFill("plate", alpha);
  ellipse(
    x,
    y,
    w,
    h
  );

  // 左上だけに共通ハイライト
  jdFill("highlight", 58);
  ellipse(
    x - w * 0.14,
    y + h * 0.12,
    w * 0.46,
    h * 0.28
  );
}


function jdDrawCoffeeTarget(t) {
  // ソーサー
  jdDrawPlate(
    t.x,
    JD.tableY + 7,
    94,
    19,
    245
  );

  // カップ本体
  jdFill("creamWarm", 255);
  rect(
    t.x,
    JD.tableY + 29,
    60,
    36,
    11
  );

  // 左上の縦ハイライト
  jdFill("highlight", 62);
  rect(
    t.x - 18,
    JD.tableY + 31,
    6,
    22,
    3
  );

  // 取っ手
  jdFill("creamWarm", 240);
  ellipse(
    t.x + 35,
    JD.tableY + 28,
    18,
    25
  );

  jdFill("wall", 255);
  ellipse(
    t.x + 35,
    JD.tableY + 28,
    9,
    16
  );

  // 飲み口とコーヒー
  jdFill("creamWarm", 255);
  ellipse(
    t.x,
    JD.tableY + 43,
    66,
    15
  );

  jdFill("coffee", 255);
  ellipse(
    t.x,
    JD.tableY + 43,
    54,
    10.5
  );

  // コーヒー面の反射も左上へ統一
  jdFill("coffeeLight", 42);
  ellipse(
    t.x - 9,
    JD.tableY + 44,
    20,
    3.5
  );
}


function jdDrawCakeTarget(t) {
  jdDrawPlate(
    t.x,
    JD.tableY + 7,
    102,
    20,
    242
  );

  // 下段スポンジ
  jdFill("cakeSponge", 250);
  rect(
    t.x,
    JD.tableY + 20,
    68,
    28,
    5
  );

  // 苺クリームの細い層
  jdFill("cakePink", 215);
  rect(
    t.x,
    JD.tableY + 29,
    68,
    7,
    3
  );

  // 中央クリーム
  jdFill("cakeCream", 255);
  rect(
    t.x,
    JD.tableY + 34,
    68,
    8,
    4
  );

  // 上段スポンジ
  jdFill("cakeSponge", 245);
  rect(
    t.x,
    JD.tableY + 45,
    68,
    15,
    5
  );

  // 上部クリーム
  jdFill("cakeCream", 255);
  rect(
    t.x,
    JD.tableY + 57,
    68,
    9,
    5
  );

  // ケーキ側面にも左上の反射を一本だけ
  jdFill("highlight", 48);
  rect(
    t.x - 27,
    JD.tableY + 34,
    5,
    44,
    3
  );

  // クリーム飾りは3個に統一
  for (const dx of [-22, 0, 22]) {
    jdFill("cakeCream", 250);
    ellipse(
      t.x + dx,
      JD.tableY + 67,
      16,
      13
    );

    jdFill("highlight", 66);
    ellipse(
      t.x + dx - 4,
      JD.tableY + 70,
      4.5,
      3
    );
  }
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
  // グラスの脚と台
  jdFill("shadow", 32);
  ellipse(
    t.x + 5,
    JD.tableY + 1,
    72,
    12
  );

  jdFill("glass", 145);
  ellipse(
    t.x,
    JD.tableY + 5,
    56,
    14
  );

  jdFill("glass", 112);
  rect(
    t.x,
    JD.tableY + 25,
    13,
    40,
    6
  );

  jdFill("glass", 160);
  ellipse(
    t.x,
    JD.tableY + 30,
    34,
    11
  );

  // グラス本体
  jdFill("glass", 68);
  rect(
    t.x,
    JD.tableY + 80,
    66,
    126,
    15
  );

  // ガラス線は左右両方ではなく、
  // 左上側の反射を主役にする
  jdFill("glassEdge", 112);
  rect(
    t.x - 29,
    JD.tableY + 82,
    5,
    114,
    3
  );

  jdFill("glassEdge", 72);
  rect(
    t.x + 29,
    JD.tableY + 80,
    4,
    110,
    3
  );

  jdFill("glassEdge", 135);
  ellipse(
    t.x,
    JD.tableY + 143,
    62,
    19
  );

  // ソーダ
  jdFill("soda", 210);
  rect(
    t.x,
    JD.tableY + 76,
    42,
    92,
    9
  );

  // 左側だけに明るい色面を置く
  jdFill("sodaLight", 72);
  rect(
    t.x - 11,
    JD.tableY + 78,
    11,
    78,
    6
  );

  jdFill("sodaLight", 145);
  ellipse(
    t.x,
    JD.tableY + 122,
    41,
    12
  );

  jdFill("highlight", 64);
  ellipse(
    t.x - 10,
    JD.tableY + 116,
    13,
    5
  );

  // 氷は3個から2個へ整理
  jdDrawIceCube(
    t.x - 11,
    JD.tableY + 91,
    16,
    -16,
    96
  );

  jdDrawIceCube(
    t.x + 8,
    JD.tableY + 69,
    17,
    11,
    78
  );

  // 気泡も4個から2個へ
  jdFill("highlight", 170);
  ellipse(
    t.x - 13,
    JD.tableY + 62,
    3.5,
    3.5
  );

  ellipse(
    t.x + 12,
    JD.tableY + 94,
    3,
    3
  );

  // アイス
  jdFill("creamWarm", 252);
  ellipse(
    t.x,
    JD.tableY + 123,
    46,
    33
  );

  jdFill("highlight", 112);
  ellipse(
    t.x - 10,
    JD.tableY + 130,
    16,
    7
  );

  // ストローはソーダの内部から外へ
  jdStroke("redDeep", 210);
  strokeWidth(2.2);

  line(
    t.x + 5,
    JD.tableY + 86,
    t.x + 30,
    JD.tableY + 204
  );

  noStroke();
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

  // 各オブジェクト側で接地影を描くため、
  // ここにあった共通の大きな影は削除
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
    // 接地影を先に描く
    jdFill("shadow", 28);
    ellipse(
      o.x + 5,
      o.y - 4,
      77,
      6
    );

    // 柄
    jdStroke("highlight", 210);
    strokeWidth(5);

    line(
      o.x - 32,
      o.y,
      o.x + 28,
      o.y + 3
    );

    noStroke();

    // 先端
    jdFill("highlight", 215);
    ellipse(
      o.x + 36,
      o.y + 5,
      24,
      10
    );

    // 左上の小さな反射
    jdFill("creamWarm", 72);
    ellipse(
      o.x + 31,
      o.y + 7,
      10,
      3
    );

  } else if (o.kind === "ticket") {
    jdFill("shadow", 30);
    rect(
      o.x + 3,
      o.y - 3,
      o.w,
      o.h,
      3
    );

    jdFill("paper");
    rect(
      o.x,
      o.y,
      o.w,
      o.h,
      3
    );

    jdFill("red", 60);
    rect(
      o.x,
      o.y + 15,
      o.w - 5,
      4,
      2
    );

  } else if (o.kind === "coaster") {
    jdFill("shadow", 30);
    ellipse(
      o.x + 4,
      o.y - 3,
      o.r * 2.05,
      o.r * 0.62
    );

    jdFill("wood", 230);
    ellipse(
      o.x,
      o.y,
      o.r * 2.05,
      o.r * 0.62
    );

    jdFill("woodDark", 115);
    ellipse(
      o.x,
      o.y + 1,
      o.r * 1.42,
      o.r * 0.34
    );

    jdFill("highlight", 42);
    ellipse(
      o.x - 4,
      o.y + 3,
      o.r * 0.92,
      o.r * 0.15
    );
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
    !JD.fortuneSpinning &&
    !(JD.fortunePickedTimer > 0);

  const firstThrow =
    JD.throwIndex <= 1 &&
    JD.results.length === 0;

  const pulse =
    0.5 +
    0.5 * Math.sin(
      ElapsedTime * 3.2
    );

  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();

  // 初見時の柔らかな操作フォーカス
  if (ready) {
    const focusAlpha =
      firstThrow
        ? 30 + pulse * 28
        : 12 + pulse * 12;

    jdFill(
      "creamWarm",
      focusAlpha
    );

    ellipse(
      x,
      y,
      firstThrow ? 126 : 100,
      firstThrow ? 88 : 66
    );

    jdFill(
      "highlight",
      focusAlpha * 0.72
    );

    ellipse(
      x,
      y,
      firstThrow ? 94 : 78,
      firstThrow ? 64 : 52
    );
  }

  // 台座と同じ輪郭を右下へずらした切り絵影
  jdFill("shadow", 42);

  ellipse(
    x + 4,
    y - 11,
    72,
    36
  );

  // 木製の台座
  jdFill("woodDark", 255);

  ellipse(
    x,
    y - 7,
    72,
    36
  );

  jdFill("wood", 255);

  ellipse(
    x - 2,
    y - 3,
    66,
    31
  );

  // 木目
  jdStroke("woodDark", 105);
  strokeWidth(2);

  line(
    x - 25,
    y - 1,
    x + 21,
    y - 7
  );

  line(
    x - 17,
    y + 5,
    x + 16,
    y + 1
  );

  noStroke();

  // 食材を受ける白い皿
  // 食器なので、ここだけ接地影を残す
  jdFill("shadow", 32);

  ellipse(
    x + 2,
    y - 1,
    34,
    14
  );

  jdFill("plate", 250);

  ellipse(
    x,
    y + 2,
    32,
    14
  );

  jdFill("highlight", 90);

  ellipse(
    x - 3,
    y + 4,
    19,
    6
  );

  // 上下の真鍮クリップ
  jdFill("woodDark", 225);

  rect(
    x + 20,
    y + 15,
    9,
    24,
    4
  );

  rect(
    x + 20,
    y - 15,
    9,
    24,
    4
  );

  jdFill("gold", 255);

  ellipse(
    x + 20,
    y + 18,
    13,
    13
  );

  ellipse(
    x + 20,
    y - 18,
    13,
    13
  );

  jdFill("highlight", 125);

  ellipse(
    x + 17,
    y + 20,
    4,
    4
  );

  ellipse(
    x + 17,
    y - 16,
    4,
    4
  );

  // 待機中のゴム
  if (!JD.dragging) {
    const breathe =
      ready && firstThrow
        ? pulse * 3
        : 0;

    jdStroke("redDeep", 235);

    strokeWidth(
      ready && firstThrow
        ? 4.8
        : 4
    );

    line(
      x + 20,
      y + 18,
      x + 5 - breathe,
      y + 6
    );

    line(
      x + 20,
      y - 18,
      x + 5 - breathe,
      y - 6
    );

    jdStroke("red", 92);
    strokeWidth(1.5);

    line(
      x + 20,
      y + 19,
      x + 5 - breathe,
      y + 7
    );

    line(
      x + 20,
      y - 17,
      x + 5 - breathe,
      y - 5
    );

    noStroke();
  }

  // 発射台から右下へ伸びる操作ガイド
  if (ready) {
    const guideAlpha =
      firstThrow
        ? 92 + pulse * 92
        : 42 + pulse * 46;

    const guideLength =
      firstThrow
        ? 88
        : 66;

    jdFill(
      "highlight",
      guideAlpha
    );

    for (let i = 0; i < 5; i++) {
      const t =
        (i + 1) / 5;

      ellipse(
        x + 30 + guideLength * t,
        y - 2 - 25 * t,
        firstThrow
          ? 4.4 + pulse * 1.4
          : 3.2 + pulse * 0.8
      );
    }

    const arrowX =
      x + 36 + guideLength;

    const arrowY =
      y - 30;

    jdStroke(
      "redDeep",
      guideAlpha
    );

    strokeWidth(
      firstThrow
        ? 3
        : 2
    );

    line(
      arrowX - 10,
      arrowY + 2,
      arrowX,
      arrowY
    );

    line(
      arrowX,
      arrowY,
      arrowX - 4,
      arrowY + 9
    );

    line(
      arrowX,
      arrowY,
      arrowX - 10,
      arrowY - 2
    );

    noStroke();
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
  if (
    !JD.hitEffectTimer ||
    JD.hitEffectTimer <= 0
  ) {
    return;
  }

  if (
    !JD.food ||
    !JD.food.resolved
  ) {
    return;
  }

  // ヒットストップ中は演出時計も止める。
  // 衝突した一枚絵を一瞬だけ見せる。
  if (
    !(JD.hitStopTimer > 0)
  ) {
    JD.hitEffectTimer -=
      DeltaTime ||
      0.016;
  }

  const duration =
    JD.hitEffectDuration ||
    0.74;

  const t =
    1 -
    jdClamp(
      JD.hitEffectTimer /
      duration,
      0,
      1
    );

  const x =
    JD.hitEffectX;

  const y =
    JD.hitEffectY;

  const perfect =
    JD.hitEffectPerfect;

  ellipseMode(CENTER);
  rectMode(CENTER);
  textAlign(CENTER);

  // ==================================================
  // 衝突直後の白い圧縮フラッシュ
  // 約0.1秒以内に消える
  // ==================================================

  const flashT =
    jdClamp(
      t / 0.16,
      0,
      1
    );

  const flashAlpha =
    (
      perfect
        ? 205
        : 145
    ) *
    (
      1 -
      flashT
    );

  noStroke();

  fill(
    255,
    250,
    222,
    flashAlpha
  );

  ellipse(
    x,
    y,
    46 +
    flashT * 30,
    25 +
    flashT * 17
  );

  // ==================================================
  // 短い放射線
  // PERFECTは8本、通常は6本
  // ==================================================

  if (
    flashT < 1
  ) {
    noFill();

    stroke(
      255,
      246,
      210,
      flashAlpha *
      0.88
    );

    strokeWidth(
      perfect
        ? 3
        : 2
    );

    const rayCount =
      perfect
        ? 8
        : 6;

    const inner =
      20 +
      flashT * 6;

    const outer =
      34 +
      flashT * 20;

    for (
      let i = 0;
      i < rayCount;
      i++
    ) {
      const angle =
        (
          i /
          rayCount
        ) *
        Math.PI *
        2;

      line(
        x +
        Math.cos(angle) *
        inner,
        y +
        Math.sin(angle) *
        inner *
        0.62,
        x +
        Math.cos(angle) *
        outer,
        y +
        Math.sin(angle) *
        outer *
        0.62
      );
    }
  }

  // ==================================================
  // 従来の柔らかい光輪
  // ==================================================

  noStroke();

  const spotAlpha =
    (
      perfect
        ? 112
        : 78
    ) *
    (
      1 -
      t
    );

  fill(
    255,
    245,
    205,
    Math.max(
      0,
      spotAlpha
    )
  );

  ellipse(
    x,
    y,
    78 +
    24 * t,
    40 +
    14 * t
  );

  noFill();

  strokeWidth(
    perfect
      ? 4
      : 3
  );

  stroke(
    255,
    245,
    215,
    (
      perfect
        ? 220
        : 165
    ) *
    (
      1 -
      t
    )
  );

  ellipse(
    x,
    y,
    26 +
    (
      perfect
        ? 74
        : 58
    ) *
    t,
    16 +
    (
      perfect
        ? 46
        : 36
    ) *
    t
  );

  strokeWidth(2);

  stroke(
    255,
    255,
    255,
    (
      perfect
        ? 165
        : 105
    ) *
    (
      1 -
      t
    )
  );

  ellipse(
    x,
    y,
    16 +
    (
      perfect
        ? 52
        : 40
    ) *
    t,
    10 +
    (
      perfect
        ? 34
        : 26
    ) *
    t
  );

  // ==================================================
  // 成功テキスト
  // 一度縮んでから、短くポップする
  // ==================================================

  const pop =
    Math.sin(
      Math.min(
        1,
        t *
        1.55
      ) *
      Math.PI
    );

  const settle =
    1 -
    Math.pow(
      1 -
      jdClamp(
        t / 0.24,
        0,
        1
      ),
      3
    );

  const labelSize =
    (
      perfect
        ? 25
        : 23
    ) +
    pop *
    (
      perfect
        ? 9
        : 7
    );

  const alpha =
    Math.max(
      0,
      240 *
      (
        1 -
        Math.max(
          0,
          t - 0.76
        ) /
        0.24
      )
    );

  noStroke();

  fill(
    255,
    255,
    255,
    alpha
  );

  font(
    "Courier-Bold"
  );

  fontSize(
    labelSize *
    (
      0.92 +
      settle *
      0.08
    )
  );

  text(
    JD.hitEffectLabel ||
    "GOOD!",
    x,
    y +
    42 +
    pop *
    5
  );

  if (
    perfect
  ) {
    fontSize(10);

    fill(
      255,
      245,
      210,
      alpha *
      0.82
    );

    text(
      jdT(
        "result.perfect",
        "PERFECT CENTER"
      ),
      x,
      y +
      66 +
      pop *
      5
    );
  }

  noStroke();
  rectMode(CORNER);
}


function jdDrawTrajectory(pull) {
  const vx =
    pull.x * JD.shotPower;

  const vy =
    pull.y * JD.shotPower;

  const g =
    JD.gravity *
    (
      (
        JD.food &&
        JD.food.gravityScale
      ) ||
      1
    );

  const pullRatio =
    jdClamp(
      Math.hypot(
        pull.x,
        pull.y
      ) / JD.maxPull,
      0,
      1
    );

  // 弱いショットでも軌道を読みやすくしつつ、
  // 強いショットでは少し遠くまで見せる
  const pointCount =
    9 +
    Math.round(
      pullRatio * 3
    );

  for (
    let i = 1;
    i <= pointCount;
    i++
  ) {
    const t =
      i * 0.052;

    const px =
      JD.launcher.x +
      vx * t;

    const py =
      JD.launcher.y +
      vy * t -
      0.5 * g * t * t;

    if (
      px > -40 &&
      px < JD.worldW + 40 &&
      py > -20 &&
      py < JD.worldH + 40
    ) {
      // 発射台に近い点ほど強く、
      // 遠くなるにつれて静かに消える
      const progress =
        i / pointCount;

      const alpha =
        178 -
        progress * 126;

      const size =
        4.4 -
        progress * 1.7;

      jdFill(
        "creamWarm",
        Math.max(
          38,
          alpha
        )
      );

      ellipse(
        px,
        py,
        Math.max(
          2.6,
          size
        )
      );
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
  ellipseMode(CENTER);
  rectMode(CENTER);

  for (
    const p of
    JD.particles
  ) {
    const life =
      jdClamp(
        p.life || 0,
        0,
        1
      );

    const alpha =
      230 *
      life;

    const c =
      p.col || {
        r: 255,
        g: 245,
        b: 220
      };

    pushMatrix();

    translate(
      p.x,
      p.y
    );

    if (
      Number.isFinite(
        p.rotation
      )
    ) {
      rotate(
        p.rotation
      );
    }

    noStroke();

    // --------------------------------
    // メロンソーダの泡
    // --------------------------------

    if (
      p.kind ===
      "bubble"
    ) {
      noFill();

      stroke(
        c.r,
        c.g,
        c.b,
        alpha * 0.82
      );

      strokeWidth(
        Math.max(
          1,
          p.size * 0.18
        )
      );

      const bubbleSize =
        p.size *
        (
          0.70 +
          0.30 *
          (
            1 -
            life
          )
        );

      ellipse(
        0,
        0,
        bubbleSize,
        bubbleSize
      );

      noStroke();

      fill(
        255,
        255,
        235,
        alpha * 0.48
      );

      ellipse(
        -bubbleSize * 0.18,
        bubbleSize * 0.18,
        Math.max(
          1.2,
          bubbleSize * 0.18
        ),
        Math.max(
          1.2,
          bubbleSize * 0.18
        )
      );

    // --------------------------------
    // コーヒーの湯気
    // --------------------------------

    } else if (
      p.kind ===
      "steam"
    ) {
      noFill();

      stroke(
        c.r,
        c.g,
        c.b,
        alpha * 0.62
      );

      strokeWidth(
        Math.max(
          1.2,
          p.size * 0.16
        )
      );

      const sway =
        Math.sin(
          (
            p.age || 0
          ) *
          8 +
          (
            p.seed || 0
          )
        ) *
        p.size *
        0.34;

      line(
        -sway * 0.35,
        -p.size * 0.45,
        sway,
        p.size * 0.45
      );

      noStroke();

    // --------------------------------
    // ケーキの粉糖
    // --------------------------------

    } else if (
      p.kind ===
      "sugar"
    ) {
      fill(
        c.r,
        c.g,
        c.b,
        alpha * 0.92
      );

      const size =
        Math.max(
          1.5,
          p.size *
          life
        );

      rect(
        0,
        0,
        size,
        size,
        0.8
      );

    // --------------------------------
    // ケーキ片
    // --------------------------------

    } else if (
      p.kind ===
      "crumb"
    ) {
      fill(
        c.r,
        c.g,
        c.b,
        alpha
      );

      rect(
        0,
        0,
        p.size * life,
        p.size * 0.62 * life,
        1
      );

    // --------------------------------
    // 通常の小さな飛沫
    // --------------------------------

    } else {
      fill(
        c.r,
        c.g,
        c.b,
        alpha
      );

      const size =
        p.size *
        life;

      ellipse(
        0,
        0,
        size,
        size
      );
    }

    popMatrix();
  }

  noStroke();
  rectMode(CORNER);
}


function jdSpawnSplash(
  x,
  y,
  c,
  kind = "splash",
  isStab = false
) {
  if (
    !Array.isArray(
      JD.particles
    )
  ) {
    JD.particles = [];
  }

  // --------------------------------
  // メロンソーダ
  // 泡が液面から静かに上がる
  // --------------------------------

  if (
    kind === "melon"
  ) {
    const bubbleColor = {
      r: 226,
      g: 255,
      b: 204
    };

    for (
      let i = 0;
      i < 11;
      i++
    ) {
      JD.particles.push({
        kind: "bubble",

        x:
          x -
          18 +
          Math.random() *
          36,

        y:
          y -
          5 +
          Math.random() *
          14,

        vx:
          -13 +
          Math.random() *
          26,

        vy:
          42 +
          Math.random() *
          62,

        gravity:
          -8,

        drag:
          0.985,

        life:
          0.72 +
          Math.random() *
          0.28,

        decay:
          0.82 +
          Math.random() *
          0.24,

        size:
          4 +
          Math.random() *
          7,

        age: 0,
        seed:
          Math.random() *
          Math.PI *
          2,

        col:
          bubbleColor
      });
    }

    return;
  }

  // --------------------------------
  // コーヒー
  // 短い湯気が数本ほどける
  // --------------------------------

  if (
    kind === "coffee"
  ) {
    const steamColor = {
      r: 247,
      g: 226,
      b: 194
    };

    for (
      let i = 0;
      i < 7;
      i++
    ) {
      JD.particles.push({
        kind: "steam",

        x:
          x -
          13 +
          Math.random() *
          26,

        y:
          y +
          4 +
          Math.random() *
          8,

        vx:
          -7 +
          Math.random() *
          14,

        vy:
          30 +
          Math.random() *
          32,

        gravity:
          0,

        drag:
          0.982,

        life:
          0.70 +
          Math.random() *
          0.24,

        decay:
          0.68 +
          Math.random() *
          0.22,

        size:
          12 +
          Math.random() *
          10,

        age: 0,

        seed:
          Math.random() *
          Math.PI *
          2,

        col:
          steamColor
      });
    }

    return;
  }

  // --------------------------------
  // ケーキ
  // 粉糖と小さなパンくず
  // --------------------------------

  if (
    kind === "cake"
  ) {
    const sugarColor = {
      r: 255,
      g: 248,
      b: 229
    };

    const crumbColor = {
      r: 197,
      g: 130,
      b: 88
    };

    const sugarCount =
      isStab
        ? 9
        : 13;

    for (
      let i = 0;
      i < sugarCount;
      i++
    ) {
      JD.particles.push({
        kind: "sugar",

        x:
          x -
          10 +
          Math.random() *
          20,

        y:
          y +
          Math.random() *
          8,

        vx:
          -42 +
          Math.random() *
          84,

        vy:
          28 +
          Math.random() *
          78,

        gravity:
          155,

        drag:
          0.976,

        life:
          0.72 +
          Math.random() *
          0.24,

        decay:
          1.05 +
          Math.random() *
          0.30,

        size:
          2 +
          Math.random() *
          2.8,

        rotation:
          Math.random() *
          Math.PI,

        spin:
          -5 +
          Math.random() *
          10,

        age: 0,

        col:
          sugarColor
      });
    }

    const crumbCount =
      isStab
        ? 7
        : 3;

    for (
      let i = 0;
      i < crumbCount;
      i++
    ) {
      JD.particles.push({
        kind: "crumb",

        x:
          x -
          7 +
          Math.random() *
          14,

        y:
          y +
          Math.random() *
          6,

        vx:
          -58 +
          Math.random() *
          116,

        vy:
          38 +
          Math.random() *
          82,

        gravity:
          250,

        drag:
          0.972,

        life:
          0.78 +
          Math.random() *
          0.18,

        decay:
          1.18 +
          Math.random() *
          0.26,

        size:
          3 +
          Math.random() *
          3.5,

        rotation:
          Math.random() *
          Math.PI,

        spin:
          -7 +
          Math.random() *
          14,

        age: 0,

        col:
          crumbColor
      });
    }

    return;
  }

  // --------------------------------
  // その他
  // 以前より粒数を抑えた飛沫
  // --------------------------------

  for (
    let i = 0;
    i < 12;
    i++
  ) {
    JD.particles.push({
      kind: "splash",
      x,
      y,

      vx:
        -70 +
        Math.random() *
        140,

      vy:
        30 +
        Math.random() *
        105,

      gravity:
        420,

      drag:
        0.98,

      life:
        0.74 +
        Math.random() *
        0.20,

      decay:
        1.45 +
        Math.random() *
        0.25,

      size:
        2.5 +
        Math.random() *
        4,

      age: 0,

      col:
        c || {
          r: 255,
          g: 235,
          b: 220
        }
    });
  }
}


function jdUpdateParticles(dt) {
  if (
    !Array.isArray(
      JD.particles
    )
  ) {
    JD.particles = [];
    return;
  }

  for (
    let i =
      JD.particles.length - 1;
    i >= 0;
    i--
  ) {
    const p =
      JD.particles[i];

    p.age =
      (
        p.age ||
        0
      ) +
      dt;

    const decay =
      Number.isFinite(
        p.decay
      )
        ? p.decay
        : 1.75;

    p.life -=
      dt *
      decay;

    const gravity =
      Number.isFinite(
        p.gravity
      )
        ? p.gravity
        : 520;

    p.vy -=
      gravity *
      dt;

    const drag =
      Number.isFinite(
        p.drag
      )
        ? p.drag
        : 0.98;

    const dragFactor =
      Math.pow(
        drag,
        dt * 60
      );

    p.vx *=
      dragFactor;

    p.vy *=
      dragFactor;

    // 泡と湯気にはわずかな横揺れを入れる
    if (
      p.kind === "bubble" ||
      p.kind === "steam"
    ) {
      p.vx +=
        Math.sin(
          p.age *
          (
            p.kind ===
            "bubble"
              ? 7
              : 5
          ) +
          (
            p.seed || 0
          )
        ) *
        dt *
        (
          p.kind ===
          "bubble"
            ? 18
            : 10
        );
    }

    p.x +=
      p.vx *
      dt;

    p.y +=
      p.vy *
      dt;

    if (
      Number.isFinite(
        p.spin
      )
    ) {
      p.rotation =
        (
          p.rotation ||
          0
        ) +
        p.spin *
        dt;
    }

    if (
      p.life <= 0
    ) {
      JD.particles.splice(
        i,
        1
      );
    }
  }
}


function jdDrawFloatTexts() {}

function jdDrawLauncherItemTicket() {
  const f =
    JD.food;

  if (
    !f ||
    f.launched ||
    f.resolved ||
    JD.dragging ||
    JD.fortuneSpinning ||
    JD.fortunePickedTimer > 0
  ) {
    JD.itemTicketTimer = 0;
    JD.itemTicketSoundPlayed = false;
    return;
  }

  if (
    !Number.isFinite(
      JD.itemTicketTimer
    )
  ) {
    JD.itemTicketTimer = 0;
  }

  const ticketEnterDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.itemTicketEnter
    )
      ? JD.motion.itemTicketEnter
      : 0.46;

  // Fortuneの退場後、同じテンポで静かに現れる
  JD.itemTicketTimer =
    Math.min(
      ticketEnterDuration,
      JD.itemTicketTimer +
      DeltaTime
    );

  const appearT =
    jdClamp(
      JD.itemTicketTimer /
      ticketEnterDuration,
      0,
      1
    );

  if (
    !JD.itemTicketSoundPlayed &&
    appearT >= 0.08
  ) {
    JD.itemTicketSoundPlayed = true;
    jdPlaySound("ticket");
  }

  const appearEase =
    1 -
    Math.pow(
      1 -
      appearT,
      3
    );

  const alpha =
    255 *
    appearEase;

  // Closeカメラ時の画面中央付近
  const x =
    JD.launcher.x -
    105;

  const baseY =
    JD.launcher.y +
    50;

  // 少し上から降りてくる
  const y =
    baseY +
    (
      1 -
      appearEase
    ) * 12;

  const name =
    f.name ||
    "-";

  const ticketW =
    jdClamp(
      54 +
      name.length *
      7.4,
      96,
      142
    );

  const ticketH =
    34;

  const targetX =
    JD.launcher.x -
    18;

  const targetY =
    JD.launcher.y +
    4;

  const lineStartX =
    x +
    ticketW / 2 -
    13;

  const lineStartY =
    y -
    ticketH / 2 +
    7;

  const elbowY =
    targetY +
    18;

  rectMode(CENTER);
  ellipseMode(CENTER);
  textAlign(CENTER);

  // --------------------------------
  // 素材へつながる説明線
  // --------------------------------

  noFill();

  jdStroke(
    "paper",
    215 *
    appearEase
  );

  strokeWidth(2);

  line(
    lineStartX,
    lineStartY,
    lineStartX,
    elbowY
  );

  line(
    lineStartX,
    elbowY,
    targetX,
    elbowY
  );

  line(
    targetX,
    elbowY,
    targetX,
    targetY
  );

  noStroke();

  // 先端の丸
  jdFill(
    "paper",
    225 *
    appearEase
  );

  ellipse(
    targetX,
    targetY,
    9,
    9
  );

  jdFill(
    "redDeep",
    165 *
    appearEase
  );

  ellipse(
    targetX,
    targetY,
    3,
    3
  );

  // --------------------------------
  // 素材札
  // --------------------------------

  jdFill(
    "shadow",
    34 *
    appearEase
  );

  rect(
    x + 4,
    y - 4,
    ticketW,
    ticketH,
    6
  );

  jdFill(
    "paper",
    238 *
    appearEase
  );

  rect(
    x,
    y,
    ticketW,
    ticketH,
    6
  );

  // 上線ではなく下線
  jdFill(
    "redDeep",
    175 *
    appearEase
  );

  rect(
    x,
    y -
    ticketH / 2 +
    6,
    ticketW -
    16,
    3,
    2
  );

  // 素材名だけを大きく表示
  jdFill(
    "ink",
    238 *
    appearEase
  );

  font(
    "Courier-Bold"
  );

  let nameSize = 13;

  if (
    name.length >= 10
  ) {
    nameSize = 10.5;

  } else if (
    name.length >= 8
  ) {
    nameSize = 11.5;
  }

  fontSize(
    nameSize
  );

  text(
    name,
    x,
    y + 3
  );

  noStroke();
}






function jdUpdateFloatTexts(_dt) { JD.floatTexts.length = 0; }

function jdDrawPlayUI() {
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
  textAlign(CENTER);

  let rest =
    JD.queue.length -
    JD.throwIndex +
    1;

  if (rest < 0) {
    rest = 0;
  }

  const resultMode =
    JD.food &&
    JD.food.resolved;

  const cx =
    JD.LOGICAL_W / 2;

  const cy =
    JD.LOGICAL_H - 31;

  const w =
    JD.LOGICAL_W - 32;

  const h = 34;

  const panelAlpha =
    resultMode
      ? 118
      : 224;

  const textAlpha =
    resultMode
      ? 145
      : 245;

  // 影
  jdFill(
    "shadow",
    resultMode
      ? 24
      : 42
  );

  rect(
    cx + 3,
    cy - 4,
    w,
    h,
    7
  );

  // 勤務伝票
  jdFill(
    "paper",
    panelAlpha
  );

  rect(
    cx,
    cy,
    w,
    h,
    7
  );

  // パンチ穴
  jdFill(
    "woodDark",
    resultMode
      ? 42
      : 88
  );

  ellipse(
    42,
    cy,
    5,
    5
  );

  // 情報の区切り
  jdFill(
    "ink",
    resultMode
      ? 28
      : 50
  );

  rect(
    129,
    cy,
    1,
    20
  );

  rect(
    246,
    cy,
    1,
    20
  );

  // --------------------------------
  // WORK TICKET
  // --------------------------------

  jdFill(
    "ink",
    textAlpha
  );

  font("Courier");
  fontSize(8);

  text(
    "WORK TICKET",
    82,
    cy + 7
  );

  font("Courier-Bold");
  fontSize(9);

  text(
    jdT(
      "ui.shift",
      "MONDAY SHIFT"
    ),
    82,
    cy - 6
  );

  // --------------------------------
  // SALES
  // --------------------------------

  font("Courier");
  fontSize(8);

  text(
    jdT(
      "ui.sales",
      "SALES"
    ),
    187,
    cy + 7
  );

  font("Courier-Bold");
  fontSize(12);

  text(
    `${JD.totalSales} ${jdT(
      "ui.yen",
      "YEN"
    )}`,
    187,
    cy - 6
  );

  // --------------------------------
  // REST
  // --------------------------------

  font("Courier");
  fontSize(8);

  text(
    jdT(
      "ui.rest",
      "REST"
    ),
    292,
    cy + 7
  );

  font("Courier-Bold");
  fontSize(13);

  text(
    String(rest),
    292,
    cy - 6
  );

  // --------------------------------
  // 下線
  // 一枚の長い線ではなく、
  // 3つの情報ごとに短く区切る
  // --------------------------------

  jdFill(
    "redDeep",
    resultMode
      ? 80
      : 165
  );

  const underlineY =
    cy -
    h / 2 +
    5;

  rect(
    82,
    underlineY,
    86,
    2.5,
    1
  );

  rect(
    187,
    underlineY,
    82,
    2.5,
    1
  );

  rect(
    292,
    underlineY,
    58,
    2.5,
    1
  );

  // Fortune回転中の補助表示
  if (
    JD.fortuneSpinning
  ) {
    jdFill(
      "ink",
      190
    );

    font(
      '"Hiragino Mincho ProN", "Yu Mincho", serif'
    );

    fontSize(11);

    text(
      "本日の素材を選んでいます",
      cx,
      91
    );
  }

  jdDrawDebugButton();
}




function jdDrawShotMeter() {
  // 下部のPOWER / ANGLEゲージは廃止。
  // 引っ張り量と角度は、ゴム・軌道予測・
  // カメラのズームアウトから体感できる構成にする。
  return;
}



function jdDrawFortuneMachine() {
  if (
    !JD.fortuneSpinning &&
    !(JD.fortunePickedTimer > 0)
  ) {
    return;
  }

  rectMode(CENTER);
  ellipseMode(CENTER);
  textAlign(CENTER);
  noStroke();

  const cx =
    JD.LOGICAL_W / 2;

  const baseCy =
    328;

  const active =
    JD.fortuneSpinning;

  const duration =
    JD.fortuneDuration ||
    0.9;

  const timer =
    JD.fortuneTimer ||
    0;

  // 紙UIと同じ約0.46秒で、上から落ち着いて登場
  const enterDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.fortuneEnter
    )
      ? JD.motion.fortuneEnter
      : 0.46;

  const enterT =
    active
      ? jdClamp(
          (
            duration -
            timer
          ) /
          enterDuration,
          0,
          1
        )
      : 1;

  const enterEase =
    1 -
    Math.pow(
      1 -
      enterT,
      3
    );

  // 確定表示の最後に下方向へ退場
  const exitDuration =
    JD.motion &&
    Number.isFinite(
      JD.motion.fortuneExit
    )
      ? JD.motion.fortuneExit
      : 0.46;

  const exitT =
    !active &&
    JD.fortunePickedTimer > 0
      ? jdClamp(
          (
            exitDuration -
            JD.fortunePickedTimer
          ) /
          exitDuration,
          0,
          1
        )
      : 0;

  const exitEase =
    exitT *
    exitT *
    (
      3 -
      2 * exitT
    );

  const visibility =
    jdClamp(
      Math.min(
        enterEase,
        1 -
        exitEase
      ),
      0,
      1
    );

  // y軸は上方向が正。
  // 上から登場：開始時はbaseCyより上
  // 下へ退場：終了時はbaseCyより下
  const cy =
    baseCy +
    (
      1 -
      enterEase
    ) * 40 -
    exitEase * 46;

  pushMatrix();

  translate(
    cx,
    cy
  );

  scale(
    0.965 +
    visibility *
    0.035
  );

  translate(
    -cx,
    -cy
  );

  const p =
    1 -
    jdClamp(
      timer /
      duration,
      0,
      1
    );

  const pickedP =
    JD.fortunePickedTimer > 0
      ? jdClamp(
          JD.fortunePickedTimer /
          (
            JD.motion &&
            Number.isFinite(
              JD.motion.fortuneHold
            )
              ? JD.motion.fortuneHold
              : 1.10
          ),
          0,
          1
        )
      : 0;

  const bodyPop =
    active
      ? Math.sin(
          Math.min(
            1,
            p *
            1.8
          ) *
          Math.PI
        ) *
        1.3
      : pickedP;

  const wheelRot =
    active
      ? (
          JD.fortuneDuration -
          timer
        ) *
        900
      : 0;

  const blink =
    active
      ? 0.84 +
        0.16 *
        Math.sin(
          ElapsedTime *
          12
        )
      : 1;

  const bodyW =
    156;

  const bodyH =
    226 +
    bodyPop;

  // --------------------------------
  // 木製本体
  // --------------------------------

  jdFill(
    "shadow",
    (
      active
        ? 78
        : 62
    ) *
    visibility
  );

  rect(
    cx + 4,
    cy - 8,
    bodyW + 8,
    bodyH + 8,
    24
  );

  jdFill(
    "woodDark",
    210 *
    visibility
  );

  rect(
    cx + 3,
    cy - 3,
    bodyW,
    bodyH,
    22
  );

  jdFill(
    "wood",
    252 *
    visibility
  );

  rect(
    cx,
    cy,
    bodyW - 8,
    bodyH - 8,
    20
  );

  jdFill(
    "wallShade",
    34 *
    visibility
  );

  rect(
    cx - 36,
    cy,
    7,
    bodyH - 44,
    4
  );

  jdFill(
    "highlight",
    28 *
    visibility
  );

  rect(
    cx + 36,
    cy,
    5,
    bodyH - 48,
    4
  );

  // --------------------------------
  // KISSA FORTUNE札
  // --------------------------------

  const signY =
    cy + 72;

  jdFill(
    "redDeep",
    242 *
    visibility
  );

  rect(
    cx,
    signY,
    118,
    26,
    10
  );

  jdFill(
    "gold",
    (
      220 +
      20 *
      blink
    ) *
    visibility
  );

  ellipse(
    cx - 46,
    signY,
    6,
    6
  );

  ellipse(
    cx + 46,
    signY,
    6,
    6
  );

  jdFill(
    "paper",
    250 *
    visibility
  );

  font(
    "Courier-Bold"
  );

  fontSize(10);

  text(
    jdT(
      "fortune.title",
      "KISSA FORTUNE"
    ),
    cx,
    signY + 1
  );

  // --------------------------------
  // ルーレット
  // --------------------------------

  const wheelCy =
    cy - 4;

  jdFill(
    "uiPanel",
    255 *
    visibility
  );

  ellipse(
    cx,
    wheelCy,
    96,
    96
  );

  jdFill(
    "gold",
    248 *
    visibility
  );

  ellipse(
    cx,
    wheelCy,
    82,
    82
  );

  jdFill(
    "cream",
    248 *
    visibility
  );

  ellipse(
    cx,
    wheelCy,
    68,
    68
  );

  jdFill(
    "paper",
    36 *
    visibility
  );

  ellipse(
    cx - 7,
    wheelCy + 9,
    17,
    44
  );

  pushMatrix();

  translate(
    cx,
    wheelCy
  );

  rotate(
    wheelRot
  );

  jdStroke(
    "woodDark",
    112 *
    visibility
  );

  strokeWidth(1.8);

  for (
    let i = 0;
    i < 6;
    i++
  ) {
    const a =
      (
        i *
        60 -
        90
      ) *
      Math.PI /
      180;

    line(
      0,
      0,
      Math.cos(a) *
      34,
      Math.sin(a) *
      34
    );
  }

  noStroke();

  jdFill(
    "ink",
    218 *
    visibility
  );

  font(
    "Courier-Bold"
  );

  fontSize(7.2);

  const labels = [
    "CHERRY",
    "SUGAR",
    "BERRY",
    "CHERRY",
    "SUGAR",
    "LUCK"
  ];

  for (
    let i = 0;
    i < labels.length;
    i++
  ) {
    const a =
      (
        i *
        60 -
        60
      ) *
      Math.PI /
      180;

    text(
      labels[i],
      Math.cos(a) *
      22,
      Math.sin(a) *
      22 -
      1
    );
  }

  popMatrix();

  // 固定ポインタ
  jdStroke(
    "red",
    250 *
    visibility
  );

  strokeWidth(4);

  line(
    cx,
    wheelCy + 44,
    cx,
    wheelCy + 34
  );

  noStroke();

  jdFill(
    "red",
    250 *
    visibility
  );

  ellipse(
    cx,
    wheelCy + 43,
    7,
    7
  );

  jdFill(
    "woodDark",
    255 *
    visibility
  );

  ellipse(
    cx,
    wheelCy,
    9,
    9
  );

  // 回転中は結果札を出さない
  if (
    active
  ) {
    popMatrix();
    return;
  }

  // --------------------------------
  // 確定素材名
  // --------------------------------

  const showName =
    JD.fortuneDisplayName ||
    (
      JD.food
        ? JD.food.name
        : "CHERRY"
    );

  const nameLength =
    showName.length;

  const paperW =
    jdClamp(
      44 +
      nameLength *
      8.2,
      94,
      bodyW - 18
    );

  const paperH =
    32;

  const paperY =
    cy - 72;

  let nameSize =
    17;

  if (
    nameLength >= 10
  ) {
    nameSize = 14;

  } else if (
    nameLength >= 8
  ) {
    nameSize = 15;
  }

  jdFill(
    "paper",
    252 *
    visibility
  );

  rect(
    cx,
    paperY,
    paperW,
    paperH,
    9
  );

  jdFill(
    "redDeep",
    230 *
    visibility
  );

  font(
    "Courier-Bold"
  );

  fontSize(
    nameSize
  );

  text(
    showName,
    cx,
    paperY - 1
  );

  popMatrix();
}





function jdDrawReceipt() {
  rectMode(CORNER);
  ellipseMode(CENTER);
  noStroke();

  const cx =
    JD.LOGICAL_W / 2;

  // ==================================================
  // 結果画面の演出時間
  // ==================================================

  // 背景がわずかに引いて、静止画の構図へ収まる
  const backdropT =
    jdClamp(
      JD.receiptTimer /
      (
        JD.motion &&
        Number.isFinite(
          JD.motion.receiptBackdrop
        )
          ? JD.motion.receiptBackdrop
          : 0.78
      ),
      0,
      1
    );

  const backdropEase =
    1 -
    Math.pow(
      1 - backdropT,
      3
    );

  // レシートは上から置かれる
  const receiptT =
    jdClamp(
      (
        JD.receiptTimer -
        (
          JD.motion &&
          Number.isFinite(
            JD.motion.receiptDropDelay
          )
            ? JD.motion.receiptDropDelay
            : 0.08
        )
      ) /
      (
        JD.motion &&
        Number.isFinite(
          JD.motion.receiptDrop
        )
          ? JD.motion.receiptDrop
          : 0.62
      ),
      0,
      1
    );

  // 少しだけ行き過ぎて戻る、控えめな着地
  const receiptEase =
    1 +
    2.7 *
    Math.pow(
      receiptT - 1,
      3
    ) +
    1.7 *
    Math.pow(
      receiptT - 1,
      2
    );

  const receiptOffsetY =
    34 *
    (
      1 -
      receiptEase
    );

  // レシートは上から置かれたあとは動かさない。
  // 印字中も紙本体は完全に静止させる。

  // ==================================================
  // ローカル関数：レシートの破線
  // ==================================================

  function drawReceiptDash(
    paperX,
    paperW,
    y,
    alpha = 88
  ) {
    jdFill(
      "ink",
      alpha
    );

    for (
      let x = paperX + 9;
      x < paperX + paperW - 9;
      x += 7
    ) {
      rect(
        x,
        y,
        4,
        1
      );
    }
  }

  // ==================================================
  // ローカル関数：上下がギザギザの感熱紙
  // ==================================================

  function drawZigzagPaper(
    x,
    y,
    w,
    h,
    fillKey,
    alpha = 255,
    offsetX = 0,
    offsetY = 0
  ) {
    const toothW = 10;
    const diamondSize = 7.2;

    const left =
      x + offsetX;

    const bottom =
      y + offsetY;

    const right =
      left + w;

    const top =
      bottom + h;

    noStroke();
    jdFill(
      fillKey,
      alpha
    );

    // 紙の中央部分
    rect(
      left,
      bottom + 4,
      w,
      h - 8
    );

    // ギザギザとの接続帯
    rect(
      left,
      bottom + 3,
      w,
      5
    );

    rect(
      left,
      top - 8,
      w,
      5
    );

    rectMode(CENTER);

    // 下端：
    // triangleを使わず、45度回転した小さな正方形で
    // 感熱紙の切り口を作る
    for (
      let px = left + toothW / 2;
      px < right;
      px += toothW
    ) {
      pushMatrix();

      translate(
        px,
        bottom + 3.5
      );

      rotate(
        Math.PI / 4
      );

      rect(
        0,
        0,
        diamondSize,
        diamondSize
      );

      popMatrix();
    }

    // 上端
    for (
      let px = left + toothW / 2;
      px < right;
      px += toothW
    ) {
      pushMatrix();

      translate(
        px,
        top - 3.5
      );

      rotate(
        Math.PI / 4
      );

      rect(
        0,
        0,
        diamondSize,
        diamondSize
      );

      popMatrix();
    }

    rectMode(CORNER);
  }

  // ==================================================
  // 背景：ゲーム中の純喫茶
  // ==================================================

  // カメラ外周
  fill(
    31,
    23,
    20
  );

  rect(
    0,
    0,
    JD.LOGICAL_W,
    JD.LOGICAL_H
  );

  pushMatrix();

  // ゲーム終了直後は少し近く、
  // 約0.85秒かけて静かな全景へ収まる
  const receiptBackdropZoom =
    0.445 +
    (
      0.42 -
      0.445
    ) * backdropEase;

  const receiptBackdropY =
    284 +
    (
      292 -
      284
    ) * backdropEase;

  translate(
    JD.LOGICAL_W / 2,
    receiptBackdropY
  );

  scale(
    receiptBackdropZoom
  );

  translate(
    -515,
    -285
  );

  jdDrawCafeWideBackdrop();
  jdDrawWorld();

  popMatrix();

  rectMode(CORNER);
  noStroke();

  fill(
    55,
    37,
    28,
    70
  );

  rect(
    -80,
    -80,
    JD.LOGICAL_W + 160,
    JD.LOGICAL_H + 160
  );

  // レシート背後の淡い照明
  jdFill(
    "creamWarm",
    15
  );

  ellipse(
    cx,
    360,
    286,
    450
  );

  // ==================================================
  // レシート本体
  // 上からすっと置かれるレイヤー
  // ==================================================

  pushMatrix();

  translate(
    0,
    receiptOffsetY
  );

  const paperW = 210;
  const paperH = 330;

  const paperX =
    cx - paperW / 2;

  const paperY = 190;

  const paperTop =
    paperY + paperH;

  // 同じギザギザ形状の影
  drawZigzagPaper(
    paperX,
    paperY,
    paperW,
    paperH,
    "shadow",
    48,
    5,
    -5
  );

  // 感熱紙
  drawZigzagPaper(
    paperX,
    paperY,
    paperW,
    paperH,
    "paper",
    255
  );

  // 紙端のわずかな陰
  jdFill(
    "wallShade",
    24
  );

  rect(
    paperX + paperW - 3,
    paperY + 8,
    3,
    paperH - 16
  );

  jdFill(
    "highlight",
    26
  );

  rect(
    paperX + 3,
    paperY + 8,
    2,
    paperH - 16
  );

  // ==================================================
  // 日付
  // ==================================================

  let dateText =
    "20XX/XX/XX 00:00";

  try {
    const now =
      new Date();

    const yyyy =
      String(
        now.getFullYear()
      );

    const mm =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const dd =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    const hh =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );

    const min =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );

    dateText =
      `${yyyy}/${mm}/${dd} ${hh}:${min}`;

  } catch (_error) {
    // 日付取得に失敗した場合は初期値
  }

  const receiptNo =
    String(
      Math.max(
        1,
        JD.results.length
      )
    ).padStart(
      3,
      "0"
    );

  // ==================================================
  // ヘッダー
  // ==================================================

  textAlign(CENTER);

  jdFill(
    "ink",
    245
  );

  font(
    "Courier-Bold"
  );

  fontSize(15.5);

  text(
    jdT(
      "receipt.shop",
      "JUNKISSA YUMANIWA"
    ),
    cx,
    paperTop - 17
  );

  fontSize(10);

  text(
    "JUNKISSA DIVE",
    cx,
    paperTop - 33
  );

  jdFill(
    "ink",
    165
  );

  font(
    "Courier"
  );

  fontSize(7.5);

  text(
    "YUMANIWA-CHO",
    cx,
    paperTop - 45
  );

  drawReceiptDash(
    paperX,
    paperW,
    paperTop - 55
  );

  // 日時・番号
  textAlign(LEFT);

  jdFill(
    "ink",
    215
  );

  font(
    "Courier"
  );

  fontSize(8.8);

  text(
    dateText,
    paperX + 9,
    paperTop - 69
  );

  text(
    "MONDAY SHIFT",
    paperX + 9,
    paperTop - 83
  );

  textAlign(RIGHT);

  text(
    `No.${receiptNo}`,
    paperX + paperW - 9,
    paperTop - 83
  );

  drawReceiptDash(
    paperX,
    paperW,
    paperTop - 92
  );

  // ==================================================
  // 商品一覧
  // ==================================================

  const resultDelay = 0.22;
  const resultInterval = 0.27;

  const resultStartY =
    paperTop - 108;

  const resultGap = 14.5;

  for (
    let i = 0;
    i < JD.results.length;
    i++
  ) {
    const appearAt =
      resultDelay +
      i * resultInterval;

    if (
      JD.receiptTimer <
      appearAt
    ) {
      continue;
    }

    const r =
      JD.results[i];

    const y =
      resultStartY -
      i * resultGap;

    let status = "OK";

    if (
      r.type === "FLOOR"
    ) {
      status = "DROP";

    } else if (
      r.type === "OUT"
    ) {
      status = "OUT";
    }

    const item =
      r.item || "-";

    const target =
      r.targetLabel ||
      r.target ||
      "-";

    // 番号
    textAlign(LEFT);

    jdFill(
      "ink",
      182
    );

    font(
      "Courier"
    );

    fontSize(8.5);

    text(
      String(
        i + 1
      ).padStart(
        2,
        "0"
      ),
      paperX + 9,
      y
    );

    // 成否
    if (
      status === "OK"
    ) {
      jdFill(
        "redDeep",
        225
      );

    } else {
      jdFill(
        "ink",
        155
      );
    }

    font(
      "Courier-Bold"
    );

    fontSize(8);

    text(
      status,
      paperX + 26,
      y
    );

    // 食材と着地点
    jdFill(
      "ink",
      240
    );

    font(
      "Courier-Bold"
    );

    fontSize(9.6);

    const itemText =
      `${item} / ${target}`;

    if (
      itemText.length > 18
    ) {
      fontSize(8.4);
    }

    text(
      itemText,
      paperX + 52,
      y
    );

    // 金額
    textAlign(RIGHT);

    font(
      "Courier-Bold"
    );

    fontSize(9.6);

    text(
      String(
        r.price || 0
      ),
      paperX + paperW - 9,
      y
    );
  }

  const resultEnd =
    resultDelay +
    JD.results.length *
    resultInterval;

  const totalAt =
    resultEnd + 0.18;

  const rankAt =
    totalAt + 0.38;

  const memoAt =
    rankAt + 0.38;

  const readyAt =
    memoAt + 0.42;

  const listBottomY =
    resultStartY -
    JD.results.length *
    resultGap +
    4;

  // ==================================================
  // 合計
  // ==================================================

  if (
    JD.receiptTimer >=
    totalAt
  ) {
    drawReceiptDash(
      paperX,
      paperW,
      listBottomY,
      100
    );

    const totalText =
      String(
        JD.totalSales
      ).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );

    const totalY =
      listBottomY - 16;

    textAlign(LEFT);

    jdFill(
      "ink",
      242
    );

    font(
      "Courier-Bold"
    );

    fontSize(11);

    text(
      jdT(
        "receipt.total",
        "TOTAL"
      ),
      paperX + 9,
      totalY
    );

    textAlign(RIGHT);

    jdFill(
      "redDeep",
      248
    );

    font(
      "Courier-Bold"
    );

    fontSize(17);

    text(
      `¥${totalText}`,
      paperX + paperW - 9,
      totalY - 1
    );
  }

  // ==================================================
  // ランク
  // ==================================================

  const rankLineY =
    listBottomY - 28;

  if (
    JD.receiptTimer >=
    rankAt
  ) {
    drawReceiptDash(
      paperX,
      paperW,
      rankLineY,
      84
    );

    textAlign(LEFT);

    jdFill(
      "ink",
      180
    );

    font(
      "Courier"
    );

    fontSize(8);

    text(
      jdT(
        "receipt.rank",
        "RANK"
      ),
      paperX + 9,
      rankLineY - 12
    );

    textAlign(RIGHT);

    jdFill(
      "redDeep",
      228
    );

    font(
      "Courier-Bold"
    );

    fontSize(11);

    text(
      jdRankName(),
      paperX + paperW - 9,
      rankLineY - 12
    );
  }

  // ==================================================
  // 店長メモ
  // ==================================================

  const memoLineY =
    rankLineY - 25;

  if (
    JD.receiptTimer >=
    memoAt
  ) {
    drawReceiptDash(
      paperX,
      paperW,
      memoLineY,
      78
    );

    textAlign(LEFT);

    jdFill(
      "ink",
      180
    );

    font(
      "Courier"
    );

    fontSize(8);

    text(
      "TENCHO MEMO",
      paperX + 9,
      memoLineY - 11
    );

    const memo =
      jdManagerCommentShort() ||
      "-";

    const maxChars = 17;

    const memoLine1 =
      memo.slice(
        0,
        maxChars
      );

    const memoLine2 =
      memo.slice(
        maxChars
      );

    jdFill(
      "ink",
      220
    );

    font(
      "Courier"
    );

    fontSize(9.2);

    text(
      memoLine1,
      paperX + 9,
      memoLineY - 25
    );

    if (
      memoLine2
    ) {
      text(
        memoLine2,
        paperX + 9,
        memoLineY - 38
      );
    }
  }

  // ==================================================
  // フッター
  // ==================================================

  if (
    JD.receiptTimer >=
    readyAt
  ) {
    const footerDashY =
      memoLineY - 56;

    drawReceiptDash(
      paperX,
      paperW,
      footerDashY,
      70
    );

    textAlign(CENTER);

    jdFill(
      "ink",
      175
    );

    font(
      "Courier"
    );

    fontSize(8.5);

    text(
      "THANK YOU",
      cx,
      footerDashY - 15
    );

    fontSize(7);

    text(
      "JUNKISSA DIVE",
      cx,
      footerDashY - 28
    );
  }

  // ==================================================
  // 感熱プリンターの印字走査線
  // 現在表示された行だけを一瞬なぞる
  // ==================================================

  let printLineY =
    null;

  let printLineAge =
    1;

  // 商品行
  for (
    let i = 0;
    i < JD.results.length;
    i++
  ) {
    const lineAt =
      resultDelay +
      i *
      resultInterval;

    const age =
      JD.receiptTimer -
      lineAt;

    if (
      age >= 0 &&
      age < 0.13
    ) {
      printLineY =
        resultStartY -
        i *
        resultGap -
        2;

      printLineAge =
        age /
        0.13;
    }
  }

  // 合計
  if (
    JD.receiptTimer >=
      totalAt &&
    JD.receiptTimer <
      totalAt +
      0.13
  ) {
    printLineY =
      listBottomY -
      18;

    printLineAge =
      (
        JD.receiptTimer -
        totalAt
      ) /
      0.13;
  }

  // ランク
  if (
    JD.receiptTimer >=
      rankAt &&
    JD.receiptTimer <
      rankAt +
      0.13
  ) {
    printLineY =
      rankLineY -
      14;

    printLineAge =
      (
        JD.receiptTimer -
        rankAt
      ) /
      0.13;
  }

  // 店長メモ
  if (
    JD.receiptTimer >=
      memoAt &&
    JD.receiptTimer <
      memoAt +
      0.13
  ) {
    printLineY =
      memoLineY -
      27;

    printLineAge =
      (
        JD.receiptTimer -
        memoAt
      ) /
      0.13;
  }

  // THANK YOU
  if (
    JD.receiptTimer >=
      readyAt &&
    JD.receiptTimer <
      readyAt +
      0.15
  ) {
    printLineY =
      memoLineY -
      72;

    printLineAge =
      (
        JD.receiptTimer -
        readyAt
      ) /
      0.15;
  }

  if (
    Number.isFinite(
      printLineY
    )
  ) {
    const lineAlpha =
      1 -
      jdClamp(
        printLineAge,
        0,
        1
      );

    rectMode(CORNER);
    noStroke();

    // 印字直下の薄い影
    jdFill(
      "ink",
      42 *
      lineAlpha
    );

    rect(
      paperX + 8,
      printLineY - 1,
      paperW - 16,
      2
    );

    // 感熱ヘッドの反射
    jdFill(
      "highlight",
      54 *
      lineAlpha
    );

    rect(
      paperX + 12,
      printLineY + 1,
      paperW - 24,
      1
    );
  }

  // レシート本体の移動レイヤーを終了
  popMatrix();

  // ==================================================
  // 再プレイボタン
  // 印字が終わったあと、少し遅れて現れる
  // ==================================================

  if (
    jdReceiptReady()
  ) {
    const bx = cx;
    const by = 91;
    const bw = 214;
    const bh = 38;

    // 印字完了後、0.28秒かけて控えめに現れる
    const buttonT =
      jdClamp(
        (
          JD.receiptTimer -
          (
            readyAt +
            (
              JD.motion &&
              Number.isFinite(
                JD.motion.receiptButtonDelay
              )
                ? JD.motion.receiptButtonDelay
                : 0.78
            )
          )
        ) /
        (
          JD.motion &&
          Number.isFinite(
            JD.motion.short
          )
            ? JD.motion.short
            : 0.46
        ),
        0,
        1
      );

    const buttonEase =
      1 -
      Math.pow(
        1 - buttonT,
        3
      );

    const buttonScale =
      0.90 +
      0.10 *
      buttonEase;

    const buttonAlpha =
      40 +
      202 *
      buttonEase;

    rectMode(CENTER);

    pushMatrix();

    translate(
      bx,
      by
    );

    scale(
      buttonScale
    );

    const pulse =
      buttonAlpha +
      Math.sin(
        ElapsedTime * 4.2
      ) *
      18 *
      buttonEase;

    // 影
    jdFill(
      "shadow",
      34 * buttonEase
    );

    rect(
      4,
      -4,
      bw,
      bh,
      6
    );

    // 紙
    jdFill(
      "paper",
      242 * buttonEase
    );

    rect(
      0,
      0,
      bw,
      bh,
      6
    );

    // 外枠
    noFill();

    jdStroke(
      "redDeep",
      pulse
    );

    strokeWidth(2);

    rect(
      0,
      0,
      bw - 8,
      bh - 8,
      4
    );

    noStroke();

    // テキスト
    jdFill(
      "redDeep",
      pulse
    );

    textAlign(CENTER);

    font(
      "Courier-Bold"
    );

    fontSize(12);

    text(
      jdT(
        "receipt.oneMore",
        "ONE MORE SHIFT"
      ),
      0,
      1
    );

    popMatrix();

    rectMode(CORNER);
  }
}








function jdUpdateReceipt(dt) {
  const previous =
    JD.receiptTimer || 0;

  JD.receiptTimer =
    previous + dt;

  const resultDelay =
    0.22;

  const resultInterval =
    0.27;

  const resultCount =
    JD.results.length;

  // レシートが着地する瞬間
  const dropAt =
    JD.motion &&
    Number.isFinite(
      JD.motion.receiptDrop
    )
      ? JD.motion.receiptDrop
      : 0.62;

  if (
    previous < dropAt &&
    JD.receiptTimer >= dropAt
  ) {
    jdPlaySound(
      "receipt_drop"
    );
  }

  // 各商品行
  for (
    let i = 0;
    i < resultCount;
    i++
  ) {
    const lineAt =
      resultDelay +
      i *
      resultInterval;

    if (
      previous < lineAt &&
      JD.receiptTimer >= lineAt
    ) {
      jdPlaySound(
        "receipt_print"
      );
    }
  }

  const resultEnd =
    resultDelay +
    resultCount *
    resultInterval;

  const totalAt =
    resultEnd +
    0.18;

  const rankAt =
    totalAt +
    0.38;

  const memoAt =
    rankAt +
    0.38;

  const thankYouAt =
    memoAt +
    0.42;

  const buttonDelay =
    JD.motion &&
    Number.isFinite(
      JD.motion.receiptButtonDelay
    )
      ? JD.motion.receiptButtonDelay
      : 0.78;

  const buttonAt =
    thankYouAt +
    buttonDelay;

  // 合計・ランク・メモも同じ印字音
  const printMoments = [
    totalAt,
    rankAt,
    memoAt
  ];

  for (
    const moment of
    printMoments
  ) {
    if (
      previous < moment &&
      JD.receiptTimer >= moment
    ) {
      jdPlaySound(
        "receipt_print"
      );
    }
  }

  if (
    previous < thankYouAt &&
    JD.receiptTimer >= thankYouAt
  ) {
    jdPlaySound(
      "receipt_finish"
    );
  }

  if (
    previous < buttonAt &&
    JD.receiptTimer >= buttonAt
  ) {
    jdPlaySound(
      "button_ready"
    );
  }
}

function jdReceiptReady() {
  const resultDelay =
    0.22;

  const resultInterval =
    0.27;

  const resultEnd =
    resultDelay +
    JD.results.length *
    resultInterval;

  const totalAt =
    resultEnd +
    0.18;

  const rankAt =
    totalAt +
    0.38;

  const memoAt =
    rankAt +
    0.38;

  const thankYouAt =
    memoAt +
    0.42;

  const buttonDelay =
    JD.motion &&
    Number.isFinite(
      JD.motion.receiptButtonDelay
    )
      ? JD.motion.receiptButtonDelay
      : 0.78;

  return (
    JD.receiptTimer >=
    thankYouAt +
    buttonDelay
  );
}




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
  if (
    JD.state ===
    STATE_PLAY
  ) {
    if (
      JD.gamePhase ===
      PHASE_SHIFT_START
    ) {
      const duration =
        Number.isFinite(
          JD.shiftStartDuration
        )
          ? JD.shiftStartDuration
          : 7.4;

      const timer =
        Number.isFinite(
          JD.shiftStartTimer
        )
          ? JD.shiftStartTimer
          : duration;

      const elapsed =
        duration - timer;

      const moveT =
        jdClamp(
          (
            elapsed -
            5.10
          ) / 2.05,
          0,
          1
        );

      const ease =
        moveT *
        moveT *
        (
          3 -
          2 * moveT
        );

      JD.cam.tx =
        515 +
        (
          JD.launcher.x -
          105 -
          515
        ) * ease;

      JD.cam.ty =
        285 +
        (
          252 -
          285
        ) * ease;

      JD.cam.tz =
        0.42 +
        (
          1 -
          0.42
        ) * ease;

    } else if (
      JD.dragging
    ) {
      jdSetCameraOverview();

    } else if (
      JD.perfectZoomActive &&
      JD.hitZoomTimer > 0
    ) {
      JD.hitZoomTimer -= dt;
      jdSetCameraHitZoom();

    } else if (
      JD.food &&
      JD.food.launched
    ) {
      jdSetCameraFollowFood();

    } else if (
      JD.food &&
      JD.food.resolved
    ) {
      jdFreezeCamera();

    } else {
      jdSetCameraClose(false);
    }
  }

  let k = 7.5;

  if (
    JD.gamePhase ===
    PHASE_SHIFT_START
  ) {
    k = 4.8;

  } else if (
    JD.dragging
  ) {
    k = 11;

  } else if (
    JD.perfectZoomActive &&
    JD.hitZoomTimer > 0
  ) {
    k = 12.5;
  }

  const a =
    Math.min(
      1,
      dt * k
    );

  JD.cam.x +=
    (
      JD.cam.tx -
      JD.cam.x
    ) * a;

  JD.cam.y +=
    (
      JD.cam.ty -
      JD.cam.y
    ) * a;

  JD.cam.zoom +=
    (
      JD.cam.tz -
      JD.cam.zoom
    ) * a;
}




function jdSetCameraClose(instant) {
  JD.cam.tx = JD.launcher.x - 105;
  JD.cam.ty = 252;
  JD.cam.tz = 1;
  if (instant) { JD.cam.x = JD.cam.tx; JD.cam.y = JD.cam.ty; JD.cam.zoom = JD.cam.tz; }
}

function jdSetCameraOverview() {
  const pull =
    jdGetScreenPull();

  const powerRatio =
    jdClamp(
      Math.hypot(
        pull.x,
        pull.y
      ) / JD.maxPull,
      0,
      1
    );

  // 40％で全景へ到達
  const overviewRatio =
    jdClamp(
      powerRatio / 0.40,
      0,
      1
    );

  const t =
    overviewRatio *
    overviewRatio *
    (
      3 -
      2 * overviewRatio
    );

  const startZoom =
    1.02;

  const endZoom =
    0.42;

  const zoom =
    startZoom +
    (
      endZoom -
      startZoom
    ) * t;

  // 発射台を右側に保ちつつ、
  // 左端のメロンソーダにも十分な余白を確保
  const launcherScreenX =
    296;

  JD.cam.tx =
    JD.launcher.x -
    (
      launcherScreenX -
      JD.camScreenX
    ) / zoom;

  // 全景時に下側へ寄りすぎないよう、
  // 店内上部とカウンターの余白を均等化
  JD.cam.ty =
    252 +
    (
      280 -
      252
    ) * t;

  JD.cam.tz =
    zoom;
}






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
