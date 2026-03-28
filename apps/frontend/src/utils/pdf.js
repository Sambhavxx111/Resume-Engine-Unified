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
  "enhancv-replica": "enhancv-replica",
  "enhancv-columns": "enhancv-columns",
};

const normalizeTemplateId = (templateId) =>
  TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";

const TEMPLATE_CONFIG = {
  contemporary: {
    layout: "standard",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "normal",
    titleSize: 12,
    nameColor: [15, 23, 42],
    titleColor: [14, 116, 144],
    contactColor: [51, 65, 85],
    sectionColor: [51, 65, 85],
    lineColor: [226, 232, 240],
    skillMode: "pill-light",
    order: ["summary", "skills", "experience", "education"],
  },
  "single-column": {
    layout: "single-column",
    background: [255, 255, 255],
    headingFont: "times",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 10,
    nameColor: [15, 23, 42],
    titleColor: [51, 65, 85],
    contactColor: [51, 65, 85],
    sectionColor: [30, 41, 59],
    lineColor: [15, 23, 42],
    skillMode: "outlined",
    order: ["summary", "experience", "education", "skills"],
  },
  compact: {
    layout: "compact",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 21,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 10,
    nameColor: [15, 23, 42],
    titleColor: [51, 65, 85],
    contactColor: [30, 41, 59],
    sectionColor: [51, 65, 85],
    lineColor: [203, 213, 225],
    skillMode: "compact",
    order: ["summary", "experience", "skills", "education"],
  },
  creative: {
    layout: "creative",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 22,
    titleFont: "helvetica",
    titleStyle: "normal",
    titleSize: 10.5,
    nameColor: [255, 255, 255],
    titleColor: [103, 232, 249],
    contactColor: [226, 232, 240],
    sectionColor: [8, 145, 178],
    lineColor: [186, 230, 253],
    skillMode: "dark",
    order: ["skills", "summary", "experience", "education"],
  },
  timeline: {
    layout: "timeline",
    background: [248, 250, 252],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 23,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 10,
    nameColor: [2, 6, 23],
    titleColor: [51, 65, 85],
    contactColor: [30, 41, 59],
    sectionColor: [8, 145, 178],
    lineColor: [203, 213, 225],
    skillMode: "light-box",
    order: ["summary", "experience", "education", "skills"],
  },
  "enhancv-replica": {
    layout: "enhancv-replica",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 24,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 12,
    nameColor: [22, 63, 143],
    titleColor: [255, 124, 31],
    contactColor: [60, 72, 88],
    sectionColor: [22, 63, 143],
    lineColor: [160, 170, 185],
    skillMode: "enhancv-line",
    order: ["summary", "experience", "education", "skills"],
  },
  "enhancv-columns": {
    layout: "enhancv-columns",
    background: [255, 255, 255],
    headingFont: "helvetica",
    headingStyle: "bold",
    headingSize: 22,
    titleFont: "helvetica",
    titleStyle: "bold",
    titleSize: 10.5,
    nameColor: [25, 92, 81],
    titleColor: [75, 180, 144],
    contactColor: [95, 103, 117],
    sectionColor: [25, 92, 81],
    lineColor: [25, 92, 81],
    skillMode: "enhancv-line",
    order: ["summary", "experience", "education", "skills"],
  },
};

const filterFilled = (items = []) => items.filter(Boolean);
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
  return start || end || "Date period";
};

const splitBulletLines = (value = "") =>
  String(value)
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

const getResumeSections = (formData) => {
  const sections = [];

  if (formData.summary?.trim()) {
    sections.push({
      key: "summary",
      title: "Summary",
      lines: [formData.summary.trim()],
    });
  }

  const skills = filterFilled(formData.skills);
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
        heading: [item.role || "Role", item.company ? `at ${item.company}` : ""]
          .filter(Boolean)
          .join(" "),
        meta: [item.startDate, item.endDate].filter(Boolean).join(" - ") || "Dates",
        body: item.description || "Impact and achievements will appear here.",
      })),
    });
  }

  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  if (educationItems.length) {
    sections.push({
      key: "education",
      title: "Education",
      items: educationItems.map((item) => ({
        heading: `${item.degree || "Degree"}${item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}`,
        subheading: item.institution || "Institution",
        meta: [item.startDate, item.endDate].filter(Boolean).join(" - ") || "Dates",
      })),
    });
  }

  (formData.customSections || [])
    .filter((section) => section.title || section.items.some((item) => item.trim()))
    .forEach((section, index) => {
      sections.push({
        key: `custom-${index}`,
        title: section.title || "Custom Section",
        lines: section.items.filter((item) => item.trim()).map((item) => item.trim()),
      });
    });

  return sections;
};

