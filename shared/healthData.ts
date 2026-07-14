// ============================================================
// Putier 好轉反應自主查詢系統 - 核心業務資料
// ============================================================

export type Gender = "male" | "female";

// ── 成分標籤 ──────────────────────────────────────────────
export const INGREDIENTS = [
  { id: "deer_placenta", name: "鹿胎盤活細胞", color: "#E91E8C" },
  { id: "core_key", name: "核心鑰鍵", color: "#9C27B0" },
  { id: "deer_velvet", name: "鹿茸臘萃", color: "#673AB7" },
  { id: "puya_saponin", name: "普亞參皂", color: "#3F51B5" },
  { id: "deer_ganoderma", name: "鹿角靈芝", color: "#2196F3" },
  { id: "fucoidan", name: "褐藻糖膠", color: "#00BCD4" },
  { id: "apple_polyphenol", name: "蘋果多酚", color: "#4CAF50" },
  { id: "marine_collagen", name: "海洋膠原蛋白", color: "#8BC34A" },
  { id: "evening_primrose", name: "月見草油", color: "#CDDC39" },
  { id: "avocado_oil", name: "酪梨油", color: "#009688" },
  { id: "squalene", name: "深海鮫精", color: "#00ACC1" },
  { id: "aloe", name: "蘆薈", color: "#43A047" },
  { id: "borage_oil", name: "琉璃苣油", color: "#F57C00" },
  { id: "lycopene", name: "蕃茄紅素", color: "#E53935" },
] as const;

export type IngredientId = (typeof INGREDIENTS)[number]["id"];

// ── 症狀分類 ──────────────────────────────────────────────
export interface SymptomItem {
  id: string;
  label: string;
  genderFilter?: Gender; // 若設定則只顯示給該性別
}

export interface SymptomCategory {
  id: string;
  name: string;
  emoji: string;
  items: SymptomItem[];
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: "circulation",
    name: "循環系統保健需求",
    emoji: "❤️",
    items: [
      { id: "high_blood_pressure", label: "高血壓" },
      { id: "low_blood_pressure", label: "低血壓" },
      { id: "heart_palpitation", label: "心悸" },
      { id: "poor_circulation", label: "末梢循環不良（手腳冰冷）" },
      { id: "varicose_veins", label: "靜脈曲張" },
      { id: "anemia", label: "貧血" },
      { id: "stroke_history", label: "曾有中風史" },
      { id: "heart_disease", label: "心臟病" },
    ],
  },
  {
    id: "immune",
    name: "免疫系統保健需求",
    emoji: "🛡️",
    items: [
      { id: "frequent_cold", label: "容易感冒" },
      { id: "allergy", label: "過敏（鼻炎、皮膚過敏）" },
      { id: "autoimmune", label: "自體免疫疾病" },
      { id: "cancer_history", label: "曾有癌症史" },
      { id: "fatigue", label: "長期疲勞、體力差" },
      { id: "low_immunity", label: "免疫力低下" },
    ],
  },
  {
    id: "bone_joint",
    name: "骨骼關節保健需求",
    emoji: "🦴",
    items: [
      { id: "joint_pain", label: "關節疼痛" },
      { id: "arthritis", label: "關節炎" },
      { id: "osteoporosis", label: "骨質疏鬆" },
      { id: "back_pain", label: "腰背痠痛" },
      { id: "neck_shoulder", label: "頸肩僵硬" },
      { id: "gout", label: "痛風" },
    ],
  },
  {
    id: "digestive",
    name: "消化系統保健需求",
    emoji: "🫁",
    items: [
      { id: "gastritis", label: "胃炎、胃潰瘍" },
      { id: "constipation", label: "便秘" },
      { id: "diarrhea", label: "腹瀉、腸躁症" },
      { id: "bloating", label: "脹氣、消化不良" },
      { id: "liver_issue", label: "肝臟問題（脂肪肝、肝炎）" },
      { id: "hemorrhoids", label: "痔瘡" },
    ],
  },
  {
    id: "skin",
    name: "皮膚保健需求",
    emoji: "✨",
    items: [
      { id: "acne", label: "痘痘、粉刺" },
      { id: "eczema", label: "濕疹、皮膚炎" },
      { id: "aging_skin", label: "皮膚老化、鬆弛" },
      { id: "pigmentation", label: "色素沉澱、斑點" },
      { id: "dry_skin", label: "皮膚乾燥、缺水" },
      { id: "hair_loss", label: "落髮、頭髮稀疏" },
    ],
  },
  {
    id: "metabolism",
    name: "代謝調整需求",
    emoji: "⚡",
    items: [
      { id: "diabetes", label: "糖尿病、血糖偏高" },
      { id: "high_cholesterol", label: "高血脂、膽固醇偏高" },
      { id: "obesity", label: "體重過重、肥胖" },
      { id: "thyroid", label: "甲狀腺問題" },
      { id: "uric_acid", label: "尿酸偏高" },
      { id: "kidney_issue", label: "腎臟問題" },
    ],
  },
  {
    id: "female",
    name: "女性保健需求",
    emoji: "🌸",
    items: [
      { id: "menstrual_pain", label: "經痛", genderFilter: "female" },
      { id: "irregular_period", label: "月經不規律", genderFilter: "female" },
      { id: "menopause", label: "更年期症狀", genderFilter: "female" },
      { id: "ovarian_cyst", label: "卵巢囊腫、子宮肌瘤", genderFilter: "female" },
      { id: "pcos", label: "多囊卵巢症候群", genderFilter: "female" },
      { id: "vaginal_dryness", label: "陰道乾澀", genderFilter: "female" },
      { id: "fertility", label: "備孕、不孕問題", genderFilter: "female" },
    ],
  },
  {
    id: "eye",
    name: "眼睛保健需求",
    emoji: "👁️",
    items: [
      { id: "dry_eye", label: "乾眼症" },
      { id: "myopia", label: "近視加深" },
      { id: "eye_fatigue", label: "眼睛疲勞、視力模糊" },
      { id: "floaters", label: "飛蚊症" },
      { id: "glaucoma", label: "青光眼、白內障" },
      { id: "macular", label: "黃斑部病變" },
    ],
  },
];

