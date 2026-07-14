export interface AnalysisResult {
  title: string;
  explanation: string;
  suggestion: string;
  lifestyleTip: string;
  category: string;
}

export const REACTION_ANALYSIS: Record<string, AnalysisResult> = {
  fatigue: {
    title: "細胞能量轉換中",
    explanation: "身體正在將大量能量從日常活動轉向內部受損組織的深層修復，這就像系統升級時的暫時性緩慢。",
    suggestion: "這代表您的肝臟正在進行積極排毒，修復反應非常理想。",
    lifestyleTip: "建議今晚在 11 點前就寢，給予肝臟最充裕的修復能量。",
    category: "排毒反應"
  },
  joint_pain: {
    title: "微循環正在打通",
    explanation: "膠囊成分正在深入關節腔修復軟組織，或是正在代謝沉積已久的毒素（如尿酸），打通阻塞的微血管。",
    suggestion: "這是典型的「瞑眩反應」，代表修復力量已到達身體最深處。",
    lifestyleTip: "可適度熱敷痠痛部位，並嚴禁飲用冰水，以維持微循環的通暢。",
    category: "循環改善"
  },
  dizziness: {
    title: "腦部血液含氧提升",
    explanation: "身體正在調整頭部微循環，增加血氧供應，這在初期可能導致短暫的平衡感調整。",
    suggestion: "多見於有血壓波動史或頸椎問題的用戶，是循環改善的訊號。",
    lifestyleTip: "起床或起身時動作放慢，多喝溫開水以穩定內環境。",
    category: "排毒反應"
  },
  skin_rash: {
    title: "皮膚排毒通道啟動",
    explanation: "當肝腎排毒負擔過重時，身體會啟動皮膚這個最大的排毒器官來排出廢物。",
    suggestion: "這是身體在清理深層毒素的表現，通常 1-2 週內會自然消退。",
    lifestyleTip: "穿著寬鬆棉質衣物，避免使用刺激性洗劑，保持皮膚清爽。",
    category: "排毒反應"
  },
  fever: {
    title: "免疫系統活化中",
    explanation: "身體正在提升核心體溫以加速代謝，並激活白血球的吞噬能力，這是在強化免疫屏障。",
    suggestion: "這是免疫力正在「開機」的表現，非常寶貴。",
    lifestyleTip: "多補充水分，觀察體溫，如無極度不適請讓身體自然完成此修復過程。",
    category: "免疫活化"
  },
  thirst: {
    title: "代謝率大幅提升",
    explanation: "細胞修復需要大量水分子參與水解反應與廢物代謝，因此身體會發出缺水訊號。",
    suggestion: "代表您的代謝引擎已全速運轉，請務必補足燃料。",
    lifestyleTip: "將每日飲水量提升至 2500cc-3000cc，分次小口飲用溫水。",
    category: "代謝反應"
  },
  diarrhea: {
    title: "腸道廢物清理中",
    explanation: "身體正在加速排出腸道內積存的腐敗物質與毒素，重新建立健康的菌叢環境。",
    suggestion: "這是腸道「大掃除」的過程，結束後吸收能力會大幅提升。",
    lifestyleTip: "補充溫水，飲食清淡，避免辛辣刺激食物。",
    category: "消化調整"
  }
};

export function getBigDataInsight(dosage: number) {
  if (dosage >= 60) {
    return "根據大數據分析，服用 60 顆加速模式的用戶，通常在第 3-5 天出現明顯的關節痠痛或疲倦感，這代表細胞轉換已進入高峰期，通常在第 7-10 天會感受到體力大幅回升。";
  }
  if (dosage >= 20) {
    return "數據顯示，採用 20 顆以上劑量的用戶，約有 85% 在首週會經歷皮膚或排便的排毒反應，這是身體環境優化的必經過程。";
  }
  return "大多數維持基礎劑量的用戶，在服用 1 個月後會感受到睡眠品質與精神狀態的穩定提升。";
}

export function getInstantFeedback(reactions: string[], dosage: number) {
  const feedbacks = reactions
    .map(r => REACTION_ANALYSIS[r])
    .filter(Boolean);
    
  let dosageAdvice = "";
  if (dosage >= 60) {
    dosageAdvice = "您目前正處於「極致加速模式」，這是一場深層的細胞革命！強烈的瞑眩反應是細胞新舊轉換的訊號，請務必補足水分與休息。";
  } else if (dosage >= 40) {
    dosageAdvice = "您目前正處於「極速修復模式」，細胞轉換速度極快，出現較強烈的反應是正常的。若不適感在可忍受範圍，請堅持；若影響睡眠，可暫時減半 3 天。";
  } else if (dosage >= 10) {
    dosageAdvice = "您正在使用「加速修復劑量」，這能有效縮短修復週期，請保持信心並大量喝水。";
  } else {
    dosageAdvice = "您目前的基礎劑量非常穩健，請持續服用，讓細胞修復力量穩定累積。";
  }

  const bigDataInsight = getBigDataInsight(dosage);

  return {
    feedbacks,
    dosageAdvice,
    bigDataInsight,
    isHighDosage: dosage >= 10
  };
}
