# WEB STABLE NOTES 2/7

## 方針

この段階ではポスター風デザインにはまだ入らない。
まずは、Web上で「Codea版と同じように触れる」ことを優先する。

## 変更点

### index.html

- `apple-mobile-web-app-capable` を追加
- `apple-mobile-web-app-status-bar-style` を追加
- `format-detection` を無効化
- `gesturestart` / `dblclick` / `contextmenu` を抑制

### style.css

- `position: fixed` と `overflow: hidden` を強化
- `100svh` / `100dvh` を利用
- `overscroll-behavior: none`
- `touch-action: none`
- 長押し選択・タップハイライトを抑制

### sketch.js

- `JD_WEB_PORT_VERSION = "2/7 Web Stable Base"`
- URL `?debug=1` で初期デバッグON
- pointer入力を1本に制限
- `blur` / `pagehide` 時にドラッグ状態をキャンセル

## 変更していないこと

- 物理挙動
- 成功判定
- 配点
- ターゲット配置
- ステージ構成
- KISSA FORTUNEの基本演出

## 次の予定

3/7 から、見た目をポスター方向に整える。
まずは背景・テーブル・全体配色から入り、食べ物や占い機はその後に分けて調整する。