// ── 好轉反應資料 ──────────────────────────────────────────
export interface HerxReaction {
  symptomId: string;
  possibleReactions: string[];
  ingredients: IngredientId[];
  improvement: string;
}

export const HERX_REACTIONS: HerxReaction[] = [
  // 循環系統
  {
    symptomId: "high_blood_pressure",
    possibleReactions: ["初期可能出現輕微頭暈", "面部潮紅感", "心跳稍加速"],
    ingredients: ["deer_placenta", "deer_ganoderma", "fucoidan"],
    improvement: "鹿角靈芝中的三萜類化合物能抑制血管收縮素轉化酶（ACE），褐藻糖膠促進一氧化氮合成，有助血管舒張，逐步調節血壓至正常範圍。",
  },
  {
    symptomId: "low_blood_pressure",
    possibleReactions: ["初期可能感到輕微心跳加速", "輕微頭暈感"],
    ingredients: ["deer_placenta", "puya_saponin", "deer_velvet"],
    improvement: "鹿胎盤活細胞含有豐富的生長因子，普亞參皂能促進腎上腺功能，鹿茸臘萃中的多胺類物質有助提升血管張力，改善低血壓症狀。",
  },
  {
    symptomId: "heart_palpitation",
    possibleReactions: ["初期心跳可能稍有波動", "輕微胸悶感"],
    ingredients: ["deer_ganoderma", "fucoidan", "deer_placenta"],
    improvement: "鹿角靈芝的多醣體能調節自律神經，改善心臟節律；褐藻糖膠具有抗凝血作用，改善心臟血液循環，減少心悸發生。",
  },
  {
    symptomId: "poor_circulation",
    possibleReactions: ["初期手腳可能出現輕微刺麻感", "局部發熱感"],
    ingredients: ["deer_placenta", "evening_primrose", "borage_oil"],
    improvement: "月見草油與琉璃苣油富含 GLA（γ-次亞麻油酸），能促進前列腺素合成，改善末梢血液循環；鹿胎盤活細胞促進微血管新生，有效改善手腳冰冷。",
  },
  {
    symptomId: "varicose_veins",
    possibleReactions: ["初期患部可能感到輕微脹熱", "局部搔癢感"],
    ingredients: ["fucoidan", "marine_collagen", "deer_placenta"],
    improvement: "褐藻糖膠能增強靜脈壁彈性，海洋膠原蛋白補充血管壁所需膠原蛋白，鹿胎盤活細胞促進靜脈瓣膜修復，逐步改善靜脈曲張。",
  },
  {
    symptomId: "anemia",
    possibleReactions: ["初期可能出現輕微疲倦感加重", "頭暈感"],
    ingredients: ["deer_placenta", "deer_velvet", "puya_saponin"],
    improvement: "鹿茸臘萃含有豐富的造血因子，能促進骨髓造血功能；普亞參皂促進鐵質吸收；鹿胎盤活細胞提供造血所需的多種生長因子，改善貧血狀況。",
  },
  {
    symptomId: "stroke_history",
    possibleReactions: ["初期可能出現輕微頭暈", "睡眠品質短暫改變"],
    ingredients: ["fucoidan", "deer_ganoderma", "squalene"],
    improvement: "褐藻糖膠具有抗凝血及抗血栓作用，鹿角靈芝改善腦部血液循環，深海鮫精提供大腦所需的不飽和脂肪酸，有助腦細胞修復與預防再次中風。",
  },
  {
    symptomId: "heart_disease",
    possibleReactions: ["初期可能出現輕微心跳變化", "短暫疲倦感"],
    ingredients: ["deer_ganoderma", "fucoidan", "squalene", "deer_placenta"],
    improvement: "鹿角靈芝三萜類化合物能保護心肌細胞，褐藻糖膠改善冠狀動脈血流，深海鮫精提供心肌所需能量，鹿胎盤活細胞促進心肌細胞修復再生。",
  },
  // 免疫系統
  {
    symptomId: "frequent_cold",
    possibleReactions: ["初期可能出現輕微發燒或排毒反應", "鼻涕增多"],
    ingredients: ["deer_ganoderma", "fucoidan", "aloe", "deer_placenta"],
    improvement: "鹿角靈芝多醣體能活化 NK 細胞與巨噬細胞，褐藻糖膠促進干擾素分泌，蘆薈多醣提升黏膜免疫力，全面強化免疫防護系統。",
  },
  {
    symptomId: "allergy",
    possibleReactions: ["初期過敏症狀可能短暫加重", "皮膚輕微搔癢"],
    ingredients: ["fucoidan", "evening_primrose", "borage_oil", "aloe"],
    improvement: "褐藻糖膠能調節 Th1/Th2 免疫平衡，月見草油與琉璃苣油的 GLA 能抑制發炎介質，蘆薈提供天然抗組胺效果，從根本改善過敏體質。",
  },
  {
    symptomId: "autoimmune",
    possibleReactions: ["初期症狀可能有短暫波動", "輕微疲倦感"],
    ingredients: ["deer_placenta", "deer_ganoderma", "fucoidan"],
    improvement: "鹿胎盤活細胞含有免疫調節肽，能重新校正免疫系統；鹿角靈芝多醣體具有雙向免疫調節作用，褐藻糖膠抑制過度的免疫反應，改善自體免疫失衡。",
  },
  {
    symptomId: "cancer_history",
    possibleReactions: ["初期可能出現排毒反應", "輕微疲倦感加重"],
    ingredients: ["fucoidan", "deer_ganoderma", "lycopene", "apple_polyphenol"],
    improvement: "褐藻糖膠具有強效抗腫瘤活性，能誘導癌細胞凋亡；鹿角靈芝多醣體增強抗腫瘤免疫力；蕃茄紅素與蘋果多酚提供強力抗氧化保護，預防細胞癌變。",
  },
  {
    symptomId: "fatigue",
    possibleReactions: ["初期可能疲勞感短暫加重", "睡眠需求增加"],
    ingredients: ["deer_placenta", "puya_saponin", "deer_velvet", "squalene"],
    improvement: "鹿胎盤活細胞提供細胞能量代謝所需的生長因子，普亞參皂調節腎上腺功能，鹿茸臘萃促進粒線體功能，深海鮫精提供細胞氧氣供應，全面提升體能。",
  },
  {
    symptomId: "low_immunity",
    possibleReactions: ["初期可能出現輕微排毒反應", "短暫疲倦感"],
    ingredients: ["deer_ganoderma", "fucoidan", "deer_placenta", "aloe"],
    improvement: "鹿角靈芝多醣體活化免疫細胞，褐藻糖膠促進免疫因子分泌，鹿胎盤活細胞重建免疫系統，蘆薈多醣增強腸道免疫屏障，全面提升免疫力。",
  },
  // 骨骼關節
  {
    symptomId: "joint_pain",
    possibleReactions: ["初期關節可能出現短暫酸脹感", "輕微發熱感"],
    ingredients: ["deer_velvet", "marine_collagen", "deer_placenta", "avocado_oil"],
    improvement: "鹿茸臘萃含有軟骨素與葡萄糖胺，海洋膠原蛋白補充關節軟骨所需膠原，鹿胎盤活細胞促進軟骨細胞再生，酪梨油的不皂化物抑制關節炎症，有效緩解關節疼痛。",
  },
  {
    symptomId: "arthritis",
    possibleReactions: ["初期患部可能出現短暫腫脹感", "輕微刺痛感"],
    ingredients: ["deer_velvet", "marine_collagen", "fucoidan", "avocado_oil"],
    improvement: "鹿茸臘萃的軟骨素抑制軟骨降解酶，海洋膠原蛋白修復關節軟骨，褐藻糖膠抑制發炎細胞因子，酪梨油抗炎成分協同作用，改善關節炎症狀。",
  },
  {
    symptomId: "osteoporosis",
    possibleReactions: ["初期可能出現輕微骨骼酸痛感"],
    ingredients: ["deer_velvet", "marine_collagen", "deer_placenta"],
    improvement: "鹿茸臘萃含有豐富的骨生長因子（IGF-1），促進成骨細胞活性；海洋膠原蛋白提供骨骼有機質基質；鹿胎盤活細胞促進骨細胞再生，有效改善骨質疏鬆。",
  },
  {
    symptomId: "back_pain",
    possibleReactions: ["初期腰背可能出現短暫酸脹加重", "輕微刺痛感"],
    ingredients: ["deer_velvet", "marine_collagen", "evening_primrose"],
    improvement: "鹿茸臘萃促進椎間盤軟骨修復，海洋膠原蛋白補充脊椎韌帶所需膠原蛋白，月見草油的 GLA 抑制腰背部發炎反應，有效緩解腰背痠痛。",
  },
  {
    symptomId: "neck_shoulder",
    possibleReactions: ["初期頸肩可能出現短暫酸脹感加重"],
    ingredients: ["deer_velvet", "marine_collagen", "borage_oil"],
    improvement: "鹿茸臘萃促進頸椎軟骨修復，海洋膠原蛋白補充肌腱韌帶所需膠原，琉璃苣油抑制頸肩部位慢性發炎，逐步改善頸肩僵硬問題。",
  },
  {
    symptomId: "gout",
    possibleReactions: ["初期尿酸可能短暫升高", "患部輕微腫脹感"],
    ingredients: ["fucoidan", "aloe", "apple_polyphenol"],
    improvement: "褐藻糖膠促進腎臟尿酸排泄，蘆薈具有天然消炎作用，蘋果多酚抑制黃嘌呤氧化酶（尿酸生成酶），三者協同作用有效降低尿酸水平，改善痛風。",
  },
  // 消化系統
  {
    symptomId: "gastritis",
    possibleReactions: ["初期胃部可能出現短暫不適感", "輕微噁心感"],
    ingredients: ["aloe", "deer_placenta", "fucoidan"],
    improvement: "蘆薈多醣能修復胃黏膜，抑制幽門螺旋桿菌；鹿胎盤活細胞促進胃壁細胞再生；褐藻糖膠形成保護膜覆蓋潰瘍面，加速胃炎與胃潰瘍癒合。",
  },
  {
    symptomId: "constipation",
    possibleReactions: ["初期可能出現輕微腹脹感", "排便次數短暫增加"],
    ingredients: ["aloe", "fucoidan", "avocado_oil"],
    improvement: "蘆薈中的蘆薈素能促進腸道蠕動，褐藻糖膠作為天然益生元促進腸道益菌生長，酪梨油潤滑腸道，三者協同改善便秘，建立健康排便習慣。",
  },
  {
    symptomId: "diarrhea",
    possibleReactions: ["初期腸道可能出現短暫不適", "輕微腹鳴"],
    ingredients: ["aloe", "fucoidan", "deer_placenta"],
    improvement: "蘆薈多醣修復腸道黏膜，褐藻糖膠調節腸道菌叢平衡，鹿胎盤活細胞促進腸道上皮細胞再生，有效改善腸躁症與慢性腹瀉。",
  },
  {
    symptomId: "bloating",
    possibleReactions: ["初期脹氣可能短暫加重", "輕微腹部不適"],
    ingredients: ["aloe", "fucoidan", "avocado_oil"],
    improvement: "蘆薈促進消化酵素分泌，褐藻糖膠改善腸道菌叢，酪梨油促進膽汁分泌助消化，三者協同改善消化功能，有效緩解脹氣與消化不良。",
  },
  {
    symptomId: "liver_issue",
    possibleReactions: ["初期可能出現輕微疲倦感", "皮膚短暫出疹"],
    ingredients: ["deer_ganoderma", "fucoidan", "lycopene", "apple_polyphenol"],
    improvement: "鹿角靈芝多醣體保護肝細胞並促進肝細胞再生，褐藻糖膠抑制肝臟脂肪堆積，蕃茄紅素與蘋果多酚提供強力抗氧化保護，改善脂肪肝與肝炎。",
  },
  {
    symptomId: "hemorrhoids",
    possibleReactions: ["初期患部可能出現短暫腫脹感"],
    ingredients: ["aloe", "fucoidan", "marine_collagen"],
    improvement: "蘆薈具有消炎止痛作用，褐藻糖膠促進靜脈壁修復，海洋膠原蛋白強化肛門靜脈壁彈性，三者協同改善痔瘡症狀，促進患部癒合。",
  },
  // 皮膚
  {
    symptomId: "acne",
    possibleReactions: ["初期痘痘可能短暫增多（排毒反應）", "皮膚輕微發紅"],
    ingredients: ["deer_placenta", "aloe", "evening_primrose", "lycopene"],
    improvement: "鹿胎盤活細胞調節皮脂腺分泌，蘆薈抗菌消炎，月見草油的 GLA 調節荷爾蒙平衡，蕃茄紅素抗氧化保護皮膚，從根本改善痘痘問題。",
  },
  {
    symptomId: "eczema",
    possibleReactions: ["初期患部可能出現短暫搔癢加重", "輕微紅腫"],
    ingredients: ["evening_primrose", "borage_oil", "aloe", "fucoidan"],
    improvement: "月見草油與琉璃苣油的 GLA 抑制皮膚發炎介質，蘆薈修復皮膚屏障，褐藻糖膠調節免疫反應，協同改善濕疹與皮膚炎症狀。",
  },
  {
    symptomId: "aging_skin",
    possibleReactions: ["初期皮膚可能出現短暫乾燥感"],
    ingredients: ["marine_collagen", "deer_placenta", "lycopene", "avocado_oil"],
    improvement: "海洋膠原蛋白補充皮膚真皮層膠原蛋白，鹿胎盤活細胞促進皮膚幹細胞再生，蕃茄紅素抗紫外線氧化，酪梨油深層滋潤，全面改善皮膚老化鬆弛。",
  },
  {
    symptomId: "pigmentation",
    possibleReactions: ["初期色斑可能短暫加深（排毒反應）"],
    ingredients: ["deer_placenta", "core_key", "lycopene", "apple_polyphenol"],
    improvement: "鹿胎盤活細胞抑制黑色素生成，核心鑰鍵（白色草莓萃取物）含有天然美白成分，蕃茄紅素與蘋果多酚抗氧化，協同淡化色斑，提亮膚色。",
  },
  {
    symptomId: "dry_skin",
    possibleReactions: ["初期皮膚可能短暫更乾燥"],
    ingredients: ["marine_collagen", "avocado_oil", "evening_primrose", "aloe"],
    improvement: "海洋膠原蛋白提升皮膚保水能力，酪梨油深層補充皮膚脂質，月見草油修復皮膚屏障，蘆薈提供天然保濕成分，全面改善皮膚乾燥問題。",
  },
  {
    symptomId: "hair_loss",
    possibleReactions: ["初期落髮可能短暫增加（換髮期）"],
    ingredients: ["deer_placenta", "deer_velvet", "marine_collagen", "evening_primrose"],
    improvement: "鹿胎盤活細胞活化毛囊幹細胞，鹿茸臘萃提供毛髮生長所需的生長因子，海洋膠原蛋白強化髮根，月見草油調節頭皮皮脂腺，有效改善落髮問題。",
  },
  // 代謝
  {
    symptomId: "diabetes",
    possibleReactions: ["初期血糖可能出現短暫波動", "輕微頭暈感"],
    ingredients: ["deer_ganoderma", "fucoidan", "apple_polyphenol", "puya_saponin"],
    improvement: "鹿角靈芝多醣體能促進胰島素分泌並提升胰島素敏感性，褐藻糖膠延緩糖分吸收，蘋果多酚抑制 α-葡萄糖苷酶，普亞參皂調節血糖代謝，協同控制血糖。",
  },
  {
    symptomId: "high_cholesterol",
    possibleReactions: ["初期可能出現輕微腹瀉", "短暫疲倦感"],
    ingredients: ["fucoidan", "apple_polyphenol", "squalene", "avocado_oil"],
    improvement: "褐藻糖膠抑制膽固醇合成並促進排泄，蘋果多酚降低 LDL 氧化，深海鮫精提升 HDL 好膽固醇，酪梨油的植物固醇競爭性抑制膽固醇吸收，全面調節血脂。",
  },
  {
    symptomId: "obesity",
    possibleReactions: ["初期可能出現輕微排毒反應", "短暫食慾變化"],
    ingredients: ["fucoidan", "apple_polyphenol", "avocado_oil", "deer_placenta"],
    improvement: "褐藻糖膠抑制脂肪細胞分化，蘋果多酚促進脂肪代謝，酪梨油的不飽和脂肪酸提升飽足感，鹿胎盤活細胞調節脂肪代謝相關荷爾蒙，協助體重管理。",
  },
  {
    symptomId: "thyroid",
    possibleReactions: ["初期甲狀腺功能可能出現短暫波動", "輕微心跳變化"],
    ingredients: ["deer_placenta", "fucoidan", "puya_saponin"],
    improvement: "鹿胎盤活細胞含有甲狀腺調節因子，褐藻糖膠中的碘元素支持甲狀腺功能，普亞參皂調節下視丘-腦垂體-甲狀腺軸，協同改善甲狀腺功能失調。",
  },
  {
    symptomId: "uric_acid",
    possibleReactions: ["初期尿酸可能短暫升高", "關節輕微不適"],
    ingredients: ["fucoidan", "aloe", "apple_polyphenol"],
    improvement: "褐藻糖膠促進腎臟尿酸排泄，蘆薈消炎止痛，蘋果多酚抑制尿酸生成酶（黃嘌呤氧化酶），三者協同降低尿酸水平，預防痛風發作。",
  },
  {
    symptomId: "kidney_issue",
    possibleReactions: ["初期可能出現輕微排尿增加", "短暫疲倦感"],
    ingredients: ["fucoidan", "deer_ganoderma", "aloe"],
    improvement: "褐藻糖膠保護腎臟細胞並促進腎臟排毒，鹿角靈芝多醣體抑制腎臟纖維化，蘆薈利尿消炎，三者協同保護腎臟功能，改善腎臟問題。",
  },
  // 女性保健
  {
    symptomId: "menstrual_pain",
    possibleReactions: ["初期經痛可能短暫加重（排毒反應）", "輕微腹部不適"],
    ingredients: ["evening_primrose", "borage_oil", "deer_placenta"],
    improvement: "月見草油與琉璃苣油的 GLA 抑制前列腺素 E2 合成，減少子宮收縮強度；鹿胎盤活細胞調節雌激素水平，從根本改善經痛問題。",
  },
  {
    symptomId: "irregular_period",
    possibleReactions: ["初期月經週期可能短暫更不規律", "輕微情緒波動"],
    ingredients: ["deer_placenta", "evening_primrose", "puya_saponin"],
    improvement: "鹿胎盤活細胞含有天然荷爾蒙前驅物，月見草油調節雌激素代謝，普亞參皂調節下視丘-腦垂體-卵巢軸，協同調整月經週期至規律。",
  },
  {
    symptomId: "menopause",
    possibleReactions: ["初期熱潮紅可能短暫加重", "輕微情緒波動"],
    ingredients: ["deer_placenta", "evening_primrose", "borage_oil", "marine_collagen"],
    improvement: "鹿胎盤活細胞提供天然植物性雌激素前驅物，月見草油與琉璃苣油調節荷爾蒙平衡，海洋膠原蛋白改善更年期皮膚乾燥，全面緩解更年期症狀。",
  },
  {
    symptomId: "ovarian_cyst",
    possibleReactions: ["初期可能出現輕微腹部不適", "短暫疲倦感"],
    ingredients: ["deer_placenta", "fucoidan", "evening_primrose"],
    improvement: "鹿胎盤活細胞調節卵巢功能，褐藻糖膠具有抗腫瘤活性，月見草油調節雌激素代謝，三者協同改善卵巢囊腫與子宮肌瘤相關症狀。",
  },
  {
    symptomId: "pcos",
    possibleReactions: ["初期荷爾蒙可能短暫波動", "輕微皮膚變化"],
    ingredients: ["deer_placenta", "evening_primrose", "fucoidan", "puya_saponin"],
    improvement: "鹿胎盤活細胞調節卵巢荷爾蒙分泌，月見草油改善胰島素阻抗，褐藻糖膠調節血糖，普亞參皂調節腎上腺雄激素，協同改善多囊卵巢症候群。",
  },
  {
    symptomId: "vaginal_dryness",
    possibleReactions: ["初期可能出現短暫不適感"],
    ingredients: ["deer_placenta", "evening_primrose", "marine_collagen"],
    improvement: "鹿胎盤活細胞補充雌激素前驅物，月見草油的 GLA 促進黏膜分泌，海洋膠原蛋白補充黏膜組織膠原蛋白，協同改善陰道乾澀問題。",
  },
  {
    symptomId: "fertility",
    possibleReactions: ["初期荷爾蒙可能短暫波動", "輕微情緒變化"],
    ingredients: ["deer_placenta", "deer_velvet", "evening_primrose", "puya_saponin"],
    improvement: "鹿胎盤活細胞提供卵巢所需的生長因子，鹿茸臘萃促進子宮內膜增厚，月見草油調節排卵週期，普亞參皂調節生殖荷爾蒙，全面改善生育能力。",
  },
  // 眼睛
  {
    symptomId: "dry_eye",
    possibleReactions: ["初期眼睛可能短暫更乾澀", "輕微刺激感"],
    ingredients: ["evening_primrose", "borage_oil", "marine_collagen"],
    improvement: "月見草油與琉璃苣油的 GLA 促進淚腺分泌，海洋膠原蛋白修復角膜上皮，三者協同改善乾眼症，恢復眼睛正常淚液分泌。",
  },
  {
    symptomId: "myopia",
    possibleReactions: ["初期眼睛可能出現短暫疲勞感"],
    ingredients: ["lycopene", "fucoidan", "marine_collagen"],
    improvement: "蕃茄紅素保護視網膜免受氧化損傷，褐藻糖膠促進眼部血液循環，海洋膠原蛋白維持眼球鞏膜彈性，三者協同有助控制近視加深。",
  },
  {
    symptomId: "eye_fatigue",
    possibleReactions: ["初期眼睛可能短暫更疲勞"],
    ingredients: ["lycopene", "squalene", "evening_primrose"],
    improvement: "蕃茄紅素強效抗氧化保護視網膜，深海鮫精提供眼部細胞所需氧氣，月見草油改善眼部血液循環，三者協同緩解眼睛疲勞，改善視力模糊。",
  },
  {
    symptomId: "floaters",
    possibleReactions: ["初期飛蚊症可能短暫增多（排毒反應）"],
    ingredients: ["lycopene", "fucoidan", "squalene"],
    improvement: "蕃茄紅素抗氧化保護玻璃體，褐藻糖膠促進玻璃體代謝廢物清除，深海鮫精提供視網膜所需的不飽和脂肪酸，協同改善飛蚊症。",
  },
  {
    symptomId: "glaucoma",
    possibleReactions: ["初期眼壓可能短暫波動", "輕微視覺變化"],
    ingredients: ["fucoidan", "lycopene", "squalene", "deer_ganoderma"],
    improvement: "褐藻糖膠改善眼房水循環，蕃茄紅素保護視神經，深海鮫精提供視神經所需營養，鹿角靈芝促進眼部血液循環，協同保護視神經，改善青光眼與白內障。",
  },
  {
    symptomId: "macular",
    possibleReactions: ["初期視覺可能出現短暫波動"],
    ingredients: ["lycopene", "fucoidan", "squalene", "evening_primrose"],
    improvement: "蕃茄紅素是黃斑部最重要的抗氧化色素，褐藻糖膠促進黃斑部血液循環，深海鮫精提供 DHA 支持視網膜功能，月見草油抗炎保護，協同改善黃斑部病變。",
  },
];

