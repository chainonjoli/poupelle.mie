/* ダサザウルス エンジンの単体テスト（node tests/dasazaurus-test.js で実行） */
const Cards = require('../scripts/dasazaurus/cards.js');
const Lines = require('../scripts/dasazaurus/lines.js');
const E = require('../scripts/dasazaurus/engine.js');
const { makeRng, buildDeck, MemoryGame, ReactionPicker } = E;

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}

console.log('--- カード・台詞データ ---');
{
  ok(Cards.MEMBER_CARDS.length === 4, 'メンバーカードは4種');
  ok(Cards.ITEM_CARDS.length >= 28, 'アイテムカードは28種以上（LEGEND 8×8=32ペア分）');
  const ids = new Set();
  Cards.MEMBER_CARDS.concat(Cards.ITEM_CARDS, [Cards.DOKI_CARD]).forEach((c) => ids.add(c.id));
  ok(ids.size === Cards.MEMBER_CARDS.length + Cards.ITEM_CARDS.length + 1, 'カードIDに重複なし');
  ok(Cards.DIFFICULTIES.length === 4, '難易度は4段階');
  ok(Cards.STAGES.length === 5, 'ステージは5会場');
  ok(Cards.STAGES[0].id === 'park' && Cards.STAGES[4].id === 'makuhari', '公園から幕張メッセへ');
  const lineCount = Lines.countLines();
  console.log('    （総台詞数: ' + lineCount + '）');
  ok(lineCount >= 100, '台詞は100種類以上');
}

console.log('--- デッキ生成 ---');
{
  Cards.DIFFICULTIES.forEach((d) => {
    const rng = makeRng(11);
    const { deck, pairs } = buildDeck({ cols: d.cols, rows: d.rows, rng, dokiChance: 0 });
    ok(deck.length === d.cols * d.rows, d.name + ': 枚数が ' + d.cols + '×' + d.rows);
    ok(pairs === deck.length / 2, d.name + ': ペア数が枚数の半分');
    const count = {};
    deck.forEach((id) => { count[id] = (count[id] || 0) + 1; });
    ok(Object.values(count).every((n) => n === 2), d.name + ': すべてのカードがちょうど2枚');
    const members = Cards.MEMBER_CARDS.map((c) => c.id);
    ok(members.every((m) => count[m] === 2), d.name + ': メンバー4人が必ず入る');
  });

  const rng1 = makeRng(5);
  const withDoki = buildDeck({ cols: 4, rows: 4, rng: rng1, dokiChance: 1 });
  ok(withDoki.hasDoki, 'dokiChance=1 で隠しキャラが入る');
  ok(withDoki.deck.filter((id) => id === 'dokidoki').length === 2, '隠しキャラもペアで入る');
  const members = Cards.MEMBER_CARDS.map((c) => c.id);
  ok(members.every((m) => withDoki.deck.indexOf(m) !== -1), '隠しキャラが入ってもメンバーは残る');

  const rng2 = makeRng(5);
  const noDoki = buildDeck({ cols: 4, rows: 4, rng: rng2, dokiChance: 0 });
  ok(!noDoki.hasDoki && noDoki.deck.indexOf('dokidoki') === -1, 'dokiChance=0 では入らない');
}