const sortSections = (sections, order) => {
  const weight = (key) => {
    const index = order.indexOf(key);
    return index === -1 ? order.length + 1 : index;
  };

  return [...sections].sort((a, b) => weight(a.key) - weight(b.key));
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
  const lines = doc.splitTextToSize(text || "", width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawSectionTitle = (doc, title, x, y, width, config, variant = "default") => {
  const label = title.toUpperCase();
  doc.setTextColor(...config.sectionColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(variant === "compact" ? 9.5 : 10.5);
  doc.text(label, x, y);
  y += 3.5;
  doc.setDrawColor(...config.lineColor);
  doc.setLineWidth(variant === "strong" ? 0.9 : 0.5);
  doc.line(x, y, x + width, y);
  return y + 5;
};

const drawSkills = (doc, skills, x, y, width, config) => {
  let cursorX = x;
  let cursorY = y + 4;

  skills.forEach((skill) => {
    const textWidth = doc.getTextWidth(skill) + 8;
    const pillWidth = Math.min(textWidth, width);
    const pillHeight = 7.5;

    if (cursorX + pillWidth > x + width) {
      cursorX = x;
      cursorY += 10;
    }

    if (config.skillMode === "dark") {
      doc.setFillColor(15, 23, 42);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "F");
    } else if (config.skillMode === "enhancv-line") {
      doc.setTextColor(79, 86, 97);
      doc.setDrawColor(169, 175, 187);
      doc.setLineWidth(0.2);
      doc.line(cursorX, cursorY + 2.2, cursorX + pillWidth - 2, cursorY + 2.2);
    } else if (config.skillMode === "outlined") {
      doc.setTextColor(30, 41, 59);
    } else if (config.skillMode === "light-box") {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setTextColor(30, 41, 59);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "FD");
    } else {
      doc.setFillColor(236, 254, 255);
      doc.setTextColor(14, 116, 144);
      doc.roundedRect(cursorX, cursorY - 5, pillWidth, pillHeight, 2, 2, "F");
    }

    doc.setFont("helvetica", config.skillMode === "compact" ? "bold" : "normal");
    doc.setFontSize(config.skillMode === "compact" ? 8.2 : 8.8);
    doc.text(
      skill,
      cursorX + (config.skillMode === "outlined" || config.skillMode === "enhancv-line" ? 0 : 4),
      cursorY,
    );
    cursorX += pillWidth + 3;
  });

  return cursorY + 6;
};

const drawSkillGrid = (doc, skills, x, y, width, columns = 2) => {
  const columnGap = 6;
  const columnWidth = (width - columnGap * (columns - 1)) / columns;
  let row = 0;

  skills.forEach((skill, index) => {
    const column = index % columns;
    row = Math.floor(index / columns);
    const itemX = x + column * (columnWidth + columnGap);
    const itemY = y + row * 11;

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.text(skill, itemX, itemY);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(itemX, itemY + 2.5, itemX + columnWidth, itemY + 2.5);
  });

  return y + (row + 1) * 11;
};

const drawSectionBody = (doc, section, x, y, width, config) => {
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (section.skills) {
    return drawSkills(doc, section.skills, x, y, width, config) + 3;
  }

  if (section.lines) {
    section.lines.forEach((line) => {
      y = drawWrappedText(doc, line, x, y, width, 5.4) + 1.5;
    });
    return y + 1;
  }

  if (section.items) {
    section.items.forEach((item) => {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      y = drawWrappedText(doc, item.heading, x, y, width, 5.2);

      if (item.subheading) {
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.4);
        y = drawWrappedText(doc, item.subheading, x, y, width, 5) + 0.5;
      }

      if (item.meta) {
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.8);
        y = drawWrappedText(doc, item.meta, x, y, width, 4.6) + 0.8;
      }

      if (item.body) {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.8);
        y = drawWrappedText(doc, item.body, x, y, width, 5.1) + 2;
      } else {
        y += 1.5;
      }
    });
  }

  return y;
};

