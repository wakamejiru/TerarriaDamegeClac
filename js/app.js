/**
 * Terraria Damage Calculator - Application Logic & Tab Controller
 */

// アプリケーション状態 (タブ1とタブ2のステータスを明確に分離)
const state = {
  calcMode: 'multiplication', // 'multiplication' | 'subtraction'
  
  // タブ1: 現在のプレイヤー状態 (リフォージ込みの現在の値をそのまま入力)
  tab1: {
    atk: 1000,
    def: 80,
    dr: 10,
    potionIronskin: false,
    potionEndurance: false
  },

  // タブ2: リフォージ最適化 (リフォージなし・素の防具等のステータスを入力)
  tab2: {
    baseAtk: 1000,
    baseDef: 60,
    baseDr: 0,
    potionIronskin: false,
    potionEndurance: false,
    accessories: ['warding', 'warding', 'hard', 'hard', 'armored'],
    optimization: null
  }
};

// DOM要素キャッシュ
let elements = {};

function initElements() {
  elements = {
    // タブナビゲーション
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    btnTabCurrent: document.getElementById('btnTabCurrent'),
    btnTabOptimizer: document.getElementById('btnTabOptimizer'),
    selectCalcMode: document.getElementById('selectCalcMode'),
    toastNotification: document.getElementById('toastNotification'),

    // --- タブ1 (現在の状態) ---
    inputAtk: document.getElementById('inputAtk'),
    rangeAtk: document.getElementById('rangeAtk'),
    inputDef: document.getElementById('inputDef'),
    rangeDef: document.getElementById('rangeDef'),
    inputDr: document.getElementById('inputDr'),
    rangeDr: document.getElementById('rangeDr'),
    chkIronskin: document.getElementById('chkIronskin'),
    chkEndurance: document.getElementById('chkEndurance'),
    finalDamageVal: document.getElementById('finalDamageVal'),
    damageSubtext: document.getElementById('damageSubtext'),
    totalDefVal: document.getElementById('totalDefVal'),
    totalDrVal: document.getElementById('totalDrVal'),
    effectiveDrVal: document.getElementById('effectiveDrVal'),
    effectiveMultiplierVal: document.getElementById('effectiveMultiplierVal'),

    // --- タブ2 (最適化) ---
    optInputAtk: document.getElementById('optInputAtk'),
    optRangeAtk: document.getElementById('optRangeAtk'),
    optInputDef: document.getElementById('optInputDef'),
    optRangeDef: document.getElementById('optRangeDef'),
    optInputDr: document.getElementById('optInputDr'),
    optRangeDr: document.getElementById('optRangeDr'),
    optChkIronskin: document.getElementById('optChkIronskin'),
    optChkEndurance: document.getElementById('optChkEndurance'),
    bestReforgeBadge: document.getElementById('bestReforgeBadge'),
    baselineDamageVal: document.getElementById('baselineDamageVal'),
    bestDamageVal: document.getElementById('bestDamageVal'),
    bestDiffVal: document.getElementById('bestDiffVal'),
    bestReforgeDetails: document.getElementById('bestReforgeDetails'),
    applyBestToTab1Btn: document.getElementById('applyBestToTab1Btn'),
    applyBestBtn: document.getElementById('applyBestBtn'),
    applyManualToTab1Btn: document.getElementById('applyManualToTab1Btn'),
    specializedCompare: document.getElementById('specializedCompare'),
    accessorySlotsContainer: document.getElementById('accessorySlotsContainer'),
    manualSlotSummary: document.getElementById('manualSlotSummary'),
    rankingTableBody: document.getElementById('rankingTableBody')
  };
}

/**
 * トーストメッセージの表示
 */
let toastTimer = null;
function showToast(message) {
  if (!elements.toastNotification) return;
  elements.toastNotification.textContent = message;
  elements.toastNotification.style.display = 'block';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toastNotification.style.display = 'none';
  }, 2400);
}

/**
 * タブ切り替え処理
 */
