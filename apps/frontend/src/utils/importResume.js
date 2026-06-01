const SECTION_NAME_MAP = {
  contact: "contact",
  "professional_summary": "summary",
  summary: "summary",
  profile: "summary",
  objective: "summary",
  experience: "experience",
  "work_experience": "experience",
  "professional_experience": "experience",
  employment: "experience",
  education: "education",
  academics: "education",
  skills: "skills",
  "technical_skills": "skills",
  "core_skills": "skills",
  projects: "projects",
  certifications: "certifications",
  achievements: "achievements",
  languages: "languages",
};

const KNOWN_SECTION_KEYS = new Set(Object.keys(SECTION_NAME_MAP));

const normalizeWhitespace = (value = "") =>
  String(value || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line))
    .map((line) => line.replace(/\s+/g, " ").trim());

const normalizeSectionName = (line = "") =>
  line.toLowerCase().replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_");

const resolveSectionName = (line = "") => SECTION_NAME_MAP[normalizeSectionName(line)] || null;

const filterFilled = (items = []) => items.filter(Boolean);
const normalizeCustomSectionKey = (line = "") =>
  String(line || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
const SKILL_REJECTION_PATTERN =
  /@|\d{4}|^\d+(?:\.\d+)?$|%|university|college|school|academy|certificate|certification|bachelor|master|dehradun|alwar|pilani|june|july|august|september|october|november|december|january|february|march|april|may|intern|managed|maintaining|created|published|content updates|brand voice|online presence|curriculum vitae|resume/i;

const isLikelySkillValue = (value = "") => {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return false;
  if (cleaned.length > 40) return false;
  if (SKILL_REJECTION_PATTERN.test(cleaned)) return false;
  if (/[.!?]/.test(cleaned) && cleaned.split(/\s+/).length > 4) return false;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length > 5) return false;

  return /[A-Za-z]/.test(cleaned);
};

const isLikelyNameLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned || resolveSectionName(cleaned)) return false;
  if (/@|\d{4}|\+?\d|linkedin|github|portfolio|resume|curriculum vitae/i.test(cleaned)) return false;
  if (cleaned.length < 4 || cleaned.length > 40) return false;
  if (cleaned.split(/\s+/).length > 4) return false;

  return (
    /^[A-Z][A-Z\s.]{3,40}$/.test(cleaned) ||
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(cleaned)
  );
};

const isSectionHeadingLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return false;

  const resolved = resolveSectionName(cleaned);
  if (resolved) {
    return cleaned.split(/\s+/).length <= 4;
  }

  if (cleaned.length > 36) return false;
  if (/@|\d/.test(cleaned)) return false;

  return /^[A-Z][A-Z\s&/-]{2,}$/.test(cleaned);
};