const drawStandardHeader = (doc, formData, config, centered = false) => {
  const x = 18;
  const width = 174;

  doc.setTextColor(...config.nameColor);
  doc.setFont(config.headingFont, config.headingStyle);
  doc.setFontSize(config.headingSize);

  if (centered) {
    doc.text(formData.personalInfo.fullName || "Your Name", PAGE_WIDTH / 2, 22, { align: "center" });
  } else {
    doc.text(formData.personalInfo.fullName || "Your Name", x, 22);
  }

  doc.setTextColor(...config.titleColor);
  doc.setFont(config.titleFont, config.titleStyle);
  doc.setFontSize(config.titleSize);

  if (centered) {
    doc.text(formData.personalInfo.title || "Professional Title", PAGE_WIDTH / 2, 30, { align: "center" });
  } else {
    doc.text(formData.personalInfo.title || "Professional Title", x, 30);
  }

  const contactLine = filterFilled([
    formData.personalInfo.email || "email@example.com",
    formData.personalInfo.phone || "+91 0000000000",
    formData.personalInfo.location || "Your location",
  ]).join(" | ");

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.3);

  if (centered) {
    const lines = doc.splitTextToSize(contactLine, 150);
    doc.text(lines, PAGE_WIDTH / 2, 38, { align: "center" });
    return 48 + lines.length * 4.5;
  }

  return drawWrappedText(doc, contactLine, x, 38, width, 4.6) + 4;
};

const renderStandardTemplate = (doc, formData, config) => {
  let y = drawStandardHeader(doc, formData, config);
  const sections = sortSections(getResumeSections(formData), config.order);

  sections.forEach((section) => {
    y = ensurePage(doc, y, 18, config.background);
    y = drawSectionTitle(doc, section.title, 18, y, 174, config);
    y = drawSectionBody(doc, section, 18, y, 174, config) + 2;
  });
};

const renderSingleColumnTemplate = (doc, formData, config) => {
  let y = drawStandardHeader(doc, formData, config, true);
  const sections = sortSections(getResumeSections(formData), config.order);

  sections.forEach((section) => {
    y = ensurePage(doc, y, 18, config.background);
    y = drawSectionTitle(doc, section.title, 24, y, 162, config, "strong");
    y = drawSectionBody(doc, section, 24, y, 162, config) + 3;
  });
};

const renderCompactTemplate = (doc, formData, config) => {
  doc.setTextColor(...config.nameColor);
  doc.setFont(config.headingFont, config.headingStyle);
  doc.setFontSize(config.headingSize);
  doc.text(formData.personalInfo.fullName || "Your Name", 18, 20);

  doc.setTextColor(...config.titleColor);
  doc.setFont(config.titleFont, config.titleStyle);
  doc.setFontSize(config.titleSize);
  doc.text(formData.personalInfo.title || "Professional Title", 18, 27);

  const contactLines = filterFilled([
    formData.personalInfo.email || "email@example.com",
    formData.personalInfo.phone || "+91 0000000000",
    formData.personalInfo.location || "Your location",
  ]);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  let contactY = 18;
  contactLines.forEach((line) => {
    doc.text(line.toUpperCase(), 192, contactY, { align: "right" });
    contactY += 5.2;
  });

  doc.setDrawColor(...config.lineColor);
  doc.line(18, 32, 192, 32);

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

  let leftY = 40;
  let rightY = 40;

  leftSections.forEach((section) => {
    leftY = drawSectionTitle(doc, section.title, 18, leftY, 76, config, "compact");
    leftY = drawSectionBody(doc, section, 18, leftY, 76, config) + 3;
  });

  rightSections.forEach((section) => {
    rightY = drawSectionTitle(doc, section.title, 104, rightY, 88, config, "compact");
    rightY = drawSectionBody(doc, section, 104, rightY, 88, config) + 3;
  });
};

