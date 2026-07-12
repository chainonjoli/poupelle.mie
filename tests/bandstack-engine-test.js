/* BAND STACK エンジンの単体テスト（node tests/bandstack-engine-test.js で実行） */
const E = require('../scripts/bandstack/engine.js');
const { Game, W, H, HIDDEN, TYPES, NOTE, ROCK } = E;

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}

console.log('--- 生成とスポーン ---');
{
  const g = new Game({ seed: 42 });
  ok(g.queue.length === 2, 'キューに2ピースある');
  ok(g.spawn(), 'スポーン成功');
  ok(g.cur && g.cur.cells.length === 2, '落下中ピースは2セル');
  ok(g.pieces === 1, 'ピース数カウント');
}

console.log('--- 移動・回転・落下 ---');
{
  const g = new Game({ seed: 1 });
  g.spawn();
  const x0 = g.cur.x;
  ok(g.move(-1) && g.cur.x === x0 - 1, '左移動');
  ok(g.move(1) && g.cur.x === x0, '右移動');
  ok(g.rotate(1) && g.cur.rot === 1, '回転');
  const d = g.hardDrop();
  ok(d > 0, 'ハードドロップで落ちる');
  const placed = g.lock();
  ok(placed.length === 2, '2セル固定される');
  ok(placed.every(p => p.y >= HIDDEN), '可視領域に置かれる');
}

console.log('--- 壁際の回転キック ---');
{
  const g = new Game({ seed: 2 });
  g.spawn();
  while (g.move(-1));
  ok(g.cur.x === 0, '左端まで移動');
  g.cur.rot = 0;
  ok(g.rotate(-1), '左端で左回転してもキックで成功');
}

console.log('--- 3連消去（横） ---');
{
  const g = new Game({ seed: 3 });
  g.grid[H - 1][0] = { t: 'guitar' };
  g.grid[H - 1][1] = { t: 'guitar' };
  g.grid[H - 1][2] = { t: 'guitar' };
  const c = g.findClears();
  ok(c && c.cells.length === 3, '横3連で3セル消去');
  ok(c.runs.length === 1 && c.runs[0].t === 'guitar', 'ラン情報が正しい');
}

console.log('--- 3連消去（縦）と音符ワイルド ---');
{
  const g = new Game({ seed: 4 });
  g.grid[H - 1][3] = { t: 'drum' };
  g.grid[H - 2][3] = { t: NOTE };
  g.grid[H - 3][3] = { t: 'drum' };
  const c = g.findClears();
  ok(c && c.cells.length === 3, '音符を挟んだ縦3連が消える');
}

console.log('--- 音符だけでは消えない ---');
{
  const g = new Game({ seed: 5 });
  g.grid[H - 1][0] = { t: NOTE };
  g.grid[H - 1][1] = { t: NOTE };
  g.grid[H - 1][2] = { t: NOTE };
  ok(g.findClears() === null, '音符のみの3連は消えない');
}

console.log('--- 2連では消えない ---');
{
  const g = new Game({ seed: 6 });
  g.grid[H - 1][0] = { t: 'bass' };
  g.grid[H - 1][1] = { t: 'bass' };
  ok(g.findClears() === null, '2連は消えない');
}

console.log('--- バンドセット（2×2で4種） ---');
{
  const g = new Game({ seed: 7 });
  g.grid[H - 2][0] = { t: 'guitar' }; g.grid[H - 2][1] = { t: 'drum' };
  g.grid[H - 1][0] = { t: 'bass' };   g.grid[H - 1][1] = { t: 'mic' };
  const c = g.findClears();
  ok(c && c.bandsets.length === 1, 'バンドセット成立');
  ok(c.cells.length === 4, '4セル消える');
}

console.log('--- バンドセット（音符補完） ---');
{
  const g = new Game({ seed: 8 });
  g.grid[H - 2][0] = { t: 'guitar' }; g.grid[H - 2][1] = { t: 'drum' };
  g.grid[H - 1][0] = { t: NOTE };     g.grid[H - 1][1] = { t: 'mic' };
  const c = g.findClears();
  ok(c && c.bandsets.length === 1, '音符が4種目を補完する');
}

console.log('--- 同種が重複する2×2は不成立 ---');
{
  const g = new Game({ seed: 9 });
  g.grid[H - 2][0] = { t: 'guitar' }; g.grid[H - 2][1] = { t: 'guitar' };
  g.grid[H - 1][0] = { t: 'bass' };   g.grid[H - 1][1] = { t: 'mic' };
  ok(g.findClears() === null, '重複ありは不成立');
}

console.log('--- 化石は隣接消去でのみ砕ける ---');
{
  const g = new Game({ seed: 10 });
  g.grid[H - 1][0] = { t: 'guitar' };
  g.grid[H - 1][1] = { t: 'guitar' };
  g.grid[H - 1][2] = { t: 'guitar' };
  g.grid[H - 1][3] = { t: ROCK };
  const c = g.findClears();
  ok(c && c.cells.length === 4, '隣接する化石も一緒に消える');
  const g2 = new Game({ seed: 11 });
  g2.grid[H - 1][5] = { t: ROCK };
  ok(g2.findClears() === null, '孤立した化石は消えない');
}

