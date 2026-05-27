// 이 파일의 역할: Draw Toast 카드 라이브러리 데이터 (6 카테고리 × 40장)
// 카드 다양성으로 "과정형/방법형/스케일형" 사고를 모두 표현 가능하게 한다.

const CARD_CATEGORIES = [
  { id: "ingredient", label: "🍞 재료", color: "#f3c98b" },
  { id: "tool",       label: "🔥 도구", color: "#e8a87c" },
  { id: "people",     label: "👤 사람", color: "#c6b8a2" },
  { id: "place",      label: "🏪 장소", color: "#b8c5a0" },
  { id: "supply",     label: "🌍 공급망", color: "#a8b8c8" },
  { id: "abstract",   label: "⚡ 추상", color: "#d4b8d4" },
];

const CARDS = [
  // 🍞 재료 (10)
  { id: "bread",      cat: "ingredient", icon: "🍞", label: "식빵" },
  { id: "wheatbread", cat: "ingredient", icon: "🥖", label: "통밀빵" },
  { id: "bagel",      cat: "ingredient", icon: "🥯", label: "베이글" },
  { id: "butter",     cat: "ingredient", icon: "🧈", label: "버터" },
  { id: "jam",        cat: "ingredient", icon: "🍓", label: "잼" },
  { id: "honey",      cat: "ingredient", icon: "🍯", label: "꿀" },
  { id: "cheese",     cat: "ingredient", icon: "🧀", label: "치즈" },
  { id: "egg",        cat: "ingredient", icon: "🥚", label: "계란" },
  { id: "milk",       cat: "ingredient", icon: "🥛", label: "우유" },
  { id: "cereal",     cat: "ingredient", icon: "🥣", label: "시리얼" },

  // 🔥 도구 (8)
  { id: "toaster",    cat: "tool", icon: "🍞", label: "토스터" },
  { id: "microwave",  cat: "tool", icon: "📡", label: "전자레인지" },
  { id: "oven",       cat: "tool", icon: "♨️", label: "오븐" },
  { id: "pan",        cat: "tool", icon: "🍳", label: "후라이팬" },
  { id: "stove",      cat: "tool", icon: "🔥", label: "가스레인지" },
  { id: "knife",      cat: "tool", icon: "🔪", label: "칼" },
  { id: "plate",      cat: "tool", icon: "🍽", label: "접시" },
  { id: "fork",       cat: "tool", icon: "🍴", label: "포크" },

  // 👤 사람 (5)
  { id: "me",         cat: "people", icon: "🙋", label: "나" },
  { id: "family",     cat: "people", icon: "👨‍👩‍👧", label: "가족" },
  { id: "friend",     cat: "people", icon: "👯", label: "친구" },
  { id: "hand",       cat: "people", icon: "✋", label: "손" },
  { id: "mouth",      cat: "people", icon: "👄", label: "입" },

  // 🏪 장소 (6)
  { id: "market",     cat: "place", icon: "🏪", label: "슈퍼마켓" },
  { id: "bakery",     cat: "place", icon: "🥐", label: "빵집" },
  { id: "fridge",     cat: "place", icon: "🧊", label: "냉장고" },
  { id: "cupboard",   cat: "place", icon: "🗄", label: "찬장" },
  { id: "table",      cat: "place", icon: "🪑", label: "식탁" },
  { id: "kitchen",    cat: "place", icon: "🏠", label: "부엌" },

  // 🌍 공급망 (5) - 스케일형 사고를 위한 핵심 카테고리
  { id: "field",      cat: "supply", icon: "🌾", label: "밀밭" },
  { id: "farmer",     cat: "supply", icon: "👨‍🌾", label: "농부" },
  { id: "factory",    cat: "supply", icon: "🏭", label: "공장" },
  { id: "truck",      cat: "supply", icon: "🚚", label: "트럭" },
  { id: "money",      cat: "supply", icon: "💰", label: "돈" },

  // ⚡ 추상 (6)
  { id: "electricity", cat: "abstract", icon: "⚡", label: "전기" },
  { id: "gas",         cat: "abstract", icon: "💨", label: "가스" },
  { id: "time",        cat: "abstract", icon: "⏱", label: "시간" },
  { id: "temperature", cat: "abstract", icon: "🌡", label: "온도" },
  { id: "start",       cat: "abstract", icon: "▶️", label: "시작" },
  { id: "end",         cat: "abstract", icon: "🏁", label: "끝" },
];

window.CARD_CATEGORIES = CARD_CATEGORIES;
window.CARDS = CARDS;
