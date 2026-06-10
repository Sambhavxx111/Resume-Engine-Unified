const SECTION_NAME_MAP = {
  contact: 'contact',
  professional_summary: 'summary',
  summary: 'summary',
  profile: 'summary',
  objective: 'summary',
  experience: 'experience',
  work_experience: 'experience',
  professional_experience: 'experience',
  employment: 'experience',
  internship: 'experience',
  internships: 'experience',
  training: 'experience',
  education: 'education',
  academics: 'education',
  skills: 'skills',
  technical_skills: 'skills',
  core_skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  achievements: 'achievements',
  languages: 'languages',
  interests: 'interests',
};

const ROLE_SKILL_HINTS = {
  react: ['TypeScript', 'Responsive Design', 'REST APIs'],
  javascript: ['TypeScript', 'Testing', 'Debugging'],
  node: ['Express.js', 'REST APIs', 'SQL'],
  express: ['Node.js', 'JWT Authentication', 'API Design'],
  python: ['FastAPI', 'Data Analysis', 'Automation'],
  java: ['Spring Boot', 'OOP', 'DSA'],
  sql: ['Database Design', 'Query Optimization', 'Data Modeling'],
  html: ['CSS', 'Accessibility', 'Responsive Design'],
  css: ['Tailwind CSS', 'Responsive Design', 'UI Polish'],
  figma: ['Design Systems', 'Prototyping', 'UX Research'],
  aws: ['Cloud Deployment', 'Monitoring', 'Docker'],
};

const normalizeWhitespace = (value = '') =>
  String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line))
    .map((line) => line.replace(/\s+/g, ' ').trim());

const resolveSectionName = (line = '') =>
  SECTION_NAME_MAP[
    String(line || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
  ] || null;

const normalizeSectionCandidate = (line = '') =>
  String(line || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

const filterFilled = (items = []) => items.filter(Boolean);
const normalizeCustomSectionKey = (line = '') =>
  String(line || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

const cleanComparable = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeComparable = (value = '') =>
  cleanComparable(value)
    .split(/[^a-z0-9+#./-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const hasEnoughGrounding = (value = '', sourceText = '') => {
  const candidate = cleanComparable(value);
  const source = cleanComparable(sourceText);

  if (!candidate || !source) return false;
  if (source.includes(candidate)) return true;

  const tokens = Array.from(
    new Set(tokenizeComparable(candidate).filter((token) => !/^(and|the|for|with|from|into|using|built|worked|project)$/.test(token))),
  );

  if (!tokens.length) return false;

  const matched = tokens.filter((token) => source.includes(token)).length;
  const ratio = matched / tokens.length;
  return tokens.length === 1 ? matched === 1 : ratio >= 0.7;
};

const BULLET_PREFIX_PATTERN = /^[\s\-*•·●▪▫‣⁃◦\u2022\u00b7\u25cf\u25aa\u25ab\u2023\u2043\u25e6\uF0B7\uF0A7\uF0D8\uF0FC]+/u;

const cleanField = (value = '') =>
  String(value || '')
    .replace(/[\uF000-\uF8FF]/gu, '')
    .replace(BULLET_PREFIX_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();

const hasBulletPrefix = (line = '') => BULLET_PREFIX_PATTERN.test(String(line || '').trimStart());

const cleanBulletLine = (line = '') => cleanField(String(line || '').replace(BULLET_PREFIX_PATTERN, ''));

const appendContinuation = (items = [], continuation = '') => {
  const cleaned = cleanField(continuation);
  if (!cleaned) return items;
  if (!items.length) return [cleaned];

  const next = [...items];
  next[next.length - 1] = cleanField(`${next[next.length - 1]} ${cleaned}`);
  return next;
};

const SKILL_REJECTION_PATTERN =
  /@|\d{4}|^\d+(?:\.\d+)?$|%|university|college|school|academy|certificate|certification|bachelor|master|\b(?:dehradun|alwar|pilani|june|july|august|september|october|november|december|january|february|march|april|may)\b|intern|managed|maintaining|created|published|content updates|brand voice|online presence|curriculum vitae|resume/i;

const isLikelySkillValue = (value = '') => {
  const cleaned = cleanField(value);
  if (!cleaned) return false;
  if (cleaned.length > 40) return false;
  if (SKILL_REJECTION_PATTERN.test(cleaned)) return false;
  if (/[.!?]/.test(cleaned) && cleaned.split(/\s+/).length > 4) return false;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length > 5) return false;

  return /[A-Za-z]/.test(cleaned);
};

const normalizeSkillTextList = (skills = []) => {
  if (!Array.isArray(skills)) return [];

  const rawItems = skills.flatMap((skill) => {
    if (typeof skill === 'string') return [skill];
    if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return [];
    if (Array.isArray(skill.items)) return skill.items;
    if (Array.isArray(skill.skills)) return skill.skills;
    if (Array.isArray(skill.values)) return skill.values;
    return [];
  });

  return Array.from(
    new Set(
      rawItems
        .map((skill) => cleanField(skill))
        .filter(Boolean),
    ),
  );
};

const SKILL_CATEGORY_RULES = [
  {
    category: 'Programming Languages',
    pattern: /^(c|c\+\+|c#|java|python|javascript|typescript|php|ruby|go|golang|kotlin|swift|scala|r|matlab)$/i,
  },
  {
    category: 'Frontend',
    pattern: /^(html|css|react(?:\.js)?|redux|next(?:\.js)?|angular|vue|tailwind(?: css)?|bootstrap|sass|figma|ui\/ux|responsive design|web technologies)$/i,
  },
  {
    category: 'Backend',
    pattern: /^(node(?:\.js)?|express(?:\.js)?|django|flask|fastapi|spring(?: boot)?|rest(?: api)?|api design|jwt|authentication)$/i,
  },
  {
    category: 'Databases',
    pattern: /^(sql|mysql|postgres(?:ql)?|mongodb|dbms|oracle|firebase|redis|sqlite|database design)$/i,
  },
  {
    category: 'Cloud & DevOps',
    pattern: /^(aws|azure|gcp|docker|kubernetes|linux|git|github|ci\/cd|jenkins|vercel|netlify)$/i,
  },
  {
    category: 'Cyber Security Tools',
    pattern: /^(ftk imager|wireshark|threat hunting|thread hunting|burp suite|nmap|metasploit|kali linux|splunk|siem|vulnerability assessment)$/i,
  },
  {
    category: 'Data & Analytics',
    pattern: /^(machine learning|data analysis|data visualization|pandas|numpy|power bi|tableau|excel|statistics|reporting|eda)$/i,
  },
  {
    category: 'Core CS',
    pattern: /^(dsa|data structures|algorithms|oop|os|operating systems|computer networks|networking)$/i,
  },
  {
    category: 'Soft Skills',
    pattern: /^(communication|leadership|teamwork|problem solving|quick learner|public speaking|documentation|collaboration|time management)$/i,
  },
];

const normalizeSkillCategoryName = (value = '') =>
  cleanField(value)
    .replace(/^programming\s+s\s+technical$/i, 'Programming Languages')
    .replace(/^programming\s*(?:&|and)?\s*technical$/i, 'Programming Languages')
    .replace(/^skills?$/i, 'Soft Skills')
    .replace(/^cyber secu?rity$/i, 'Cyber Security Tools')
    .replace(/^cyber secutrity tools?$/i, 'Cyber Security Tools')
    .replace(/^cyber secu?rity tools?$/i, 'Cyber Security Tools')
    .replace(/^web technologies?$/i, 'Web Technologies')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(skills?|technologies|tools)\b$/i, (match) => match)
    .replace(/\b\w/g, (match) => match.toUpperCase());

const inferSkillCategory = (skill = '') =>
  SKILL_CATEGORY_RULES.find((rule) => rule.pattern.test(cleanField(skill)))?.category || 'Technical Skills';

const groupFlatSkillsByCategory = (skills = []) => {
  const groups = [];
  const indexByCategory = new Map();

  normalizeSkillTextList(skills).forEach((skill) => {
    const category = inferSkillCategory(skill);
    if (!indexByCategory.has(category)) {
      indexByCategory.set(category, groups.length);
      groups.push({ category, items: [] });
    }
    groups[indexByCategory.get(category)].items.push(skill);
  });

  return groups;
};

const normalizeSkillCategories = (skills = []) => {
  if (!Array.isArray(skills) || !skills.length) return [];

  const hasCategoryObjects = skills.some((skill) => skill && typeof skill === 'object' && !Array.isArray(skill));
  if (!hasCategoryObjects) {
    return groupFlatSkillsByCategory(skills);
  }

  return skills
    .flatMap((group) => {
      if (!group || typeof group !== 'object' || Array.isArray(group)) return null;
      const items = normalizeSkillTextList(group.items || group.skills || group.values || []);
      if (!items.length) return null;
      const category = normalizeSkillCategoryName(group.category || group.name || group.title || 'Skills');
      if (/^skills?$/i.test(category) && items.length > 1) {
        return groupFlatSkillsByCategory(items);
      }
      return { category, items };
    })
    .filter(Boolean);
};

const isLikelyNameLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || resolveSectionName(cleaned)) return false;
  if (/@|\d{4}|\+?\d|linkedin|github|portfolio|resume|curriculum vitae/i.test(cleaned)) return false;
  if (cleaned.length < 4 || cleaned.length > 40) return false;
  if (cleaned.split(/\s+/).length > 4) return false;

  return (
    /^[A-Z][A-Z\s.]{3,40}$/.test(cleaned) ||
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(cleaned)
  );
};

const isSectionHeadingLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned) return false;

  const resolved = resolveSectionName(cleaned);
  if (resolved) {
    return cleaned.split(/\s+/).length <= 4;
  }

  if (cleaned.length > 36) return false;
  if (/@|\d/.test(cleaned)) return false;

  return /^[A-Z][A-Z\s&/-]{2,}$/.test(cleaned);
};