function switchTab(targetTabId) {
  elements.tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === targetTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.tabPanes.forEach(pane => {
    if (pane.id === targetTabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  if (typeof resizeAllCharts === 'function') {
    setTimeout(resizeAllCharts, 50);
  }
}

function initTabs() {
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });
}

/**
 * 入力値とスライダーのバインド
 */
function bindSyncInputs(numberInput, rangeInput, obj, key, min, max, onChange) {
  numberInput.addEventListener('input', () => {
    let val = parseFloat(numberInput.value);
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;
    rangeInput.value = val;
    obj[key] = val;
    onChange();
  });

  rangeInput.addEventListener('input', () => {
    const val = parseFloat(rangeInput.value);
    numberInput.value = val;
    obj[key] = val;
    onChange();
  });
}

// ==========================================
// タブ1: 現在の状態の計算＆描画
// ==========================================
function updateTab1() {
  const potionDef = state.tab1.potionIronskin ? POTIONS.ironskin.def : 0;
  const potionDr = state.tab1.potionEndurance ? POTIONS.endurance.dr : 0;

  const totalDef = state.tab1.def + potionDef;
  const totalDr = state.tab1.dr + potionDr;

  const calcResult = calculateDamage(state.tab1.atk, totalDef, totalDr, state.calcMode);

  // 表示更新
  elements.finalDamageVal.textContent = calcResult.finalDamage.toLocaleString();
  elements.totalDefVal.textContent = `${totalDef} (現在値:${state.tab1.def} +ポーション:${potionDef})`;
  elements.totalDrVal.textContent = `${totalDr.toFixed(1)}% (現在値:${state.tab1.dr}% +ポーション:${potionDr}%)`;
  elements.effectiveDrVal.textContent = `${calcResult.effectiveDrPercent.toFixed(2)}%`;
  elements.effectiveMultiplierVal.textContent = `×${calcResult.effectiveMultiplier.toFixed(4)}`;

  if (calcResult.finalDamage === 1) {
    elements.damageSubtext.textContent = '※最低ダメージ保証により1以下になりません';
    elements.damageSubtext.className = 'subtext alert';
  } else {
    elements.damageSubtext.textContent = `軽減前ダメージ: ${Math.max(0, state.tab1.atk - totalDef).toLocaleString()} (軽減効果: -${(Math.max(0, state.tab1.atk - totalDef) - calcResult.finalDamage).toFixed(1)})`;
    elements.damageSubtext.className = 'subtext';
  }

  // タブ1のグラフ更新
  updateDefenseChart(
    state.tab1.atk,
    totalDef,
    totalDr,
    undefined,
    undefined,
    state.calcMode
  );
  updateCurvatureChart(totalDr);
}

// ==========================================
// タブ2: 最適化計算＆描画
// ==========================================
function getTab2AccessoryBonus() {
  let bonusDef = 0;
  let bonusDr = 0;
  state.tab2.accessories.forEach(reforgeId => {
    const ref = REFORGES[reforgeId];
    if (ref) {
      bonusDef += ref.def;
      bonusDr += ref.dr;
    }
  });
  return { bonusDef, bonusDr };
}

function updateTab2() {
  // リフォージなし状態での最適化実行
  const opt = optimizeReforges(
    state.tab2.baseAtk,
    state.tab2.baseDef,
    state.tab2.baseDr,
    { ironskin: state.tab2.potionIronskin, endurance: state.tab2.potionEndurance },
    state.calcMode
  );
  state.tab2.optimization = opt;

  renderOptimization(opt);
  updateManualSlotSummary();
}

function renderOptimization(opt) {
  const best = opt.best;
  const baseline = opt.baseline;

  // 推奨バッジ
  const parts = [];
  if (best.wardingCount > 0) parts.push(`頑丈 ×${best.wardingCount}`);
  if (best.hardCount > 0) parts.push(`かたい ×${best.hardCount}`);
  if (best.armoredCount > 0) parts.push(`装甲の ×${best.armoredCount}`);

  elements.bestReforgeBadge.textContent = parts.join(' ＋ ');
  elements.baselineDamageVal.textContent = `${baseline.finalDamage.toLocaleString()} DMG`;
  elements.bestDamageVal.textContent = `${best.finalDamage.toLocaleString()} DMG`;
  elements.bestDiffVal.innerHTML = `<span class="text-green font-num">-${best.dmgReduction.toFixed(1)} DMG (-${((best.dmgReduction / baseline.finalDamage) * 100).toFixed(1)}%)</span>`;

  elements.bestReforgeDetails.innerHTML = `
    <div>防御力: <strong class="font-num">${best.totalDef}</strong> (素:${opt.effectiveBaseDef} +枠:${best.bonusDef})</div>
    <div>投入軽減率: <strong class="font-num">${best.totalDr.toFixed(1)}%</strong> (素:${opt.effectiveBaseDr}% +枠:${best.bonusDr.toFixed(1)}%)</div>
    <div>実効軽減: <strong class="font-num text-green">${best.effectiveDrPercent.toFixed(2)}%</strong></div>
  `;

  // 特化比較
  const spec = opt.specialized;
  elements.specializedCompare.innerHTML = `
    <div class="spec-item ${best.wardingCount === 5 ? 'is-best' : ''}">
      <div class="spec-title">🛡️ 頑丈 特化 (5枠)</div>
      <div class="spec-desc">防御力 +20 / 軽減率 +0%</div>
      <div class="spec-val font-num">${spec.allWarding.finalDamage} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted)">DMG</span></div>
      <div style="font-size:0.75rem; color:var(--color-green); margin-top:4px;">-${spec.allWarding.dmgReduction.toFixed(1)} 軽減</div>
    </div>
    <div class="spec-item ${best.hardCount === 5 ? 'is-best' : ''}">
      <div class="spec-title">💎 かたい 特化 (5枠)</div>
      <div class="spec-desc">防御力 +0 / 軽減率 +15%</div>
      <div class="spec-val font-num">${spec.allHard.finalDamage} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted)">DMG</span></div>
      <div style="font-size:0.75rem; color:var(--color-green); margin-top:4px;">-${spec.allHard.dmgReduction.toFixed(1)} 軽減</div>
    </div>
    <div class="spec-item ${best.armoredCount === 5 ? 'is-best' : ''}">
      <div class="spec-title">⚙️ 装甲の 特化 (5枠)</div>
      <div class="spec-desc">防御力 +10 / 軽減率 +7.5%</div>
      <div class="spec-val font-num">${spec.allArmored.finalDamage} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted)">DMG</span></div>
      <div style="font-size:0.75rem; color:var(--color-green); margin-top:4px;">-${spec.allArmored.dmgReduction.toFixed(1)} 軽減</div>
    </div>
  `;

  // ランキング表
  elements.rankingTableBody.innerHTML = '';
  opt.topRankings.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const comboText = [
      item.wardingCount ? `頑丈×${item.wardingCount}` : '',
      item.hardCount ? `かたい×${item.hardCount}` : '',
      item.armoredCount ? `装甲の×${item.armoredCount}` : ''
    ].filter(Boolean).join(' ＋ ');

    tr.innerHTML = `
      <td><span class="rank-badge ${idx === 0 ? 'rank-1' : ''}">#${idx + 1}</span></td>
      <td><strong>${comboText}</strong></td>
      <td class="font-num">${item.totalDef}</td>
      <td class="font-num">${item.totalDr.toFixed(1)}%</td>
      <td class="font-num" style="font-weight:700; color:#fff;">${item.finalDamage}</td>
      <td class="font-num text-green">-${item.dmgReduction.toFixed(1)}</td>
    `;
    elements.rankingTableBody.appendChild(tr);
  });
}