const deriveNameFromOriginalName = (originalName = "") =>
  String(originalName || "uploaded resume")
    .replace(/\.[^/.]+$/, "")
    .replace(/_enhancv-replica$/i, "")
    .replace(/_enhancv-columns$/i, "")
    .replace(/_resume$/i, "")
    .replace(/\s+resume$/i, "")
    .replace(/^(resume|cv|curriculum vitae|my resume|final resume|updated resume)\b[\s_-]*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

const normalizeImportedName = (value = "") => {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\b([A-Za-z])'([A-Za-z])/g, (_, first, second) => `${first.toUpperCase()}'${second.toUpperCase()}`)
    .trim();
};

const extractContactDetails = (lines = []) => {
  const contactText = lines.join(" ");
  const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = contactText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || "";
  const portfolio =
    contactText.match(/((?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[^\s|•]+|github\.com\/[^\s|•]+|[A-Z0-9.-]+\.[A-Z]{2,}\/[^\s|•]+))/i)?.[0] ||
    "";
  const location = lines
    .map((line) =>
      String(line || "")
        .replace(email, "")
        .replace(phone, "")
        .replace(portfolio, "")
        .replace(/[•|]/g, " ")
        .replace(/\b\d{6}\b/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find((line) => {
      if (!line) return false;
      if (/linkedin|github|portfolio|www\.|https?:\/\//i.test(line)) return false;
      if (/(bachelor|master|university|college|engineering|expected)/i.test(line)) return false;
      return /(india|uttarakhand|dehradun|remote|onsite|hybrid|[A-Z][a-z]+,\s*[A-Z][a-z]+)/i.test(line);
    }) || "";

  return { email, phone, location, portfolio };
};

const inferProfessionalTitle = (lines = [], summaryLines = []) => {
  const explicitTitle =
    lines.find((line) =>
      /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|student|associate|undergraduate)/i.test(
        line,
      ),
    ) || "";

  if (explicitTitle) {
    return explicitTitle;
  }

  const summaryTitle = summaryLines
    .map((line) => line.match(/^([A-Za-z][A-Za-z\s/-]{4,60}?)(?:\s+with|\s+experienced|\s+focused|\s+skilled)/i)?.[1]?.trim())
    .find(Boolean);

  return summaryTitle || "";
};

const EDUCATION_NOISE_PATTERN =
  /(developed|wrote|used|managed|created|published|assisted|documented|volunteered|tools\s*&\s*technologies|project|internship|intern|analysis|dashboard|reports?|query|queries|model|tracking|performance|presence|awareness)/i;

const hasEducationAnchorLine = (line = "") =>
  isInstitutionLine(line) || isDegreeLine(line) || isEducationScoreLine(line);

const isUsefulEducationContextLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned || EDUCATION_NOISE_PATTERN.test(cleaned)) return false;
  return (
    hasEducationAnchorLine(cleaned) ||
    ((isEducationDateLine(cleaned) || extractEducationLocation(cleaned)) && !/linkedin|github|remote/i.test(cleaned))
  );
};

const collectEducationLinesFromDocument = (lines = []) =>
  lines.filter((line, index, source) => {
    const cleaned = String(line || "").replace(/\s+/g, " ").trim();
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
    const cleaned = String(line || "").replace(/\s+/g, " ").trim();
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
      institution: institution?.text || "",
      degree: degree?.text || "",
      fieldOfStudy: "",
      startDate: date?.startDate || "",
      endDate: date?.endDate || "",
      location: institution?.location || "",
      score: score?.text || "",
    };
  }).filter((item) => item.institution || item.degree);
};

const getEducationLevel = (item = {}) => {
  const text = String([item.degree, item.institution].filter(Boolean).join(" ") || "").replace(/\s+/g, " ").trim();
  if (/(master|mca|mtech|msc|phd)/i.test(text)) return 4;
  if (/(bachelor|btech|bca|bsc|engineering)/i.test(text)) return 3;
  if (/higher secondary/i.test(text)) return 2;
  if (/secondary|school certificate/i.test(text)) return 1;
  return 0;
};

const extractComparableYear = (value = "") => Number(String(value).match(/\b(19|20)\d{2}\b/)?.[0] || 0);

const postProcessEducationItems = (items = []) => {
  const merged = [];

  items.forEach((item) => {
    const previous = merged[merged.length - 1];
    const currentInstitution = String(item.institution || "").replace(/\s+/g, " ").trim();
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
  const institution = String(item.institution || "").replace(/\s+/g, " ").trim();
  const degree = String(item.degree || "").replace(/\s+/g, " ").trim();
  const looksSentenceLike = (value = "") =>
    value.length > 70 || /[.]/.test(value) || /\b(developed|wrote|used|managed|created|assisted|documented)\b/i.test(value);

  return (
    (!institution && !degree) ||
    looksSentenceLike(institution) ||
    looksSentenceLike(degree) ||
    (institution && institution.split(/\s+/).length > 9 && !isInstitutionLine(institution))
  );
};

const hasParsedEducationDate = (items = []) =>
  items.some((item) => String(item.startDate || item.endDate || "").trim());

const collectExplicitSkillLines = (lines = []) =>
  lines.filter((line) =>
    SKILL_CATEGORY_LINE_PATTERN.test(String(line || "").replace(/\s+/g, " ").trim()),
  );

const SKILL_CATEGORY_LINE_PATTERN =
  /^(programming languages?|languages?|frontend|front end|backend|back end|web technologies?|databases?|database technologies|data visualization|data analysis|data analysis & manipulation|machine learning|statistics|reporting & tools|reporting|technical skills|cyber secu?rity tools?|cyber secutrity tools?|security tools?|tools\s*&\s*technologies|tools|frameworks|libraries|soft skills|core skills|cloud|devops|cloud & devops)\s*:/i;

const SKILL_CATEGORY_HEADING_PATTERN =
  /^(programming languages?|languages?|frontend|front end|backend|back end|web technologies?|databases?|database technologies|data visualization|data analysis|data analysis & manipulation|machine learning|statistics|reporting & tools|reporting|technical skills|cyber secu?rity tools?|cyber secutrity tools?|security tools?|tools\s*&\s*technologies|tools|frameworks|libraries|soft skills|core skills|cloud|devops|cloud & devops)$/i;

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

const normalizeSkillCategoryName = (value = "") =>
  String(value || "Skills")
    .replace(/^cyber secutrity tools?$/i, "Cyber Security Tools")
    .replace(/^cyber secu?rity tools?$/i, "Cyber Security Tools")
    .replace(/^web technologies?$/i, "Web Technologies")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const isInstitutionLine = (line = "") =>
  /(university|college|school|academy|institute|vidyapeeth|polytechnic)/i.test(String(line || "").trim());

const isDegreeLine = (line = "") =>
  /(10th|12th|xii?|cbse|icse|bachelor|master|b\.?\s?tech|m\.?\s?tech|bca|mca|bsc|msc|phd|secondary|certificate|diploma|cse|computer science|data science|engineering)/i.test(
    String(line || "").trim(),
  );

const isEducationMetaLine = (line = "") =>
  /\b(19|20)\d{2}\b|present|current|cgpa|gpa|percentage|marks|score|grade|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    String(line || "").trim(),
  );

const isEducationScoreLine = (line = "") =>
  /\b(cgpa|sgpa|gpa|grade|percentage|marks|score)\b/i.test(String(line || "").trim()) ||
  /\b\d{1,2}(?:\.\d+)?\s*\/\s*10\b/i.test(String(line || "").trim()) ||
  /\b\d{1,3}(?:\.\d+)?%\b/.test(String(line || "").trim());

const isEducationDateLine = (line = "") =>
  /\b(19|20)\d{2}\b|present|current|till\s*date|till\s*now|ongoing|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    String(line || "").trim(),
  );

const extractEducationScore = (line = "") => {
  const cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return "";

  const labeled =
    cleaned.match(/\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/i)?.[0] || "";
  if (labeled) return labeled.trim();

  return (
    cleaned.match(/\b\d{1,2}(?:\.\d+)?\s*\/\s*10\b/i)?.[0] ||
    cleaned.match(/\b\d{1,3}(?:\.\d+)?%\b/)?.[0] ||
    cleaned.match(/\b\d{1,2}(?:\.\d+)?\b/)?.[0] ||
    ""
  );
};

const EDUCATION_MONTH_PATTERN = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const EDUCATION_DATE_TOKEN_PATTERN = `${EDUCATION_MONTH_PATTERN}\\s*,?\\s*\\d{2,4}|\\d{4}`;
const EDUCATION_CURRENT_TOKEN_PATTERN = "(?:present|current|till\\s*date|till\\s*now|ongoing)";

const normalizeEducationDateSource = (line = "") =>
  String(line || "")
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/â€“|â€”|Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(new RegExp(`(?<=[A-Za-z0-9/%])(?=${EDUCATION_MONTH_PATTERN}\\s*,?\\s*\\d{2,4}\\b)`, "gi"), " ")
    .replace(/\btilldate\b/gi, "Till date")
    .trim();

const extractEducationDateRange = (line = "") => {
  const cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return { startDate: "", endDate: "" };

  const normalizedRangeMatch = cleaned.match(
    new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, "i"),
  );
  if (normalizedRangeMatch) {
    return {
      startDate: normalizedRangeMatch[1].replace(/\s+/g, " ").trim(),
      endDate: normalizedRangeMatch[2].replace(/\s+/g, " ").trim(),
    };
  }

  const match = cleaned.match(
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\d{4})\s*(?:to|-|â€“|â€”)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\d{4})/i,
  );

  if (match) {
    return { startDate: match[1].trim(), endDate: match[2].trim() };
  }

  const yearMatches = cleaned.match(/\b(19|20)\d{2}\b/g) || [];
  if (yearMatches.length >= 2) return { startDate: yearMatches[0], endDate: yearMatches[1] };
  if (yearMatches.length === 1) {
    const monthYearMatch = cleaned.match(
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}\b/i,
    );
    return { startDate: "", endDate: String(monthYearMatch?.[0] || yearMatches[0]).replace(/\s+/g, " ").trim() };
  }
  return { startDate: "", endDate: "" };
};

const isEducationScoreOnlyLine = (line = "") => {
  const cleaned = stripEducationLineArtifacts(line);
  if (!cleaned) return false;
  return (
    isEducationScoreLine(line) &&
    !isDegreeLine(cleaned) &&
    !isInstitutionLine(cleaned) &&
    !isEducationDateLine(cleaned)
  );
};

const extractEducationLocation = (line = "") => {
  const educationDateRangePattern = new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, "gi");
  const cleaned = normalizeEducationDateSource(line)
    .replace(/\s+/g, " ")
    .replace(educationDateRangePattern, "")
    .replace(/\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/gi, "")
    .replace(
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)\s*(?:to|-|â€“|â€”)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)/gi,
      "",
    )
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi, "")
    .replace(/\b(?:19|20)\d{2}\b/g, "")
    .trim();
  if (!cleaned) return "";
  if (isLocationOnlyLine(cleaned)) return cleaned;

  const institutionSuffixMatch = cleaned.match(
    /(?:university|college|school|academy|institute|vidyapeeth|polytechnic)\b(.*)$/i,
  );
  if (institutionSuffixMatch) {
    const suffix = institutionSuffixMatch[1].replace(/^[-,]\s*/, "").trim();
    if (
      suffix &&
      !/^of\b/i.test(suffix) &&
      !isDegreeLine(suffix) &&
      !isInstitutionLine(suffix) &&
      (suffix.includes(",") || /\bindia\b/i.test(suffix) || isLocationOnlyLine(suffix))
    ) {
      return suffix;
    }
  }

  const commaParts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    return commaParts.slice(1).join(", ");
  }

  return "";
};

const stripEducationLineArtifacts = (line = "", { removeLocation = false } = {}) => {
  const educationDateRangePattern = new RegExp(`(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through)\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`, "gi");
  let cleaned = normalizeEducationDateSource(line);
  if (!cleaned) return "";

  cleaned = cleaned
    .replace(/\b(?:sgpa|cgpa|gpa|grade|percentage|marks|score)\s*[:\-]?\s*[A-Za-z0-9./%]+(?:\s*\/\s*[A-Za-z0-9.]+)?/gi, "")
    .replace(educationDateRangePattern, "")
    .replace(
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)\s*(?:to|-|â€“|â€”)\s*((?:present|current)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,/-]*\d{2,4}|\b(?:19|20)\d{2}\b)/gi,
      "",
    )
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi, "")
    .replace(/\b(?:19|20)\d{2}\b/g, "")
    .trim();

  if (removeLocation) {
    const location = extractEducationLocation(cleaned);
    if (location) {
      cleaned = cleaned.replace(location, "").replace(/\s+,/g, ",").trim();
    }
  }

  return cleaned.replace(/[|,-]\s*$/, "").trim();
};

const isLocationOnlyLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.split(/\s+/).length > 3) return false;
  return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(cleaned);
};

const hasEducationAnchor = (entry = {}) =>
  entry.rawLines.some((line) => isInstitutionLine(line) || isEducationDateLine(line) || extractEducationLocation(line));

const isExperienceHeadingLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length > 90) return false;
  if (cleaned.endsWith(".")) return false;
  if (/@|\d{4}/.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 8) return false;

  return /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|associate|executive|scientist|lead|trainee|coordinator)/i.test(
    cleaned,
  );
};

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[,|/]/))
        .map((skill) =>
          skill
            .replace(/^[-*•]\s*/, "")
            .replace(/\band\b/gi, "")
            .trim(),
        )
        .filter((skill) => isLikelySkillValue(skill)),
    ),
  ).slice(0, 24);

const inferSkillCategory = (skill = "") =>
  SKILL_CATEGORY_RULES.find((rule) => rule.pattern.test(String(skill || "").replace(/\s+/g, " ").trim()))?.category ||
  "Technical Skills";

const splitSkillTokensForCategories = (lines = []) =>
  Array.from(
    new Set(
      (Array.isArray(lines) ? lines : []).flatMap((line) => {
        const simpleSkillTokenPattern =
          /^(c|c\+\+|c#|python|java|javascript|typescript|html|css|react|node(?:\.js)?|express(?:\.js)?|mysql|sql|mongodb|postgres(?:ql)?|dbms|dsa|os|oop|aws|docker|linux|git)$/i;

        return String(line || "")
          .split(/[,|/]|â€¢|\t+/)
          .flatMap((part) => part.split(/\s{2,}/))
          .flatMap((part) => part.split(/\.(?=\s+[A-Z])/))
          .flatMap((skill) => {
            const cleaned = skill
              .replace(/^[-*â€¢]\s*/, "")
              .replace(/\band\b/gi, "")
              .replace(/[.;]+$/g, "")
              .replace(/\s+/g, " ")
              .trim();
            const spaceTokens = cleaned.split(" ").filter(Boolean);

            if (spaceTokens.length >= 2 && spaceTokens.every((token) => simpleSkillTokenPattern.test(token))) {
              return spaceTokens;
            }

            return [cleaned];
          })
          .filter((skill) => isLikelySkillValue(skill));
      }),
    ),
  ).slice(0, 24);

const groupFlatSkillsByCategory = (skills = []) => {
  const groups = [];
  const indexByCategory = new Map();

  (Array.isArray(skills) ? skills : []).forEach((skill) => {
    const cleaned = String(skill || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const category = inferSkillCategory(cleaned);
    if (!indexByCategory.has(category)) {
      indexByCategory.set(category, groups.length);
      groups.push({ category, items: [] });
    }
    groups[indexByCategory.get(category)].items.push(cleaned);
  });

  return groups;
};

const extractSkillCategoriesFromLines = (lines = []) => {
  const groups = [];
  const seen = new Map();

  const sourceLines = Array.isArray(lines) ? lines : [];

  sourceLines.forEach((line, lineIndex) => {
    const cleaned = String(line || "").replace(/^[-*]\s*/, "").replace(/\s+/g, " ").trim();
    if (!cleaned) return;

    const isColonCategory = cleaned.includes(":") && SKILL_CATEGORY_LINE_PATTERN.test(cleaned);
    const isStandaloneCategory = !cleaned.includes(":") && SKILL_CATEGORY_HEADING_PATTERN.test(cleaned);
    if (!isColonCategory && !isStandaloneCategory) return;

    const [rawCategory, ...rawSkillParts] = isColonCategory ? cleaned.split(":") : [cleaned, sourceLines[lineIndex + 1] || ""];
    const category = normalizeSkillCategoryName(rawCategory);
    const items = splitSkillTokensForCategories([rawSkillParts.join(":")]);
    if (!items.length) return;

    const key = category.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({ category, items: [] });
    }

    const group = groups[seen.get(key)];
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

  return explicitGroups.length ? explicitGroups : groupFlatSkillsByCategory(splitSkillTokensForCategories(skillLines));
};

const inferSummary = (lines = [], title = "") => {
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

  return "";
};

const looksLikeDateOrMeta = (line = "") =>
  /\b(19|20)\d{2}\b|present|current|remote|hybrid|onsite|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    line,
  );

const buildExperienceItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = line.replace(/^[-*]\s*/, "").trim();
    if (!cleaned) return;

    const looksLikeHeading = !line.startsWith("-") && !line.startsWith("*") && isExperienceHeadingLine(cleaned);

    if (!current || looksLikeHeading) {
      if (current) groups.push(current);
      current = { heading: cleaned, details: [] };
      return;
    }

    current.details.push(cleaned);
  });

  if (current) groups.push(current);

  return groups.map((group) => {
    const metaLine = group.details.find((item) => looksLikeDateOrMeta(item)) || "";
    const companyLine =
      group.details.find((item) => !looksLikeDateOrMeta(item) && item.length < 80) || "";
    const detailLines = group.details.filter((item) => item !== metaLine && item !== companyLine);

    return {
      company: companyLine,
      role: group.heading,
      startDate: "",
      endDate: metaLine,
      description: detailLines.join(" ").trim(),
    };
  });
};

const buildEducationItems = (lines = []) => {
  if (!lines.length) return [];

  const entries = [];
  let current = { rawLines: [], degreeLine: "", institutionLine: "", extraLines: [] };

  const pushCurrent = () => {
    if (!current.rawLines.length) return;
    entries.push(current);
    current = { rawLines: [], degreeLine: "", institutionLine: "", extraLines: [] };
  };

  lines.forEach((line) => {
    const cleaned = String(line || "").replace(/\s+/g, " ").trim();
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
    const dateLine = entry.rawLines.find((line) => line !== entry.degreeLine && isEducationDateLine(line)) || "";
    const fallbackInstitutionLine =
      entry.rawLines.find((line) => line !== entry.degreeLine && !isDegreeLine(line) && !isEducationScoreOnlyLine(line)) || "";
    const institutionCandidate =
      entry.rawLines.find((line) => isInstitutionLine(line) && line !== entry.degreeLine) ||
      entry.institutionLine ||
      entry.rawLines.find((line) => extractEducationLocation(line) && !isEducationScoreOnlyLine(line)) ||
      fallbackInstitutionLine ||
      (entry.rawLines.length === 1 ? entry.rawLines[0] : "") ||
      "";
    const scoredDegreeLine =
      entry.rawLines.find((line) => isDegreeLine(line) && isEducationScoreLine(line) && line !== institutionCandidate) || "";
    const degreeCandidate =
      scoredDegreeLine ||
      entry.rawLines.find((line) => isDegreeLine(line) && line !== institutionCandidate && !isEducationScoreOnlyLine(line)) ||
      entry.degreeLine ||
      entry.rawLines.find((line) => line !== institutionCandidate && !isInstitutionLine(line)) ||
      entry.rawLines[0] ||
      "";
    const institutionLine =
      institutionCandidate ||
      "";
    const degreeLine = degreeCandidate;
    const metaLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && isEducationMetaLine(line)) || "";
    const dateSource =
      dateLine ||
      institutionLine ||
      degreeLine ||
      metaLine;
    const { startDate, endDate } = extractEducationDateRange(dateSource);
    const scoreLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && isEducationScoreLine(line)) ||
      (isEducationScoreLine(institutionLine) ? institutionLine : "") ||
      degreeLine ||
      institutionLine ||
      "";
    const locationLine =
      entry.rawLines.find((line) => line !== institutionLine && line !== degreeLine && extractEducationLocation(line)) ||
      institutionLine ||
      "";
    const degree = stripEducationLineArtifacts(degreeLine || entry.rawLines[0] || "");
    const alternateInstitutionLine =
      entry.rawLines.find((line) => line !== degreeLine && isInstitutionLine(line)) || institutionLine;
    const institution = stripEducationLineArtifacts(
      institutionLine === degree ? alternateInstitutionLine : institutionLine,
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
      ) || "";

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

const toTitleCase = (value = "") =>
  value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

export function buildImportedResumeData(resumeText = "", originalName = "", template = "contemporary") {
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

    sectionMap[currentSection].push(line.replace(/^[-*]\s*/, "").trim());
  });

  const derivedName = deriveNameFromOriginalName(originalName);

  const introName =
    introLines.find((line) => isLikelyNameLine(line)) || "";
  const contactDetails = extractContactDetails([
    ...introLines,
    ...(sectionMap.contact || []),
    ...lines,
  ]);
  const summarySectionLines = filterFilled(sectionMap.summary || []);
  const title = inferProfessionalTitle(introLines, summarySectionLines);
  const summaryLines = filterFilled(sectionMap.summary || []).filter((line) => line.length > 25);
  const explicitSkillLines = collectExplicitSkillLines(lines);
  const skillSourceLines = explicitSkillLines.length ? explicitSkillLines : sectionMap.skills || [];
  const skills = buildSkillCategories(skillSourceLines, explicitSkillLines.length ? [] : lines);
  const experience = buildExperienceItems(sectionMap.experience || []);
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
  );

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
      : [
          {
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            location: "",
            score: "",
          },
        ],
    experience: experience.length
      ? experience
      : [
          {
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            description: "",
          },
        ],
    skills,
    summary: summaryLines.join(" ").trim() || inferSummary(lines, title),
    customSections: Object.entries(sectionMap)
      .filter(([key, values]) => !["summary", "skills", "experience", "education", "contact"].includes(key) && values.length)
      .map(([key, values]) => ({
        title: toTitleCase(key),
        items: filterFilled(values),
      })),
    raw_text: resumeText,
  };
}