console.log('--- 神経衰弱の状態遷移 ---');
{
  const g = new MemoryGame({ cols: 4, rows: 4, seed: 42, dokiChance: 0 });
  // デッキを覗いてペアの場所を特定（テスト用）
  const find = (excl) => {
    for (let i = 0; i < g.deck.length; i++) {
      for (let j = i + 1; j < g.deck.length; j++) {
        if (g.deck[i] === g.deck[j] && excl.indexOf(i) === -1 && excl.indexOf(j) === -1) return [i, j];
      }
    }
    return null;
  };
  const [a, b] = find([]);
  ok(g.flip(a).type === 'first', '1枚目は first');
  ok(g.flip(a).type === 'reject', '同じカードの2度めくりは reject');
  const m = g.flip(b);
  ok(m.type === 'match' && m.combo === 1, '同じ絵で match、コンボ1');
  ok(g.flip(a).type === 'reject', 'マッチ済みカードは reject');
  ok(g.moves === 1, '手数は組単位で数える');

  // わざとmiss
  let missA = -1, missB = -1;
  outer:
  for (let i = 0; i < g.deck.length; i++) {
    if (g.matched[i]) continue;
    for (let j = 0; j < g.deck.length; j++) {
      if (i !== j && !g.matched[j] && g.deck[i] !== g.deck[j]) { missA = i; missB = j; break outer; }
    }
  }
  g.flip(missA);
  const miss = g.flip(missB);
  ok(miss.type === 'miss', 'ちがう絵は miss');
  ok(g.combo === 0, 'missでコンボはリセット');
  ok(g.flip(0).type === 'reject', 'miss後 closeMiss まではめくれない');
  ok(g.closeMiss(), 'closeMiss で復帰');
  ok(!g.pendingMiss, 'pendingMiss が解除される');

  // 全部そろえてクリア
  let guard = 100;
  while (!g.cleared && guard-- > 0) {
    const matchedIdx = [];
    g.deck.forEach((_, i) => { if (g.matched[i]) matchedIdx.push(i); });
    const p = find(matchedIdx);
    g.flip(p[0]);
    g.flip(p[1]);
  }
  ok(g.cleared, '全ペアで cleared');
  ok(g.matchedPairs === g.pairs, 'matchedPairs == pairs');
  ok(g.flip(0).type === 'reject', 'クリア後は reject');
  ok(g.maxCombo >= 1, 'maxCombo を記録');
}

console.log('--- 隠しキャラのマッチ ---');
{
  const g = new MemoryGame({ cols: 4, rows: 4, seed: 9, dokiChance: 1 });
  const idx = [];
  g.deck.forEach((id, i) => { if (id === 'dokidoki') idx.push(i); });
  ok(idx.length === 2, '隠しキャラペアがある');
  g.flip(idx[0]);
  const ev = g.flip(idx[1]);
  ok(ev.type === 'match' && ev.isDoki, '隠しキャラのマッチで isDoki フラグ');
}

console.log('--- リアクション抽選 ---');
{
  const rng = makeRng(7);
  const p = new ReactionPicker(rng);
  const validChars = ['takeru', 'funky', 'terako', 'shibakuzo', 'dokidoki'];

  ['start', 'first', 'match', 'miss', 'combo', 'clear'].forEach((ev) => {
    const r = p.pick(ev);
    ok(Array.isArray(r) && r.length >= 1 && r.length <= 2 &&
       r.every((x) => validChars.indexOf(x.c) !== -1 && typeof x.t === 'string' && x.t.length > 0),
       ev + ': 正しい形式のリアクション');
  });

  const doki = p.pick('doki');
  ok(doki.length === 1 && doki[0].c === 'dokidoki', 'doki: DOKIDOKIが喋る');

  // 多数回まわして、直近重複しない・掛け合いと居眠りが出る
  let prevText = null, dupAdjacent = 0, duoCount = 0, sleepCount = 0;
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const ev = ['first', 'match', 'miss'][i % 3];
    const r = p.pick(ev);
    if (r.length === 2) duoCount++;
    r.forEach((x) => {
      if (x.t === prevText) dupAdjacent++;
      prevText = x.t;
      seen.add(x.t);
      if (x.sleeping) sleepCount++;
    });
  }
  ok(dupAdjacent === 0, '同じ台詞が連続しない（seed=7・300回）');
  ok(seen.size >= 60, 'いろいろな台詞が出る（' + seen.size + '種）');
  ok(duoCount > 0, '掛け合いが発生する（' + duoCount + '回）');
  ok(sleepCount > 0, 'SHIBAKUZOが寝る（' + sleepCount + '回）');
}

console.log('');
console.log(`結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