/**
 * 手動5枠スロットの描画
 */
function renderAccessorySlots() {
  if (!elements.accessorySlotsContainer) return;
  elements.accessorySlotsContainer.innerHTML = '';

  state.tab2.accessories.forEach((currentReforge, index) => {
    const slotCard = document.createElement('div');
    slotCard.className = 'slot-box';

    slotCard.innerHTML = `
      <div class="slot-box-top">
        <span>枠 ${index + 1}</span>
        <span>${REFORGES[currentReforge]?.icon || '▫️'}</span>
      </div>
      <select class="slot-select-input" data-slot="${index}">
        <option value="warding" ${currentReforge === 'warding' ? 'selected' : ''}>頑丈 (防御+4)</option>
        <option value="hard" ${currentReforge === 'hard' ? 'selected' : ''}>かたい (軽減3%)</option>
        <option value="armored" ${currentReforge === 'armored' ? 'selected' : ''}>装甲の (防御+2, 軽減1.5%)</option>
        <option value="none" ${currentReforge === 'none' ? 'selected' : ''}>なし (ボーナスなし)</option>
      </select>
    `;

    const select = slotCard.querySelector('.slot-select-input');
    select.addEventListener('change', (e) => {
      state.tab2.accessories[index] = e.target.value;
      updateManualSlotSummary();
    });

    elements.accessorySlotsContainer.appendChild(slotCard);
  });
}