const renderCreativeTemplate = (doc, formData, config) => {
  doc.setFillColor(28, 57, 84);
  doc.rect(0, 0, PAGE_WIDTH, 56, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text((formData.personalInfo.fullName || "Your Name").toUpperCase(), 10, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(formData.personalInfo.title || "Professional Title", 10, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  const leftContact = filterFilled([
    formData.personalInfo.phone || "[Phone Number]",
    "LinkedIn / Portfolio",
  ]);
  leftContact.forEach((line, index) => {
    doc.text(line, 10, 36 + index * 5.5);
  });

  doc.text(formData.personalInfo.email || "[Email]", 92, 39);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1.2);
  doc.circle(182, 28, 14);
  doc.circle(182, 26, 5.5);
  doc.ellipse(182, 37.5, 8.5, 5.5);

  const sections = sortSections(getResumeSections(formData), config.order);
  const leftSections = sections.filter((section) =>
    ["experience", "education"].includes(section.key) || section.key.startsWith("custom-"),
  );
  const rightSections = sections.filter((section) =>
    ["summary", "skills"].includes(section.key),
  );

  let leftY = 68;
  let rightY = 68;
  const leftX = 10;
  const rightX = 116;
  const leftWidth = 96;
  const rightWidth = 84;

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
    y = drawSectionBody(doc, section, 26, y, 166, config) + 4;
  });
};

