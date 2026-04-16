import { jsPDF } from "jspdf";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_LIMIT = 276;

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
};

const TEMPLATE_FILE_NAMES = {
  contemporary: "contemporary",
  timeline: "timeline",
  compact: "compact",
  "single-column": "single-column",
  creative: "creative",
  "enhancv-replica": "signature-timeline",
  "enhancv-columns": "emerald-columns",
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
  if (/certification|certificate|course/.test(normalized)) return "certifications";
  if (/achievement|award/.test(normalized)) return "achievements";
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
      (Array.isArray(skills) ? skills : [])
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

  let x = 12;
  let y = 12;
  let width = 28;
  let height = 28;

  if (template === "creative") {
    x = 168;
    y = 14;
    width = 28;
    height = 28;
  } else if (template === "enhancv-columns") {
    x = 168;
    y = 9;
    width = 28;
    height = 28;
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

  const contactLine = filterFilled([
    safeText(formData.personalInfo.email),
    safeText(formData.personalInfo.phone),
    safeText(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location),
  ]).join(" | ");

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (!contactLine) {
    return centered ? 41 : 40;
  }

  if (centered) {
    const lines = doc.splitTextToSize(contactLine, 150);
    doc.text(lines, PAGE_WIDTH / 2, 35.5, { align: "center" });
    return 45 + lines.length * 4.9;
  }

  return drawWrappedText(doc, contactLine, x, 35.5, width, 4.9) + 4.5;
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
    safeText(formData.personalInfo.email),
    safeText(formData.personalInfo.phone),
    safeText(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location),
  ]);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.1);
  let contactY = 17;
  contactLines.forEach((line) => {
    doc.text(line.toUpperCase(), 195, contactY, { align: "right" });
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
  const leftContact = filterFilled([
    safeText(formData.personalInfo.phone),
    safeText(formData.personalInfo.portfolio),
  ]);
  leftContact.forEach((line, index) => {
    doc.text(line, 12, 36 + index * 6);
  });

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
  const contactParts = filterFilled([
    safeText(formData.personalInfo.phone),
    safeText(formData.personalInfo.email),
    safeText(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location),
  ]);
  const customSections = (formData.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length);
  const projectItems = (formData.projects || []).filter(hasProjectContent);

  doc.setTextColor(...config.nameColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  if (name) {
    doc.text(name, 12, 17);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  if (title) {
    doc.text(title, 12, 24);
  }

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.4);
  const contactLine = contactParts.join("   ");
  if (contactLine) {
    drawWrappedText(doc, contactLine, 12, 30, 184, 4.4);
  }

  let y = 38;
  const drawTitle = (label) => {
    doc.setTextColor(...config.sectionColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.2);
    doc.text(label, 12, y);
    y += 6;
  };

  drawTitle("SUMMARY");
  doc.setTextColor(55, 65, 81);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.6);
  y = drawWrappedText(
    doc,
    safeText(formData.summary),
    12,
    y,
    186,
    4.9,
  ) + 4.5;

  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  const renderedEducation = educationItems;

  if (renderedEducation.length) {
    drawTitle("EDUCATION");
  }

  renderedEducation.forEach((item) => {
    const startY = y;
    doc.setTextColor(56, 88, 148);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.1);
    const educationDate = formatDateRange(item.startDate, item.endDate);
    if (educationDate) {
      doc.text(educationDate, 12, startY);
    }
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    if (safeText(formData.personalInfo.location)) {
      doc.text(formData.personalInfo.location, 12, startY + 4);
    }

    doc.setDrawColor(138, 143, 153);
    doc.setLineWidth(0.25);
    doc.circle(44, startY - 0.5, 0.9, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.4);
    doc.text(
      [safeText(item.degree), safeText(item.fieldOfStudy)].filter(Boolean).join(", "),
      50,
      startY,
    );

    doc.setTextColor(210, 96, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.8);
    y = drawWrappedText(doc, safeText(item.institution), 50, startY + 4, 140, 4.6);
    y += 3.5;
  });

  customSections.forEach((section, index) => {
    drawTitle(section.title || `SECTION ${index + 1}`);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    const items = splitCustomSectionItems(section.items);
    items.forEach((item) => {
      doc.text("-", 12, y);
      y = drawWrappedText(doc, item, 15, y, 180, 4.8) + 1.2;
    });
    y += 2;
  });

  if (projectItems.length) {
    drawTitle("PROJECTS");
    projectItems.forEach((project, index) => {
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      y = drawWrappedText(doc, safeText(project.name) || `Project ${index + 1}`, 12, y, 180, 4.8) + 1;
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      getProjectBullets(project).forEach((bullet) => {
        doc.text("-", 12, y);
        y = drawWrappedText(doc, bullet, 15, y, 180, 4.8) + 1.2;
      });
      y += 2;
    });
  }

  if (filterFilled(formData.skills).length) {
    drawTitle("SKILLS");
    y = drawSkills(doc, filterFilled(formData.skills), 12, y, 180, config);
  }

  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const renderedExperience = experienceItems;

  if (renderedExperience.length) {
    drawTitle("EXPERIENCE");
  }

  renderedExperience.forEach((item) => {
    const startY = y;
    doc.setTextColor(56, 88, 148);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.1);
    const experienceDate = formatDateRange(item.startDate, item.endDate);
    if (experienceDate) {
      doc.text(experienceDate, 12, startY);
    }
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    if (safeText(formData.personalInfo.location)) {
      doc.text(formData.personalInfo.location, 12, startY + 4);
    }

    doc.setDrawColor(138, 143, 153);
    doc.setLineWidth(0.25);
    doc.circle(44, startY - 0.5, 0.9, "F");
    doc.line(44, startY + 1.2, 44, startY + 14);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.6);
    if (safeText(item.role)) {
      doc.text(item.role, 50, startY);
    }

    doc.setTextColor(210, 96, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (safeText(item.company)) {
      doc.text(item.company, 50, startY + 4);
    }

    const bullets = splitBulletLines(item.description);
    const fallbackBullet = bullets.length ? bullets : [];
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.9);
    let bulletY = startY + 8;
    fallbackBullet.forEach((bullet) => {
      doc.text("-", 50, bulletY);
      bulletY = drawWrappedText(doc, bullet, 53, bulletY, 138, 4.5);
    });
    y = bulletY + 3;
  });
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
    safeText(formData.personalInfo.phone),
    safeText(formData.personalInfo.email),
    safeText(formData.personalInfo.portfolio),
    safeText(formData.personalInfo.location),
  ]);
  const contactLine = contactParts.join("   ");
  if (contactLine) {
    drawWrappedText(doc, contactLine, 12, 29, 150, 4.2);
  }

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
  const skills = filterFilled(formData.skills);
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

  renderStandardTemplate(doc, formData, config);
};

