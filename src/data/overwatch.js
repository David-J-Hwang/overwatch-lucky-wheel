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
  { id: "dva", name: "D.Va", roleId: "tank", color: "#ed93c7" },
  { id: "domina", name: "Domina", roleId: "tank", color: "#69deef" },
  { id: "doomfist", name: "Doomfist", roleId: "tank", color: "#83534c" },
  { id: "hazard", name: "Hazard", roleId: "tank", color: "#ad8fcb" },
  { id: "junker-queen", name: "Junker Queen", roleId: "tank", color: "#8eb5d7" },
  { id: "mauga", name: "Mauga", roleId: "tank", color: "#dc847d" },
  { id: "orisa", name: "Orisa", roleId: "tank", color: "#458b42" },
  { id: "ramattra", name: "Ramattra", roleId: "tank", color: "#9d8cd0" },
  { id: "reinhardt", name: "Reinhardt", roleId: "tank", color: "#94a1a5" },
  { id: "roadhog", name: "Roadhog", roleId: "tank", color: "#b38b50" },
  { id: "sigma", name: "Sigma", roleId: "tank", color: "#94a0a5" },
  { id: "winston", name: "Winston", roleId: "tank", color: "#a0a9ba" },
  { id: "wrecking-ball", name: "Wrecking Ball", roleId: "tank", color: "#db9342" },
  { id: "zarya", name: "Zarya", roleId: "tank", color: "#e782b8" },

  { id: "anran", name: "Anran", roleId: "damage", color: "#e81a05" },
  { id: "ashe", name: "Ashe", roleId: "damage", color: "#696968" },
  { id: "bastion", name: "Bastion", roleId: "damage", color: "#7c8f7a" },
  { id: "cassidy", name: "Cassidy", roleId: "damage", color: "#ad5a5f" },
  { id: "echo", name: "Echo", roleId: "damage", color: "#9acaf3" },
  { id: "emre", name: "Emre", roleId: "damage", color: "#c70c0c" },
  { id: "freja", name: "Freja", roleId: "damage", color: "#367fdd" },
  { id: "genji", name: "Genji", roleId: "damage", color: "#95ef42" },
  { id: "hanzo", name: "Hanzo", roleId: "damage", color: "#b9b489" },
  { id: "junkrat", name: "Junkrat", roleId: "damage", color: "#ecbe52" },
  { id: "mei", name: "Mei", roleId: "damage", color: "#6dabeb" },
  { id: "pharah", name: "Pharah", roleId: "damage", color: "#3c7ecc" },
  { id: "reaper", name: "Reaper", roleId: "damage", color: "#7c3e52" },
  { id: "sojourn", name: "Sojourn", roleId: "damage", color: "#c61c41" },
  { id: "soldier-76", name: "Soldier: 76", roleId: "damage", color: "#6d7995" },
  { id: "sombra", name: "Sombra", roleId: "damage", color: "#765dbd" },
  { id: "symmetra", name: "Symmetra", roleId: "damage", color: "#91bbd1" },
  { id: "torbjorn", name: "Torbjorn", roleId: "damage", color: "#bf736e" },
  { id: "tracer", name: "Tracer", roleId: "damage", color: "#d69141" },
  { id: "vendetta", name: "Vendetta", roleId: "damage", color: "#83191e" },
  { id: "venture", name: "Venture", roleId: "damage", color: "#79614e" },
  { id: "widowmaker", name: "Widowmaker", roleId: "damage", color: "#9d69a6" },

  { id: "ana", name: "Ana", roleId: "support", color: "#6e89b1" },
  { id: "baptiste", name: "Baptiste", roleId: "support", color: "#55b2cc" },
  { id: "brigitte", name: "Brigitte", roleId: "support", color: "#8b625e" },
  { id: "illari", name: "Illari", roleId: "support", color: "#b7a88e" },
  { id: "jetpack-cat", name: "Jetpack Cat", roleId: "support", color: "#aab3c0" },
  { id: "juno", name: "Juno", roleId: "support", color: "#721fa3" },
  { id: "kiriko", name: "Kiriko", roleId: "support", color: "#d4878f" },
  { id: "lifeweaver", name: "Lifeweaver", roleId: "support", color: "#e0b6c6" },
  { id: "lucio", name: "Lucio", roleId: "support", color: "#84c951" },
  { id: "mercy", name: "Mercy", roleId: "support", color: "#ece9bd" },
  { id: "mizuki", name: "Mizuki", roleId: "support", color: "#9affc7" },
  { id: "moira", name: "Moira", roleId: "support", color: "#9771e4" },
  { id: "wuyang", name: "Wuyang", roleId: "support", color: "#436fd2" },
  { id: "zenyatta", name: "Zenyatta", roleId: "support", color: "#ece580" },
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
