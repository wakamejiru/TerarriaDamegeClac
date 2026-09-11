/**
 * Terraria Damage Calculator & Optimization Engine
 */

const REFORGES = {
  warding: { id: 'warding', name: '頑丈', nameEn: 'Warding', def: 4, dr: 0, icon: '🛡️' },
  hard: { id: 'hard', name: 'かたい', nameEn: 'Hard', def: 0, dr: 3, icon: '💎' },
  armored: { id: 'armored', name: '装甲の', nameEn: 'Armored', def: 2, dr: 1.5, icon: '⚙️' }
};

const POTIONS = {
  ironskin: { def: 8, dr: 0, name: '鉄壁のポーション' },
  endurance: { def: 0, dr: 10, name: '耐久のポーション' }
};

/**
 * 実効軽減率の計算
 * E(dr) = 1 - 1 / (1 + dr)
 * @param {number} drPercent 投入軽減率 (%)
 * @returns {number} 実効軽減率 (0.0 〜 1.0)
 */
function getEffectiveDr(drPercent) {
  const dr = Math.max(0, drPercent) / 100;
  return 1 - (1 / (1 + dr));
}

/**
 * 実質被ダメ倍率の計算
 * M(dr) = 1 / (1 + dr)
 * @param {number} drPercent 投入軽減率 (%)
 * @returns {number} 実効倍率 (0.0 〜 1.0)
 */
function getEffectiveMultiplier(drPercent) {
  const dr = Math.max(0, drPercent) / 100;
  return 1 / (1 + dr);
}

/**
 * 被ダメージの計算
 * @param {number} atk 敵攻撃力
 * @param {number} def プレイヤー防御力
 * @param {number} drPercent 投入軽減率 (%)
 * @param {'multiplication' | 'subtraction'} mode 計算方式
 */
function calculateDamage(atk, def, drPercent, mode = 'multiplication') {
  const safeAtk = Math.max(0, Number(atk) || 0);
  const safeDef = Math.max(0, Number(def) || 0);
  const safeDrPercent = Math.max(0, Number(drPercent) || 0);
  const dr = safeDrPercent / 100;

  const effectiveDr = 1 - (1 / (1 + dr));
  const effectiveMultiplier = 1 / (1 + dr);

  let rawDamage;
  const baseDiff = safeAtk - safeDef;

  if (mode === 'subtraction') {
    // 提示された文字通りの式: (攻撃力 - 防御力) - (1 - 1/(1+軽減率))
    rawDamage = baseDiff - effectiveDr;
  } else {
    // 実効乗算方式 (推奨): (攻撃力 - 防御力) * (1 / (1 + 軽減率))
    const dmgAfterDef = Math.max(0, baseDiff);
    rawDamage = dmgAfterDef * effectiveMultiplier;
  }

  // ただし1以下にはならない
  const finalDamage = Math.max(1, rawDamage);

  return {
    finalDamage: Math.round(finalDamage * 100) / 100,
    rawFinalDamage: finalDamage,
    atk: safeAtk,
    def: safeDef,
    drPercent: safeDrPercent,
    effectiveDrPercent: Math.round(effectiveDr * 10000) / 100, // %表示 (例: 9.09%)
    effectiveMultiplier: Math.round(effectiveMultiplier * 10000) / 10000,
    mode
  };
}

/**
 * 5つのアクセサリーのリフォージ全組み合わせをシミュレーションし、
 * 最も被ダメージが低くなる組み合わせを最適化
 * 
 * リフォージ候補:
 * - 頑丈 (w): 防御+4
 * - かたい (h): 軽減率+3%
 * - 装甲の (a): 防御+2, 軽減率+1.5%
 * 
 * 条件: w + h + a = 5
 */
function optimizeReforges(atk, baseDef, baseDr, potions = { ironskin: false, endurance: false }, mode = 'multiplication') {
  const potionDef = (potions.ironskin ? POTIONS.ironskin.def : 0);
  const potionDr = (potions.endurance ? POTIONS.endurance.dr : 0);

  const effectiveBaseDef = baseDef + potionDef;
  const effectiveBaseDr = baseDr + potionDr;

  // ベース状態（リフォージなし）のダメージ
  const baselineResult = calculateDamage(atk, effectiveBaseDef, effectiveBaseDr, mode);

  const results = [];
  const TOTAL_SLOTS = 5;

  // 重複組み合わせ (w, h, a) such that w + h + a = TOTAL_SLOTS
  for (let w = 0; w <= TOTAL_SLOTS; w++) {
    for (let h = 0; h <= TOTAL_SLOTS - w; h++) {
      const a = TOTAL_SLOTS - w - h;

      const bonusDef = (w * REFORGES.warding.def) + (h * REFORGES.hard.def) + (a * REFORGES.armored.def);
      const bonusDr = (w * REFORGES.warding.dr) + (h * REFORGES.hard.dr) + (a * REFORGES.armored.dr);

      const totalDef = effectiveBaseDef + bonusDef;
      const totalDr = effectiveBaseDr + bonusDr;

      const calc = calculateDamage(atk, totalDef, totalDr, mode);
      const dmgReduction = baselineResult.finalDamage - calc.finalDamage;

      results.push({
        wardingCount: w,
        hardCount: h,
        armoredCount: a,
        bonusDef,
        bonusDr,
        totalDef,
        totalDr,
        finalDamage: calc.finalDamage,
        dmgReduction: Math.round(dmgReduction * 100) / 100,
        effectiveDrPercent: calc.effectiveDrPercent,
        slots: [
          ...Array(w).fill(REFORGES.warding),
          ...Array(h).fill(REFORGES.hard),
          ...Array(a).fill(REFORGES.armored)
        ]
      });
    }
  }

  // 被ダメージが最も少ない順にソート
  results.sort((x, y) => {
    if (x.finalDamage !== y.finalDamage) {
      return x.finalDamage - y.finalDamage;
    }
    // 同率なら防御力が高いほうを優先
    return y.totalDef - x.totalDef;
  });

  const best = results[0];

  // 各特化パターンの抽出（比較用）
  const allWarding = results.find(r => r.wardingCount === TOTAL_SLOTS);
  const allHard = results.find(r => r.hardCount === TOTAL_SLOTS);
  const allArmored = results.find(r => r.armoredCount === TOTAL_SLOTS);

  return {
    baseline: baselineResult,
    best,
    allCombinations: results,
    topRankings: results.slice(0, 5),
    specialized: {
      allWarding,
      allHard,
      allArmored
    },
    effectiveBaseDef,
    effectiveBaseDr
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REFORGES,
    POTIONS,
    getEffectiveDr,
    getEffectiveMultiplier,
    calculateDamage,
    optimizeReforges
  };
}