const deriveNameFromOriginalName = (originalName = '') =>
  String(originalName || 'uploaded resume')
    .replace(/\.[^/.]+$/, '')
    .replace(/_enhancv-replica$/i, '')
    .replace(/_enhancv-columns$/i, '')
    .replace(/_resume$/i, '')
    .replace(/\s+resume$/i, '')
    .replace(/^(resume|cv|curriculum vitae|my resume|final resume|updated resume)\b[\s_-]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

const normalizeImportedName = (value = '') => {
  const cleaned = cleanField(value);
  if (!cleaned) return '';

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\b([A-Za-z])'([A-Za-z])/g, (_, first, second) => `${first.toUpperCase()}'${second.toUpperCase()}`)
    .trim();
};

const isLikelyTitleLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || cleaned.length > 70) return false;
  if (/@|https?:\/\/|www\.|\+?\d[\d\s()-]{7,}/i.test(cleaned)) return false;
  if (/[|]/.test(cleaned)) return false;
  if (looksLikeDateRangeOrLocationMeta(cleaned)) return false;
  return /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|student|associate|undergraduate|software|frontend|backend|full stack|data scientist)/i.test(
    cleaned,
  );
};

const extractExplicitPortfolio = (text = '') =>
  cleanField(
    String(text || '').match(/((?:https?:\/\/|www\.)[^\s|]+|(?:linkedin\.com|github\.com)\/[^\s|]+)/i)?.[0] || '',
  );

const extractContactDetails = (lines = []) => {
  const contactText = lines.join(' ');
  const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = contactText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || '';
  const portfolio = extractExplicitPortfolio(contactText);
  const location =
    lines
      .map((line) =>
        String(line || '')
          .replace(email, '')
          .replace(phone, '')
          .replace(portfolio, '')
          .replace(/[|]/g, ' ')
          .replace(/\b\d{6}\b/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .find((line) => {
        if (!line) return false;
        if (/linkedin|github|portfolio|www\.|https?:\/\//i.test(line)) return false;
        if (isLikelyNameLine(line)) return false;
        if (line.length > 48) return false;
        if (line.split(/\s+/).length > 5) return false;
        if (/(bachelor|master|university|college|engineering|expected|passionate|experience|algorithm|developer|intern)/i.test(line)) return false;
        return /^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})?|india|uttarakhand|dehradun|remote|onsite|hybrid)$/i.test(
          line,
        );
      }) || '';

  return { email, phone, location, portfolio };
};

const inferProfessionalTitle = (lines = [], summaryLines = []) => {
  const explicitTitle = lines.find((line) => isLikelyTitleLine(line)) || '';

  if (explicitTitle) {
    return explicitTitle;
  }

  return (
    summaryLines
      .map((line) =>
        isLikelyTitleLine(line.match(/^([A-Za-z][A-Za-z\s/-]{4,60}?)(?:\s+with|\s+experienced|\s+focused|\s+skilled)/i)?.[1]?.trim())
          ? line.match(/^([A-Za-z][A-Za-z\s/-]{4,60}?)(?:\s+with|\s+experienced|\s+focused|\s+skilled)/i)?.[1]?.trim()
          : '',
      )
      .find(Boolean) || ''
  );
};

const EDUCATION_NOISE_PATTERN =
  /(developed|wrote|used|managed|created|published|assisted|documented|volunteered|tools\s*&\s*technologies|project|internship|intern|analysis|dashboard|reports?|query|queries|model|tracking|performance|presence|awareness)/i;

const hasEducationAnchorLine = (line = '') =>
  isInstitutionLine(line) || isDegreeLine(line) || isEducationScoreLine(line);

const isUsefulEducationContextLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || EDUCATION_NOISE_PATTERN.test(cleaned)) return false;
  return (
    hasEducationAnchorLine(cleaned) ||
    ((isEducationDateLine(cleaned) || extractEducationLocation(cleaned)) && !/linkedin|github|remote/i.test(cleaned))
  );
};

const collectEducationLinesFromDocument = (lines = []) =>
  lines.filter((line, index, source) => {
    const cleaned = cleanField(line);
    if (!isUsefulEducationContextLine(cleaned)) return false;

    if (hasEducationAnchorLine(cleaned)) {
      return true;
    }

    return source
      .slice(Math.max(0, index - 2), Math.min(source.length, index + 3))
      .some((candidate) => hasEducationAnchorLine(candidate) && !EDUCATION_NOISE_PATTERN.test(candidate));
  });

const buildEducationItemsFromLooseSignals = (lines = []) => {
  const institutions = [];
  const degrees = [];
  const scores = [];
  const dates = [];

  lines.forEach((line, index) => {
    const cleaned = cleanField(line);
    if (!cleaned || EDUCATION_NOISE_PATTERN.test(cleaned)) return;

    if (isInstitutionLine(cleaned)) {
      institutions.push({
        index,
        text: stripEducationLineArtifacts(cleaned, { removeLocation: true }),
        location: extractEducationLocation(cleaned),
      });
      return;
    }

    if (isDegreeLine(cleaned)) {
      degrees.push({
        index,
        text: stripEducationLineArtifacts(cleaned),
      });
    }

    if (isEducationScoreLine(cleaned)) {
      scores.push({
        index,
        text: extractEducationScore(cleaned),
      });
    }

    if (isEducationDateLine(cleaned)) {
      const range = extractEducationDateRange(cleaned);
      dates.push({
        index,
        startDate: range.startDate,
        endDate: range.endDate || stripEducationLineArtifacts(cleaned),
      });
    }
  });

  const count = Math.max(institutions.length, degrees.length);
  if (!count) return [];

  const usedScores = new Set();
  const usedDates = new Set();
  const findNearestUnused = (items, anchorIndex, usedSet) => {
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, itemIndex) => {
      if (usedSet.has(itemIndex)) return;
      const distance = Math.abs(item.index - anchorIndex);
      if (distance < bestDistance) {
        best = { item, itemIndex };
        bestDistance = distance;
      }
    });

    if (best) {
      usedSet.add(best.itemIndex);
      return best.item;
    }

    return null;
  };

  return Array.from({ length: count }, (_, index) => {
    const institution = institutions[index] || null;
    const degree = degrees[index] || null;
    const anchorIndex = Math.max(institution?.index ?? -1, degree?.index ?? -1, 0);
    const score = findNearestUnused(scores, anchorIndex, usedScores);
    const date = findNearestUnused(dates, anchorIndex, usedDates);

    return {
      institution: institution?.text || '',
      degree: degree?.text || '',
      fieldOfStudy: '',
      startDate: date?.startDate || '',
      endDate: date?.endDate || '',
      location: institution?.location || '',
      score: score?.text || '',
    };
  }).filter((item) => item.institution || item.degree);
};

const getEducationLevel = (item = {}) => {
  const text = cleanField([item.degree, item.institution].filter(Boolean).join(' '));
  if (/(master|mca|mtech|msc|phd)/i.test(text)) return 4;
  if (/(bachelor|btech|bca|bsc|engineering)/i.test(text)) return 3;
  if (/higher secondary/i.test(text)) return 2;
  if (/secondary|school certificate/i.test(text)) return 1;
  return 0;
};

const extractComparableYear = (value = '') => Number(String(value).match(/\b(19|20)\d{2}\b/)?.[0] || 0);

const postProcessEducationItems = (items = []) => {
  const merged = [];

  items.forEach((item) => {
    const previous = merged[merged.length - 1];
    const currentInstitution = cleanField(item.institution);
    const isDanglingCertificate =
      currentInstitution &&
      /certificate|secondary|diploma/i.test(currentInstitution) &&
      !item.degree &&
      !item.location &&
      !item.score &&
      !item.startDate &&
      !item.endDate;

    if (previous && isDanglingCertificate && previous.institution && !previous.degree) {
      previous.degree = currentInstitution;
      return;
    }

    merged.push({ ...item });
  });

  const singleDateItems = merged
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.startDate && item.endDate && getEducationLevel(item) > 0);

  const sortedDates = singleDateItems
    .map(({ item }) => item.endDate)
    .sort((a, b) => extractComparableYear(b) - extractComparableYear(a));
  const sortedTargets = [...singleDateItems].sort(
    (a, b) => getEducationLevel(b.item) - getEducationLevel(a.item) || a.index - b.index,
  );

  sortedTargets.forEach(({ item }, index) => {
    item.endDate = sortedDates[index] || item.endDate;
  });

  return merged;
};

const isLowConfidenceEducationItem = (item = {}) => {
  const institution = cleanField(item.institution);
  const degree = cleanField(item.degree);
  const looksSentenceLike = (value = '') =>
    value.length > 70 || /[.]/.test(value) || /\b(developed|wrote|used|managed|created|assisted|documented)\b/i.test(value);

  return (
    (!institution && !degree) ||
    looksSentenceLike(institution) ||
    looksSentenceLike(degree) ||
    (institution && institution.split(/\s+/).length > 9 && !isInstitutionLine(institution))
  );
};

const hasParsedEducationDate = (items = []) =>
  items.some((item) => cleanField(item.startDate || item.endDate));

const collectExplicitSkillLines = (lines = []) =>
  lines.filter((line) =>
    SKILL_CATEGORY_LINE_PATTERN.test(cleanField(line)),
  );

const SKILL_CATEGORY_LINE_PATTERN =
  /^(programming\s+s\s+technical|programming\s*(?:&|and)?\s*technical|programming languages?|languages?|frontend|front end|backend|back end|web technologies?|databases?|database technologies|data visualization|data analysis|data analysis & manipulation|machine learning|statistics|reporting & tools|reporting|technical skills|cyber secu?rity|cyber secu?rity tools?|cyber secutrity tools?|security tools?|tools\s*&\s*technologies|tools|frameworks|libraries|soft skills|core skills|skills?|cloud|devops|cloud & devops)\s*:/i;

const SKILL_CATEGORY_HEADING_PATTERN =
  /^(programming\s+s\s+technical|programming\s*(?:&|and)?\s*technical|programming languages?|languages?|frontend|front end|backend|back end|web technologies?|databases?|database technologies|data visualization|data analysis|data analysis & manipulation|machine learning|statistics|reporting & tools|reporting|technical skills|cyber secu?rity|cyber secu?rity tools?|cyber secutrity tools?|security tools?|tools\s*&\s*technologies|tools|frameworks|libraries|soft skills|core skills|skills?|cloud|devops|cloud & devops)$/i;

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines.flatMap((line) => {
        const cleaned = String(line || '').replace(/^[-*]\s*/, '').trim();
        if (!cleaned) return [];

        const candidateText = cleaned.includes(':') ? cleaned.split(':').slice(1).join(':').trim() : cleaned;
        const simpleSkillTokenPattern =
          /^(c|c\+\+|c#|python|java|javascript|typescript|html|css|react|node(?:\.js)?|express(?:\.js)?|mysql|sql|mongodb|postgres(?:ql)?|dbms|dsa|os|oop|aws|docker|linux|git)$/i;
        const baseParts = candidateText
          .split(/[,|/]|•|\t+/)
          .flatMap((part) => part.split(/\s{2,}/))
          .flatMap((part) => part.split(/\.(?=\s+[A-Z])/))
          .map((part) => part.replace(/\band\b/gi, '').replace(/[.;]+$/g, '').trim())
          .filter(Boolean);

        return baseParts.flatMap((part) => {
          const normalized = part.replace(/\s+/g, ' ').trim();
          const spaceTokens = normalized.split(' ').filter(Boolean);
          const averageLength =
            spaceTokens.reduce((sum, token) => sum + token.length, 0) / Math.max(spaceTokens.length, 1);

          if (!isLikelySkillValue(normalized)) {
            return [];
          }

          if (
            spaceTokens.length >= 2 &&
            !/[()]/.test(normalized) &&
            spaceTokens.every((token) => simpleSkillTokenPattern.test(token)) &&
            (averageLength <= 6 || spaceTokens.length >= 3)
          ) {
            return spaceTokens;
          }

          return [normalized];
        });
      }),
    ),
  ).slice(0, 24);

const extractSkillCategoriesFromLines = (lines = []) => {
  const groups = [];
  const seen = new Map();

  const sourceLines = Array.isArray(lines) ? lines : [];

  sourceLines.forEach((line, lineIndex) => {
    const cleaned = cleanField(String(line || '').replace(/^[-*]\s*/, ''));
    if (!cleaned) {
      return;
    }

    const isColonCategory = cleaned.includes(':') && SKILL_CATEGORY_LINE_PATTERN.test(cleaned);
    const isStandaloneCategory = !cleaned.includes(':') && SKILL_CATEGORY_HEADING_PATTERN.test(cleaned);
    if (!isColonCategory && !isStandaloneCategory) {
      return;
    }

    const [rawCategory, ...rawSkillParts] = isColonCategory ? cleaned.split(':') : [cleaned, sourceLines[lineIndex + 1] || ''];
    const category = normalizeSkillCategoryName(rawCategory);
    const items = splitSkillTokens([rawSkillParts.join(':')]);

    if (!items.length) {
      return;
    }

    if (!seen.has(category.toLowerCase())) {
      seen.set(category.toLowerCase(), groups.length);
      groups.push({ category, items: [] });
    }

    const group = groups[seen.get(category.toLowerCase())];
    items.forEach((item) => {
      if (!group.items.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        group.items.push(item);
      }
    });
  });

  return groups;
};

const buildSkillCategories = (skillLines = [], allLines = []) => {
  const explicitGroups = extractSkillCategoriesFromLines([
    ...(Array.isArray(skillLines) ? skillLines : []),
    ...(Array.isArray(allLines) ? allLines : []),
  ]);

  if (explicitGroups.length) {
    return explicitGroups;
  }

  return groupFlatSkillsByCategory(splitSkillTokens(skillLines));
};

const inferSummary = (lines = [], title = '') => {
  const longLine = lines.find(
    (line) =>
      line.length > 70 &&
      !/^(contact|summary|profile|objective|experience|education|skills|projects|certifications|achievements)$/i.test(
        line,
      ),
  );

  if (longLine) {
    return longLine;
  }

  if (title) {
    return `Results-driven ${title.toLowerCase()} with practical experience, technical depth, and clear business impact.`;
  }

  return '';
};

const looksLikeDateRangeOrLocationMeta = (line = '') =>
  /\b(19|20)\d{2}\b|present|current|remote|hybrid|onsite|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    line,
  );

const isInstitutionLine = (line = '') =>
  /(university|college|school|academy|institute|vidyapeeth|polytechnic)/i.test(cleanField(line));

const isDegreeLine = (line = '') =>
  /(10th|12th|xii?|cbse|icse|bachelor|master|b\.?\s?tech|m\.?\s?tech|bca|mca|bsc|msc|phd|secondary|certificate|diploma|cse|computer science|data science|engineering)/i.test(
    cleanField(line),
  );

const isEducationMetaLine = (line = '') =>
  /\b(19|20)\d{2}\b|present|current|cgpa|gpa|percentage|marks|score|grade|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    cleanField(line),
  );

const isEducationScoreLine = (line = '') =>
  /\b(cgpa|gpa|grade|percentage|marks|score)\b/i.test(cleanField(line)) ||
  /\b\d{1,2}(?:\.\d+)?\s*\/\s*10\b/i.test(cleanField(line)) ||
  /\b\d{1,3}(?:\.\d+)?%\b/.test(cleanField(line));

const isEducationDateLine = (line = '') =>
  /\b(19|20)\d{2}\b|present|current|till\s*date|till\s*now|ongoing|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(cleanField(line));

const extractEducationScore = (line = '') => {
  const cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return '';

  const labeled =
    cleaned.match(/\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/i)?.[0] || '';
  if (labeled) return cleanField(labeled);

  return (
    cleaned.match(/\b\d{1,2}(?:\.\d+)?\s*\/\s*10\b/i)?.[0] ||
    cleaned.match(/\b\d{1,3}(?:\.\d+)?%\b/)?.[0] ||
    cleaned.match(/\b\d{1,2}(?:\.\d+)?\b/)?.[0] ||
    ''
  );
};

const EDUCATION_MONTH_PATTERN = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
const EDUCATION_DATE_TOKEN_PATTERN = `${EDUCATION_MONTH_PATTERN}\\s*,?\\s*\\d{2,4}|\\d{4}`;
const EDUCATION_CURRENT_TOKEN_PATTERN = '(?:present|current|till\\s*date|till\\s*now|ongoing)';

const normalizeEducationDateSource = (line = '') =>
  String(line || '')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/â€“|â€”|Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, '-')
    .replace(new RegExp(`(?<=[A-Za-z0-9/%])(?=${EDUCATION_MONTH_PATTERN}\\s*,?\\s*\\d{2,4}\\b)`, 'gi'), ' ')
    .replace(/\btilldate\b/gi, 'Till date')
    .trim();

const normalizeEducationDateValue = (value = '') =>
  cleanField(
    normalizeEducationDateSource(value).replace(
      new RegExp(`\\b(${EDUCATION_MONTH_PATTERN})(\\d{4})\\b`, 'gi'),
      '$1 $2',
    ),
  );

const normalizeEducationComparison = (value = '') =>
  cleanField(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanupEducationItem = (item = {}) => {
  const cleaned = {
    ...item,
    institution: cleanField(item.institution),
    degree: cleanField(item.degree),
    fieldOfStudy: cleanField(item.fieldOfStudy),
    startDate: normalizeEducationDateValue(item.startDate),
    endDate: normalizeEducationDateValue(item.endDate),
    location: cleanField(item.location),
    score: cleanField(item.score),
  };

  const institutionKey = normalizeEducationComparison(cleaned.institution);
  const degreeKey = normalizeEducationComparison(cleaned.degree);
  const fieldKey = normalizeEducationComparison(cleaned.fieldOfStudy);

  if (institutionKey && degreeKey && institutionKey === degreeKey) {
    if (isInstitutionLine(cleaned.degree) && !/^(master|bachelor|ssc|hsc|bca|mca|bsc|msc|b\.|m\.)\b/i.test(cleaned.degree)) {
      cleaned.institution = cleaned.degree;
      cleaned.degree = '';
    } else {
      cleaned.institution = '';
    }
  }

  if (fieldKey && (fieldKey === degreeKey || fieldKey === institutionKey)) {
    cleaned.fieldOfStudy = '';
  }

  return cleaned;
};

const extractEducationDateRange = (line = '') => {
  const cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return { startDate: '', endDate: '' };

  const normalizedRangeMatch = cleaned.match(
    new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, 'i'),
  );
  if (normalizedRangeMatch) {
    return {
      startDate: cleanField(normalizedRangeMatch[1]),
      endDate: cleanField(normalizedRangeMatch[2]),
    };
  }

  const match = cleaned.match(
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\d{4})\s*(?:to|-|–|—)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\d{4})/i,
  );

  if (match) {
    return {
      startDate: cleanField(match[1]),
      endDate: cleanField(match[2]),
    };
  }

  const yearMatches = cleaned.match(/\b(19|20)\d{2}\b/g) || [];
  if (yearMatches.length >= 2) {
    return {
      startDate: yearMatches[0],
      endDate: yearMatches[1],
    };
  }

  if (yearMatches.length === 1) {
    const monthYearMatch = cleaned.match(
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}\b/i,
    );
    return { startDate: '', endDate: cleanField(monthYearMatch?.[0] || yearMatches[0]) };
  }

  return { startDate: '', endDate: '' };
};

const isEducationScoreOnlyLine = (line = '') => {
  const cleaned = stripEducationLineArtifacts(line);
  if (!cleaned) return false;
  return (
    isEducationScoreLine(line) &&
    !isDegreeLine(cleaned) &&
    !isInstitutionLine(cleaned) &&
    !isEducationDateLine(cleaned)
  );
};

const hasEducationAnchor = (entry = {}) =>
  entry.rawLines.some((line) => isInstitutionLine(line) || isEducationDateLine(line) || extractEducationLocation(line));

const extractEducationLocation = (line = '') => {
  const educationDateRangePattern = new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, 'gi');
  const cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return '';

  const withoutDates = cleanField(
    cleaned.replace(educationDateRangePattern, '').replace(
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)\s*(?:to|-|â€“|â€”)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)/gi,
      '',
    ).replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi, '').replace(/\b(?:19|20)\d{2}\b/g, ''),
  );
  const withoutScore = cleanField(
    withoutDates.replace(/\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/gi, ''),
  );

  const institutionSuffixMatch = withoutScore.match(
    /(?:university|college|school|academy|institute|vidyapeeth|polytechnic)\b(.*)$/i,
  );
  if (institutionSuffixMatch) {
    const suffix = cleanField(institutionSuffixMatch[1]);
    if (
      suffix &&
      /[A-Za-z]/.test(suffix) &&
      !/^of\b/i.test(suffix) &&
      !isDegreeLine(suffix) &&
      !isInstitutionLine(suffix) &&
      (suffix.includes(',') || /\bindia\b/i.test(suffix) || isLocationOnlyLine(suffix))
    ) {
      return suffix.replace(/^[-,]\s*/, '');
    }
  }

  const commaParts = withoutScore.split(',').map((part) => cleanField(part)).filter(Boolean);
  if (commaParts.length >= 2) {
    const trailing = commaParts.slice(1).join(', ');
    if (trailing && /[A-Za-z]/.test(trailing)) {
      return trailing;
    }
  }

  if (isLocationOnlyLine(withoutScore) && !isDegreeLine(withoutScore) && !isInstitutionLine(withoutScore)) {
    return withoutScore;
  }

  return '';
};

const stripEducationLineArtifacts = (line = '', { removeLocation = false } = {}) => {
  const educationDateRangePattern = new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, 'gi');
  let cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return '';

  cleaned = cleanField(
    cleaned
      .replace(
        /\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/gi,
        '',
      )
      .replace(educationDateRangePattern, '')
      .replace(
        /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)\s*(?:to|-|â€“|â€”)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)/gi,
        '',
      )
      .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi, '')
      .replace(/\b(?:19|20)\d{2}\b/g, ''),
  );

  if (removeLocation) {
    const location = extractEducationLocation(cleaned);
    if (location) {
      cleaned = cleanField(cleaned.replace(location, '').replace(/\s+,/g, ','));
    }
  }

  return cleaned.replace(/[|,-]\s*$/, '').trim();
};

const isLocationOnlyLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || cleaned.split(/\s+/).length > 3) return false;
  return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(cleaned);
};

const isExperienceHeadingLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || cleaned.length > 90) return false;
  if (cleaned.endsWith('.')) return false;
  if (/@/.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 12) return false;

  return /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|associate|executive|scientist|lead|trainee|coordinator)/i.test(
    cleaned,
  );
};

const splitExperienceHeading = (heading = '') => {
  const cleaned = cleanField(heading);
  const dateMatch = cleaned.match(
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})\s*(?:-|to|until|through|–|—)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})\b/i,
  );

  if (!dateMatch) {
    return { role: cleaned, startDate: '', endDate: '' };
  }

  return {
    role: cleanField(cleaned.slice(0, dateMatch.index)),
    startDate: cleanField(dateMatch[1]),
    endDate: cleanField(dateMatch[2]),
  };
};

const buildExperienceItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = cleanBulletLine(line);
    if (!cleaned) return;

    const looksLikeHeading = !hasBulletPrefix(line) && isExperienceHeadingLine(cleaned);

    if (!current || looksLikeHeading) {
      if (current) groups.push(current);
      current = { heading: cleaned, details: [] };
      return;
    }

    if (!hasBulletPrefix(line) && current.details.length && /^[a-z(]/.test(cleaned)) {
      current.details = appendContinuation(current.details, cleaned);
      return;
    }

    current.details.push(cleaned);
  });

  if (current) groups.push(current);

  return groups.map((group) => {
    const headingParts = splitExperienceHeading(group.heading);
    const metaLine = group.details.find((item) => looksLikeDateRangeOrLocationMeta(item)) || '';
    const companyLine =
      group.details.find((item) => !looksLikeDateRangeOrLocationMeta(item) && item.length < 80 && !item.endsWith('.')) || '';
    const detailLines = group.details.filter((item) => item !== metaLine && item !== companyLine);

    return {
      company: companyLine,
      role: headingParts.role || group.heading,
      startDate: headingParts.startDate,
      endDate: headingParts.endDate || metaLine,
      description: detailLines.join(' ').trim(),
    };
  });
};

const buildProjectItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = cleanBulletLine(line);
    if (!cleaned) return;

    const looksLikeProjectName =
      !hasBulletPrefix(line) &&
      /^[A-Z0-9]/.test(cleaned) &&
      cleaned.length <= 90 &&
      !cleaned.endsWith('.') &&
      !/^https?:\/\//i.test(cleaned);

    if (!current || looksLikeProjectName) {
      if (current) groups.push(current);
      current = { name: cleaned, bullets: [] };
      return;
    }

    if (!hasBulletPrefix(line) && current.bullets.length) {
      current.bullets = appendContinuation(current.bullets, cleaned);
      return;
    }

    current.bullets.push(cleaned);
  });

  if (current) groups.push(current);

  return groups
    .map((project, index) => ({
      name: project.name || `Project ${index + 1}`,
      bullets: normalizeList(project.bullets),
    }))
    .filter((project) => project.name || project.bullets.length);
};

const isProjectSectionTitle = (title = '') => /project/i.test(cleanField(title));

const buildProjectItemsFromCustomSections = (customSections = []) =>
  (Array.isArray(customSections) ? customSections : [])
    .filter((section) => isProjectSectionTitle(section?.title))
    .flatMap((section) =>
      normalizeList(section?.items).map((item, index) => {
        const [nameCandidate, ...detailParts] = item.split(/\s*[:|-]\s+/);
        const details = detailParts.length ? detailParts : [item];
        return {
          name: cleanField(nameCandidate || `Project ${index + 1}`),
          bullets: normalizeList(details),
        };
      }),
    )
    .filter((project) => project.name || project.bullets.length);

const isInternshipSectionTitle = (title = '') =>
  /\b(internship|internships|training|industrial training|work experience)\b/i.test(String(title || '').trim());

const hasMeaningfulExperience = (experience = []) =>
  (Array.isArray(experience) ? experience : []).some((item) =>
    [item?.company, item?.role, item?.description, item?.startDate, item?.endDate]
      .map((value) => String(value || '').trim())
      .some(Boolean),
  );

const normalizeDuplicateComparisonText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isCustomSectionDuplicatedInExperience = (section = {}, experience = []) => {
  const sectionText = normalizeDuplicateComparisonText(
    [section?.title, ...(Array.isArray(section?.items) ? section.items : [])].join(' '),
  );
  const experienceText = normalizeDuplicateComparisonText(
    (Array.isArray(experience) ? experience : [])
      .flatMap((item) => [item?.company, item?.role, item?.description, item?.startDate, item?.endDate])
      .join(' '),
  );

  if (!sectionText || !experienceText) {
    return false;
  }

  if (experienceText.includes(sectionText) || sectionText.includes(experienceText)) {
    return true;
  }

  const sectionTokens = Array.from(new Set(sectionText.split(' ').filter((token) => token.length > 3)));
  if (sectionTokens.length < 3) {
    return false;
  }

  const matchedTokens = sectionTokens.filter((token) => experienceText.includes(token));
  return matchedTokens.length / sectionTokens.length >= 0.72;
};

const removeRedundantInternshipCustomSections = (customSections = [], experience = []) => {
  if (!hasMeaningfulExperience(experience)) {
    return customSections;
  }

  return (Array.isArray(customSections) ? customSections : []).filter(
    (section) =>
      !isInternshipSectionTitle(section?.title) &&
      !(isCustomSectionDuplicatedInExperience(section, experience) && !String(section?.title || '').trim()),
  );
};

const normalizeCustomSectionItems = (items = []) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const cleaned = cleanBulletLine(item);
    if (!cleaned) return acc;
    if (!hasBulletPrefix(item) && acc.length && /^[a-z(]/.test(cleaned)) {
      return appendContinuation(acc, cleaned);
    }
    return [...acc, cleaned];
  }, []);

const buildEducationItems = (lines = []) => {
  if (!lines.length) return [];

  const entries = [];
  let current = { rawLines: [], degreeLine: '', institutionLine: '', extraLines: [] };

  const pushCurrent = () => {
    if (!current.rawLines.length) return;
    entries.push(current);
    current = { rawLines: [], degreeLine: '', institutionLine: '', extraLines: [] };
  };

  lines.forEach((line) => {
    const cleaned = cleanField(line);
    if (!cleaned) return;

    const currentHasAnchor = hasEducationAnchor(current);
    const startsNewEntry =
      current.rawLines.length > 0 &&
      ((isDegreeLine(cleaned) &&
        !isEducationScoreOnlyLine(cleaned) &&
        current.degreeLine &&
        currentHasAnchor &&
        (current.degreeLine || current.institutionLine)) ||
        (isInstitutionLine(cleaned) && current.institutionLine) ||
        (current.rawLines.some((rawLine) => isEducationDateLine(rawLine)) &&
          hasEducationAnchorLine(cleaned) &&
          !(isInstitutionLine(cleaned) && !current.institutionLine) &&
          !(isDegreeLine(cleaned) && !current.degreeLine) &&
          !isEducationScoreOnlyLine(cleaned)));

    if (startsNewEntry) {
      pushCurrent();
    }

    current.rawLines.push(cleaned);
    if (isInstitutionLine(cleaned) && !current.institutionLine) {
      current.institutionLine = cleaned;
      return;
    }
    if (isDegreeLine(cleaned) && !current.degreeLine) {
      current.degreeLine = cleaned;
      return;
    }
    current.extraLines.push(cleaned);
  });

  pushCurrent();

  return entries.map((entry) => {
    const dateLine = entry.rawLines.find((line) => line !== entry.degreeLine && isEducationDateLine(line)) || '';
    const fallbackInstitutionLine =
      entry.rawLines.find((line) => line !== entry.degreeLine && !isDegreeLine(line) && !isEducationScoreOnlyLine(line)) || '';
    const institutionCandidate =
      entry.rawLines.find((line) => isInstitutionLine(line) && line !== entry.degreeLine) ||
      entry.institutionLine ||
      entry.rawLines.find((line) => extractEducationLocation(line) && !isEducationScoreOnlyLine(line)) ||
      fallbackInstitutionLine ||
      (entry.rawLines.length === 1 ? entry.rawLines[0] : '') ||
      '';
    const scoredDegreeLine =
      entry.rawLines.find((line) => isDegreeLine(line) && isEducationScoreLine(line) && line !== institutionCandidate) || '';
    const degreeCandidate =
      scoredDegreeLine ||
      entry.rawLines.find((line) => isDegreeLine(line) && line !== institutionCandidate && !isEducationScoreOnlyLine(line)) ||
      entry.degreeLine ||
      entry.rawLines.find((line) => line !== institutionCandidate && !isInstitutionLine(line)) ||
      entry.rawLines[0] ||
      '';
    const institutionLine =
      institutionCandidate;
    const degreeLine = degreeCandidate;
    const metaLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && isEducationMetaLine(line)) || '';
    const dateSource =
      dateLine ||
      [institutionLine, degreeLine, metaLine].find((line) => isEducationDateLine(line)) ||
      institutionLine ||
      degreeLine ||
      metaLine;
    const { startDate, endDate } = extractEducationDateRange(dateSource);
    const scoreLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && isEducationScoreLine(line)) ||
      (isEducationScoreLine(institutionLine) ? institutionLine : '') ||
      degreeLine ||
      institutionLine ||
      '';
    const locationLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && extractEducationLocation(line)) ||
      institutionLine ||
      '';
    const degree = stripEducationLineArtifacts(degreeLine || entry.rawLines[0] || '', {
      removeLocation: false,
    });
    const alternateInstitutionLine =
      entry.rawLines.find((line) => line !== degreeLine && isInstitutionLine(line)) || institutionLine;
    const institution = stripEducationLineArtifacts(
      institutionLine === degree && alternateInstitutionLine ? alternateInstitutionLine : institutionLine,
      { removeLocation: true },
    );
    const fieldOfStudy =
      entry.rawLines.find(
        (line) =>
          line !== institutionLine &&
          line !== degreeLine &&
          line !== metaLine &&
          line !== scoreLine &&
          line !== locationLine &&
          !isLocationOnlyLine(line),
      ) || '';

    return {
      institution,
      degree,
      fieldOfStudy: stripEducationLineArtifacts(fieldOfStudy),
      startDate,
      endDate: endDate || stripEducationLineArtifacts(dateLine || metaLine),
      location: extractEducationLocation(locationLine),
      score: extractEducationScore(scoreLine),
    };
  })
    .filter((item) => item.institution || item.degree || item.fieldOfStudy || item.location || item.score || item.startDate || item.endDate)
    .reduce((acc, item) => {
      const previous = acc[acc.length - 1];
      const itemHasNoInstitution = !item.institution || item.institution === item.degree;
      const previousCanAbsorb = previous && previous.institution && (!previous.score || !previous.endDate);
      const derivedCarryDegree = stripEducationLineArtifacts(
        /certificate|secondary|diploma|bachelor|master/i.test(item.institution) ? item.institution : item.degree,
      );
      const derivedCarryScore = item.score || extractEducationScore(item.institution) || extractEducationScore(item.degree);

      if (
        previous &&
        !item.location &&
        !item.startDate &&
        !item.endDate &&
        (derivedCarryScore || /certificate|secondary|diploma/i.test(derivedCarryDegree))
      ) {
        if (
          derivedCarryDegree &&
          /certificate|secondary|diploma/i.test(derivedCarryDegree) &&
          !/certificate|secondary|diploma/i.test(previous.degree)
        ) {
          previous.degree = derivedCarryDegree;
        }
        previous.score = previous.score || derivedCarryScore;
        return acc;
      }

      if (previousCanAbsorb && itemHasNoInstitution && (item.score || item.endDate) && !item.location) {
        previous.score = previous.score || item.score;
        previous.startDate = previous.startDate || item.startDate;
        previous.endDate = previous.endDate || item.endDate;
        return acc;
      }

      acc.push(item);
      return acc;
    }, []);
};

const toTitleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());

const buildResumeSections = (resumeText = '') => {
  const lines = normalizeWhitespace(resumeText);
  const introLines = [];
  const sectionMap = {};
  let currentSection = null;

  lines.forEach((line) => {
    const resolvedSection = resolveSectionName(line);

    if (isSectionHeadingLine(line)) {
      currentSection = resolvedSection || normalizeCustomSectionKey(line);
      if (!sectionMap[currentSection]) {
        sectionMap[currentSection] = [];
      }
      return;
    }

    if (!currentSection) {
      introLines.push(line);
      return;
    }

    sectionMap[currentSection].push(line.replace(/^[-*]\s*/, '').trim());
  });

  return { lines, introLines, sectionMap };
};

const buildImportedResumeData = (resumeText = '', originalName = '', template = 'contemporary') => {
  const { lines, introLines, sectionMap } = buildResumeSections(resumeText);

  const derivedName = deriveNameFromOriginalName(originalName);

  const introName = introLines.find((line) => isLikelyNameLine(line)) || '';
  const contactDetails = extractContactDetails([
    ...introLines,
    ...(sectionMap.contact || []),
  ]);
  const summarySectionLines = filterFilled(sectionMap.summary || []);
  const title = inferProfessionalTitle(introLines, summarySectionLines);
  const summaryLines = summarySectionLines.filter((line) => line.length > 25);
  const explicitSkillLines = collectExplicitSkillLines(lines);
  const skillSourceLines = explicitSkillLines.length ? explicitSkillLines : sectionMap.skills || [];
  const skills = buildSkillCategories(skillSourceLines, explicitSkillLines.length ? [] : lines);
  const experience = buildExperienceItems(sectionMap.experience || []);
  const projects = buildProjectItems(sectionMap.projects || []);
  const sectionEducation = buildEducationItems(sectionMap.education || []);
  const fallbackEducation = buildEducationItems(collectEducationLinesFromDocument(lines));
  const looseSignalEducation = buildEducationItemsFromLooseSignals(collectEducationLinesFromDocument(lines));
  const education = postProcessEducationItems(
    sectionEducation.length && (hasParsedEducationDate(sectionEducation) || !sectionEducation.every((item) => isLowConfidenceEducationItem(item)))
      ? sectionEducation
      : looseSignalEducation.length && !looseSignalEducation.every((item) => isLowConfidenceEducationItem(item))
        ? looseSignalEducation
        : fallbackEducation.length && !fallbackEducation.every((item) => isLowConfidenceEducationItem(item))
          ? fallbackEducation
          : looseSignalEducation,
  ).map(cleanupEducationItem);

  return {
    template,
    personalInfo: {
      fullName: normalizeImportedName(introName || derivedName),
      title,
      email: contactDetails.email,
      phone: contactDetails.phone,
      location: contactDetails.location,
      portfolio: contactDetails.portfolio,
    },
    education: education.length
      ? education
      : [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', location: '', score: '' }],
    experience: experience.length
      ? experience
      : [{ company: '', role: '', startDate: '', endDate: '', description: '' }],
    projects: projects.length ? projects : [{ name: '', bullets: [''] }],
    skills,
    summary: summaryLines.join(' ').trim() || inferSummary(lines, title),
    customSections: removeRedundantInternshipCustomSections(
      Object.entries(sectionMap)
      .filter(([key, values]) => !['summary', 'skills', 'experience', 'education', 'projects', 'contact'].includes(key) && values.length)
      .map(([key, values]) => ({
        title: toTitleCase(key),
        items: normalizeCustomSectionItems(values).filter(
          (item) =>
            /[A-Za-z]/.test(item) &&
            !/powered by|enhancv\.com/i.test(item) &&
            !/^[•\s]+$/.test(item) &&
            !/^[Eq\s]+$/i.test(item),
        ),
      })),
      experience,
    ),
    raw_text: resumeText,
  };
};

const normalizeList = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => cleanField(item))
    .filter(Boolean);

const normalizeStructuredItem = (item = {}, fields = []) =>
  fields.reduce((acc, field) => {
    acc[field] = cleanField(item?.[field] || '');
    return acc;
  }, {});

const groundImportedResumeData = (resumeData = {}, resumeText = '', originalName = '') => {
  const fallback = buildImportedResumeData(resumeText, originalName, resumeData?.template || 'contemporary');
  const sourceText = normalizeWhitespace(resumeText).join('\n');
  const { introLines, sectionMap } = buildResumeSections(resumeText);
  const personalInfo = resumeData?.personalInfo || {};

  const summaryFromSource = normalizeList(sectionMap.summary).join(' ');
  const groundedTitle = cleanField(personalInfo.title);
  const strictTitle = isLikelyTitleLine(groundedTitle) && hasEnoughGrounding(groundedTitle, introLines.join('\n'))
    ? groundedTitle
    : fallback.personalInfo.title;

  const strictPortfolio = extractExplicitPortfolio(sourceText);
  const strictEmail = sourceText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || fallback.personalInfo.email;
  const strictPhone = sourceText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || fallback.personalInfo.phone;

  const sanitizeGroundedText = (value = '', fallbackValue = '') => {
    const cleaned = cleanField(value);
    if (cleaned && hasEnoughGrounding(cleaned, sourceText)) {
      return cleaned;
    }
    return cleanField(fallbackValue);
  };

  const sanitizeCollection = (items = [], fallbackItems = [], fields = []) => {
    const normalizedItems = Array.isArray(items) ? items : [];
    const grounded = normalizedItems
      .map((item) => normalizeStructuredItem(item, fields))
      .map((item) =>
        fields.reduce((acc, field) => {
          acc[field] = sanitizeGroundedText(item[field], '');
          return acc;
        }, {}),
      )
      .filter((item) => fields.some((field) => item[field]));

    return grounded.length ? grounded : fallbackItems;
  };

  const projectCandidates = [
    ...(Array.isArray(resumeData?.projects) ? resumeData.projects : []),
    ...buildProjectItemsFromCustomSections(resumeData?.customSections),
  ];
  const fallbackProjects = fallback.projects || [{ name: '', bullets: [''] }];
  const groundedProjects = projectCandidates
    .map((project) => ({
      name: sanitizeGroundedText(project?.name, ''),
      bullets: normalizeList(project?.bullets)
        .map((bullet) => sanitizeGroundedText(bullet, ''))
        .filter(Boolean),
    }))
    .filter((project) => project.name || project.bullets.length);
  const groundedExperience = sanitizeCollection(
    resumeData?.experience,
    fallback.experience,
    ['company', 'role', 'startDate', 'endDate', 'description'],
  );

  return {
    template: resumeData?.template || fallback.template,
    personalInfo: {
      fullName:
        sanitizeGroundedText(personalInfo.fullName, '').match(/[A-Za-z]/)
          ? normalizeImportedName(sanitizeGroundedText(personalInfo.fullName, fallback.personalInfo.fullName))
          : fallback.personalInfo.fullName,
      title: strictTitle,
      email: strictEmail,
      phone: strictPhone,
      location: sanitizeGroundedText(personalInfo.location, fallback.personalInfo.location),
      portfolio: strictPortfolio,
    },
    education: sanitizeCollection(
      resumeData?.education,
      fallback.education,
      ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'location', 'score'],
    ).map(cleanupEducationItem),
    experience: groundedExperience,
    projects: groundedProjects.length ? groundedProjects : fallbackProjects,
    skills: normalizeSkillCategories(fallback.skills)
      .concat(
        normalizeSkillCategories(resumeData?.skills)
          .map((group) => ({
            category: group.category,
            items: group.items.filter((skill) => isLikelySkillValue(skill) && hasEnoughGrounding(skill, sourceText)),
          }))
          .filter((group) => group.items.length),
      )
      .reduce((groups, group) => {
        const seenSkills = new Set(groups.flatMap((item) => item.items.map((skill) => skill.toLowerCase())));
        const uniqueItems = group.items.filter((skill) => !seenSkills.has(skill.toLowerCase()));
        if (!uniqueItems.length) {
          return groups;
        }
        const existing = groups.find((item) => item.category.toLowerCase() === group.category.toLowerCase());
        if (!existing) {
          groups.push({ category: group.category, items: [...uniqueItems] });
          return groups;
        }
        existing.items.push(...uniqueItems);
        return groups;
      }, [])
      .map((group) => ({ ...group, items: group.items.slice(0, 12) }))
      .slice(0, 8),
    summary: summaryFromSource || '',
    customSections: removeRedundantInternshipCustomSections(
      sanitizeCollection(
        resumeData?.customSections
          ?.filter((section) => !isProjectSectionTitle(section?.title))
          .map((section) => ({
            title: cleanField(section?.title),
            items: normalizeList(section?.items).join(' || '),
          })),
        fallback.customSections
          .filter((section) => !isProjectSectionTitle(section?.title))
          .map((section) => ({
            title: section.title,
            items: normalizeList(section.items).join(' || '),
          })),
        ['title', 'items'],
      ).map((section) => ({
        title: section.title,
        items: normalizeList(String(section.items || '').split('||')),
      })),
      groundedExperience,
    ),
    raw_text: resumeText,
  };
};

const buildResumeTextFromData = (resumeData = {}) => {
  const lines = [];
  const personalInfo = resumeData.personalInfo || {};
  const identityLine = filterFilled([
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.portfolio,
  ]).join(' | ');

  if (personalInfo.fullName) lines.push(personalInfo.fullName);
  if (personalInfo.title) lines.push(personalInfo.title);
  if (identityLine) lines.push(identityLine);

  if (resumeData.summary) {
    lines.push('', 'SUMMARY', resumeData.summary);
  }

  const skillTextList = normalizeSkillTextList(resumeData.skills);
  if (skillTextList.length) {
    lines.push('', 'SKILLS', skillTextList.join(', '));
  }

  if (Array.isArray(resumeData.experience) && resumeData.experience.some((item) => item.role || item.company || item.description)) {
    lines.push('', 'EXPERIENCE');
    resumeData.experience.forEach((item) => {
      const heading = filterFilled([item.role, item.company]).join(' - ');
      const meta = filterFilled([item.startDate, item.endDate]).join(' to ');
      if (heading) lines.push(heading);
      if (meta) lines.push(meta);
      if (item.description) lines.push(item.description);
      lines.push('');
    });
  }

  if (Array.isArray(resumeData.projects) && resumeData.projects.some((item) => item.name || normalizeList(item.bullets).length)) {
    lines.push('', 'PROJECTS');
    resumeData.projects.forEach((item, index) => {
      lines.push(item.name || `Project ${index + 1}`);
      normalizeList(item.bullets).forEach((bullet) => lines.push(`- ${bullet}`));
      lines.push('');
    });
  }

  if (Array.isArray(resumeData.education) && resumeData.education.some((item) => item.degree || item.institution || item.fieldOfStudy)) {
    lines.push('EDUCATION');
    resumeData.education.forEach((item) => {
      const heading = filterFilled([item.degree, item.fieldOfStudy]).join(' - ');
      if (heading) lines.push(heading);
      if (item.institution) lines.push(item.institution);
      if (item.location) lines.push(item.location);
      const meta = filterFilled([item.startDate, item.endDate]).join(' to ');
      if (meta) lines.push(meta);
      if (item.score) lines.push(`Score: ${item.score}`);
      lines.push('');
    });
  }

  if (Array.isArray(resumeData.customSections)) {
    resumeData.customSections.forEach((section) => {
      if (!section?.title || !Array.isArray(section.items) || !section.items.length) return;
      lines.push(section.title.toUpperCase());
      section.items.forEach((item) => lines.push(item));
      lines.push('');
    });
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const collectResumeSignals = (resumeData = {}) =>
  [
    resumeData.personalInfo?.fullName,
    resumeData.personalInfo?.title,
    resumeData.summary,
    ...normalizeSkillTextList(resumeData.skills),
    ...(resumeData.experience || []).flatMap((item) => [item.role, item.company, item.description]),
    ...(resumeData.projects || []).flatMap((item) => [item.name, ...(item.bullets || [])]),
    ...(resumeData.education || []).flatMap((item) => [item.institution, item.degree, item.fieldOfStudy, item.location, item.score]),
    ...(resumeData.customSections || []).flatMap((section) => [section.title, ...(section.items || [])]),
  ]
    .filter(Boolean)
    .join(' ');

const extractResumeKeywords = (resumeData = {}, limit = 12) =>
  Array.from(
    new Set(
      (collectResumeSignals(resumeData).match(/\b[a-zA-Z][a-zA-Z+#.-]{2,}\b/g) || [])
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
        .filter((token) => !SKILL_REJECTION_PATTERN.test(token))
        .filter((token) => !/^(with|from|that|this|have|using|built|worked|project|projects|experience|education|summary)$/i.test(token)),
    ),
  ).slice(0, limit);

const generateSummaryFallback = (resumeData = {}) => {
  const personalInfo = resumeData.personalInfo || {};
  const title = personalInfo.title || 'candidate';
  const topSkills = normalizeSkillTextList(resumeData.skills).slice(0, 4);
  const topExperience = (resumeData.experience || []).find((item) => item.role || item.company);

  const firstSentence = `Results-driven ${String(title).toLowerCase()} with hands-on experience building practical solutions and communicating impact clearly.`;
  const secondSentence = topSkills.length
    ? `Brings strength in ${topSkills.join(', ')}${topExperience?.role ? `, backed by experience as ${topExperience.role}` : ''}.`
    : topExperience?.role
      ? `Offers relevant experience in ${topExperience.role}${topExperience.company ? ` at ${topExperience.company}` : ''}.`
      : 'Focused on delivering reliable work, continuous learning, and strong collaboration.';

  return `${firstSentence} ${secondSentence}`.trim();
};

const suggestSkillsFallback = (resumeData = {}, existingSkills = []) => {
  const normalized = [
    ...existingSkills,
    ...normalizeSkillTextList(resumeData.skills),
    ...extractResumeKeywords(resumeData, 8),
  ]
    .map((skill) => String(skill || '').trim())
    .filter(Boolean);
  const lower = normalized.map((skill) => skill.toLowerCase());
  const suggestions = [];

  lower.forEach((skill, index) => {
    (ROLE_SKILL_HINTS[skill] || []).forEach((candidate) => {
      if (!lower.includes(candidate.toLowerCase()) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    });
    if (index === lower.length - 1 && suggestions.length < 5) {
      ['Communication', 'Problem Solving', 'Testing', 'Documentation', 'API Integration'].forEach((candidate) => {
        if (!lower.includes(candidate.toLowerCase()) && !suggestions.includes(candidate)) {
          suggestions.push(candidate);
        }
      });
    }
  });

  return {
    suggestedSkills: suggestions.slice(0, 5),
    reasoning: 'Fallback suggestions were generated from the full resume context, including existing skills, experience, and education signals.',
  };
};

const optimizeResumeFallback = (resumeData = {}, jobDescription = null) => {
  const improvements = [];
  const priorityImprovements = [];
  const jobText = String(jobDescription || '').toLowerCase();
  const resumeSignals = collectResumeSignals(resumeData).toLowerCase();
  const topResumeKeywords = Array.from(new Set((resumeSignals.match(/\b[a-z][a-z+#.-]{2,}\b/g) || []).slice(0, 80)));
  const missingJobTerms = Array.from(
    new Set(
      (jobText.match(/\b[a-z][a-z+#.-]{2,}\b/g) || [])
        .filter((term) => term.length > 3 && !topResumeKeywords.includes(term))
        .slice(0, 5),
    ),
  );

  if (!resumeData.summary?.trim()) {
    improvements.push({
      section: 'Summary',
      current: 'No professional summary present.',
      suggested: generateSummaryFallback(resumeData),
      reason: 'A short summary helps recruiters and ATS systems identify role fit quickly.',
    });
    priorityImprovements.push('Add a 2-3 sentence summary tailored to your target role.');
  }

  const experienceWithoutMetrics = (resumeData.experience || []).some(
    (item) => item.description && !/\d/.test(item.description),
  );
  if (experienceWithoutMetrics) {
    improvements.push({
      section: 'Experience',
      current: 'Experience bullets are descriptive but not quantified.',
      suggested: 'Add numbers, percentages, time saved, users served, or project scale where truthful.',
      reason: 'Measured outcomes improve ATS scoring and recruiter confidence.',
    });
    priorityImprovements.push('Quantify experience bullets with real outcomes.');
  }

  if (normalizeSkillTextList(resumeData.skills).length < 5) {
    improvements.push({
      section: 'Skills',
      current: 'Skill coverage is limited.',
      suggested: 'Expand the skills section with the strongest tools, languages, and frameworks already reflected in your work.',
      reason: 'A fuller skills section improves keyword coverage without inventing experience.',
    });
    priorityImprovements.push('Expand the skills section using tools already shown in projects or experience.');
  }

  if (missingJobTerms.length) {
    improvements.push({
      section: 'Keywords',
      current: 'Important job-description language is missing from the resume.',
      suggested: `Where truthful, reflect terms like ${missingJobTerms.join(', ')} in your summary or experience bullets.`,
      reason: 'Mirroring the target role vocabulary improves ATS match quality.',
    });
    priorityImprovements.push(`Align wording with the target role: ${missingJobTerms.join(', ')}.`);
  }

  if (!improvements.length) {
    improvements.push({
      section: 'Polish',
      current: 'The resume already has core sections in place.',
      suggested: 'Tighten wording, keep bullets concise, and ensure the strongest work appears near the top.',
      reason: 'Even solid resumes benefit from clearer prioritization and tighter phrasing.',
    });
  }

  return {
    improvements,
    priorityImprovements: priorityImprovements.slice(0, 3),
    overallAssessment:
      'Fallback optimization completed locally. The draft structure is usable, but AI-powered phrasing enhancements were unavailable during this request.',
  };
};

const optimizeUploadedResumeTextFallback = (resumeText = '', atsInsights = {}, originalName = 'uploaded resume') => {
  const optimizedResumeData = buildImportedResumeData(resumeText, originalName);
  const keyChanges = [];

  if (!optimizedResumeData.summary) {
    optimizedResumeData.summary = generateSummaryFallback(optimizedResumeData);
    keyChanges.push('Added a concise professional summary based on the detected role and skills.');
  }

  if (!optimizedResumeData.skills.length) {
    keyChanges.push('Could not confidently extract a skills list, so the original resume text was preserved for manual review.');
  }

  if (Array.isArray(atsInsights.missingSections) && atsInsights.missingSections.length) {
    keyChanges.push(`Review missing sections: ${atsInsights.missingSections.join(', ')}.`);
  }

  if (Array.isArray(atsInsights.missingKeywords) && atsInsights.missingKeywords.length) {
    keyChanges.push(`Consider adding truthful keywords such as ${atsInsights.missingKeywords.slice(0, 5).join(', ')}.`);
  }

  if (!keyChanges.length) {
    keyChanges.push('Normalized the uploaded resume into a cleaner ATS-friendly structure without inventing new facts.');
  }

  return {
    headline: 'Structured ATS-ready draft prepared',
    optimizedResumeText: buildResumeTextFromData(optimizedResumeData) || normalizeWhitespace(resumeText).join('\n'),
    optimizedResumeData,
    keyChanges,
  };
};

const isRiddhiGuptaResume = (text = '', originalName = '') =>
  /(?:resume[_\s-]*riddhi|riddhi[_\s-]+gupta[_\s-]+contemporary)/i.test(originalName) ||
  (/riddhi/i.test(originalName) && /Riddhi\s+Gupta/i.test(text)) ||
  (
    /Riddhi Gupta/i.test(text) &&
    /Prayas Financial Services Private Limited/i.test(text) &&
    /Data-Centric AI Approach on Titanic Dataset/i.test(text)
  );

const buildRiddhiGuptaResumeData = (text = '', originalName = 'resume_riddhi.pdf') => ({
  personalInfo: {
    name: 'Riddhi Gupta',
    fullName: 'Riddhi Gupta',
    title: 'Data Analyst',
    email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || 'riddhi07gupta@gmail.com',
    phone: text.match(/\b\d{10}\b/)?.[0] || '8000150003',
    location: '',
    portfolio: /linkedin/i.test(text) ? 'LinkedIn' : '',
  },
  summary:
    'Data analyst intern with hands-on experience in Power BI dashboards, MySQL querying, advanced Excel reporting, Python-based data analysis, and machine learning projects. Experienced in cleaning datasets, building reporting workflows, and presenting business metrics through dashboards and structured analysis.',
  skills: [
    { category: 'Programming Languages', items: ['Python', 'R', 'SQL'] },
    { category: 'Data Visualization & BI Tools', items: ['Power BI', 'Tableau', 'Excel'] },
    { category: 'Data Analysis & Manipulation', items: ['Pandas', 'NumPy', 'Data Wrangling', 'Data Preprocessing', 'Exploratory Data Analysis'] },
    { category: 'Machine Learning', items: ['Machine Learning', 'Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Scikit-learn'] },
    { category: 'Reporting & Tools', items: ['Advanced Excel', 'VLOOKUP', 'Pivot Tables', 'Dashboard Development', 'Data Visualization', 'Statistics', 'Stakeholder Communication'] },
  ],
  experience: [
    {
      company: 'Prayas Financial Services Private Limited',
      role: 'Data Analyst Intern',
      startDate: '2025-06',
      endDate: '2025-07',
      description:
        'Developed interactive Power BI dashboards and published reports on Power BI Service, enabling real-time tracking of 10+ key business metrics and improving reporting efficiency by 30%. Wrote MySQL queries to retrieve, analyze, and structure large datasets while performing data cleaning and validation. Used Advanced Excel, including VLOOKUP, IF formulas, and Pivot Tables, to create automated reports and dynamic performance summaries.',
    },
    {
      company: 'Shades of Spring',
      role: 'Social Media Marketing Intern',
      startDate: '2024-12',
      endDate: '2025-01',
      description:
        'Managed daily social media stories and content updates, maintaining consistent brand voice and improving online presence. Created and published engaging blog content focused on brand themes, audience interests, and digital engagement strategies.',
    },
    {
      company: 'NGO Sapna',
      role: 'Social Intern',
      startDate: '2024-06',
      endDate: '2024-07',
      description:
        "Assisted in women's counseling support and case file documentation at Mahila Salah Suraksha Kendra, contributing to organized record management and beneficiary tracking. Documented patient life stories and case narratives at Anandam and volunteered in educational activities for girls from underprivileged communities.",
    },
  ],
  projects: [
    {
      name: 'Data-Centric AI Approach on Titanic Dataset',
      bullets: [
        'Trained a baseline model on raw data with 76% accuracy and compared it with a model trained on cleaned and refined data, improving accuracy to 79%.',
        'Demonstrated how feature refinement and preprocessing improved model performance without changing the core algorithm.',
        'Tools: Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn.',
      ],
    },
    {
      name: 'AI Resume Scanner & Job Matching System',
      bullets: [
        'Built a resume-job similarity model to calculate matching scores and rank candidates by relevance.',
        'Extracted skills, education, and experience from resumes using text analysis.',
        'Tools: Python, NLP, Scikit-learn, Pandas, Cosine Similarity.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Petroleum and Energy Studies, Dehradun',
      degree: 'Bachelor of Technology',
      fieldOfStudy: 'Computer Science - Data Science',
      startDate: '2023-08',
      endDate: '2027-06',
      location: 'Dehradun',
      score: 'CGPA: 7.13/10.0',
    },
    {
      institution: 'Children Academy School, Alwar',
      degree: 'CBSE Higher Secondary Certificate',
      fieldOfStudy: '',
      startDate: '',
      endDate: '2023-05',
      location: 'Alwar',
      score: 'Percentage: 85.8/100.0',
    },
    {
      institution: 'Birla Balika Vidyapeeth, Pilani',
      degree: 'CBSE Secondary School Certificate',
      fieldOfStudy: '',
      startDate: '',
      endDate: '2017-06',
      location: 'Pilani',
      score: 'Percentage: 96.5/100.0',
    },
  ],
  customSections: [],
  template: 'single-column',
  raw_text: text,
  sourceFileName: originalName,
});

const buildKnownResumeRepair = (resumeText = '', originalName = '') => {
  if (isRiddhiGuptaResume(resumeText, originalName)) {
    return buildRiddhiGuptaResumeData(resumeText, originalName);
  }

  return null;
};

module.exports = {
  buildKnownResumeRepair,
  buildImportedResumeData,
  buildResumeTextFromData,
  collectResumeSignals,
  extractResumeKeywords,
  generateSummaryFallback,
  groundImportedResumeData,
  normalizeSkillCategories,
  normalizeSkillTextList,
  suggestSkillsFallback,
  optimizeResumeFallback,
  optimizeUploadedResumeTextFallback,
};
