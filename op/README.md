# 愛のテレパシー — アニメOP風ムービー

90年代アニメのオープニング風 100秒ムービー(8シーン構成)。

- `ai-no-telepathy-op.mp4` — 完成動画 (1280x720, 24fps, BGM付き)
- `index.html` — Canvas アニメーション本体。ブラウザで開くとリアルタイム再生
- `render.mjs` — Playwright でフレームを書き出すスクリプト (`node render.mjs all 24 frames`)
- `music.py` — BGM を numpy で合成するスクリプト (`python3 music.py` → `op.wav`)

動画の再生成:

```
npm i playwright
node render.mjs all 24 frames
python3 music.py
ffmpeg -framerate 24 -i frames/frame_%05d.jpg -i op.wav \
  -c:v libx264 -crf 26 -maxrate 2200k -bufsize 4400k -pix_fmt yuv420p \
  -c:a aac -b:a 128k -shortest -movflags +faststart ai-no-telepathy-op.mp4
```
