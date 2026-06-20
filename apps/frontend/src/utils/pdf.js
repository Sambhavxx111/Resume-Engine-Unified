import { flattenSkillCategories, normalizeSkillCategories } from "./skills";

let jsPDF;
let html2canvas;
let pdfDependencyPromise;

const loadPdfDependencies = async () => {
  if (!pdfDependencyPromise) {
    pdfDependencyPromise = Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]).then(([jspdfModule, html2canvasModule]) => {
      jsPDF = jspdfModule.jsPDF;
      html2canvas = html2canvasModule.default;
    });
  }

  await pdfDependencyPromise;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_LIMIT = 276;

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
  socs: "socs-official",
};

const TEMPLATE_FILE_NAMES = {
  contemporary: "contemporary",
  timeline: "timeline",
  compact: "compact",
  "single-column": "single-column",
  creative: "creative",
  "enhancv-replica": "signature-timeline",
  "enhancv-columns": "emerald-columns",
  "socs-official": "socs-official",
};

const normalizeTemplateId = (templateId) =>
  TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";

const TEMPLATE_CONFIG = {
  contemporary: {
    layout: "standard",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 26,
    titleFont: "helvetica",
    titleStyle: "normal",
    titleSize: 13,
    nameColor: [15, 23, 42],
    titleColor: [8, 88, 120],
    contactColor: [30, 41, 59],
    sectionColor: [30, 41, 59],
    lineColor: [180, 195, 210],
    skillMode: "plain",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  "single-column": {
    layout: "single-column",
    background: [255, 255, 255],
    headingFont: "times",
    headingStyle: "bold",
    headingSize: 26,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 11.5,
    nameColor: [15, 23, 42],
    titleColor: [51, 65, 85],
    contactColor: [51, 65, 85],
    sectionColor: [30, 41, 59],
    lineColor: [15, 23, 42],
    skillMode: "outlined",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  compact: {
    layout: "compact",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 11.2,
    nameColor: [15, 23, 42],
    titleColor: [51, 65, 85],
    contactColor: [30, 41, 59],
    sectionColor: [51, 65, 85],
    lineColor: [203, 213, 225],
    skillMode: "compact",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  creative: {
    layout: "creative",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "normal",
    titleSize: 12,
    nameColor: [255, 255, 255],
    titleColor: [167, 243, 255],
    contactColor: [241, 245, 249],
    sectionColor: [14, 165, 233],
    lineColor: [125, 211, 252],
    skillMode: "dark",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  timeline: {
    layout: "timeline",
    background: [248, 250, 252],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 25,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 11.4,
    nameColor: [2, 6, 23],
    titleColor: [30, 41, 59],
    contactColor: [30, 41, 59],
    sectionColor: [8, 145, 178],
    lineColor: [203, 213, 225],
    skillMode: "light-box",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  "enhancv-replica": {
    layout: "enhancv-replica",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 26,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 13,
    nameColor: [15, 43, 110],
    titleColor: [210, 96, 16],
    contactColor: [55, 65, 81],
    sectionColor: [15, 43, 110],
    lineColor: [120, 138, 168],
    skillMode: "enhancv-line",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  "enhancv-columns": {
    layout: "enhancv-columns",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 12,
    nameColor: [16, 73, 63],
    titleColor: [34, 132, 102],
    contactColor: [55, 65, 81],
    sectionColor: [25, 92, 81],
    lineColor: [25, 92, 81],
    skillMode: "enhancv-line",
    order: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
  },
  "socs-official": {
    layout: "socs-official",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 14,
    titleFont: "helvetica",
    titleStyle: "normal",
    titleSize: 11,
    nameColor: [0, 0, 0],
    titleColor: [0, 0, 0],
    contactColor: [0, 0, 0],
    sectionColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    skillMode: "plain",
    order: ["summary", "education", "skills", "experience", "projects", "research", "certifications", "achievements", "custom"],
  },
};

const filterFilled = (items = []) => items.filter(Boolean);
const cleanResumeText = (value = "") =>
  String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/â€¢|â—|â–ª|ð·/g, "•")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/^[ðþÿ]+\s*/g, "")
    .replace(/\s*[ðþÿ]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
const toPdfSafeText = (value = "") =>
  cleanResumeText(value)
    .normalize("NFKD")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const safeText = (value = "") => toPdfSafeText(value);
const stripBulletPrefix = (value = "") =>
  cleanResumeText(value).replace(/^(?:[•●▪◦·*-]\s*)+/, "").trim();
const getCustomSectionSortKey = (title = "") => {
  const normalized = String(title || "").trim().toLowerCase();
  if (/project/.test(normalized)) return "projects";
  if (/research|publication|paper|journal|conference/.test(normalized)) return "research";
  if (/certification|certificate|course|accomplishment/.test(normalized)) return "certifications";
  if (/leadership|activity|activities|achievement|award/.test(normalized)) return "achievements";
  if (/language/.test(normalized)) return "languages";
  if (/interest/.test(normalized)) return "interests";
  return "custom";
};
const formatMonthYear = (value = "") => {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year) return "";
  if (!month) return year;
  return `${String(month).padStart(2, "0")}/${year}`;
};

const formatDateRange = (startDate, endDate) => {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
};

const EDUCATION_MONTH_PATTERN_FOR_DISPLAY = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const EDUCATION_DATE_TOKEN_PATTERN_FOR_DISPLAY = `${EDUCATION_MONTH_PATTERN_FOR_DISPLAY}\\s*,?\\s*\\d{2,4}|\\d{4}`;
const EDUCATION_CURRENT_TOKEN_PATTERN_FOR_DISPLAY = "(?:present|current|till\\s*date|till\\s*now|ongoing)";
const EDUCATION_DATE_RANGE_PATTERN_FOR_DISPLAY = new RegExp(
  `(${EDUCATION_DATE_TOKEN_PATTERN_FOR_DISPLAY})\\s*(?:to|-|until|through|[–—])\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN_FOR_DISPLAY}|${EDUCATION_DATE_TOKEN_PATTERN_FOR_DISPLAY})`,
  "i",
);

const normalizeEducationDateTextForDisplay = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .replace(/â€“|â€”|Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/\btilldate\b/gi, "Till date")
    .trim();

const extractEducationDateRangeFromTextForDisplay = (value = "") => {
  const cleaned = normalizeEducationDateTextForDisplay(value);
  const match = cleaned.match(EDUCATION_DATE_RANGE_PATTERN_FOR_DISPLAY);
  return match ? `${match[1].trim()} - ${match[2].trim()}` : "";
};

const getEducationDateDisplay = (item = {}) =>
  formatDateRange(item.startDate, item.endDate) ||
  extractEducationDateRangeFromTextForDisplay([
    item.degree,
    item.fieldOfStudy,
    item.institution,
    item.location,
    item.score,
  ].filter(Boolean).join(" "));

const normalizeExternalHref = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const stripProtocol = (value = "") =>
  String(value || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");

const getPortfolioContactPart = (portfolio = "") => {
  const url = normalizeExternalHref(portfolio);
  return url ? { text: "LinkedIn", url } : null;
};

const drawLinkedText = (doc, text, x, y, url, underlineColor = [30, 41, 59]) => {
  doc.textWithLink(text, x, y, { url });
  doc.setDrawColor(...underlineColor);
  doc.setLineWidth(0.2);
  doc.line(x, y + 0.7, x + doc.getTextWidth(text), y + 0.7);
};

const drawInlineContactParts = (
  doc,
  parts,
  x,
  y,
  { separator = " | ", align = "left", underlineColor = [30, 41, 59] } = {},
) => {
  const filledParts = parts.filter(Boolean);
  if (!filledParts.length) return;

  const totalWidth = filledParts.reduce((sum, part, index) => {
    return sum + doc.getTextWidth(part.text) + (index ? doc.getTextWidth(separator) : 0);
  }, 0);
  let cursorX = align === "center" ? x - totalWidth / 2 : align === "right" ? x - totalWidth : x;

  filledParts.forEach((part, index) => {
    if (index) {
      doc.text(separator, cursorX, y);
      cursorX += doc.getTextWidth(separator);
    }

    if (part.url) {
      drawLinkedText(doc, part.text, cursorX, y, part.url, underlineColor);
    } else {
      doc.text(part.text, cursorX, y);
    }
    cursorX += doc.getTextWidth(part.text);
  });
};

const formatEducationMeta = (item = {}) =>
  [formatDateRange(item.startDate, item.endDate), safeText(item.location), safeText(item.score)]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ");

const splitBulletLines = (value = "") =>
  String(value)
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

const getProjectBullets = (project = {}) =>
  (Array.isArray(project.bullets) ? project.bullets : splitBulletLines(project.description || ""))
    .flatMap((item) => splitBulletLines(item))
    .map((item) => safeText(item))
    .filter(Boolean);

const hasProjectContent = (project = {}) =>
  Boolean(safeText(project.name) || getProjectBullets(project).length);

const splitCustomSectionItems = (items = []) =>
  items
    .flatMap((item) => {
      const raw = String(item || "").trim();
      if (!raw) return [];

      const primaryParts = raw
        .split(/\r?\n|•|●|▪|\s+\|\s+/)
        .map((part) => part.replace(/^\s*[-*]\s*/, "").trim())
        .filter(Boolean);

      if (primaryParts.length > 1) {
        return primaryParts;
      }

      if (raw.length > 120 && /[.]\s+[A-Z]/.test(raw)) {
        return raw
          .split(/(?<=\.)\s+(?=[A-Z])/)
          .map((part) => part.replace(/^\s*[-*]\s*/, "").trim())
          .filter(Boolean);
      }

      return [raw];
    })
    .filter(Boolean);

const RENDER_SKILL_REJECTION_PATTERN =
  /@|\d{4}|^\d+(?:\.\d+)?$|%|university|college|school|academy|institute|vidyapeeth|certificate|certification|bachelor|master|dehradun|alwar|pilani|india|june|july|august|september|october|november|december|january|february|march|april|may|intern|manager|services private limited|ngo|linkedin|github/i;

const sanitizeRenderedSkills = (skills = []) =>
  Array.from(
    new Set(
      flattenSkillCategories(skills)
        .map((skill) => String(skill || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .filter((skill) => skill.length <= 40)
        .filter((skill) => /[A-Za-z]/.test(skill))
        .filter((skill) => !RENDER_SKILL_REJECTION_PATTERN.test(skill))
        .filter((skill) => skill.split(/\s+/).length <= 5)
        .filter((skill) => !(/[.!?]/.test(skill) && skill.split(/\s+/).length > 3)),
    ),
  );

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getResumePhotoFrameScale = (resumePhoto) => clamp(resumePhoto?.frameScale ?? 1, 0.5, 1.4);

const getPhotoImageFormat = (src = "") => {
  const match = String(src || "").match(/^data:image\/(png|jpeg|jpg|webp);/i);
  if (!match) return "PNG";
  return /jpe?g/i.test(match[1]) ? "JPEG" : "PNG";
};

const prepareResumePhotoAsset = (resumePhoto, frameWidth, frameHeight, shape = "rounded") => {
  if (!resumePhoto?.src || typeof document === "undefined") {
    return null;
  }

  const cropX = clamp(resumePhoto?.crop?.x ?? 0.5, 0, 1);
  const cropY = clamp(resumePhoto?.crop?.y ?? 0.5, 0, 1);
  const zoom = clamp(resumePhoto?.zoom ?? 1, 1, 3.5);
  const image = new Image();
  image.src = resumePhoto.src;

  const imageWidth = resumePhoto.width || image.width || 1;
  const imageHeight = resumePhoto.height || image.height || 1;
  const outputSize = 512;
  const baseScale = Math.max(outputSize / imageWidth, outputSize / imageHeight);
  const drawWidth = imageWidth * baseScale * zoom;
  const drawHeight = imageHeight * baseScale * zoom;
  const drawX = (outputSize - drawWidth) * cropX;
  const drawY = (outputSize - drawHeight) * cropY;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.clearRect(0, 0, outputSize, outputSize);
  context.save();
  if (shape === "circle") {
    context.beginPath();
    context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
  }
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();

  return {
    src: canvas.toDataURL("image/png"),
    format: "PNG",
    width: frameWidth,
    height: frameHeight,
  };
};

const drawResumePhoto = (doc, template, resumePhoto = null) => {
  if (!resumePhoto?.src) {
    return;
  }

  const frameScale = getResumePhotoFrameScale(resumePhoto);
  let x = 12;
  let y = 12;
  let width = 28 * frameScale;
  let height = 28 * frameScale;

  if (template === "creative") {
    x = 168 - (width - 28) / 2;
    y = 14 - (height - 28) / 2;
  } else if (template === "enhancv-columns") {
    x = 168 - (width - 28) / 2;
    y = 9 - (height - 28) / 2;
  } else {
    const usableWidth = PAGE_WIDTH - 24 - width;
    const usableHeight = PAGE_HEIGHT - 24 - height;
    x = 12 + Math.max(0, Math.min(usableWidth, (resumePhoto.placement?.x ?? 0.72) * usableWidth));
    y = 12 + Math.max(0, Math.min(usableHeight, (resumePhoto.placement?.y ?? 0.06) * usableHeight));
  }

  const shape = template === "creative" || template === "enhancv-columns" ? "circle" : "rounded";
  const preparedPhoto = prepareResumePhotoAsset(resumePhoto, width, height, shape);
  doc.addImage(preparedPhoto?.src || resumePhoto.src, preparedPhoto?.format || getPhotoImageFormat(resumePhoto.src), x, y, width, height, undefined, "FAST");

  if (template === "creative" || template === "enhancv-columns") {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.9);
  } else {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
  }
  if (shape === "circle") {
    doc.circle(x + width / 2, y + height / 2, Math.min(width, height) / 2);
  } else {
    doc.roundedRect(x, y, width, height, 2, 2);
  }
};

const getResumeSections = (formData) => {
  const sections = [];

  if (formData.summary?.trim()) {
    sections.push({
      key: "summary",
      title: "Summary",
      lines: [formData.summary.trim()],
    });
  }

  const skills = sanitizeRenderedSkills(formData.skills);
  if (skills.length) {
    sections.push({
      key: "skills",
      title: "Skills",
      skills,
    });
  }

  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  if (experienceItems.length) {
    sections.push({
      key: "experience",
      title: "Experience",
      items: experienceItems.map((item) => ({
        heading: [safeText(item.role), safeText(item.company) ? `at ${safeText(item.company)}` : ""]
          .filter(Boolean)
          .join(" "),
        meta: formatDateRange(item.startDate, item.endDate),
        body: safeText(item.description),
      })),
    });
  }

  const projectItems = (formData.projects || []).filter(hasProjectContent);
  if (projectItems.length) {
    sections.push({
      key: "projects",
      title: "Projects",
      items: projectItems.map((project, index) => ({
        heading: safeText(project.name) || `Project ${index + 1}`,
        bullets: getProjectBullets(project),
      })),
    });
  }

  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy || item.location || item.score,
  );
  if (educationItems.length) {
    sections.push({
      key: "education",
      title: "Education",
      items: educationItems.map((item) => ({
        heading: [safeText(item.degree), safeText(item.fieldOfStudy)].filter(Boolean).join(", "),
        subheading: safeText(item.institution),
        meta: formatEducationMeta(item),
      })),
    });
  }

  (formData.customSections || [])
    .filter((section) => section.title || section.items.some((item) => item.trim()))
    .forEach((section, index) => {
      sections.push({
        key: `custom-${index}`,
        sortKey: getCustomSectionSortKey(section.title),
        title: section.title || "Custom Section",
        lines: section.items.filter((item) => item.trim()).map((item) => item.trim()),
      });
    });

  return sections;
};

const sortSections = (sections, order) => {
  const weight = (sortKey) => {
    const index = order.indexOf(sortKey || "custom");
    return index === -1 ? order.length + 1 : index;
  };

  return [...sections].sort((a, b) => {
    const weightA = weight(a.sortKey || a.key);
    const weightB = weight(b.sortKey || b.key);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

const resetPage = (doc, background) => {
  doc.setFillColor(...background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
};

const ensurePage = (doc, y, requiredHeight, background) => {
  if (y + requiredHeight <= PAGE_LIMIT) {
    return y;
  }

  doc.addPage();
  resetPage(doc, background);
  return 20;
};

const drawWrappedText = (doc, text, x, y, width, lineHeight = 5.4) => {
  const cleaned = safeText(text);
  if (!cleaned) return y;
  const lines = doc.splitTextToSize(cleaned, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawWrappedTextPaginated = (doc, text, x, y, width, lineHeight, config) => {
  const cleaned = safeText(text);
  if (!cleaned) return y;

  const lines = doc.splitTextToSize(cleaned, width);
  lines.forEach((line) => {
    y = ensurePage(doc, y, lineHeight, config.background);
    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
};

const drawBulletTextPaginated = (doc, bullet, x, y, width, lineHeight, config) => {
  const cleaned = safeText(bullet);
  if (!cleaned) return y;

  const lines = doc.splitTextToSize(cleaned, width - 4);
  lines.forEach((line, index) => {
    y = ensurePage(doc, y, lineHeight, config.background);
    if (index === 0) {
      doc.text("-", x, y);
    }
    doc.text(line, x + 4, y);
    y += lineHeight;
  });

  return y;
};

const drawSectionTitle = (doc, title, x, y, width, config, variant = "default") => {
  const label = title.toUpperCase();
  doc.setTextColor(...config.sectionColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(variant === "compact" ? 10.8 : 11.8);
  doc.text(label, x, y);
  y += 4;
  doc.setDrawColor(...config.lineColor);
  doc.setLineWidth(variant === "strong" ? 0.9 : 0.5);
  doc.line(x, y, x + width, y);
  return y + 6;
};

const drawSkills = (doc, skills, x, y, width, config) => {
  let cursorX = x;
  let cursorY = y + 4;
  let rowHeight = 9;
  const skillGap = config.skillMode === "plain" ? 6 : 3;
  const rowGap = config.skillMode === "plain" ? 4 : 2;

  skills.forEach((skill) => {
    const label = String(skill || "").trim();
    if (!label) return;

    const maxLabelWidth =
      config.skillMode === "enhancv-line" ? Math.max(width / 2 - 4, 18) : Math.max(width - 8, 20);
    const labelLines = doc.splitTextToSize(label, maxLabelWidth);
    const longestLineWidth = Math.max(...labelLines.map((line) => doc.getTextWidth(line)), 0);
    const pillWidth = Math.min(
      longestLineWidth +
        (config.skillMode === "plain"
          ? 1
          : config.skillMode === "outlined" || config.skillMode === "enhancv-line"
            ? 2
            : 8),
      width,
    );
    const pillHeight = Math.max(7.5, labelLines.length * 4.1 + 2);

    if (cursorX + pillWidth > x + width) {
      cursorX = x;
      cursorY += rowHeight + rowGap;
      rowHeight = 9;
    }

    if (config.skillMode === "dark") {
      doc.setFillColor(15, 23, 42);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "F");
    } else if (config.skillMode === "enhancv-line") {
      doc.setTextColor(55, 65, 81);
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.2);
      doc.line(
        cursorX,
        cursorY + labelLines.length * 3.6 + 0.8,
        cursorX + pillWidth - 1,
        cursorY + labelLines.length * 3.6 + 0.8,
      );
    } else if (config.skillMode === "outlined" || config.skillMode === "plain") {
      doc.setTextColor(30, 41, 59);
    } else if (config.skillMode === "light-box") {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setTextColor(30, 41, 59);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "FD");
    } else {
      doc.setFillColor(236, 254, 255);
      doc.setTextColor(8, 88, 120);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "F");
    }

    doc.setFont("helvetica", config.skillMode === "compact" ? "bold" : "normal");
    doc.setFontSize(config.skillMode === "compact" ? 9.1 : 9.6);
    doc.text(
      labelLines,
      cursorX +
        (config.skillMode === "outlined" || config.skillMode === "enhancv-line" || config.skillMode === "plain"
          ? 0
          : 4),
      cursorY,
    );
    cursorX += pillWidth + skillGap;
    rowHeight = Math.max(rowHeight, pillHeight);
  });

  return cursorY + rowHeight;
};

const measureSkillsHeight = (doc, skills, width, config) => {
  let cursorX = 0;
  let cursorY = 4;
  let rowHeight = 9;
  const skillGap = config.skillMode === "plain" ? 6 : 3;
  const rowGap = config.skillMode === "plain" ? 4 : 2;

  doc.setFont("helvetica", config.skillMode === "compact" ? "bold" : "normal");
  doc.setFontSize(config.skillMode === "compact" ? 9.1 : 9.6);

  skills.forEach((skill) => {
    const label = String(skill || "").trim();
    if (!label) return;

    const maxLabelWidth =
      config.skillMode === "enhancv-line" ? Math.max(width / 2 - 4, 18) : Math.max(width - 8, 20);
    const labelLines = doc.splitTextToSize(label, maxLabelWidth);
    const longestLineWidth = Math.max(...labelLines.map((line) => doc.getTextWidth(line)), 0);
    const pillWidth = Math.min(
      longestLineWidth +
        (config.skillMode === "plain"
          ? 1
          : config.skillMode === "outlined" || config.skillMode === "enhancv-line"
            ? 2
            : 8),
      width,
    );
    const pillHeight = Math.max(7.5, labelLines.length * 4.1 + 2);

    if (cursorX + pillWidth > width) {
      cursorX = 0;
      cursorY += rowHeight + rowGap;
      rowHeight = 9;
    }

    cursorX += pillWidth + skillGap;
    rowHeight = Math.max(rowHeight, pillHeight);
  });

  return cursorY + rowHeight + 3;
};

const drawSkillGrid = (doc, skills, x, y, width, columns = 2) => {
  const columnGap = 6;
  const columnWidth = (width - columnGap * (columns - 1)) / columns;
  let currentY = y;
  let rowHeight = 0;

  skills.forEach((skill, index) => {
    const column = index % columns;
    if (column === 0 && index !== 0) {
      currentY += rowHeight + 4;
      rowHeight = 0;
    }
    const itemX = x + column * (columnWidth + columnGap);
    const itemY = currentY;
    const lines = doc.splitTextToSize(String(skill || ""), Math.max(columnWidth - 1, 10));

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.text(lines, itemX, itemY);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    const lineY = itemY + lines.length * 3.6;
    doc.line(itemX, lineY + 1.2, itemX + columnWidth, lineY + 1.2);
    rowHeight = Math.max(rowHeight, lines.length * 3.6 + 3);
  });

  return currentY + rowHeight;
};

const drawSectionBody = (doc, section, x, y, width, config) => {
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.8);

  if (section.skills) {
    return drawSkills(doc, section.skills, x, y, width, config) + 3;
  }

  if (section.lines) {
    section.lines.forEach((line) => {
      y = drawWrappedText(doc, line, x, y, width, 5.9) + 1.6;
    });
    return y + 1;
  }

  if (section.items) {
    section.items.forEach((item) => {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.9);
      y = drawWrappedText(doc, item.heading, x, y, width, 5.5);

      if (item.subheading && safeText(item.subheading) !== safeText(item.heading)) {
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        y = drawWrappedText(doc, item.subheading, x, y, width, 5.2) + 0.7;
      }

      if (item.meta) {
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.3);
        y = drawWrappedText(doc, item.meta, x, y, width, 4.9) + 1;
      }

      if (item.body) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        y = drawWrappedText(doc, item.body, x, y, width, 5.4) + 2.2;
      }

      if (Array.isArray(item.bullets) && item.bullets.length) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        item.bullets.forEach((bullet) => {
          doc.text("-", x, y);
          y = drawWrappedText(doc, bullet, x + 4, y, width - 4, 5.1) + 0.7;
        });
        y += 1.5;
      } else if (!item.body) {
        y += 1.5;
      }
    });
  }

  return y;
};

const drawPaginatedSectionBody = (doc, section, x, y, width, config) => {
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.8);

  if (section.skills) {
    y = ensurePage(doc, y, measureSkillsHeight(doc, section.skills, width, config), config.background);
    return drawSkills(doc, section.skills, x, y, width, config) + 3;
  }

  if (section.lines) {
    section.lines.forEach((line) => {
      y = drawWrappedTextPaginated(doc, line, x, y, width, 5.9, config) + 1.6;
    });
    return y + 1;
  }

  if (section.items) {
    section.items.forEach((item) => {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.9);
      y = drawWrappedTextPaginated(doc, item.heading, x, y, width, 5.5, config);

      if (item.subheading && safeText(item.subheading) !== safeText(item.heading)) {
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        y = drawWrappedTextPaginated(doc, item.subheading, x, y, width, 5.2, config) + 0.7;
      }

      if (item.meta) {
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.3);
        y = drawWrappedTextPaginated(doc, item.meta, x, y, width, 4.9, config) + 1;
      }

      if (item.body) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        y = drawWrappedTextPaginated(doc, item.body, x, y, width, 5.4, config) + 2.2;
      }

      if (Array.isArray(item.bullets) && item.bullets.length) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        item.bullets.forEach((bullet) => {
          y = drawBulletTextPaginated(doc, bullet, x, y, width, 5.1, config) + 0.7;
        });
        y += 1.5;
      } else if (!item.body) {
        y += 1.5;
      }
    });
  }

  return y;
};