console.log('--- 重力と連鎖 ---');
{
  const g = new Game({ seed: 12 });
  // 下段: G G G / その上に D が3つ縦に並ばず横に散らばる形で連鎖を作る
  g.grid[H - 1][0] = { t: 'guitar' };
  g.grid[H - 1][1] = { t: 'guitar' };
  g.grid[H - 1][2] = { t: 'guitar' };
  g.grid[H - 2][0] = { t: 'drum' };
  g.grid[H - 2][1] = { t: 'drum' };
  g.grid[H - 3][2] = { t: 'drum' };
  const c1 = g.findClears();
  ok(c1 && c1.cells.length === 3, '1連鎖目はギター3つ');
  g.clearCells(c1.cells);
  const moved = g.applyGravity();
  ok(moved.length === 3, '3セルが落下');
  const c2 = g.findClears();
  ok(c2 && c2.cells.length === 3, '2連鎖目でドラム3つが消える');
}

console.log('--- スコア計算 ---');
{
  const clear = { cells: new Array(4), bandsets: [{}], runs: [] };
  const s1 = E.scoreStep(clear, 1, { fanRate: 1 });
  const s2 = E.scoreStep(clear, 2, { fanRate: 1 });
  ok(s1.score === 4 * 10 + 250, '1連鎖の基本スコア');
  ok(s2.score === (4 * 10 + 250) * 2, '2連鎖で2倍');
  ok(s2.fans > s1.fans, '連鎖でファンが増える');
  const s3 = E.scoreStep(clear, 1, { fanRate: 1, scoreMult: 2 });
  ok(s3.score === s1.score * 2, 'スコア倍率スキルが効く');
}

console.log('--- ゲームオーバー ---');
{
  const g = new Game({ seed: 13 });
  for (let y = HIDDEN; y < H; y++) for (let x = 2; x <= 4; x++) g.grid[y][x] = { t: ROCK };
  ok(!g.spawn(), 'スポーン位置が埋まっていたら失敗');
  ok(g.over, 'ゲームオーバーになる');
}

console.log('--- 統計とスキル補助 ---');
{
  const g = new Game({ seed: 14 });
  g.grid[H - 1][0] = { t: 'guitar' };
  g.grid[H - 1][1] = { t: 'guitar' };
  g.grid[H - 1][2] = { t: 'drum' };
  ok(g.mostCommonType() === 'guitar', '最多楽器の判定');
  ok(g.leastCommonType() === 'drum', '最少楽器の判定');
  ok(!g.dangerLevel(), '危険状態でない');
  g.grid[HIDDEN][0] = { t: 'bass' };
  ok(g.dangerLevel(), '上段に積むと危険状態');
}

console.log('--- ホールド ---');
{
  const g = new Game({ seed: 20 });
  g.spawn();
  const firstCells = g.cur.cells.slice();
  const next = g.queue[0].slice();
  ok(g.holdSwap(), '初回ホールド成功');
  ok(g.holdPiece.join() === firstCells.join(), 'ホールドに元ピースが入る');
  ok(g.cur.cells.join() === next.join(), '次のピースが繰り出される');
  ok(!g.canHold, '同じピースでは再ホールド不可');
  ok(!g.holdSwap(), '2回目のホールドは失敗する');
  g.hardDrop(); g.lock(); g.spawn();
  ok(g.canHold, '新しいピースでホールド可能に戻る');
  const held = g.holdPiece.slice();
  const cur2 = g.cur.cells.slice();
  ok(g.holdSwap(), '入れ替えホールド成功');
  ok(g.cur.cells.join() === held.join(), 'ホールドしていたピースが出てくる');
  ok(g.holdPiece.join() === cur2.join(), '今のピースがホールドに入る');
}

console.log('--- 長時間の自動プレイで例外が出ない ---');
{
  const g = new Game({ seed: 99 });
  g.rockChance = 0.05;
  let steps = 0;
  outer:
  while (!g.over && steps < 5000) {
    if (!g.spawn()) break;
    // ランダム操作
    for (let i = 0; i < 3; i++) {
      const r = g.rng();
      if (r < 0.4) g.move(r < 0.2 ? -1 : 1);
      else if (r < 0.6) g.rotate(1);
    }
    g.hardDrop();
    g.lock();
    let chain = 0;
    let clear;
    while ((clear = g.findClears())) {
      chain++;
      if (chain > 30) { ok(false, '連鎖が無限ループ'); break outer; }
      g.clearCells(clear.cells);
      g.applyGravity();
    }
    steps++;
  }
  ok(steps > 20, '20手以上プレイできた (' + steps + '手)');
  ok(g.over || steps === 5000, '正常に終了');
}

console.log(`\n結果: ${pass} 成功 / ${fail} 失敗`);
process.exit(fail ? 1 : 0);
