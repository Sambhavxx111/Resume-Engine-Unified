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

const isLikelyNameLine = (line = "") =>
  /^[A-Z][A-Z\s.]{3,40}$/.test(String(line).trim()) &&
  !resolveSectionName(line) &&
  !/@|\d{4}|\+?\d/.test(String(line));

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
        .replace(/[•|]/g, " ")
        .replace(/\b\d{6}\b/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find((line) => {
      if (!line) return false;
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
        .filter(Boolean),
    ),
  ).slice(0, 24);

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
  /\b(19|20)\d{2}\b|present|current|intern|remote|hybrid|onsite|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    line,
  );

const buildExperienceItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = line.replace(/^[-*]\s*/, "").trim();
    if (!cleaned) return;

    const looksLikeHeading =
      !line.startsWith("-") &&
      !line.startsWith("*") &&
      cleaned.length < 100 &&
      /^[A-Z]/.test(cleaned);

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

  const chunks = [];
  let current = [];

  lines.forEach((line) => {
    if (/^[A-Z]/.test(line) && current.length >= 2) {
      chunks.push(current);
      current = [line];
      return;
    }

    current.push(line);
  });

  if (current.length) {
    chunks.push(current);
  }

  return chunks.map((chunk) => ({
    institution: chunk[1] || "",
    degree: chunk[0] || "",
    fieldOfStudy: chunk[2] || "",
    startDate: "",
    endDate:
      chunk.find(
        (line) =>
          line !== chunk[0] &&
          line !== chunk[1] &&
          /\b(19|20)\d{2}\b|present|current/i.test(line),
      ) || "",
  }));
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

    if (resolvedSection && /^[A-Z][A-Z\s&/-]{2,}$/.test(line)) {
      currentSection = resolvedSection;
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

  const derivedName = String(originalName || "uploaded resume")
    .replace(/\.[^/.]+$/, "")
    .replace(/_enhancv-replica$/i, "")
    .replace(/_enhancv-columns$/i, "")
    .replace(/_resume$/i, "")
    .replace(/\s+resume$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

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
  const skills = splitSkillTokens(sectionMap.skills || []);
  const experience = buildExperienceItems(sectionMap.experience || []);
  const education = buildEducationItems(sectionMap.education || []);

  return {
    template,
    personalInfo: {
      fullName: introName || derivedName,
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