const drawStandardHeader = (doc, formData, config, centered = false) => {
  const x = 15;
  const width = 180;

  doc.setTextColor(...config.nameColor);
  doc.setFont(config.headingFont, config.headingStyle);
  doc.setFontSize(config.headingSize);

  if (centered) {
    if (safeText(formData.personalInfo.fullName)) {
      doc.text(formData.personalInfo.fullName, PAGE_WIDTH / 2, 20, { align: "center" });
    }
  } else if (safeText(formData.personalInfo.fullName)) {
    doc.text(formData.personalInfo.fullName, x, 20);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont(config.titleFont, config.titleStyle);
  doc.setFontSize(config.titleSize);

  if (centered) {
    if (safeText(formData.personalInfo.title)) {
      doc.text(formData.personalInfo.title, PAGE_WIDTH / 2, 28, { align: "center" });
    }
  } else if (safeText(formData.personalInfo.title)) {
    doc.text(formData.personalInfo.title, x, 28);
  }

  const contactParts = filterFilled([
    safeText(formData.personalInfo.email) ? { text: safeText(formData.personalInfo.email) } : null,
    safeText(formData.personalInfo.phone) ? { text: safeText(formData.personalInfo.phone) } : null,
    getPortfolioContactPart(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location) ? { text: safeText(formData.personalInfo.location) } : null,
  ]);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (!contactParts.length) {
    return centered ? 41 : 40;
  }

  if (centered) {
    drawInlineContactParts(doc, contactParts, PAGE_WIDTH / 2, 35.5, {
      align: "center",
      underlineColor: config.contactColor,
    });
    return 49.9;
  }

  drawInlineContactParts(doc, contactParts, x, 35.5, {
    underlineColor: config.contactColor,
  });
  return 44.9;
};

const renderStandardTemplate = (doc, formData, config) => {
  let y = drawStandardHeader(doc, formData, config);
  const sections = sortSections(getResumeSections(formData), config.order);

  sections.forEach((section) => {
    y = ensurePage(doc, y, 18, config.background);
    y = drawSectionTitle(doc, section.title, 15, y, 180, config);
    y = drawPaginatedSectionBody(doc, section, 15, y, 180, config) + 2.5;
  });
};

const getSocsSectionItems = (customSections = [], pattern) =>
  (customSections || [])
    .filter((section) => pattern.test(String(section?.title || "")))
    .flatMap((section) => splitCustomSectionItems(section.items || []));

const getSocsOtherCustomSections = (customSections = []) =>
  (customSections || [])
    .map((section) => ({
      title: safeText(section?.title || ""),
      items: splitCustomSectionItems(section?.items || []),
    }))
    .filter((section) => section.title || section.items.length)
    .filter((section) => !/(research|publication|paper|journal|conference|certification|certificate|course|accomplishment|leadership|activity|activities|achievement|award)/i.test(section.title));

const compareByEndDateDesc = (a = {}, b = {}) => {
  const getDateValue = (item = {}) => {
    const raw = item.endDate || item.startDate || "";
    if (!raw) return -Infinity;
    const parsed = new Date(String(raw));
    return Number.isFinite(parsed.valueOf()) ? parsed.valueOf() : -Infinity;
  };

  const aValue = getDateValue(a);
  const bValue = getDateValue(b);
  return bValue - aValue;
};

const getSocsSkillGroups = (skills = []) => {
  const flattenedSkills = sanitizeRenderedSkills(skills);
  if (!flattenedSkills.length) return [];

  if (!Array.isArray(skills) || !skills.some((skill) => skill && typeof skill === "object" && !Array.isArray(skill))) {
    return [{ category: "Programming/Scripting Languages", items: flattenedSkills }];
  }

  return skills
    .map((group) => {
      const rawCategory = safeText(group?.category || group?.name || group?.title || "Skills");
      const rawItems = Array.isArray(group?.items)
        ? group.items
        : Array.isArray(group?.skills)
          ? group.skills
          : Array.isArray(group?.values)
            ? group.values
            : [];
      const items = sanitizeRenderedSkills(rawItems);
      let category = rawCategory || "Programming/Scripting Languages";
      if (/^skills?$/i.test(category)) category = "Programming/Scripting Languages";
      else if (/programming|language/i.test(category)) category = "Programming/Scripting Languages";
      else if (/database/i.test(category)) category = "Databases";
      else if (/framework/i.test(category)) category = "Frameworks";
      else if (/tool|platform|other/i.test(category)) category = "Tools";
      else if (/operating|os\b/i.test(category)) category = "Operating Systems";
      return { category, items };
    })
    .filter((group) => group.items.length);
};

const renderSocsOfficialTemplate = (doc, formData, config) => {
  const marginX = 19.05;
  const contentWidth = PAGE_WIDTH - marginX * 2;
  let y = 17;

  const ensureSocsPage = (requiredHeight = 8) => {
    y = ensurePage(doc, y, requiredHeight, config.background);
  };

  const drawSocsSectionTitle = (title) => {
    ensureSocsPage(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, marginX, y);
    y += 5.2;
  };

  const drawSocsParagraph = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    y = drawWrappedTextPaginated(doc, text, marginX, y, contentWidth, 4.1, config) + 1;
  };

  const drawSocsBullets = (items = []) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    items.forEach((item) => {
      y = drawBulletTextPaginated(doc, item, marginX, y, contentWidth, 4.1, config);
    });
    y += 1;
  };

  const drawVisibleContactLink = (text, url, x) => {
    if (url) {
      doc.textWithLink(text, x, y, { url });
    } else {
      doc.text(text, x, y);
    }
  };

  resetPage(doc, config.background);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  if (safeText(formData.personalInfo.fullName)) {
    doc.text(safeText(formData.personalInfo.fullName), PAGE_WIDTH / 2, y, { align: "center" });
  }

  y += 6.1;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const contactParts = [
    { text: safeText(formData.personalInfo.email) },
    { text: safeText(formData.personalInfo.phone) },
    formData.personalInfo.portfolio
      ? { text: stripProtocol(formData.personalInfo.portfolio), url: normalizeExternalHref(formData.personalInfo.portfolio) }
      : null,
    formData.personalInfo.github
      ? { text: stripProtocol(formData.personalInfo.github), url: normalizeExternalHref(formData.personalInfo.github) }
      : null,
  ].filter((part) => part?.text);
  const contactLineWidth = contactParts.reduce((width, part, index) => width + doc.getTextWidth(part.text) + (index ? doc.getTextWidth(" | ") : 0), 0);
  let contactX = Math.max(marginX, (PAGE_WIDTH - contactLineWidth) / 2);
  contactParts.forEach((part, index) => {
    if (index) {
      doc.text(" | ", contactX, y);
      contactX += doc.getTextWidth(" | ");
    }
    drawVisibleContactLink(part.text, part.url, contactX);
    contactX += doc.getTextWidth(part.text);
  });
  y += 10;

  if (safeText(formData.summary)) {
    drawSocsSectionTitle("Professional Summary");
    drawSocsParagraph(formData.summary);
  }

  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy || item.location || item.score || item.startDate || item.endDate,
  ).sort(compareByEndDateDesc);
  if (educationItems.length) {
    drawSocsSectionTitle("Education");
    educationItems.forEach((item) => {
      drawSocsParagraph(
        `${[safeText(item.degree), safeText(item.fieldOfStudy)].filter(Boolean).join(" in ")}${item.institution ? `, ${safeText(item.institution)}` : ""}${item.location ? `, ${safeText(item.location)}` : ""}${item.score ? ` | ${safeText(item.score)}` : ""}${getEducationDateDisplay(item) ? ` ${getEducationDateDisplay(item)}` : ""}`,
      );
    });
  }

  const skillGroups = getSocsSkillGroups(formData.skills);
  if (skillGroups.length) {
    drawSocsSectionTitle("Technical Skills");
    skillGroups.forEach((group) => drawSocsParagraph(`${group.category}: ${group.items.join(", ")}`));
  }

  const internshipItems = (formData.experience || []).filter((item) => item.company || item.role || item.description).sort(compareByEndDateDesc);
  if (internshipItems.length) {
    drawSocsSectionTitle("Internships");
    internshipItems.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      y = drawWrappedTextPaginated(
        doc,
        `${[safeText(item.company), safeText(item.role)].filter(Boolean).join(" | ")}${formatDateRange(item.startDate, item.endDate) ? ` ${formatDateRange(item.startDate, item.endDate)}` : ""}`,
        marginX,
        y,
        contentWidth,
        4.1,
        config,
      );
      drawSocsParagraph("Responsibilities:");
      drawSocsBullets(splitBulletLines(item.description));
    });
  }

  const projectItems = (formData.projects || []).filter(hasProjectContent);
  if (projectItems.length) {
    drawSocsSectionTitle("Projects");
    projectItems.forEach((project, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      y = drawWrappedTextPaginated(doc, safeText(project.name) || `Project ${index + 1}`, marginX, y, contentWidth, 4.1, config);
      drawSocsBullets(getProjectBullets(project));
    });
  }

  const researchItems = getSocsSectionItems(formData.customSections, /research|publication|paper|journal|conference/i);
  if (researchItems.length) {
    drawSocsSectionTitle("Research and Publications");
    drawSocsBullets(researchItems);
  }

  const certificationItems = getSocsSectionItems(formData.customSections, /certification|certificate|course|accomplishment/i);
  if (certificationItems.length) {
    drawSocsSectionTitle("Certifications and Accomplishments");
    drawSocsBullets(certificationItems);
  }

  const leadershipItems = getSocsSectionItems(formData.customSections, /leadership|activity|activities|achievement|award/i);
  if (leadershipItems.length) {
    drawSocsSectionTitle("Leadership / Activities / Achievements");
    drawSocsBullets(leadershipItems);
  }

  getSocsOtherCustomSections(formData.customSections).forEach((section) => {
    drawSocsSectionTitle(section.title || "Additional Section");
    drawSocsBullets(section.items);
  });
};

