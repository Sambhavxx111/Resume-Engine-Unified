export const DEFAULT_SKILL_CATEGORY = "Skills";

const cleanText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const SKILL_CATEGORY_RULES = [
  { category: "Programming Languages", pattern: /^(c|c\+\+|c#|java|python|javascript|typescript|php|ruby|go|golang|kotlin|swift|scala|r|matlab)$/i },
  { category: "Frontend", pattern: /^(html|css|react(?:\.js)?|redux|next(?:\.js)?|angular|vue|tailwind(?: css)?|bootstrap|sass|figma|ui\/ux|responsive design|web technologies)$/i },
  { category: "Backend", pattern: /^(node(?:\.js)?|express(?:\.js)?|django|flask|fastapi|spring(?: boot)?|rest(?: api)?|api design|jwt|authentication)$/i },
  { category: "Databases", pattern: /^(sql|mysql|postgres(?:ql)?|mongodb|dbms|oracle|firebase|redis|sqlite|database design)$/i },
  { category: "Cloud & DevOps", pattern: /^(aws|azure|gcp|docker|kubernetes|linux|git|github|ci\/cd|jenkins|vercel|netlify)$/i },
  { category: "Cyber Security Tools", pattern: /^(ftk imager|wireshark|threat hunting|thread hunting|burp suite|nmap|metasploit|kali linux|splunk|siem|vulnerability assessment)$/i },
  { category: "Data & Analytics", pattern: /^(machine learning|data analysis|data visualization|pandas|numpy|power bi|tableau|excel|statistics|reporting|eda)$/i },
  { category: "Core CS", pattern: /^(dsa|data structures|algorithms|oop|os|operating systems|computer networks|networking)$/i },
  { category: "Soft Skills", pattern: /^(communication|leadership|teamwork|problem solving|quick learner|public speaking|documentation|collaboration|time management)$/i },
];

const inferSkillCategory = (skill = "") =>
  SKILL_CATEGORY_RULES.find((rule) => rule.pattern.test(cleanText(skill)))?.category || "Technical Skills";

const groupFlatSkillsByCategory = (skills = []) => {
  const groups = [];
  const indexByCategory = new Map();

  uniqueCleanItems(skills).forEach((skill) => {
    const category = inferSkillCategory(skill);
    if (!indexByCategory.has(category)) {
      indexByCategory.set(category, groups.length);
      groups.push({ category, items: [] });
    }
    groups[indexByCategory.get(category)].items.push(skill);
  });

  return groups;
};

const uniqueCleanItems = (items = [], preserveEmpty = false) => {
  const seen = new Set();

  return (Array.isArray(items) ? items : [])
    .map((item) => cleanText(item))
    .filter((item) => preserveEmpty || item)
    .filter((item) => {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        return true;
      }
      return false;
    });
};

export const normalizeSkillCategories = (skills = [], options = {}) => {
  const { preserveEmpty = false, defaultCategory = DEFAULT_SKILL_CATEGORY } = options;

  if (!Array.isArray(skills) || !skills.length) {
    return [];
  }

  const hasCategoryObjects = skills.some(
    (skill) => skill && typeof skill === "object" && !Array.isArray(skill),
  );

  if (!hasCategoryObjects) {
    const items = uniqueCleanItems(skills, preserveEmpty);
    return items.length || preserveEmpty ? [{ category: defaultCategory, items }] : [];
  }

  return skills
    .flatMap((group) => {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        return null;
      }

      const category = cleanText(group.category || group.name || group.title || (preserveEmpty ? "" : defaultCategory));
      const items = uniqueCleanItems(group.items || group.skills || group.values || [], preserveEmpty);

      if (!preserveEmpty && !category && !items.length) {
        return null;
      }

      if (!preserveEmpty && /^skills?$/i.test(category) && items.length > 1) {
        return groupFlatSkillsByCategory(items);
      }

      return {
        category: category || (preserveEmpty ? "" : defaultCategory),
        items,
      };
    })
    .filter(Boolean)
    .filter((group) => preserveEmpty || group.items.length);
};

export const flattenSkillCategories = (skills = []) =>
  Array.from(
    new Set(
      normalizeSkillCategories(skills, { preserveEmpty: false })
        .flatMap((group) => group.items)
        .map((skill) => cleanText(skill))
        .filter(Boolean),
    ),
  );

export const normalizeSkillsForStorage = (skills = []) =>
  normalizeSkillCategories(skills, { preserveEmpty: false }).map((group) => ({
    category: group.category || DEFAULT_SKILL_CATEGORY,
    items: group.items,
  }));