// ── 好轉反應說明文本 ──────────────────────────────────────
export const HERX_EXPLANATION = {
  title: "好轉反應說明",
  content: `好轉反應（Herxheimer Reaction）是指身體在修復過程中，細胞開始大量排毒、修復受損組織時所產生的暫時性反應。這是身體正在積極自我修復的訊號，而非副作用。

**好轉反應的特徵：**
- 通常在開始服用後 1-4 週內出現
- 症狀多為輕微且短暫（通常持續 3-14 天）
- 反應結束後，身體狀況會明顯改善
- 症狀越多，代表身體修復越積極

**常見好轉反應類型：**
- 排毒反應：輕微疲倦、頭暈、皮膚出疹
- 循環改善：手腳發熱、輕微刺麻感
- 免疫活化：輕微發燒、鼻涕增多
- 消化調整：短暫腹瀉或便秘

**如何應對好轉反應：**
- 多喝水（每日至少 2000ml）以加速排毒
- 充足休息，讓身體有足夠能量修復
- 症狀嚴重時可暫時減少服用量
- 如有疑慮，請諮詢您的健康顧問`,
  references: [
    "Jarisch R, Herxheimer A. (1895). Über Quecksilberausschlag. Wien Klin Wochenschr.",
    "Maloy AL, Black RD, Segurola RJ Jr. (1998). Lyme disease complicated by the Jarisch-Herxheimer reaction. J Emerg Med.",
    "Pound MW, May DB. (2005). Proposed mechanisms and preventative options of Jarisch-Herxheimer reactions. J Clin Pharm Ther.",
  ],
};

