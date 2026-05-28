export const ROLES = [
  {
    id: "tank",
    name: "돌격군",
    englishName: "Tank",
    color: "#f97316",
    softColor: "bg-orange-50 text-orange-700 ring-orange-200",
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
  { id: "dva", name: "D.Va", roleId: "tank" },
  { id: "domina", name: "Domina", roleId: "tank" },
  { id: "doomfist", name: "Doomfist", roleId: "tank" },
  { id: "hazard", name: "Hazard", roleId: "tank" },
  { id: "junker-queen", name: "Junker Queen", roleId: "tank" },
  { id: "mauga", name: "Mauga", roleId: "tank" },
  { id: "orisa", name: "Orisa", roleId: "tank" },
  { id: "ramattra", name: "Ramattra", roleId: "tank" },
  { id: "reinhardt", name: "Reinhardt", roleId: "tank" },
  { id: "roadhog", name: "Roadhog", roleId: "tank" },
  { id: "sigma", name: "Sigma", roleId: "tank" },
  { id: "winston", name: "Winston", roleId: "tank" },
  { id: "wrecking-ball", name: "Wrecking Ball", roleId: "tank" },
  { id: "zarya", name: "Zarya", roleId: "tank" },

  { id: "anran", name: "Anran", roleId: "damage" },
  { id: "ashe", name: "Ashe", roleId: "damage" },
  { id: "bastion", name: "Bastion", roleId: "damage" },
  { id: "cassidy", name: "Cassidy", roleId: "damage" },
  { id: "echo", name: "Echo", roleId: "damage" },
  { id: "emre", name: "Emre", roleId: "damage" },
  { id: "freja", name: "Freja", roleId: "damage" },
  { id: "genji", name: "Genji", roleId: "damage" },
  { id: "hanzo", name: "Hanzo", roleId: "damage" },
  { id: "junkrat", name: "Junkrat", roleId: "damage" },
  { id: "mei", name: "Mei", roleId: "damage" },
  { id: "pharah", name: "Pharah", roleId: "damage" },
  { id: "reaper", name: "Reaper", roleId: "damage" },
  { id: "sojourn", name: "Sojourn", roleId: "damage" },
  { id: "soldier-76", name: "Soldier: 76", roleId: "damage" },
  { id: "sombra", name: "Sombra", roleId: "damage" },
  { id: "symmetra", name: "Symmetra", roleId: "damage" },
  { id: "torbjorn", name: "Torbjorn", roleId: "damage" },
  { id: "tracer", name: "Tracer", roleId: "damage" },
  { id: "vendetta", name: "Vendetta", roleId: "damage" },
  { id: "venture", name: "Venture", roleId: "damage" },
  { id: "widowmaker", name: "Widowmaker", roleId: "damage" },

  { id: "ana", name: "Ana", roleId: "support" },
  { id: "baptiste", name: "Baptiste", roleId: "support" },
  { id: "brigitte", name: "Brigitte", roleId: "support" },
  { id: "illari", name: "Illari", roleId: "support" },
  { id: "jetpack-cat", name: "Jetpack Cat", roleId: "support" },
  { id: "juno", name: "Juno", roleId: "support" },
  { id: "kiriko", name: "Kiriko", roleId: "support" },
  { id: "lifeweaver", name: "Lifeweaver", roleId: "support" },
  { id: "lucio", name: "Lucio", roleId: "support" },
  { id: "mercy", name: "Mercy", roleId: "support" },
  { id: "mizuki", name: "Mizuki", roleId: "support" },
  { id: "moira", name: "Moira", roleId: "support" },
  { id: "wuyang", name: "Wuyang", roleId: "support" },
  { id: "zenyatta", name: "Zenyatta", roleId: "support" },
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
    weight: 1,
    source: "preset",
  }));
}