const renderSingleColumnTemplate = (doc, formData, config) => {
  let y = drawStandardHeader(doc, formData, config, true);
  const sections = sortSections(getResumeSections(formData), config.order);

  sections.forEach((section) => {
    y = ensurePage(doc, y, 18, config.background);
    y = drawSectionTitle(doc, section.title, 21, y, 168, config, "strong");
    y = drawPaginatedSectionBody(doc, section, 21, y, 168, config) + 3.2;
  });
};

const renderCompactTemplate = (doc, formData, config) => {
  doc.setTextColor(...config.nameColor);
  doc.setFont(config.headingFont, config.headingStyle);
  doc.setFontSize(config.headingSize);
  if (safeText(formData.personalInfo.fullName)) {
    doc.text(formData.personalInfo.fullName, 15, 19);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont(config.titleFont, config.titleStyle);
  doc.setFontSize(config.titleSize);
  if (safeText(formData.personalInfo.title)) {
    doc.text(formData.personalInfo.title, 15, 26);
  }

  const contactLines = filterFilled([
    safeText(formData.personalInfo.email) ? { text: safeText(formData.personalInfo.email) } : null,
    safeText(formData.personalInfo.phone) ? { text: safeText(formData.personalInfo.phone) } : null,
    getPortfolioContactPart(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location) ? { text: safeText(formData.personalInfo.location) } : null,
  ]);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.1);
  let contactY = 17;
  contactLines.forEach((line) => {
    const label = line.url ? line.text : line.text.toUpperCase();
    const lineX = 195 - doc.getTextWidth(label);
    if (line.url) {
      drawLinkedText(doc, label, lineX, contactY, line.url, config.contactColor);
    } else {
      doc.text(label, 195, contactY, { align: "right" });
    }
    contactY += 5.6;
  });

  doc.setDrawColor(...config.lineColor);
  doc.line(15, 31, 195, 31);

  const sections = sortSections(getResumeSections(formData), config.order);
  const leftSections = [];
  const rightSections = [];

  sections.forEach((section, index) => {
    if (index % 2 === 0) {
      leftSections.push(section);
    } else {
      rightSections.push(section);
    }
  });

  let leftY = 37;
  let rightY = 37;

  leftSections.forEach((section) => {
    leftY = drawSectionTitle(doc, section.title, 15, leftY, 80, config, "compact");
    leftY = drawSectionBody(doc, section, 15, leftY, 80, config) + 3.4;
  });

  rightSections.forEach((section) => {
    rightY = drawSectionTitle(doc, section.title, 103, rightY, 92, config, "compact");
    rightY = drawSectionBody(doc, section, 103, rightY, 92, config) + 3.4;
  });
};