const renderEnhancvReplicaTemplate = (doc, formData, config) => {
  const name = (formData.personalInfo.fullName || "Your Name").toUpperCase();
  const title = formData.personalInfo.title || "Professional Title";
  const contactParts = filterFilled([
    formData.personalInfo.phone || "[Phone Number]",
    formData.personalInfo.email || "yourname@email.com",
    formData.personalInfo.title || "LinkedIn/Portfolio",
    formData.personalInfo.location || "[Location]",
  ]);

  doc.setTextColor(...config.nameColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(name, 12, 18);

  doc.setTextColor(...config.titleColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(title, 12, 25);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  let cursorX = 12;
  contactParts.forEach((part, index) => {
    doc.text(part, cursorX, 31);
    cursorX += doc.getTextWidth(part) + (index === contactParts.length - 1 ? 0 : 8);
  });

  let y = 41;
  const drawTitle = (label) => {
    doc.setTextColor(...config.sectionColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, 12, y);
    y += 5;
  };

  drawTitle("SUMMARY");
  doc.setTextColor(95, 103, 117);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  y = drawWrappedText(
    doc,
    formData.summary ||
      "Your professional summary will appear here once you add it.",
    12,
    y,
    186,
    4,
  ) + 4;

  drawTitle("EXPERIENCE");
  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const renderedExperience =
    experienceItems.length > 0
      ? experienceItems
      : [
          {
            role: "Title",
            company: "Company Name",
            startDate: "",
            endDate: "",
            description: "Add experience entries to build your preview.",
          },
        ];

  renderedExperience.forEach((item) => {
    const startY = y;
    doc.setTextColor(106, 135, 192);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.text(formatDateRange(item.startDate, item.endDate), 12, startY);
    doc.setTextColor(180, 188, 200);
    doc.setFont("helvetica", "normal");
    doc.text(formData.personalInfo.location || "Location", 12, startY + 4);

    doc.setDrawColor(138, 143, 153);
    doc.setLineWidth(0.25);
    doc.circle(44, startY - 0.5, 0.9, "F");
    doc.line(44, startY + 1.2, 44, startY + 14);

    doc.setTextColor(154, 167, 190);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(item.role || "Title", 50, startY);

    doc.setTextColor(255, 139, 57);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(item.company || "Company Name", 50, startY + 4);

    const bullets = splitBulletLines(item.description);
    const fallbackBullet = bullets.length ? bullets : [item.description || "Add experience entries to build your preview."];
    doc.setTextColor(168, 175, 185);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    let bulletY = startY + 8;
    fallbackBullet.forEach((bullet) => {
      doc.text("-", 50, bulletY);
      bulletY = drawWrappedText(doc, bullet, 53, bulletY, 138, 3.8);
    });
    y = bulletY + 2;
  });

  drawTitle("EDUCATION");
  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  const renderedEducation =
    educationItems.length > 0
      ? educationItems
      : [
          {
            degree: "Degree / Program",
            fieldOfStudy: "",
            institution: "Institution Name",
            startDate: "",
            endDate: "",
          },
        ];

  renderedEducation.forEach((item) => {
    const startY = y;
    doc.setTextColor(106, 135, 192);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.text(formatDateRange(item.startDate, item.endDate), 12, startY);
    doc.setTextColor(180, 188, 200);
    doc.setFont("helvetica", "normal");
    doc.text(formData.personalInfo.location || "Location", 12, startY + 4);

    doc.setDrawColor(138, 143, 153);
    doc.setLineWidth(0.25);
    doc.circle(44, startY - 0.5, 0.9, "F");

    doc.setTextColor(106, 135, 192);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${item.degree || "Degree"}${item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}`,
      50,
      startY,
    );

    doc.setTextColor(255, 124, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.6);
    doc.text(item.institution || "Institution", 50, startY + 4);
    y = startY + 10;
  });

  drawTitle("SKILLS");
  if (filterFilled(formData.skills).length) {
    y = drawSkills(doc, filterFilled(formData.skills), 12, y, 180, config);
  } else {
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    y = drawWrappedText(doc, "Add skills to populate the preview.", 12, y + 2, 180, 4) + 2;
  }
};

const renderEnhancvColumnsTemplate = (doc, formData, config) => {
  const educationItems = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  const experienceItems = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );

  doc.setTextColor(...config.nameColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text((formData.personalInfo.fullName || "Your Name").toUpperCase(), 12, 18);

  doc.setTextColor(...config.titleColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(formData.personalInfo.title || "Professional Title", 12, 24);

  doc.setTextColor(...config.contactColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const contactParts = filterFilled([
    formData.personalInfo.phone || "[Phone Number]",
    formData.personalInfo.email || "yourname@email.com",
    formData.personalInfo.title || "LinkedIn/Portfolio",
    formData.personalInfo.location || "[Location]",
  ]);
  let contactX = 12;
  contactParts.forEach((part, index) => {
    doc.text(part, contactX, 29);
    contactX += doc.getTextWidth(part) + (index === contactParts.length - 1 ? 0 : 7);
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
    doc.setFontSize(9);
    doc.text(label, x, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(...config.lineColor);
    doc.line(x, y + 1.5, x + width, y + 1.5);
    return y + 6;
  };

  const leftX = 12;
  const centerX = 76;
  const rightX = 148;
  const leftWidth = 46;
  const centerWidth = 64;
  const rightWidth = 44;
  let leftY = 40;
  let centerY = 40;
  let rightY = 40;

  leftY = drawColumnTitle("SUMMARY", leftX, leftY, leftWidth);
  doc.setTextColor(100, 108, 115);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  leftY = drawWrappedText(
    doc,
    formData.summary || "Your professional summary will appear here once you add it.",
    leftX,
    leftY,
    leftWidth,
    3.8,
  ) + 5;

  centerY = drawColumnTitle("EXPERIENCE", centerX, centerY, centerWidth);
  const renderedExperience = experienceItems.length
    ? experienceItems
    : [{ role: "Title", company: "Company Name", startDate: "", endDate: "", description: "Highlight your accomplishments, using numbers if possible." }];
  renderedExperience.slice(0, 3).forEach((item) => {
    doc.setTextColor(160, 170, 178);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.text(item.role || "Title", centerX, centerY);
    doc.setTextColor(124, 195, 173);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);
    doc.text(item.company || "Company Name", centerX, centerY + 4);
    doc.setTextColor(190, 196, 201);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.text(formatDateRange(item.startDate, item.endDate), centerX, centerY + 8);
    doc.text(formData.personalInfo.location || "Location", centerX + 22, centerY + 8);
    const bullets = splitBulletLines(item.description);
    const bulletItems = bullets.length ? bullets : ["Highlight your accomplishments, using numbers if possible."];
    doc.setTextColor(180, 185, 190);
    doc.setFontSize(6.6);
    bulletItems.slice(0, 3).forEach((bullet) => {
      doc.text("-", centerX, centerY + 12);
      centerY = drawWrappedText(doc, bullet, centerX + 3, centerY + 12, centerWidth - 3, 3.2);
    });
    centerY += 4;
  });

  rightY = drawColumnTitle("EDUCATION", rightX, rightY, rightWidth);
  const renderedEducation = educationItems.length
    ? educationItems
    : [{ degree: "Degree / Program", institution: "Institution Name", fieldOfStudy: "", startDate: "", endDate: "" }];
  renderedEducation.slice(0, 1).forEach((item) => {
    doc.setTextColor(40, 54, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.text(item.degree || "Degree / Program", rightX, rightY);
    doc.setTextColor(124, 195, 173);
    doc.setFontSize(7.8);
    rightY = drawWrappedText(doc, item.institution || "Institution Name", rightX, rightY + 4, rightWidth, 3.6);
    doc.setTextColor(160, 170, 178);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.text(formatDateRange(item.startDate, item.endDate), rightX, rightY + 1);
    rightY += 6;
  });

  rightY = drawColumnTitle("SKILLS", rightX, rightY, rightWidth);
  const skills = filterFilled(formData.skills);
  const skillItems = skills.length ? skills : ["Skill One", "Skill Two", "Skill Three", "Skill Four", "Skill Five", "Skill Six"];
  let skillX = rightX;
  let skillY = rightY + 1;
  skillItems.slice(0, 8).forEach((skill, index) => {
    if (index > 0 && index % 2 === 0) {
      skillY += 7;
      skillX = rightX;
    }
    doc.setTextColor(25, 92, 81);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text(skill, skillX, skillY);
    const width = Math.min(doc.getTextWidth(skill) + 1, 18);
    doc.setDrawColor(160, 170, 178);
    doc.setLineWidth(0.2);
    doc.line(skillX, skillY + 1.2, skillX + width, skillY + 1.2);
    skillX += 21;
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
  experience: "experience",
  work_experience: "experience",
  education: "education",
  skills: "skills",
  projects: "projects",
  certifications: "certifications",
  achievements: "achievements",
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

  return titleLike || "Professional Title";
};

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[,|/]/))
        .map((skill) => skill.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 14);

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
  /(python|java|javascript|typescript|react|node(?:\.js)?|express|mongodb|mysql|sql|postgres(?:ql)?|aws|azure|gcp|docker|kubernetes|linux|git|github|html|css|tailwind|bootstrap|c\+\+|c#|java|spring|django|flask|machine learning|data structures|algorithms|oop|dbms|siem|vapt|soc|incident response|digital forensics|wireshark|burp suite|nmap|metasploit|threat intelligence|malware analysis|api|rest|rest api|cloud security|network security|cybersecurity)/i;

const isLikelyName = (value = "") =>
  /^[A-Za-z]+(?:[.\s'-][A-Za-z]+){1,4}$/.test(String(value).trim()) &&
  !/(summary|experience|education|skills|projects|certifications|achievements|contact|technical|resume)/i.test(
    String(value),
  );

const sanitizeSkillItems = (skills = [], personalInfo = {}) => {
  const forbiddenTokens = new Set(
    [
      personalInfo.fullName,
      personalInfo.name,
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.title,
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

  const customSections = Array.isArray(optimizedResume.customSections)
    ? optimizedResume.customSections
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

  return {
    ...optimizedResume,
    personalInfo: {
      ...personalInfo,
      fullName: cleanedFullName || "Optimized Resume",
      name: cleanedFullName || "Optimized Resume",
    },
    skills: mergedSkills,
    customSections: filteredCustomSections,
  };
};

export async function exportResumePdf(formData) {
  const doc = new jsPDF();
  const template = normalizeTemplateId(formData.template);
  const config = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.contemporary;

  renderTemplatePdf(doc, formData, config);
  doc.save(getResumeFileName(formData, template));
}

export function exportOptimizedUploadPdf(
  fileName,
  headline,
  optimizedResumeText,
  optimizedResumeData = null,
) {
  const safeName = (fileName || "optimized_resume").replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  const chosenTemplate = "single-column";
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
  const config = TEMPLATE_CONFIG[chosenTemplate];

  renderTemplatePdf(doc, { ...optimizedResume, template: chosenTemplate }, config);
  doc.save(`${safeName}_ATS_Optimized_${chosenTemplate}.pdf`);
}
