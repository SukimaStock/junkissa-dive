# 純喫茶ダイブ / Junkissa Dive

Web Port **5/7 Motif Recognition Polish**.

## 目的

3/7で整えたレトロ喫茶ポスター風の色面を保ったまま、ゲーム中の主役であるメニュー類の見た目を磨いた版です。

動き・判定・配点・配置は基本的に変更せず、まずは「触りたくなる対象」に見えるように、コーヒー、ケーキ、メロンソーダ、飛ばす食材の描画を整理しました。

## 変更点

- コーヒーカップを柔らかい色面とソーサーで再描画
- いちごケーキに層、クリーム、いちご断面を追加
- メロンソーダにグラス、氷、泡、アイス、チェリー、ストローの要素を追加
- 飛ばす食材を小さなアイコンとして再整理
  - CHERRY: つやと茎を追加
  - SUGAR: 角砂糖らしい面とハイライトを追加
  - STRAWBERRY: 種と葉を追加
- 皿・影・ハイライトの描画ヘルパーを追加
- 共通カラーパレットに glassEdge / ice / plate などを追加

## 変更していないもの

- 物理挙動
- 当たり判定
- 配点
- ターゲット配置
- シーン推移
- KISSA FORTUNE の仕様

## 確認ポイント

1. 3/7と同じように最後まで遊べるか
2. メロンソーダがポスターの主役として見えるか
3. ケーキが狙いたくなる見た目になっているか
4. コーヒーが地味すぎず、でも落ち着いて見えるか
5. 食材が小さくても判別できるか
6. 見た目が変わっても、当たり判定の印象が大きくズレていないか


## 5/7 Motif Recognition Polish

This pass improves visual readability of individual cafe motifs while keeping gameplay unchanged. See `MOTIF_RECOGNITION_5of7.md` and `WEB_QA_CHECKLIST_5of7.md`.


## 8/10 Balance prep

This package keeps the 7of7b build intact and adds balance/design notes for the next tuning phase.
