export const ROLES = [
  {
    id: "tank",
    name: "돌격군",
    englishName: "Tank",
    color: "#2563eb",
    softColor: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    id: "damage",
    name: "공격군",
    englishName: "Damage",
    color: "#ef4444",
    softColor: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  {
    id: "support",
    name: "지원군",
    englishName: "Support",
    color: "#10b981",
    softColor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
];

export const DRAW_TYPES = [
  {
    id: "role",
    name: "역할군 뽑기",
    description: "돌격군, 공격군, 지원군 중 하나를 추첨합니다.",
  },
  {
    id: "allHeroes",
    name: "전체 영웅 뽑기",
    description: "전체 영웅 풀에서 하나를 추첨합니다.",
  },
  {
    id: "roleHeroes",
    name: "역할군 영웅 뽑기",
    description: "선택한 역할군 안에서 영웅을 추첨합니다.",
  },
];

export const HEROES = [
  { id: "dva", name: "D.Va", roleId: "tank", color: "#f472b6" },
  { id: "domina", name: "Domina", roleId: "tank", color: "#8b5cf6" },
  { id: "doomfist", name: "Doomfist", roleId: "tank", color: "#7f1d1d" },
  { id: "hazard", name: "Hazard", roleId: "tank", color: "#a855f7" },
  { id: "junker-queen", name: "Junker Queen", roleId: "tank", color: "#0f766e" },
  { id: "mauga", name: "Mauga", roleId: "tank", color: "#b45309" },
  { id: "orisa", name: "Orisa", roleId: "tank", color: "#84cc16" },
  { id: "ramattra", name: "Ramattra", roleId: "tank", color: "#4c1d95" },
  { id: "reinhardt", name: "Reinhardt", roleId: "tank", color: "#64748b" },
  { id: "roadhog", name: "Roadhog", roleId: "tank", color: "#92400e" },
  { id: "sigma", name: "Sigma", roleId: "tank", color: "#0891b2" },
  { id: "winston", name: "Winston", roleId: "tank", color: "#334155" },
  { id: "wrecking-ball", name: "Wrecking Ball", roleId: "tank", color: "#d97706" },
  { id: "zarya", name: "Zarya", roleId: "tank", color: "#ec4899" },

  { id: "anran", name: "Anran", roleId: "damage", color: "#dc2626" },
  { id: "ashe", name: "Ashe", roleId: "damage", color: "#6b7280" },
  { id: "bastion", name: "Bastion", roleId: "damage", color: "#65a30d" },
  { id: "cassidy", name: "Cassidy", roleId: "damage", color: "#92400e" },
  { id: "echo", name: "Echo", roleId: "damage", color: "#38bdf8" },
  { id: "emre", name: "Emre", roleId: "damage", color: "#b45309" },
  { id: "freja", name: "Freja", roleId: "damage", color: "#2563eb" },
  { id: "genji", name: "Genji", roleId: "damage", color: "#22c55e" },
  { id: "hanzo", name: "Hanzo", roleId: "damage", color: "#0f766e" },
  { id: "junkrat", name: "Junkrat", roleId: "damage", color: "#f59e0b" },
  { id: "mei", name: "Mei", roleId: "damage", color: "#60a5fa" },
  { id: "pharah", name: "Pharah", roleId: "damage", color: "#2563eb" },
  { id: "reaper", name: "Reaper", roleId: "damage", color: "#111827" },
  { id: "sojourn", name: "Sojourn", roleId: "damage", color: "#e11d48" },
  { id: "soldier-76", name: "Soldier: 76", roleId: "damage", color: "#1d4ed8" },
  { id: "sombra", name: "Sombra", roleId: "damage", color: "#9333ea" },
  { id: "symmetra", name: "Symmetra", roleId: "damage", color: "#06b6d4" },
  { id: "torbjorn", name: "Torbjorn", roleId: "damage", color: "#dc2626" },
  { id: "tracer", name: "Tracer", roleId: "damage", color: "#f97316" },
  { id: "vendetta", name: "Vendetta", roleId: "damage", color: "#991b1b" },
  { id: "venture", name: "Venture", roleId: "damage", color: "#ca8a04" },
  { id: "widowmaker", name: "Widowmaker", roleId: "damage", color: "#7c3aed" },

  { id: "ana", name: "Ana", roleId: "support", color: "#2563eb" },
  { id: "baptiste", name: "Baptiste", roleId: "support", color: "#f97316" },
  { id: "brigitte", name: "Brigitte", roleId: "support", color: "#b45309" },
  { id: "illari", name: "Illari", roleId: "support", color: "#facc15" },
  { id: "jetpack-cat", name: "Jetpack Cat", roleId: "support", color: "#64748b" },
  { id: "juno", name: "Juno", roleId: "support", color: "#fb7185" },
  { id: "kiriko", name: "Kiriko", roleId: "support", color: "#ef4444" },
  { id: "lifeweaver", name: "Lifeweaver", roleId: "support", color: "#ec4899" },
  { id: "lucio", name: "Lucio", roleId: "support", color: "#84cc16" },
  { id: "mercy", name: "Mercy", roleId: "support", color: "#fbbf24" },
  { id: "mizuki", name: "Mizuki", roleId: "support", color: "#a855f7" },
  { id: "moira", name: "Moira", roleId: "support", color: "#7c3aed" },
  { id: "wuyang", name: "Wuyang", roleId: "support", color: "#0ea5e9" },
  { id: "zenyatta", name: "Zenyatta", roleId: "support", color: "#eab308" },
];

export function getRoleById(roleId) {
  return ROLES.find((role) => role.id === roleId);
}

export function getPresetItems(drawType, selectedRoleId) {
  if (drawType === "role") {
    return ROLES.map((role) => ({
      id: `role-${role.id}`,
      name: role.name,
      subtitle: role.englishName,
      roleId: role.id,
      color: role.color,
      weight: 1,
      source: "preset",
    }));
  }

  const heroes =
    drawType === "roleHeroes"
      ? HEROES.filter((hero) => hero.roleId === selectedRoleId)
      : HEROES;

  return heroes.map((hero) => ({
    id: `hero-${hero.id}`,
    name: hero.name,
    roleId: hero.roleId,
    color: hero.color,
    weight: 1,
    source: "preset",
  }));
}