// ── 細胞修復優勢文本 ──────────────────────────────────────
export const CELL_REPAIR_ADVANTAGES = {
  title: "細胞修復的優勢",
  advantages: [
    {
      emoji: "💎",
      title: "①【直擊老化根源：從 10 萬億顆細胞開始逆轉】",
      description: "人體是由約 300 種不同類型、總計達 10 萬億顆細胞所組成的（包含肌肉、肝臟甚至眼睛瞳孔）。醫學證實，細胞衰老是生物衰老與老年病發病的根本原因。本產品透過補充純淨活細胞原料，從根本阻斷細胞衰老鏈。",
    },
    {
      emoji: "🔄",
      title: "②【解鎖市面保健品做不到的『細胞再生』程序】",
      description: "想要留住青春，身體抗老化系統必須滿足三大相互依賴的程序：【保護】、【修復】與【再生】。一般市面上的普通保健品或藥劑，通常只能在『保護』和『修復』程序上給予輔助；而唯有本產品的高端『活細胞療法』，才能真正促使身體啟動關鍵的【再生】程序，進而煥發活力、恢復青春。",
    },
    {
      emoji: "👑",
      title: "③【復刻瑞士頂級富豪名人的抗老秘密】",
      description: "自 1931 年保羅·奈爾漢醫生（Dr. Paul Niehans）發現活細胞好處以來，全球頂級富豪、明星藝人及政治元首，皆紛紛前往瑞士蒙特利奧斯醫院（Montreux）接受活胎盤細胞注射以保持極致的活力與耐力。本產品透過高端生物科技，將過往動輒百萬、只有少數富豪能負擔的活細胞療法，轉化為更普及、安全且人人都可負擔的口服形式。",
    },
  ],
  references: [
    "新加坡醫藥總監曾偉雄醫師著述——《富豪和名人的秘密》",
    "瑞士保羅·奈爾漢醫生（Dr. Paul Niehans）現代活細胞療法醫學臨床歷史文獻",
  ],
};