const getResumeFileName = (formData, template) =>
  `${(formData.personalInfo.fullName || "resume").replace(/\s+/g, "_")}_${TEMPLATE_FILE_NAMES[template] || "contemporary"}.pdf`;

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
  /(python|java|javascript|typescript|react|node(?:\.js)?|express|mongodb|mysql|sql|postgres(?:ql)?|aws|azure|gcp|docker|kubernetes|linux|git|github|html|css|tailwind|bootstrap|c\+\+|c#|\bc\b|spring|django|flask|machine learning|data structures|algorithms|oop|\bos\b|dbms|dsa|siem|vapt|soc|incident response|digital forensics|wireshark|burp suite|nmap|metasploit|threat intelligence|malware analysis|api|rest|rest api|cloud security|network security|cybersecurity)/i;

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
      (skills || [])
        .map((skill) => String(skill || "").trim())
        .filter(Boolean)
        .filter((skill) => !/@|https?:\/\/|linkedin\.com|github\.com/i.test(skill))
        .filter((skill) => !forbiddenTokens.has(skill.toLowerCase()))
        .filter((skill) => !/^(candidate|experience|critical|flaws|detection|security|digital)$/i.test(skill))
        .filter((skill) => KNOWN_SKILL_PATTERN.test(skill)),
    ),
  ).slice(0, 16);
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
    skills: (Array.isArray(resume.skills) ? resume.skills : []).map((skill) => safeText(skill)).filter(Boolean).slice(0, 14),
    experience: compactExperience,
    education: compactEducation,
    customSections: compactCustomSections,
  };
};

export async function exportResumePdf(formData, options = {}) {
  const doc = new jsPDF();
  const template = normalizeTemplateId(formData.template);
  const config = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.contemporary;

  renderTemplatePdf(doc, formData, config);
  drawResumePhoto(doc, template, options.resumePhoto || null);
  doc.save(getResumeFileName(formData, template));
}

export function exportOptimizedUploadPdf(
  fileName,
  headline,
  optimizedResumeText,
  optimizedResumeData = null,
) {
  const safeName = (fileName || "optimized_resume").replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  const chosenTemplate = "compact";
  const doc = new jsPDF();
  const optimizedResume = compactOptimizedResumeToSinglePage(sanitizeOptimizedResumeData(
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
  ));
  const config = TEMPLATE_CONFIG[chosenTemplate];

  renderTemplatePdf(doc, { ...optimizedResume, template: chosenTemplate }, config);
  doc.save(`${safeName}_ATS_Optimized_${chosenTemplate}.pdf`);
}