function updateManualSlotSummary() {
  const bonus = getTab2AccessoryBonus();
  const potDef = state.tab2.potionIronskin ? POTIONS.ironskin.def : 0;
  const potDr = state.tab2.potionEndurance ? POTIONS.endurance.dr : 0;

  const totalDef = state.tab2.baseDef + potDef + bonus.bonusDef;
  const totalDr = state.tab2.baseDr + potDr + bonus.bonusDr;
  const calc = calculateDamage(state.tab2.baseAtk, totalDef, totalDr, state.calcMode);

  elements.manualSlotSummary.innerHTML = `
    <span>現在の5枠ボーナス: <strong class="font-num">防御+${bonus.bonusDef} / 軽減+${bonus.bonusDr.toFixed(1)}%</strong></span>
    <span>合計ステータス: <strong class="font-num">防御 ${totalDef} / 軽減 ${totalDr.toFixed(1)}%</strong></span>
    <span>この構成での被ダメ: <strong class="font-num text-green">${calc.finalDamage} DMG</strong></span>
  `;
}

// ==========================================
// 反映アクション (タブ2 → タブ1)
// ==========================================

/**
 * 最適リフォージ結果をタブ1（現在の状態）に反映する
 */
function applyBestToTab1() {
  if (!state.tab2.optimization || !state.tab2.optimization.best) return;
  const best = state.tab2.optimization.best;

  // タブ1の防御力 ＝ タブ2の素防御力 ＋ 最適リフォージ防御ボーナス
  state.tab1.def = state.tab2.baseDef + best.bonusDef;
  state.tab1.dr = state.tab2.baseDr + best.bonusDr;
  state.tab1.atk = state.tab2.baseAtk;
  state.tab1.potionIronskin = state.tab2.potionIronskin;
  state.tab1.potionEndurance = state.tab2.potionEndurance;

  // タブ1のUI入力値を更新
  elements.inputDef.value = state.tab1.def;
  elements.rangeDef.value = state.tab1.def;
  elements.inputDr.value = state.tab1.dr;
  elements.rangeDr.value = state.tab1.dr;
  elements.inputAtk.value = state.tab1.atk;
  elements.rangeAtk.value = state.tab1.atk;
  elements.chkIronskin.checked = state.tab1.potionIronskin;
  elements.chkEndurance.checked = state.tab1.potionEndurance;

  // タブ1の再計算
  updateTab1();

  // 最適解を手動スロットにも反映しておく
  applyBestToSlots();

  // トースト表示＆タブ1へ自動切り替え
  showToast(`最適リフォージ結果 (防御:${state.tab1.def}, 軽減:${state.tab1.dr}%) をタブ1に反映しました！`);
  switchTab('tab-current');
}

/**
 * 手動で組んだ5枠の構成をタブ1に反映する
 */