// ── 服用建議計算邏輯 ──────────────────────────────────────
export interface DosageRecommendation {
  dailyCapsules: number; // 每日建議顆數
  firstSetDays: number; // 首套天數（1套=420顆）
  improvementCycles: string; // 預計改善週期描述
  waterGuide: string; // 喝水指南
  dosageGuide: string; // 服用指南
  regulatoryNotice: string; // 台灣法規澄清說明
}

export function calculateDosage(
  age: number,
  gender: Gender,
  symptoms: string[],
  weight?: number,
  setCount: number = 1
): DosageRecommendation {
  // 基礎顆數：根據症狀數量
  let baseCapsules = 2;
  const symptomCount = symptoms.length;

  if (symptomCount <= 2) baseCapsules = 2;
  else if (symptomCount <= 4) baseCapsules = 3;
  else if (symptomCount <= 6) baseCapsules = 4;
  else if (symptomCount <= 9) baseCapsules = 5;
  else baseCapsules = 6;

  // 年齡調整
  if (age >= 50) baseCapsules = Math.min(baseCapsules + 1, 6);
  if (age >= 65) baseCapsules = Math.min(baseCapsules + 1, 6);

  // 確保在 2-6 範圍內
  const dailyCapsules = Math.max(2, Math.min(6, baseCapsules));

  // 首套天數（1套=420顆）
  const totalCapsules = setCount * 420;
  const firstSetDays = Math.round(totalCapsules / dailyCapsules);

  // 預計改善週期
  let improvementCycles = "";
  if (dailyCapsules <= 2) {
    improvementCycles = "預計 3-4 個月可感受到明顯改善，建議持續服用 6 個月以上以達到最佳效果。";
  } else if (dailyCapsules <= 3) {
    improvementCycles = "預計 2-3 個月可感受到明顯改善，建議持續服用 4-6 個月以達到最佳效果。";
  } else if (dailyCapsules <= 4) {
    improvementCycles = "預計 6-8 週可感受到明顯改善，建議持續服用 3-4 個月以達到最佳效果。";
  } else {
    improvementCycles = "預計 4-6 週可感受到明顯改善，建議持續服用 3 個月以上以達到最佳效果。";
  }

  // 喝水指南
  const waterAmount = weight ? Math.round(weight * 35) : 2000;
  const waterGuide = weight
    ? `根據您的體重，建議每日飲水量為 ${waterAmount}ml（${(waterAmount / 1000).toFixed(1)} 公升）。服用膠囊時請搭配 300ml 以上的溫水，有助於成分吸收。`
    : `建議每日飲水量至少 2000ml（2 公升）。服用膠囊時請搭配 300ml 以上的溫水，有助於成分吸收。`;

  // 服用指南
  const dosageGuide =
    dailyCapsules <= 2
      ? `建議每日服用 ${dailyCapsules} 顆，早餐後服用 ${dailyCapsules} 顆，搭配溫水服用效果最佳。`
      : dailyCapsules <= 4
        ? `建議每日服用 ${dailyCapsules} 顆，早餐後服用 ${Math.ceil(dailyCapsules / 2)} 顆，晚餐後服用 ${Math.floor(dailyCapsules / 2)} 顆，搭配溫水服用效果最佳。`
        : `建議每日服用 ${dailyCapsules} 顆，早餐後服用 2 顆，午餐後服用 2 顆，晚餐後服用 ${dailyCapsules - 4} 顆，搭配溫水服用效果最佳。`;

  // 台灣法規澄清說明
  const regulatoryNotice = `💡 溫馨提示：本產品包裝上註明之每日 2 粒建議量，主要是為因應中華民國台灣政府之食品法規規範。本產品定位為頂級高純度營養食品，不分年齡層皆可全年齡安心食用。若您希望在初期加速細胞修復、追求更好的日常保健效果，在維持基礎食用量的同時，完全可以根據每天自己身體的實際感受，安心且開放地自主調整劑量（例如初期可由 2 顆調配調整為每日 4-6 顆或更多）。請隨時觀察身體的瞑眩好轉反應，這有助於更快啟動健康循環。`;

  return {
    dailyCapsules,
    firstSetDays,
    improvementCycles,
    waterGuide,
    dosageGuide,
    regulatoryNotice,
  };
}

