/* PIXEL OFFICE エンジンの単体テスト（node tests/office-engine-test.js で実行） */
const E = require('../scripts/office/engine.js');
const { Office, findPath, isWalkable, tileAt, SEATS, SPOTS, MEETING_SPOTS, MAP_ROWS, COLS } = E;

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}

console.log('--- マップの整合性 ---');
{
  ok(MAP_ROWS.every((r) => r.length === COLS), '全行が同じ幅');
  ok(Object.keys(SEATS).length === 6, '座席が6つある');
  ok(Object.values(SEATS).every((s) => isWalkable(s.x, s.y)), '座席はすべて歩行可能');
  ok(isWalkable(SPOTS.coffee.x, SPOTS.coffee.y), 'コーヒー立ち位置が歩行可能');
  ok(tileAt(SPOTS.coffee.x + 1, SPOTS.coffee.y) === 'm', 'コーヒーメーカーの左に立つ');
  ok(isWalkable(SPOTS.whiteboard.x, SPOTS.whiteboard.y), 'ホワイトボード前が歩行可能');
  ok(MEETING_SPOTS.every((s) => isWalkable(s.x, s.y)), '会議の立ち位置がすべて歩行可能');
}

console.log('--- 経路探索 ---');
{
  const seat = SEATS[1];
  const path = findPath(seat.x, seat.y, SPOTS.coffee.x, SPOTS.coffee.y);
  ok(Array.isArray(path) && path.length > 0, '座席→コーヒーの経路が見つかる');
  ok(path.every((p) => isWalkable(p.x, p.y)), '経路上がすべて歩行可能');
  const last = path[path.length - 1];
  ok(last.x === SPOTS.coffee.x && last.y === SPOTS.coffee.y, '経路の終点が目的地');
  ok(findPath(seat.x, seat.y, 0, 0) === null, '壁への経路はnull');
  ok(findPath(seat.x, seat.y, seat.x, seat.y).length === 0, '同一地点への経路は空');
}

console.log('--- シミュレーション ---');
{
  const office = new Office({ seed: 42 });
  ok(office.agents.length === 6, 'AI社員が6名いる');
  ok(office.agents.every((a) => a.state === 'working'), '始業時は全員作業中');
  ok(office.agents.every((a) => a.task && a.task.text.length > 0), '全員タスクを持っている');
  ok(office.clockText() === '09:00', '始業は09:00');

  /* 8時間分回す */
  for (let i = 0; i < 8 * 60 * 10; i++) office.update(0.1);

  ok(office.clockText() === '17:00', '8時間後は17:00');
  const VALID = ['working', 'walking', 'coffee', 'vending', 'chat', 'whiteboard', 'meeting', 'wander'];
  ok(office.agents.every((a) => VALID.includes(a.state)), '全員の状態が正当');
  ok(office.agents.every((a) => a.x >= 0 && a.x < COLS), '全員がマップ内にいる');
  const totalDone = office.agents.reduce((s, a) => s + a.doneCount, 0);
  ok(totalDone > 10, '8時間でタスクが十分完了している (' + totalDone + '件)');
  ok(office.events.length > 0, 'イベントログが記録されている');
  ok(office.events.some((e) => e.icon === '✅'), '完了ログがある');
  ok(office.events.some((e) => e.icon === '📋'), 'ミーティングログがある');
}

console.log('--- 再現性 ---');
{
  const a = new Office({ seed: 7 });
  const b = new Office({ seed: 7 });
  for (let i = 0; i < 3000; i++) { a.update(0.1); b.update(0.1); }
  const snap = (o) => o.agents.map((x) => x.state + ':' + x.doneCount).join(',');
  ok(snap(a) === snap(b), '同じシードなら同じ結果');
}

console.log('\n結果: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