function applyManualToTab1() {
  const bonus = getTab2AccessoryBonus();

  state.tab1.def = state.tab2.baseDef + bonus.bonusDef;
  state.tab1.dr = state.tab2.baseDr + bonus.bonusDr;
  state.tab1.atk = state.tab2.baseAtk;
  state.tab1.potionIronskin = state.tab2.potionIronskin;
  state.tab1.potionEndurance = state.tab2.potionEndurance;

  elements.inputDef.value = state.tab1.def;
  elements.rangeDef.value = state.tab1.def;
  elements.inputDr.value = state.tab1.dr;
  elements.rangeDr.value = state.tab1.dr;
  elements.inputAtk.value = state.tab1.atk;
  elements.rangeAtk.value = state.tab1.atk;
  elements.chkIronskin.checked = state.tab1.potionIronskin;
  elements.chkEndurance.checked = state.tab1.potionEndurance;

  updateTab1();
  showToast(`手動アクセサリー構成 (防御:${state.tab1.def}, 軽減:${state.tab1.dr}%) をタブ1に反映しました！`);
  switchTab('tab-current');
}

/**
 * 最適解を手動5枠スロットにセットする
 */
function applyBestToSlots() {
  if (!state.tab2.optimization || !state.tab2.optimization.best) return;
  const best = state.tab2.optimization.best;

  const newSlots = [];
  for (let i = 0; i < best.wardingCount; i++) newSlots.push('warding');
  for (let i = 0; i < best.hardCount; i++) newSlots.push('hard');
  for (let i = 0; i < best.armoredCount; i++) newSlots.push('armored');

  state.tab2.accessories = newSlots;
  renderAccessorySlots();
  updateManualSlotSummary();
}

// ==========================================
// 初期化
// ==========================================
function init() {
  initElements();
  initTabs();

  // --- タブ1 入力バインド ---
  bindSyncInputs(elements.inputAtk, elements.rangeAtk, state.tab1, 'atk', 0, 5000, updateTab1);
  bindSyncInputs(elements.inputDef, elements.rangeDef, state.tab1, 'def', 0, 300, updateTab1);
  bindSyncInputs(elements.inputDr, elements.rangeDr, state.tab1, 'dr', 0, 100, updateTab1);

  elements.chkIronskin.addEventListener('change', (e) => {
    state.tab1.potionIronskin = e.target.checked;
    updateTab1();
  });
  elements.chkEndurance.addEventListener('change', (e) => {
    state.tab1.potionEndurance = e.target.checked;
    updateTab1();
  });

  // --- タブ2 入力バインド (独立した素ステータス) ---
  bindSyncInputs(elements.optInputAtk, elements.optRangeAtk, state.tab2, 'baseAtk', 0, 5000, updateTab2);
  bindSyncInputs(elements.optInputDef, elements.optRangeDef, state.tab2, 'baseDef', 0, 300, updateTab2);
  bindSyncInputs(elements.optInputDr, elements.optRangeDr, state.tab2, 'baseDr', 0, 100, updateTab2);

  elements.optChkIronskin.addEventListener('change', (e) => {
    state.tab2.potionIronskin = e.target.checked;
    updateTab2();
  });
  elements.optChkEndurance.addEventListener('change', (e) => {
    state.tab2.potionEndurance = e.target.checked;
    updateTab2();
  });

  // 計算方式変更
  elements.selectCalcMode.addEventListener('change', (e) => {
    state.calcMode = e.target.value;
    updateTab1();
    updateTab2();
  });

  // ボタンイベント
  elements.applyBestToTab1Btn.addEventListener('click', applyBestToTab1);
  elements.applyBestBtn.addEventListener('click', () => {
    applyBestToSlots();
    showToast('最適解を手動枠にセットしました');
  });
  elements.applyManualToTab1Btn.addEventListener('click', applyManualToTab1);

  // 手動枠初期生成
  renderAccessorySlots();

  // 初期計算実行
  updateTab1();
  updateTab2();
}

window.addEventListener('DOMContentLoaded', init);