// ── BMI 計算 ──────────────────────────────────────────────
export function calculateBMI(weight: number, height: number): { bmi: number; category: string } {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  let category = "";

  if (bmi < 18.5) category = "體重過輕";
  else if (bmi < 24) category = "正常範圍";
  else if (bmi < 27) category = "體重過重";
  else if (bmi < 30) category = "輕度肥胖";
  else if (bmi < 35) category = "中度肥胖";
  else category = "重度肥胖";

  return { bmi: Math.round(bmi * 10) / 10, category };
}

// ── 每日喝水量計算 ────────────────────────────────────────
export function calculateDailyWater(weight: number): { ml: number; liters: string } {
  const ml = Math.round(weight * 35);
  return { ml, liters: (ml / 1000).toFixed(1) };
}

// ── 小秘書溫馨結論 ────────────────────────────────────────
export function generateSecretary(nickname: string, symptoms: string[]): string {
  const symptomCount = symptoms.length;
  if (symptomCount === 0) {
    return `親愛的 ${nickname}，您目前的健康狀況相當良好！建議持續服用 Putier 作為日常保健，讓細胞活力常保年輕。記得多喝水、規律作息，讓好轉反應更順利進行！💚`;
  } else if (symptomCount <= 3) {
    return `親愛的 ${nickname}，您有 ${symptomCount} 項保健需求，身體正在向您發出溫和的訊號。透過 Putier 的細胞修復，這些問題都能逐步改善。請耐心配合服用，好轉反應是身體修復的必經過程，加油！💪`;
  } else if (symptomCount <= 6) {
    return `親愛的 ${nickname}，您有 ${symptomCount} 項保健需求，身體需要更多的關愛與修復。Putier 的 14 種珍貴成分將全面協助您的身體進行深層修復。請記得多喝水、充足休息，讓好轉反應順利完成，您的身體會感謝您的！🌟`;
  } else {
    return `親愛的 ${nickname}，您有 ${symptomCount} 項保健需求，身體正在積極呼喚深層修復。Putier 將以六大頂尖技術為您的細胞提供全面修復支持。好轉反應可能會比較明顯，這代表身體修復力正在全力運作！請多喝水、充足休息，我們一起陪伴您走向健康！🌈💚`;
  }
}