const renderCreativeTemplate = (doc, formData, config) => {
  doc.setFillColor(28, 57, 84);
  doc.rect(0, 0, PAGE_WIDTH, 56, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  if (safeText(formData.personalInfo.fullName)) {
    doc.text(formData.personalInfo.fullName, 12, 19);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  if (safeText(formData.personalInfo.title)) {
    doc.text(formData.personalInfo.title, 12, 28);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  if (safeText(formData.personalInfo.phone)) {
    doc.text(safeText(formData.personalInfo.phone), 12, 36);
  }

  const portfolioHref = normalizeExternalHref(formData.personalInfo.portfolio);
  if (portfolioHref) {
    const linkY = safeText(formData.personalInfo.phone) ? 42 : 36;
    doc.textWithLink("LinkedIn", 12, linkY, { url: portfolioHref });
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(12, linkY + 0.7, 12 + doc.getTextWidth("LinkedIn"), linkY + 0.7);
  }

  if (safeText(formData.personalInfo.email)) {
    doc.text(formData.personalInfo.email, 98, 39);
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1.2);
  doc.circle(182, 28, 14);
  doc.circle(182, 26, 5.5);
  doc.ellipse(182, 37.5, 8.5, 5.5);

  const sections = sortSections(getResumeSections(formData), config.order);
  const leftSections = sections.filter((section) =>
    ["education", "skills"].includes(section.key),
  );
  const rightSections = sections.filter((section) =>
    !["education", "skills"].includes(section.key),
  );

  let leftY = 64;
  let rightY = 64;
  const leftX = 12;
  const rightX = 114;
  const leftWidth = 96;
  const rightWidth = 82;

  leftSections.forEach((section) => {
    leftY = drawSectionTitle(doc, section.title, leftX, leftY, leftWidth, config, "strong");
    leftY = drawSectionBody(doc, section, leftX, leftY, leftWidth, config) + 4;
  });

  rightSections.forEach((section) => {
    rightY = drawSectionTitle(doc, section.title, rightX, rightY, rightWidth, config, "strong");
    if (section.skills) {
      rightY = drawSkillGrid(doc, section.skills, rightX, rightY + 1, rightWidth, 2) + 4;
    } else {
      rightY = drawSectionBody(doc, section, rightX, rightY, rightWidth, config) + 4;
    }
  });
};

const renderTimelineTemplate = (doc, formData, config) => {
  let y = drawStandardHeader(doc, formData, config);
  const sections = sortSections(getResumeSections(formData), config.order);

  sections.forEach((section) => {
    y = ensurePage(doc, y, 18, config.background);
    doc.setFillColor(6, 182, 212);
    doc.circle(20, y - 1.5, 1.4, "F");
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y + 1.5, 20, Math.min(PAGE_LIMIT, y + 24));
    y = drawSectionTitle(doc, section.title, 26, y, 166, config);
    y = drawPaginatedSectionBody(doc, section, 26, y, 166, config) + 4;
  });
};

const renderEnhancvReplicaTemplate = (doc, formData, config) => {
  const name = safeText(formData.personalInfo.fullName);
  const title = safeText(formData.personalInfo.title);
  const portfolioHref = normalizeExternalHref(formData.personalInfo.portfolio);
  const portfolioLabel = safeText(formData.personalInfo.portfolio);
  const contactParts = filterFilled([
    safeText(formData.personalInfo.phone) ? { text: safeText(formData.personalInfo.phone) } : null,
    safeText(formData.personalInfo.email) ? { text: safeText(formData.personalInfo.email) } : null,
    portfolioHref ? { text: portfolioLabel || "LinkedIn", url: portfolioHref } : null,
    safeText(formData.personalInfo.location) ? { text: safeText(formData.personalInfo.location) } : null,
  ]);
  const customSections = (formData.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length);
  const projectItems = (formData.projects || []).filter(hasProjectContent);
  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );

  const leftX = 17;
  const dateX = 17;
  const railX = 68;
  const bodyX = 73.5;
  const bodyWidth = 120;
  const signaturePageLimit = 296;

  const ensureSignaturePage = (currentY, requiredHeight = 16) => {
    if (currentY + requiredHeight <= signaturePageLimit) {
      return currentY;
    }

    doc.addPage();
    resetPage(doc, config.background);
    return 18;
  };
  const drawSignatureBullet = (text) => {
    y = ensureSignaturePage(y, 6);
    doc.setFillColor(71, 85, 105);
    doc.circle(bodyX + 1.5, y - 1.55, 0.65, "F");
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    y = drawWrappedText(doc, text, bodyX + 5, y, bodyWidth - 5, 5.4) + 1.15;
  };
  const splitSkillPair = (skill = "") => {
    const [rawLabel, ...rawValue] = String(skill || "").split(":");
    if (!rawValue.length) {
      return { label: "", value: safeText(skill) };
    }
    return {
      label: `${safeText(rawLabel)} :`,
      value: safeText(rawValue.join(":")),
    };
  };
  const drawSignatureSkills = (skills = []) => {
    doc.setFontSize(13);
    let skillY = y + 2.5;
    skills.forEach((skill) => {
      const { label, value } = splitSkillPair(skill);
      if (!label && !value) return;
      skillY = ensureSignaturePage(skillY, 12);
      const labelX = leftX + 3;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 43, 110);
      doc.setFontSize(13);
      doc.text(label || value, labelX, skillY);

      if (label && value) {
        const valueX = Math.min(labelX + doc.getTextWidth(label) + 4, 94);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        skillY = Math.max(skillY, drawWrappedText(doc, value, valueX, skillY, 190 - valueX, 5.4));
      }

      skillY += 11.2;
    });
    y = skillY + 2;
  };

  doc.setTextColor(...config.nameColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  if (name) {
    doc.text(name, leftX, 25);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  if (title) {
    doc.text(title, leftX, 34.5);
  }

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  drawInlineContactParts(doc, contactParts, leftX, 45.5, {
    separator: "   ",
    underlineColor: config.contactColor,
  });

  let y = 58;
  const drawTitle = (label) => {
    y = ensureSignaturePage(y, 14);
    doc.setTextColor(...config.sectionColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(String(label || "").toUpperCase(), leftX, y);
    y += 9.2;
  };

  const drawTimelineEntry = ({
    meta = [],
    role = "",
    accent = "",
    bullets = [],
    description = "",
    dotLineHeight = 18,
  }) => {
    y = ensureSignaturePage(y, 18);
    const entryTop = y;
    const metaLines = filterFilled(meta.map((item) => safeText(item)));

    doc.setTextColor(56, 88, 148);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    metaLines.forEach((line, index) => {
      if (!line) return;
      doc.setFont("helvetica", index === 0 ? "bold" : "normal");
      doc.setTextColor(index === 0 ? 56 : 100, index === 0 ? 88 : 116, index === 0 ? 148 : 139);
      doc.text(line, dateX, entryTop + index * 7.7);
    });

    doc.setDrawColor(138, 143, 153);
    doc.setFillColor(15, 23, 42);
    doc.setLineWidth(0.25);
    doc.circle(railX, entryTop - 0.5, 0.9, "F");
    if (dotLineHeight > 0) {
      doc.line(railX, entryTop + 1.4, railX, Math.min(signaturePageLimit, entryTop + dotLineHeight));
    }

    if (role) {
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      y = drawWrappedText(doc, role, bodyX, y, bodyWidth, 6.6);
    }

    if (accent) {
      doc.setTextColor(...config.titleColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      y = drawWrappedText(doc, accent, bodyX, y + (role ? 1 : 0), bodyWidth, 5.8);
    }

    const descriptionLines = splitBulletLines(description);
    const bulletItems = bullets.length ? bullets : descriptionLines;
    if (bulletItems.length) {
      y += 3.1;
      bulletItems.forEach((bullet) => drawSignatureBullet(bullet));
    }

    y = Math.max(y, entryTop + metaLines.length * 7.7) + 9.8;
  };

  if (safeText(formData.summary)) {
    drawTitle("SUMMARY");
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    y = drawWrappedText(doc, safeText(formData.summary), leftX, y, 184, 5.9) + 12;
  }

  if (experienceItems.length) {
    drawTitle("EXPERIENCE");
    experienceItems.forEach((item) => {
      drawTimelineEntry({
        meta: [
          formatDateRange(item.startDate, item.endDate),
          safeText(item.location) || safeText(formData.personalInfo.location),
        ],
        role: safeText(item.role),
        accent: safeText(item.company),
        description: item.description,
      });
    });
  }

  if (educationItems.length) {
    drawTitle("EDUCATION");
    educationItems.forEach((item) => {
      const educationTitle = item.fieldOfStudy
        ? `${safeText(item.degree)} (${safeText(item.fieldOfStudy)})`
        : safeText(item.degree);
      drawTimelineEntry({
        meta: [
          formatDateRange(item.startDate, item.endDate),
          safeText(item.location),
          safeText(item.score),
        ],
        role: educationTitle,
        accent: safeText(item.institution),
        dotLineHeight: 13,
      });
    });
  }

  if (projectItems.length) {
    drawTitle("PROJECTS");
    projectItems.forEach((project, index) => {
      drawTimelineEntry({
        meta: ["Project"],
        role: safeText(project.name) || `Project ${index + 1}`,
        bullets: getProjectBullets(project),
        dotLineHeight: 13,
      });
    });
  }

  const signatureSkills = sanitizeRenderedSkills(formData.skills);
  if (signatureSkills.length) {
    drawTitle("SKILLS");
    drawSignatureSkills(signatureSkills);
  }

  customSections.forEach((section, index) => {
    if (index === 0 && y > 277) {
      y = 277;
    }
    drawTitle(section.title || `SECTION ${index + 1}`);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    splitCustomSectionItems(section.items).forEach((item) => {
      y = ensureSignaturePage(y, 8);
      doc.setFillColor(71, 85, 105);
      doc.circle(leftX + 1.5, y - 1.65, 0.65, "F");
      y = drawWrappedText(doc, item, leftX + 6, y, 180, 5.8) + 1.6;
    });
    y += 2;
  });

  doc.setTextColor(120, 138, 168);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.text("www.enhancv.com", leftX, 293);
  doc.text("Powered by", 178, 293);
};

const renderEnhancvColumnsTemplate = (doc, formData, config) => {
  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const customSections = (formData.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length);
  const projectItems = (formData.projects || []).filter(hasProjectContent);

  doc.setTextColor(...config.nameColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  if (safeText(formData.personalInfo.fullName)) {
    doc.text(formData.personalInfo.fullName, 12, 17);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.8);
  if (safeText(formData.personalInfo.title)) {
    doc.text(formData.personalInfo.title, 12, 24);
  }

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  const contactParts = filterFilled([
    safeText(formData.personalInfo.phone) ? { text: safeText(formData.personalInfo.phone) } : null,
    safeText(formData.personalInfo.email) ? { text: safeText(formData.personalInfo.email) } : null,
    getPortfolioContactPart(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location) ? { text: safeText(formData.personalInfo.location) } : null,
  ]);
  drawInlineContactParts(doc, contactParts, 12, 29, {
    separator: "   ",
    underlineColor: config.contactColor,
  });

  doc.setDrawColor(190, 196, 201);
  doc.setFillColor(245, 245, 245);
  doc.circle(183, 20, 11, "F");
  doc.setDrawColor(140, 140, 140);
  doc.setLineWidth(0.8);
  doc.circle(183, 17.5, 3.8);
  doc.ellipse(183, 25, 6.5, 4.2);

  const drawColumnTitle = (label, x, y, width) => {
    doc.setTextColor(...config.sectionColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.8);
    doc.text(label, x, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(...config.lineColor);
    doc.line(x, y + 1.5, x + width, y + 1.5);
    return y + 7;
  };

  const leftX = 12;
  const centerX = 72;
  const rightX = 144;
  const leftWidth = 44;
  const centerWidth = 66;
  const rightWidth = 50;
  let leftY = 37;
  let centerY = 37;
  let rightY = 37;

  leftY = drawColumnTitle("SUMMARY", leftX, leftY, leftWidth);
  doc.setTextColor(55, 65, 81);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  leftY = drawWrappedText(
    doc,
    safeText(formData.summary),
    leftX,
    leftY,
    leftWidth,
    4.8,
  ) + 5.5;

  customSections.forEach((section, index) => {
    leftY = drawColumnTitle(section.title || `SECTION ${index + 1}`, leftX, leftY, leftWidth);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    const items = splitCustomSectionItems(section.items);
    items.forEach((item) => {
      doc.text("-", leftX, leftY);
      leftY = drawWrappedText(doc, item, leftX + 3, leftY, leftWidth - 3, 4.4) + 1.6;
    });
    leftY += 3;
  });

  if (projectItems.length) {
    leftY = drawColumnTitle("PROJECTS", leftX, leftY, leftWidth);
    projectItems.forEach((project, index) => {
      doc.setTextColor(40, 54, 68);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      leftY = drawWrappedText(doc, safeText(project.name) || `Project ${index + 1}`, leftX, leftY, leftWidth, 4.3) + 1.2;
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      getProjectBullets(project).forEach((bullet) => {
        doc.text("-", leftX, leftY);
        leftY = drawWrappedText(doc, bullet, leftX + 3, leftY, leftWidth - 3, 4.2) + 1.2;
      });
      leftY += 3;
    });
  }

  centerY = drawColumnTitle("EDUCATION", centerX, centerY, centerWidth);
  const renderedEducation = educationItems.length
    ? educationItems
    : [];
  renderedEducation.slice(0, 3).forEach((item) => {
    doc.setTextColor(40, 54, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.4);
    centerY = drawWrappedText(
      doc,
      [safeText(item.degree), safeText(item.fieldOfStudy)].filter(Boolean).join(", "),
      centerX,
      centerY,
      centerWidth,
      4.3,
    );
    doc.setTextColor(34, 132, 102);
    doc.setFontSize(9);
    centerY = drawWrappedText(
      doc,
      safeText(item.institution),
      centerX,
      centerY + 1.4,
      centerWidth,
      4.2,
    );
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    centerY = drawWrappedText(
      doc,
      filterFilled([formatDateRange(item.startDate, item.endDate), safeText(formData.personalInfo.location)]).join(" | "),
      centerX,
      centerY + 1.2,
      centerWidth,
      4,
    ) + 3;
  });

  centerY = drawColumnTitle("SKILLS", centerX, centerY, centerWidth);
  const skills = sanitizeRenderedSkills(formData.skills);
  const skillItems = skills.length
    ? skills
    : [];
  doc.setTextColor(16, 73, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  const columnGap = 4;
  const halfWidth = (centerWidth - columnGap) / 2;
  let skillX = centerX;
  let skillRowY = centerY + 1;
  let skillRowHeight = 0;
  let inSecondColumn = false;

  skillItems.slice(0, 10).forEach((skill) => {
    const label = String(skill || "").trim();
    const estimatedWidth = doc.getTextWidth(label);
    const shouldTakeFullRow = estimatedWidth >= centerWidth * 0.4;

    if (shouldTakeFullRow && inSecondColumn) {
      skillRowY += skillRowHeight + 2;
      skillX = centerX;
      skillRowHeight = 0;
      inSecondColumn = false;
    }

    const availableWidth = shouldTakeFullRow ? centerWidth : halfWidth;
    const wrapped = doc.splitTextToSize(label, availableWidth);
    doc.text(wrapped, skillX, skillRowY);
    const underlineY = skillRowY + wrapped.length * 4 + 0.3;
    const underlineWidth = Math.min(
      Math.max(...wrapped.map((line) => doc.getTextWidth(line)), 0) + 1,
      availableWidth,
    );
    doc.setDrawColor(120, 138, 168);
    doc.setLineWidth(0.2);
    doc.line(skillX, underlineY, skillX + underlineWidth, underlineY);
    skillRowHeight = Math.max(skillRowHeight, wrapped.length * 4 + 1);

    if (shouldTakeFullRow) {
      skillRowY += skillRowHeight + 2;
      skillX = centerX;
      skillRowHeight = 0;
      inSecondColumn = false;
      return;
    }

    if (!inSecondColumn) {
      skillX = centerX + halfWidth + columnGap;
      inSecondColumn = true;
    } else {
      skillRowY += skillRowHeight + 2;
      skillX = centerX;
      skillRowHeight = 0;
      inSecondColumn = false;
    }
  });

  rightY = drawColumnTitle("EXPERIENCE", rightX, rightY, rightWidth);
  const renderedExperience = experienceItems.length
    ? experienceItems
    : [];
  renderedExperience.slice(0, 3).forEach((item) => {
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.9);
    rightY = drawWrappedText(doc, safeText(item.role), rightX, rightY, rightWidth, 4.2);
    doc.setTextColor(34, 132, 102);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    rightY = drawWrappedText(doc, safeText(item.company), rightX, rightY + 1.5, rightWidth, 4.6);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    rightY = drawWrappedText(
      doc,
      filterFilled([formatDateRange(item.startDate, item.endDate), safeText(formData.personalInfo.location)]).join(" | "),
      rightX,
      rightY + 1.4,
      rightWidth,
      4,
    );
    const bullets = splitBulletLines(item.description);
    const bulletItems = bullets.length ? bullets : [];
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8.2);
    bulletItems.slice(0, 4).forEach((bullet) => {
      doc.text("-", rightX, rightY + 3.2);
      rightY = drawWrappedText(doc, bullet, rightX + 3, rightY + 3.2, rightWidth - 3, 4.1);
    });
    rightY += 4;
  });
};

const renderTemplatePdf = (doc, formData, config) => {
  resetPage(doc, config.background);

  if (config.layout === "single-column") {
    renderSingleColumnTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "compact") {
    renderCompactTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "creative") {
    renderCreativeTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "timeline") {
    renderTimelineTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "enhancv-replica") {
    renderEnhancvReplicaTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "enhancv-columns") {
    renderEnhancvColumnsTemplate(doc, formData, config);
    return;
  }

  if (config.layout === "socs-official") {
    renderSocsOfficialTemplate(doc, formData, config);
    return;
  }

  renderStandardTemplate(doc, formData, config);
};

const getResumeFileName = (formData, template, suffix = "") =>
  `${(formData.personalInfo.fullName || "resume").replace(/\s+/g, "_")}_${TEMPLATE_FILE_NAMES[template] || "contemporary"}${suffix}.pdf`;

const SECTION_NAME_MAP = {
  contact: "contact",
  "professional_summary": "summary",
  summary: "summary",
  profile: "summary",
  experience: "experience",
  work_experience: "experience",
  education: "education",
  skills: "skills",
  technical_skills: "skills",
  projects: "projects",
  certifications: "certifications",
  achievements: "achievements",
  languages: "languages",
  interests: "interests",
};

const normalizeSectionName = (line = "") =>
  SECTION_NAME_MAP[line.toLowerCase().replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_")] ||
  line.toLowerCase().replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_");

const sanitizeOptimizedLines = (optimizedResumeText = "") =>
  String(optimizedResumeText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^ATS OPTIMIZATION DRAFT$/i.test(line))
    .filter((line) => !/^ORIGINAL CONTENT FOR REFERENCE$/i.test(line))
    .filter((line) => !/^Rewrite your summary/i.test(line))
    .filter((line) => !/^Add your best email/i.test(line))
    .filter((line) => !/^Highlight one strong project/i.test(line))
    .filter((line) => !/^\/(BaseFont|URI|FontName)/i.test(line))
    .filter((line) => !/%PDF|obj\b|endobj\b|xref\b|trailer\b|startxref\b|stream\b|endstream\b/i.test(line))
    .filter((line) => !/^(Producer|Creator|CreationDate|ModDate|Type|Length|Filter|Contents)\b/i.test(line))
    .filter((line) => /[A-Za-z]/.test(line))
    .map((line) => line.replace(/\s+/g, " ").trim());

const extractContactDetails = (lines = []) => {
  const contactText = lines.join(" ");
  const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone =
    contactText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || "";
  const locationLine =
    lines.find(
      (line) =>
        !email || !line.includes(email)
    ) || "";

  return {
    email,
    phone,
    location: locationLine && locationLine !== email && locationLine !== phone ? locationLine : "",
  };
};

const inferProfessionalTitle = (lines = [], headline = "") => {
  const titleLike =
    lines.find((line) =>
      /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect)/i.test(
        line,
      ),
    ) || "";

  if (headline && !/ats-ready revision prepared/i.test(headline)) {
    return headline;
  }

  return titleLike || "";
};

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines.flatMap((line) => {
        const cleaned = String(line || "").replace(/^[-*]\s*/, "").trim();
        if (!cleaned) return [];

        const candidateText = cleaned.includes(":") ? cleaned.split(":").slice(1).join(":").trim() : cleaned;
        const simpleSkillTokenPattern =
          /^(c|c\+\+|c#|python|java|javascript|typescript|html|css|react|node(?:\.js)?|express(?:\.js)?|mysql|sql|mongodb|postgres(?:ql)?|dbms|dsa|os|oop|aws|docker|linux|git)$/i;
        const baseParts = candidateText
          .split(/[,|/]|•|\t+/)
          .flatMap((part) => part.split(/\s{2,}/))
          .map((part) => part.trim())
          .filter(Boolean);

        return baseParts.flatMap((part) => {
          const normalized = part.replace(/\s+/g, " ").trim();
          const spaceTokens = normalized.split(" ").filter(Boolean);
          const averageLength =
            spaceTokens.reduce((sum, token) => sum + token.length, 0) / Math.max(spaceTokens.length, 1);

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

const extractLikelySkillsFromLines = (lines = []) =>
  Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[,|/]/))
        .flatMap((line) => line.split(/\s{2,}/))
        .flatMap((line) => line.split(/\b/))
        .map((token) => token.trim())
        .filter((token) => /^[A-Za-z][A-Za-z0-9.+#/-]{1,20}$/.test(token))
        .filter((token) =>
          /(react|node|python|java|sql|aws|docker|api|html|css|javascript|typescript|mongodb|mysql|git|linux|c\+\+|c|dsa|oop|dbms|os|dcn|spring|kubernetes|postgres|express)/i.test(
            token,
          ),
        ),
    ),
  ).slice(0, 16);

const inferSummary = (lines = [], title = "") => {
  const longLine = lines.find(
    (line) =>
      line.length > 70 &&
      !/^(contact|summary|experience|education|skills|projects|certifications|achievements)$/i.test(
        line,
      ),
  );

  if (longLine) {
    return longLine;
  }

  if (title && title !== "Professional Title") {
    return `Results-driven ${title.toLowerCase()} with strong technical fundamentals, relevant project work, and a resume structure optimized for ATS screening.`;
  }

  return "Results-driven candidate with relevant technical skills, practical experience, and an ATS-friendly resume structure.";
};

const buildExperienceItems = (lines = []) => {
  if (!lines.length) {
    return [];
  }

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = line.replace(/^[-*]\s*/, "").trim();
    if (!cleaned) {
      return;
    }

    const looksLikeHeading =
      !line.startsWith("-") &&
      !line.startsWith("*") &&
      cleaned.length < 90 &&
      /(^[A-Z])/.test(cleaned);

    if (!current || looksLikeHeading) {
      if (current) {
        groups.push(current);
      }
      current = {
        heading: cleaned,
        details: [],
      };
      return;
    }

    current.details.push(cleaned);
  });

  if (current) {
    groups.push(current);
  }

  return groups.map((group) => {
    const metaLine = group.details.find((item) => /\b(20\d{2}|present|current|intern|remote|hybrid)\b/i.test(item)) || "";
    const detailLines = group.details.filter((item) => item !== metaLine);
    return {
      role: group.heading,
      company: "",
      startDate: "",
      endDate: metaLine,
      description: detailLines.join(" "),
    };
  });
};

const buildEducationItems = (lines = []) => {
  if (!lines.length) {
    return [];
  }

  return [
    {
      degree: lines[0] || "",
      institution: lines[1] || "",
      fieldOfStudy: lines[2] || "",
      startDate: "",
      endDate: lines.find((line) => /\b(20\d{2}|present|current)\b/i.test(line)) || "",
    },
  ];
};

const parseOptimizedResumeText = (optimizedResumeText = "", fileName = "", headline = "") => {
  const lines = sanitizeOptimizedLines(optimizedResumeText);

  const firstSectionIndex = lines.findIndex((line) => /^[A-Z][A-Z\s&/-]{2,}$/.test(line));
  const introLines = firstSectionIndex > 0 ? lines.slice(0, firstSectionIndex) : [];

  const sectionMap = {};
  let currentSection = "summary";
  sectionMap[currentSection] = [];

  lines.forEach((line) => {
    if (/^[A-Z][A-Z\s&/-]{2,}$/.test(line)) {
      currentSection = normalizeSectionName(line);
      if (!sectionMap[currentSection]) {
        sectionMap[currentSection] = [];
      }
      return;
    }
    sectionMap[currentSection].push(line.replace(/^[-*]\s*/, ""));
  });

  const derivedName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

  const introName =
    introLines.find((line) => /^[A-Z][A-Za-z\s.]{4,40}$/.test(line) && !/@/.test(line)) || "";
  const contactDetails = extractContactDetails([...(sectionMap.contact || []), ...lines]);
  const professionalTitle = inferProfessionalTitle(
    [...introLines, ...(sectionMap.summary || []), ...(sectionMap.experience || [])],
    headline,
  );
  const summaryLines = (sectionMap.summary || []).filter(
    (line) => line.length > 25 && !/^(candidate name|ats-optimized resume)$/i.test(line),
  );
  const skills = splitSkillTokens(sectionMap.skills || []);
  const inferredSkills = extractLikelySkillsFromLines(lines);
  const experienceItems = buildExperienceItems(sectionMap.experience || []);
  const inferredExperienceItems =
    experienceItems.length || !lines.length
      ? experienceItems
      : buildExperienceItems(
          lines.filter((line) =>
            /(^[-*])|(developed|built|implemented|managed|analyzed|led|created|delivered|optimized|collaborated|designed)/i.test(
              line,
            ),
          ),
        );
  const educationItems = buildEducationItems(sectionMap.education || []);

  const customSections = Object.entries(sectionMap)
    .filter(([key]) => !["summary", "skills", "experience", "education", "contact"].includes(key))
    .map(([key, values]) => ({
      title: key.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()),
      items: values,
    }));

  return {
    personalInfo: {
      fullName: introName || derivedName || "Optimized Resume",
      title: professionalTitle,
      email: contactDetails.email,
      phone: contactDetails.phone,
      location: contactDetails.location,
    },
    summary: summaryLines.join(" ") || inferSummary(lines, professionalTitle),
    skills: skills.length ? skills : inferredSkills,
    experience: inferredExperienceItems,
    education: educationItems,
    customSections,
  };
};

const KNOWN_SKILL_PATTERN =
  /(python|r\b|java|javascript|typescript|react|node(?:\.js)?|express|mongodb|mysql|sql|postgres(?:ql)?|aws|azure|gcp|docker|kubernetes|linux|git|github|html|css|tailwind|bootstrap|c\+\+|c#|\bc\b|spring|django|flask|fastapi|machine learning|supervised learning|unsupervised learning|model evaluation|scikit-learn|data structures|algorithms|oop|\bos\b|dbms|dsa|power bi|tableau|excel|advanced excel|vlookup|pivot tables|pandas|numpy|data analysis|data visualization|dashboard|dashboard development|reporting|eda|exploratory data analysis|data wrangling|data preprocessing|statistics|siem|vapt|soc|incident response|digital forensics|wireshark|burp suite|nmap|metasploit|threat intelligence|malware analysis|api|rest|rest api|cloud security|network security|cybersecurity)/i;

const isLikelyName = (value = "") =>
  /^[A-Za-z]+(?:[.\s'-][A-Za-z]+){1,4}$/.test(String(value).trim()) &&
  !/(summary|experience|education|skills|projects|certifications|achievements|contact|technical|resume)/i.test(
    String(value),
  );

const looksLikeContactLine = (value = "") =>
  /@|linkedin\.com|github\.com|https?:\/\/|\+?\d[\d\s\-()]{7,}/i.test(cleanResumeText(value));

const looksLikeContactSummary = (value = "") => {
  const text = cleanResumeText(value);
  if (!text) return false;

  const fragments = text.split(/\s*\|\s*|,\s*/).map((part) => part.trim()).filter(Boolean);
  const contactCount = fragments.filter((fragment) => looksLikeContactLine(fragment)).length;

  return contactCount >= 2 || (looksLikeContactLine(text) && !/[.!?]/.test(text));
};

const sanitizeSkillItems = (skills = [], personalInfo = {}) => {
  const forbiddenTokens = new Set(
    [
      personalInfo.fullName,
      personalInfo.name,
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.title,
      personalInfo.portfolio,
    ]
      .filter(Boolean)
      .flatMap((value) =>
        String(value)
          .split(/[\s|,/@._-]+/)
          .map((token) => token.trim().toLowerCase())
          .filter((token) => token.length > 1),
      ),
  );

  return Array.from(
    new Set(
      flattenSkillCategories(skills)
        .map((skill) => String(skill || "").trim())
        .filter(Boolean)
        .filter((skill) => !/@|https?:\/\/|linkedin\.com|github\.com/i.test(skill))
        .filter((skill) => !forbiddenTokens.has(skill.toLowerCase()))
        .filter((skill) => !/^(candidate|experience|critical|flaws|detection|security|digital)$/i.test(skill))
        .filter((skill) => KNOWN_SKILL_PATTERN.test(skill)),
    ),
  ).slice(0, 32);
};

const sanitizeOptimizedResumeData = (optimizedResume = {}, fileName = "") => {
  const personalInfo = {
    ...(optimizedResume.personalInfo || {}),
  };

  const normalizeEntry = (item = {}, fields = []) =>
    fields.reduce((acc, field) => {
      acc[field] = cleanResumeText(item?.[field] || "");
      return acc;
    }, {});

  const normalizedExperience = (Array.isArray(optimizedResume.experience) ? optimizedResume.experience : [])
    .map((item) => normalizeEntry(item, ["role", "company", "startDate", "endDate", "description"]))
    .filter((item) => item.role || item.company || item.description);

  const normalizedEducation = (Array.isArray(optimizedResume.education) ? optimizedResume.education : [])
    .map((item) => normalizeEntry(item, ["degree", "institution", "fieldOfStudy", "startDate", "endDate"]))
    .filter((item) => item.degree || item.institution || item.fieldOfStudy);

  const normalizedProjects = (Array.isArray(optimizedResume.projects) ? optimizedResume.projects : [])
    .map((item) => ({
      name: cleanResumeText(item?.name || ""),
      bullets: Array.isArray(item?.bullets)
        ? item.bullets.map((bullet) => stripBulletPrefix(bullet)).filter(Boolean)
        : splitBulletLines(item?.description || ""),
    }))
    .filter((item) => item.name || item.bullets.length);

  const customSections = Array.isArray(optimizedResume.customSections)
    ? optimizedResume.customSections.map((section) => ({
        title: cleanResumeText(section?.title || ""),
        items: Array.isArray(section?.items)
          ? section.items.map((item) => stripBulletPrefix(item)).filter(Boolean)
          : [],
      }))
    : [];

  const possibleNameSection = customSections.find((section) => {
    const title = String(section?.title || "").trim();
    const items = Array.isArray(section?.items) ? section.items : [];
    return (
      isLikelyName(title) &&
      items.some((item) => /@|\+?\d[\d\s\-()]{7,}|linkedin\.com|github\.com/i.test(String(item)))
    );
  });

  const rawFullName =
    personalInfo.fullName ||
    personalInfo.name ||
    possibleNameSection?.title ||
    fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();

  const cleanedFullName = /resume|final|boss|optimized/i.test(rawFullName)
    ? possibleNameSection?.title || rawFullName
    : rawFullName;

  const normalizedSkills = sanitizeSkillItems(optimizedResume.skills, {
    ...personalInfo,
    fullName: cleanedFullName,
  });

  const skillsFromCustomSection = customSections
    .filter((section) => /technical skills|skills/i.test(String(section?.title || "")))
    .flatMap((section) => (Array.isArray(section.items) ? section.items : []))
    .flatMap((item) => String(item).split(/[,|]/))
    .map((item) => item.trim())
    .filter(Boolean);

  const mergedSkills = normalizedSkills.length
    ? normalizedSkills
    : sanitizeSkillItems(skillsFromCustomSection, {
        ...personalInfo,
        fullName: cleanedFullName,
      });

  const filteredCustomSections = customSections.filter((section) => {
    const title = String(section?.title || "").trim();
    const items = Array.isArray(section?.items) ? section.items : [];

    if (!title && !items.length) return false;
    if (/technical skills|skills/i.test(title)) return false;
    if (
      isLikelyName(title) &&
      items.some((item) => /@|\+?\d[\d\s\-()]{7,}|linkedin\.com|github\.com/i.test(String(item)))
    ) {
      return false;
    }

    return true;
  });

  const cleanedTitle = cleanResumeText(personalInfo.title || "");
  const inferredTitle =
    cleanedTitle ||
    inferProfessionalTitle(
      [
        ...normalizedExperience.flatMap((item) => [item.role, item.company, item.description]),
      ],
      "",
    );

  const cleanedSummary = cleanResumeText(optimizedResume.summary || "");
  const fallbackSummary = inferSummary(
    [
      ...normalizedExperience.flatMap((item) => [item.role, item.description]),
      ...filteredCustomSections.flatMap((section) => [section.title, ...(section.items || []).slice(0, 2)]),
      ...mergedSkills,
    ],
    inferredTitle,
  );
  const resolvedSummary =
    cleanedSummary && !looksLikeContactSummary(cleanedSummary) ? cleanedSummary : fallbackSummary;

  return {
    ...optimizedResume,
    personalInfo: {
      ...personalInfo,
      fullName: cleanedFullName || "Optimized Resume",
      name: cleanedFullName || "Optimized Resume",
      title: inferredTitle,
      email: cleanResumeText(personalInfo.email || ""),
      phone: cleanResumeText(personalInfo.phone || ""),
      location: cleanResumeText(personalInfo.location || ""),
      portfolio: cleanResumeText(personalInfo.portfolio || ""),
    },
    summary: resolvedSummary,
    skills: mergedSkills,
    experience: normalizedExperience,
    projects: normalizedProjects,
    education: normalizedEducation,
    customSections: filteredCustomSections,
  };
};

const compactOptimizedResumeToSinglePage = (resume = {}) => {
  const compactSummary = safeText(resume.summary || "").slice(0, 320).trim();

  const compactExperience = (Array.isArray(resume.experience) ? resume.experience : [])
    .slice(0, 2)
    .map((item) => ({
      ...item,
      role: safeText(item.role || ""),
      company: safeText(item.company || ""),
      startDate: safeText(item.startDate || ""),
      endDate: safeText(item.endDate || ""),
      description: splitBulletLines(item.description || "")
        .slice(0, 2)
        .join(" "),
    }))
    .filter((item) => item.role || item.company || item.description);

  const compactEducation = (Array.isArray(resume.education) ? resume.education : [])
    .slice(0, 2)
    .map((item) => ({
      ...item,
      degree: safeText(item.degree || ""),
      institution: safeText(item.institution || ""),
      fieldOfStudy: safeText(item.fieldOfStudy || ""),
      startDate: safeText(item.startDate || ""),
      endDate: safeText(item.endDate || ""),
    }))
    .filter((item) => item.degree || item.institution || item.fieldOfStudy);

  const compactProjects = (Array.isArray(resume.projects) ? resume.projects : [])
    .slice(0, 2)
    .map((project, index) => ({
      name: safeText(project.name || `Project ${index + 1}`),
      bullets: getProjectBullets(project).slice(0, 2),
    }))
    .filter(hasProjectContent);

  const compactCustomSections = (Array.isArray(resume.customSections) ? resume.customSections : [])
    .filter((section) => /project|certification|achievement|publication|internship/i.test(String(section?.title || "")))
    .slice(0, 5)
    .map((section) => ({
      title: safeText(section.title || ""),
      items: splitCustomSectionItems(Array.isArray(section.items) ? section.items : []).slice(0, 2),
    }))
    .filter((section) => section.title && section.items.length);

  return {
    ...resume,
    summary: compactSummary,
    skills: sanitizeRenderedSkills(resume.skills).map((skill) => safeText(skill)).filter(Boolean).slice(0, 28),
    experience: compactExperience,
    projects: compactProjects,
    education: compactEducation,
    customSections: compactCustomSections,
  };
};

const waitForPreviewAssets = async (previewElement) => {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const imageElements = Array.from(previewElement?.querySelectorAll?.("img") || []);
  await Promise.all(
    imageElements.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      if (typeof image.decode === "function") {
        try {
          await image.decode();
          return;
        } catch {
          // Some already-rendered data URLs reject decode; load/error listeners still settle export.
        }
      }

      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );

  if (typeof window !== "undefined") {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  }
};

const A4_EXPORT_WIDTH_PX = 794;
const A4_EXPORT_HEIGHT_PX = Math.round((A4_EXPORT_WIDTH_PX * PAGE_HEIGHT) / PAGE_WIDTH);
const PDF_CAPTURE_SCALE = 3;
const PREVIEW_PLACEHOLDER_TEXT = new Set([
  "[Phone Number]",
  "[Email]",
  "[Location]",
  "yourname@email.com",
  "email@example.com",
  "+91 0000000000",
  "Your location",
  "Title",
  "Company Name",
  "University / Institute",
  "Degree / Program",
  "Institution Name",
  "Add items to populate this section.",
  "Add projects to highlight practical work.",
  "Add project details as bullet points.",
  "Add skills to populate the preview.",
  "Highlight your accomplishments, using numbers if possible.",
  "Your professional summary will appear here once you add it.",
  "Your professional summary will appear here as you write or generate it.",
]);

const removePreviewOnlyPlaceholders = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const normalized = String(node.nodeValue || "").replace(/\s+/g, " ").trim();
    if (PREVIEW_PLACEHOLDER_TEXT.has(normalized)) {
      node.nodeValue = "";
    }
  });
};

const showFullLinkText = (root) => {
  root.querySelectorAll("a[href]").forEach((link) => {
    const fullHref = String(link.href || "").trim();
    if (!fullHref) {
      return;
    }

    link.textContent = fullHref;
    link.style.overflowWrap = "anywhere";
    link.style.wordBreak = "break-word";
  });
};

const createStableExportClone = async (previewElement, options = {}) => {
  const exportHost = document.createElement("div");
  exportHost.setAttribute("data-resume-pdf-export-host", "true");
  exportHost.style.position = "absolute";
  exportHost.style.left = "-10000px";
  exportHost.style.top = "0";
  exportHost.style.width = `${A4_EXPORT_WIDTH_PX}px`;
  exportHost.style.minWidth = `${A4_EXPORT_WIDTH_PX}px`;
  exportHost.style.maxWidth = `${A4_EXPORT_WIDTH_PX}px`;
  exportHost.style.background = "#ffffff";
  exportHost.style.pointerEvents = "none";
  exportHost.style.overflow = "visible";
  exportHost.style.zIndex = "-1";

  const clonedPreview = previewElement.cloneNode(true);
  clonedPreview.style.width = `${A4_EXPORT_WIDTH_PX}px`;
  clonedPreview.style.minWidth = `${A4_EXPORT_WIDTH_PX}px`;
  clonedPreview.style.maxWidth = `${A4_EXPORT_WIDTH_PX}px`;
  clonedPreview.style.margin = "0";
  clonedPreview.style.border = "0";
  clonedPreview.style.borderRadius = "0";
  clonedPreview.style.boxShadow = "none";
  clonedPreview.style.outline = "0";
  clonedPreview.style.background = "#ffffff";
  clonedPreview.style.overflow = "visible";
  clonedPreview.style.transform = "none";
  clonedPreview.style.transformOrigin = "top left";

  removePreviewOnlyPlaceholders(clonedPreview);
  if (options.fullLinkText) {
    showFullLinkText(clonedPreview);
  }
  clonedPreview.querySelectorAll("a").forEach((link) => {
    link.style.textDecoration = "none";
    link.style.borderBottom = "0";
  });
  clonedPreview.querySelectorAll('[data-compact-empty="true"]').forEach((section) => {
    section.remove();
  });
  clonedPreview.querySelectorAll('[data-resume-section-empty="true"]').forEach((section) => {
    section.remove();
  });
  clonedPreview.querySelectorAll("section, article, ul, ol, li, h1, h2, h3, h4").forEach((element) => {
    element.style.breakInside = "avoid";
    element.style.pageBreakInside = "avoid";
  });
  clonedPreview.querySelectorAll('[class*="grid-cols"], [class*="space-y"], [class*="border-b"]').forEach((element) => {
    element.style.breakInside = "avoid";
    element.style.pageBreakInside = "avoid";
  });
  clonedPreview.querySelectorAll("section span").forEach((element) => {
    if (element.textContent?.trim() && element.closest("section")?.textContent?.includes("SKILLS")) {
      element.style.textDecoration = "none";
      element.style.borderBottom = "0";
    }
  });
  clonedPreview.querySelectorAll("section").forEach((section) => {
    const heading = section.querySelector("h1, h2, h3, h4")?.textContent?.trim().toUpperCase();
    if (heading !== "SKILLS") {
      return;
    }

    section.querySelectorAll("*").forEach((element) => {
      element.style.textDecoration = "none";
      if (element !== section) {
        element.style.borderBottomColor = "transparent";
      }
    });
  });

  const exportStyle = document.createElement("style");
  exportStyle.textContent = `
    [data-resume-pdf-root="true"],
    [data-resume-pdf-root="true"] * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    [data-resume-pdf-root="true"] section,
    [data-resume-pdf-root="true"] article,
    [data-resume-pdf-root="true"] ul,
    [data-resume-pdf-root="true"] ol,
    [data-resume-pdf-root="true"] li {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    [data-resume-pdf-root="true"] a {
      color: inherit;
      text-decoration: none !important;
      border-bottom: 0 !important;
    }
  `;
  clonedPreview.prepend(exportStyle);

  exportHost.appendChild(clonedPreview);
  document.body.appendChild(exportHost);

  await waitForPreviewAssets(clonedPreview);

  return {
    element: clonedPreview,
    cleanup: () => exportHost.remove(),
  };
};

const getResumeSafeBreakpoints = (exportElement, canvasScale) => {
  const rootRect = exportElement.getBoundingClientRect();
  const candidates = new Set([0]);
  const selector = [
    "section",
    "article",
    "ul",
    "ol",
    "li",
    "h3",
    '[class*="grid-cols"]',
    '[class*="space-y"] > *',
  ].join(",");

  exportElement.querySelectorAll(selector).forEach((element) => {
    const rect = element.getBoundingClientRect();
    const top = Math.round((rect.top - rootRect.top) * canvasScale);
    const bottom = Math.round((rect.bottom - rootRect.top) * canvasScale);

    if (top > 0) candidates.add(top);
    if (bottom > 0) candidates.add(bottom);
  });

  return Array.from(candidates).sort((a, b) => a - b);
};

const getExportElementLinks = (exportElement) => {
  const rootRect = exportElement.getBoundingClientRect();

  return Array.from(exportElement.querySelectorAll("a[href]")).flatMap((link) => {
    const url = link.href;
    if (!url) {
      return [];
    }

    return Array.from(link.getClientRects())
      .map((rect) => ({
        url,
        left: rect.left - rootRect.left,
        top: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
      }))
      .filter((rect) => rect.width > 0 && rect.height > 0);
  });
};

const addPdfLink = (doc, link, scaleX, scaleY) => {
  doc.link(
    link.left * scaleX,
    link.top * scaleY,
    link.width * scaleX,
    link.height * scaleY,
    { url: link.url },
  );
};

const isMostlyWhiteCanvasRow = (context, width, y) => {
  const safeY = Math.max(0, Math.min(context.canvas.height - 1, Math.round(y)));
  const { data } = context.getImageData(0, safeY, width, 1);
  let whitePixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index] > 245 && data[index + 1] > 245 && data[index + 2] > 245 && data[index + 3] > 245) {
      whitePixels += 1;
    }
  }

  return whitePixels / width > 0.985;
};

const isMostlyWhiteCanvasBand = (context, width, y, radius = 14) => {
  for (let offset = -radius; offset <= radius; offset += 4) {
    if (!isMostlyWhiteCanvasRow(context, width, y + offset)) {
      return false;
    }
  }

  return true;
};

const findWhitespaceBreakNear = (context, width, preferredY, minY, maxY, searchRadius = 180) => {
  const clampedPreferredY = Math.max(minY, Math.min(maxY, Math.round(preferredY)));

  for (let offset = 0; offset <= searchRadius; offset += 3) {
    const upwardY = clampedPreferredY - offset;
    if (upwardY > minY && isMostlyWhiteCanvasBand(context, width, upwardY)) {
      return upwardY;
    }

    const downwardY = clampedPreferredY + offset;
    if (offset > 0 && downwardY < maxY && isMostlyWhiteCanvasBand(context, width, downwardY)) {
      return downwardY;
    }
  }

  return null;
};

const getCanvasPageSliceHeight = (canvas, sourceY, targetPageHeightPx, breakpoints = []) => {
  const remainingHeight = canvas.height - sourceY;
  if (remainingHeight <= targetPageHeightPx) {
    return remainingHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return Math.min(targetPageHeightPx, remainingHeight);
  }

  const idealBreakY = Math.min(sourceY + targetPageHeightPx, canvas.height - 1);
  const minBreakY = sourceY + Math.floor(targetPageHeightPx * 0.62);
  const maxBreakY = Math.min(sourceY + targetPageHeightPx, canvas.height - 1);
  const safeBreakpoints = [...breakpoints]
    .reverse()
    .filter((breakpoint) => breakpoint < maxBreakY && breakpoint > minBreakY);

  for (const breakpoint of safeBreakpoints) {
    const whitespaceY = findWhitespaceBreakNear(context, canvas.width, breakpoint, minBreakY, maxBreakY, 72);
    if (whitespaceY) {
      return Math.max(1, whitespaceY - sourceY);
    }
  }

  const whitespaceY = findWhitespaceBreakNear(context, canvas.width, idealBreakY, minBreakY, maxBreakY, 280);
  if (whitespaceY) {
    return Math.max(1, whitespaceY - sourceY);
  }

  return Math.min(targetPageHeightPx, remainingHeight);
};

const addCanvasLinksToPdf = (doc, links, sourceY, sliceHeight, topPadding, canvasScale, mmPerPx) => {
  links.forEach((link) => {
    const linkLeft = link.left * canvasScale;
    const linkTop = link.top * canvasScale;
    const linkWidth = link.width * canvasScale;
    const linkHeight = link.height * canvasScale;
    const linkBottom = linkTop + linkHeight;
    const sliceBottom = sourceY + sliceHeight;
    const overlapTop = Math.max(linkTop, sourceY);
    const overlapBottom = Math.min(linkBottom, sliceBottom);

    if (overlapBottom <= overlapTop) {
      return;
    }

    doc.link(
      linkLeft * mmPerPx,
      (topPadding + overlapTop - sourceY) * mmPerPx,
      linkWidth * mmPerPx,
      (overlapBottom - overlapTop) * mmPerPx,
      { url: link.url },
    );
  });
};

const addCanvasToPdf = (doc, canvas, breakpoints = [], links = [], canvasScale = 1) => {
  const imageWidth = PAGE_WIDTH;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const pageHeightPx = Math.floor((canvas.width * PAGE_HEIGHT) / PAGE_WIDTH);
  const pageTopPaddingPx = Math.round(28 * PDF_CAPTURE_SCALE);
  const pageBottomPaddingPx = Math.round(24 * PDF_CAPTURE_SCALE);
  const mmPerPx = PAGE_WIDTH / canvas.width;

  if (imageHeight <= PAGE_HEIGHT) {
    doc.addImage(canvas.toDataURL("image/png", 1), "PNG", 0, 0, imageWidth, imageHeight, undefined, "FAST");
    addCanvasLinksToPdf(doc, links, 0, canvas.height, 0, canvasScale, mmPerPx);
    return;
  }

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const topPadding = pageIndex === 0 ? 0 : pageTopPaddingPx;
    const availablePageHeight = pageHeightPx - topPadding - pageBottomPaddingPx;
    const sliceHeight = getCanvasPageSliceHeight(canvas, sourceY, availablePageHeight, breakpoints);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const context = pageCanvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to prepare PDF page canvas.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      topPadding,
      canvas.width,
      sliceHeight,
    );

    if (pageIndex > 0) {
      doc.addPage();
    }

    doc.addImage(pageCanvas.toDataURL("image/png", 1), "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, "FAST");
    addCanvasLinksToPdf(doc, links, sourceY, sliceHeight, topPadding, canvasScale, mmPerPx);
    sourceY += sliceHeight;
    pageIndex += 1;
  }
};

const buildSearchableResumeText = (formData = {}) => {
  const personalInfo = formData.personalInfo || {};
  const sections = [
    [
      personalInfo.fullName,
      personalInfo.title,
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.portfolio,
      personalInfo.github,
    ],
    ["Professional Summary", formData.summary],
    [
      "Education",
      ...(Array.isArray(formData.education) ? formData.education : []).map((item) =>
        [item.degree, item.fieldOfStudy, item.institution, item.location, item.score, item.startDate, item.endDate]
          .filter(Boolean)
          .join(" "),
      ),
    ],
    [
      "Experience",
      ...(Array.isArray(formData.experience) ? formData.experience : []).map((item) =>
        [item.role, item.company, item.startDate, item.endDate, item.description].filter(Boolean).join(" "),
      ),
    ],
    [
      "Projects",
      ...(Array.isArray(formData.projects) ? formData.projects : []).map((item) =>
        [item.name, item.description, ...(Array.isArray(item.bullets) ? item.bullets : [])].filter(Boolean).join(" "),
      ),
    ],
    [
      "Skills",
      ...normalizeSkillCategories(formData.skills || []).map((group) =>
        [group.category, ...(Array.isArray(group.items) ? group.items : [])].filter(Boolean).join(": "),
      ),
    ],
    ...(Array.isArray(formData.customSections) ? formData.customSections : []).map((section) => [
      section.title,
      ...(Array.isArray(section.items) ? section.items : []),
    ]),
  ];

  return sections
    .flat()
    .map((value) => String(value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

const addSearchableTextLayer = (doc, formData = {}) => {
  const text = buildSearchableResumeText(formData);
  if (!text) {
    return;
  }

  const currentPage = doc.getCurrentPageInfo?.().pageNumber || 1;
  doc.setPage(1);
  doc.setFontSize(1);
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(text, PAGE_WIDTH - 8).slice(0, 180), 2, 2);
  doc.setTextColor(0, 0, 0);
  doc.setPage(currentPage);
  doc.setProperties({
    title: formData.personalInfo?.fullName ? `${formData.personalInfo.fullName} Resume` : "Resume",
    subject: "Resume Engine export with searchable resume text",
    creator: "Resume Engine",
  });
};

const isEmeraldColumnsPreview = (previewElement) =>
  previewElement?.getAttribute?.("data-resume-template") === "enhancv-columns" ||
  !!previewElement?.querySelector?.('[data-emerald-columns-body="true"]');

const cloneEmeraldSectionWithItem = (section, item, labelSuffix = "") => {
  const clone = section.cloneNode(true);
  const heading = clone.querySelector("h3");
  if (heading && labelSuffix) {
    heading.textContent = `${heading.textContent.replace(/\s*\(CONT\.\)$/i, "")} ${labelSuffix}`;
  }

  const clonedItems = Array.from(clone.querySelectorAll("[data-emerald-item]"));
  if (!clonedItems.length) {
    return clone;
  }

  const targetParent = clonedItems[0].parentElement;
  clonedItems.forEach((node) => node.remove());
  targetParent?.appendChild(item.cloneNode(true));
  return clone;
};

const splitEmeraldSectionIntoItemUnits = (section) => {
  const items = Array.from(section.querySelectorAll("[data-emerald-item]"));
  if (items.length <= 1) {
    return [section.cloneNode(true)];
  }

  return items.map((item, index) => cloneEmeraldSectionWithItem(section, item, index ? "(CONT.)" : ""));
};

const prepareEmeraldColumnPage = (sourceRoot, pageIndex) => {
  const page = sourceRoot.cloneNode(true);
  page.style.width = `${A4_EXPORT_WIDTH_PX}px`;
  page.style.minWidth = `${A4_EXPORT_WIDTH_PX}px`;
  page.style.maxWidth = `${A4_EXPORT_WIDTH_PX}px`;
  page.style.height = `${A4_EXPORT_HEIGHT_PX}px`;
  page.style.minHeight = `${A4_EXPORT_HEIGHT_PX}px`;
  page.style.maxHeight = `${A4_EXPORT_HEIGHT_PX}px`;
  page.style.overflow = "hidden";
  page.style.margin = "0";
  page.style.border = "0";
  page.style.borderRadius = "0";
  page.style.boxShadow = "none";

  const header = page.querySelector('[data-emerald-header="true"]');
  const body = page.querySelector('[data-emerald-columns-body="true"]');
  if (!body) {
    return null;
  }

  if (pageIndex > 0 && header) {
    header.remove();
    body.style.marginTop = "0";
  }

  body.innerHTML = "";
  body.style.display = "grid";
  body.style.columnCount = "auto";
  body.style.columnGap = "normal";
  body.style.gridTemplateColumns = "1.04fr 1.42fr 1.12fr";
  body.style.alignItems = "start";
  body.style.gap = "20px";

  const columns = Array.from({ length: 3 }, () => {
    const column = document.createElement("div");
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.gap = "16px";
    column.style.minWidth = "0";
    column.style.breakInside = "avoid";
    column.style.pageBreakInside = "avoid";
    body.appendChild(column);
    return column;
  });

  return { page, body, columns, currentColumnIndex: 0 };
};

const getEmeraldColumnLimit = (page, body) => {
  const pageRect = page.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  return Math.max(240, pageRect.bottom - bodyRect.top - 32);
};

const prepareEmeraldUnit = (unit) => {
  unit.style.marginBottom = "0";
  unit.style.breakInside = "avoid";
  unit.style.pageBreakInside = "avoid";
  unit.querySelectorAll("[data-emerald-item], li, ul, p").forEach((element) => {
    element.style.breakInside = "avoid";
    element.style.pageBreakInside = "avoid";
  });
  return unit;
};

const appendEmeraldUnitToCurrentColumn = (pageState, unit) => {
  const limit = getEmeraldColumnLimit(pageState.page, pageState.body);
  const column = pageState.columns[pageState.currentColumnIndex];
  prepareEmeraldUnit(unit);
  column.appendChild(unit);

  if (column.scrollHeight <= limit) {
    return true;
  }

  unit.remove();
  return false;
};

const appendEmeraldUnitInReadingFlow = (pageState, unit) => {
  if (appendEmeraldUnitToCurrentColumn(pageState, unit)) {
    return true;
  }

  while (pageState.currentColumnIndex < pageState.columns.length - 1) {
    pageState.currentColumnIndex += 1;
    if (appendEmeraldUnitToCurrentColumn(pageState, unit)) {
      return true;
    }
  }

  return false;
};

const buildEmeraldPaginatedPages = (exportElement) => {
  const host = document.createElement("div");
  host.style.width = `${A4_EXPORT_WIDTH_PX}px`;
  host.style.minWidth = `${A4_EXPORT_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  exportElement.replaceWith(host);

  const sections = Array.from(exportElement.querySelectorAll("[data-emerald-section]"));
  const pages = [];

  const createPage = () => {
    const pageState = prepareEmeraldColumnPage(exportElement, pages.length);
    if (!pageState) {
      return null;
    }
    pages.push(pageState);
    host.appendChild(pageState.page);
    return pageState;
  };

  let currentPage = createPage();
  if (!currentPage) {
    return { element: exportElement, pages: [exportElement], cleanup: () => {} };
  }

  const appendItemUnitsAcrossPages = (section) => {
    splitEmeraldSectionIntoItemUnits(section).forEach((itemUnit) => {
      const nextUnit = itemUnit.cloneNode(true);
      if (appendEmeraldUnitInReadingFlow(currentPage, nextUnit)) {
        return;
      }

      currentPage = createPage();
      const retryUnit = itemUnit.cloneNode(true);
      if (!appendEmeraldUnitInReadingFlow(currentPage, retryUnit)) {
        prepareEmeraldUnit(retryUnit);
        currentPage.columns[currentPage.currentColumnIndex].appendChild(retryUnit);
      }
    });
  };

  sections.forEach((section) => {
    const wholeSection = section.cloneNode(true);
    if (appendEmeraldUnitInReadingFlow(currentPage, wholeSection)) {
      return;
    }

    currentPage = createPage();
    const retryWholeSection = section.cloneNode(true);
    if (appendEmeraldUnitInReadingFlow(currentPage, retryWholeSection)) {
      return;
    }

    retryWholeSection.remove();
    appendItemUnitsAcrossPages(section);
  });

  return {
    element: host,
    pages: pages.map((pageState) => pageState.page),
    cleanup: () => {},
  };
};

const exportEmeraldColumnsPreviewPdf = async (previewElement, fileName, options = {}) => {
  const { element: exportElement, cleanup } = await createStableExportClone(previewElement, options);

  try {
    const { pages } = buildEmeraldPaginatedPages(exportElement);
    await waitForPreviewAssets(pages[0] || exportElement);

    const doc = new jsPDF({
      compress: true,
      format: "a4",
      orientation: "portrait",
      unit: "mm",
    });

    for (const [pageIndex, page] of pages.entries()) {
      const rect = page.getBoundingClientRect();
      const pageLinks = getExportElementLinks(page);
      const canvas = await html2canvas(page, {
        backgroundColor: "#ffffff",
        height: A4_EXPORT_HEIGHT_PX,
        imageTimeout: 15000,
        logging: false,
        removeContainer: true,
        scale: PDF_CAPTURE_SCALE,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        width: A4_EXPORT_WIDTH_PX,
        windowHeight: Math.ceil(rect.height || A4_EXPORT_HEIGHT_PX),
        windowWidth: A4_EXPORT_WIDTH_PX,
      });

      if (pageIndex > 0) {
        doc.addPage();
      }
      doc.addImage(canvas.toDataURL("image/png", 1), "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, "FAST");
      pageLinks.forEach((link) => {
        addPdfLink(doc, link, PAGE_WIDTH / (rect.width || A4_EXPORT_WIDTH_PX), PAGE_HEIGHT / A4_EXPORT_HEIGHT_PX);
      });
    }

    addSearchableTextLayer(doc, options.resumeData);
    doc.save(fileName);
  } finally {
    cleanup();
  }
};

const exportPreviewElementPdf = async (previewElement, fileName, options = {}) => {
  if (!previewElement || typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Resume preview is not ready for PDF export.");
  }

  if (isEmeraldColumnsPreview(previewElement)) {
    await exportEmeraldColumnsPreviewPdf(previewElement, fileName, options);
    return;
  }

  const { element: exportElement, cleanup } = await createStableExportClone(previewElement, options);

  try {
    const rect = exportElement.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      throw new Error("Resume preview has no visible layout to export.");
    }

    const canvas = await html2canvas(exportElement, {
      backgroundColor: "#ffffff",
      height: Math.ceil(rect.height),
      imageTimeout: 15000,
      logging: false,
      removeContainer: true,
      scale: 3,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      width: A4_EXPORT_WIDTH_PX,
      windowHeight: Math.ceil(rect.height),
      windowWidth: A4_EXPORT_WIDTH_PX,
    });
    const canvasScale = canvas.width / rect.width;
    const breakpoints = getResumeSafeBreakpoints(exportElement, canvasScale);
    const links = getExportElementLinks(exportElement);

    const doc = new jsPDF({
      compress: true,
      format: "a4",
      orientation: "portrait",
      unit: "mm",
    });

    addCanvasToPdf(doc, canvas, breakpoints, links, canvasScale);
    addSearchableTextLayer(doc, options.resumeData);
    doc.save(fileName);
  } finally {
    cleanup();
  }
};

export async function exportResumePdf(formData, options = {}) {
  await loadPdfDependencies();

  const template = normalizeTemplateId(formData.template);
  const fileName = getResumeFileName(formData, template, options.hardCopyMode ? "_hard-copy" : "");

  if (options.previewElement) {
    await exportPreviewElementPdf(options.previewElement, fileName, {
      fullLinkText: Boolean(options.hardCopyMode),
      resumeData: formData,
    });
    return;
  }

  const doc = new jsPDF();
  const config = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.contemporary;

  renderTemplatePdf(doc, formData, config);
  drawResumePhoto(doc, template, options.resumePhoto || null);
  doc.save(fileName);
}

export async function exportOptimizedUploadPdf(
  fileName,
  headline,
  optimizedResumeText,
  optimizedResumeData = null,
) {
  await loadPdfDependencies();

  const safeName = (fileName || "optimized_resume").replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  const doc = new jsPDF();
  const optimizedResume = sanitizeOptimizedResumeData(
    optimizedResumeData && typeof optimizedResumeData === "object"
      ? {
          ...optimizedResumeData,
          personalInfo: {
            ...(optimizedResumeData.personalInfo || {}),
            fullName:
              optimizedResumeData.personalInfo?.fullName ||
              optimizedResumeData.personalInfo?.name ||
              "Optimized Resume",
          },
          skills: Array.isArray(optimizedResumeData.skills) ? optimizedResumeData.skills : [],
          experience: Array.isArray(optimizedResumeData.experience)
            ? optimizedResumeData.experience
            : [],
          education: Array.isArray(optimizedResumeData.education)
            ? optimizedResumeData.education
            : [],
          customSections: Array.isArray(optimizedResumeData.customSections)
            ? optimizedResumeData.customSections
            : [],
        }
      : parseOptimizedResumeText(optimizedResumeText, fileName, headline),
    fileName,
  );
  const chosenTemplate = normalizeTemplateId(optimizedResume.template || "single-column");
  const config = TEMPLATE_CONFIG[chosenTemplate];

  renderTemplatePdf(doc, { ...optimizedResume, template: chosenTemplate }, config);
  doc.save(`${safeName}_ATS_Optimized_${chosenTemplate}.pdf`);
}

