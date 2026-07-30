# 純喫茶ダイブ / Junkissa Dive — Web Port 2/7

## 今回の目的

2/7 は **Web実機安定化版** です。
1/7 のゲーム内容・物理挙動・得点・配置は大きく変えず、iPhone Safari / GitHub Pages 上で触る時の土台を固めています。

## ファイル構成

- `index.html` — GitHub Pages 用エントリ
- `style.css` — モバイルブラウザ向けの画面固定・スクロール抑止
- `codea-lite.js` — Codea風 Canvas 互換レイヤー
- `sketch.js` — ゲーム本体
- `WEB_QA_CHECKLIST_2of7.md` — 実機確認リスト
- `WEB_STABLE_NOTES_2of7.md` — 今回の変更メモ

## 起動方法

GitHub Pages にそのままアップロードして `index.html` を開きます。
ローカル確認の場合は、簡易サーバーで開くのがおすすめです。

```bash
python3 -m http.server 8000
```

## デバッグ

通常は画面右上の `DBG` ボタンで切り替えます。
初期状態からデバッグONにしたい場合は、URL末尾に `?debug=1` を付けます。

```text
https://example.github.io/junkissa-dive/?debug=1
```

## 2/7 の変更範囲

- モバイルブラウザのスクロール・長押し・ダブルタップ対策を強化
- pointer入力を1本に制限し、マルチタッチによる暴発を抑制
- ページ離脱・フォーカス喪失時にドラッグ状態をキャンセル
- GitHub Pages / iPhone Safari 向けの確認メモを追加
- ゲーム内容、配置、配点、当たり判定は原則維持