// ── 常見好轉反應列表 (供回報日誌使用) ──────────────────────
export const COMMON_REACTIONS = [
  { id: "fatigue", label: "感到疲倦/嗜睡", category: "排毒反應" },
  { id: "dizziness", label: "頭暈/頭痛", category: "排毒反應" },
  { id: "skin_rash", label: "皮膚出疹/搔癢", category: "排毒反應" },
  { id: "fever", label: "輕微發燒/發熱", category: "免疫活化" },
  { id: "thirst", label: "口乾舌燥", category: "代謝反應" },
  { id: "diarrhea", label: "腹瀉/排便增加", category: "消化調整" },
  { id: "constipation", label: "便秘", category: "消化調整" },
  { id: "joint_pain", label: "關節/肌肉痠痛加劇", category: "循環改善" },
  { id: "insomnia", label: "短暫失眠/精神亢奮", category: "神經調節" },
  { id: "nausea", label: "噁心/胃部不適", category: "消化調整" },
  { id: "sweating", label: "出汗量增加", category: "排毒反應" },
  { id: "heart_palpitation", label: "心跳加速/心悸", category: "循環改善" },
  { id: "phlegm", label: "痰多/鼻涕增多", category: "排毒反應" },
  { id: "other", label: "其他反應", category: "其他" },
];
