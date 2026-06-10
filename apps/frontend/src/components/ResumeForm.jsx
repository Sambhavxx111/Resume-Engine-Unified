import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Loader from "./Loader";
import { flattenSkillCategories, normalizeSkillCategories } from "../utils/skills";

const blankEducation = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  location: "",
  score: "",
};

const blankExperience = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  description: "",
};

const blankProject = {
  name: "",
  description: "",
  bullets: [""],
};

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
  socs: "socs-official",
};

const normalizeTemplateId = (templateId) => TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const TEMPLATE_OPTIONS = [
  {
    id: "socs-official",
    name: "SOCS Official",
    blurb: "The official SOCS placement resume format: Calibri, ATS-safe, single-column, and print-ready.",
    accent: "from-slate-200/70 to-white",
    recommended: true,
  },
  {
    id: "enhancv-replica",
    name: "Signature Timeline",
    blurb: "A polished statement layout with a crisp top banner, editorial spacing, and premium ATS-safe rhythm.",
    accent: "from-orange-200/35 to-blue-300/20",
    recommended: true,
  },
  {
    id: "enhancv-columns",
    name: "Emerald Columns",
    blurb: "A refined multi-column resume with elegant structure, balanced density, and strong recruiter readability.",
    accent: "from-emerald-200/35 to-slate-300/20",
    recommended: true,
    locked: true,
  },
  {
    id: "contemporary",
    name: "Modern Arc",
    blurb: "A crisp premium layout with modern hierarchy, clean whitespace, and ATS-safe structure.",
    accent: "from-cyan-300/30 to-blue-500/20",
  },
  {
    id: "timeline",
    name: "Career Flow",
    blurb: "A progression-first resume design that highlights growth, promotions, and milestones clearly.",
    accent: "from-slate-100/40 to-cyan-200/15",
  },
  {
    id: "compact",
    name: "Impact Grid",
    blurb: "A dense but highly readable one-page format built for content-rich resumes and fast scans.",
    accent: "from-cyan-200/30 to-slate-200/20",
  },
  {
    id: "single-column",
    name: "Linear Luxe",
    blurb: "A focused linear layout that feels elegant, recruiter-friendly, and reliable for ATS parsing.",
    accent: "from-slate-200/60 to-stone-300/30",
  },
  {
    id: "creative",
    name: "Studio Slate",
    blurb: "A more expressive premium look with standout accents while staying printable and ATS-conscious.",
    accent: "from-cyan-300/30 to-sky-200/20",
  },
];

const formatMonthYear = (value) => {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year) return "";
  if (!month) return year;
  return `${month.padStart(2, "0")}/${year}`;
};

const formatDateRange = (startDate, endDate) => {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
};

const EDUCATION_MONTH_PATTERN = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const EDUCATION_DATE_TOKEN_PATTERN = `${EDUCATION_MONTH_PATTERN}\\s*,?\\s*\\d{2,4}|\\d{4}`;
const EDUCATION_CURRENT_TOKEN_PATTERN = "(?:present|current|till\\s*date|till\\s*now|ongoing)";
const EDUCATION_DATE_RANGE_PATTERN = new RegExp(
  `(${EDUCATION_DATE_TOKEN_PATTERN})\\s*(?:to|-|until|through|[–—])\\s*(${EDUCATION_CURRENT_TOKEN_PATTERN}|${EDUCATION_DATE_TOKEN_PATTERN})`,
  "i",
);

const normalizeEducationDateText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .replace(/â€“|â€”|Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/\btilldate\b/gi, "Till date")
    .trim();

const extractEducationDateRangeFromText = (value = "") => {
  const cleaned = normalizeEducationDateText(value);
  const match = cleaned.match(EDUCATION_DATE_RANGE_PATTERN);
  return match ? `${match[1].trim()} - ${match[2].trim()}` : "";
};

const getEducationDateDisplay = (item = {}) =>
  formatDateRange(item.startDate, item.endDate) ||
  extractEducationDateRangeFromText([
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

const renderPortfolioPreviewLink = (portfolio, className = "break-all") =>
  portfolio ? (
    <a
      className={`${className} underline underline-offset-2`}
      href={normalizeExternalHref(portfolio)}
      target="_blank"
      rel="noreferrer"
    >
      LinkedIn
    </a>
  ) : (
    <span className={className}>LinkedIn / Portfolio</span>
  );

const stripProtocol = (value = "") =>
  String(value || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");

const renderSocsContactLink = (value, fallback, className = "break-all") => {
  const label = stripProtocol(value);
  return label ? (
    <a className={`${className} underline underline-offset-2`} href={normalizeExternalHref(value)} target="_blank" rel="noreferrer">
      {label}
    </a>
  ) : (
    <span className={className}>{fallback}</span>
  );
};

const TrashIcon = ({ className = "h-5 w-5" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M8 6V4.75A1.75 1.75 0 0 1 9.75 3h4.5A1.75 1.75 0 0 1 16 4.75V6" />
    <path d="M6.75 6l.7 11.14A2 2 0 0 0 9.44 19h5.12a2 2 0 0 0 1.99-1.86L17.25 6" />
    <path d="M10 10.25v5.5" />
    <path d="M14 10.25v5.5" />
  </svg>
);

const RemoveIconButton = ({
  onClick,
  disabled = false,
  label = "Remove",
  className = "text-slate-400 transition hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-35",
}) => (
  <button
    type="button"
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 ${className}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
  >
    <TrashIcon />
  </button>
);

const InlineRemoveButton = ({ onClick, label = "Remove" }) => (
  <button
    type="button"
    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base font-semibold leading-none text-slate-400 opacity-55 transition hover:bg-rose-50 hover:text-rose-500 hover:opacity-100 focus:opacity-100"
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    ×
  </button>
);

const hasEducationContent = (item = {}) =>
  Boolean(
    item.institution ||
      item.degree ||
      item.fieldOfStudy ||
      item.location ||
      item.score ||
      item.startDate ||
      item.endDate,
  );

const getEducationMetaItems = (item = {}) =>
  [formatDateRange(item.startDate, item.endDate), item.location, item.score]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const getProjectBullets = (project = {}) =>
  (Array.isArray(project.bullets) ? project.bullets : splitLines(project.description || ""))
    .flatMap((item) => splitLines(item))
    .filter(Boolean);

const hasProjectContent = (project = {}) =>
  Boolean(String(project.name || "").trim() || getProjectBullets(project).length);

const splitLines = (value = "") =>
  String(value)
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

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

const formatProjectDetailsEditorValue = (project = {}) => {
  const rawDescription = String(project.description || "");
  if (rawDescription.trim()) {
    return rawDescription;
  }

  const bullets = getProjectBullets(project);
  return bullets.length ? bullets.map((bullet) => `- ${bullet}`).join("\n") : "";
};

const RENDER_SKILL_REJECTION_PATTERN =
  /@|\d{4}|^\d+(?:\.\d+)?$|%|university|college|school|academy|institute|vidyapeeth|certificate|certification|bachelor|master|dehradun|alwar|pilani|india|june|july|august|september|october|november|december|january|february|march|april|may|intern|manager|services private limited|ngo|linkedin|github/i;

const sanitizeRenderedSkills = (skills = []) =>
  Array.from(
    new Set(
      flattenSkillCategories(skills)
        .map((skill) => String(skill || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .filter((skill) => skill.length <= 80)
        .filter((skill) => /[A-Za-z]/.test(skill))
        .filter((skill) => !RENDER_SKILL_REJECTION_PATTERN.test(skill))
        .filter((skill) => skill.split(/\s+/).length <= 8)
        .filter((skill) => !(/[.!?]/.test(skill) && skill.split(/\s+/).length > 5)),
    ),
  );

const sanitizeRenderedSkillCategories = (skills = []) =>
  normalizeSkillCategories(skills)
    .map((group) => ({
      category: String(group.category || "Skills").replace(/\s+/g, " ").trim() || "Skills",
      items: sanitizeRenderedSkills(group.items),
    }))
    .filter((group) => group.items.length);

const renderSkillCategoryGroups = (skillCategories, templateStyle = {}, options = {}) => {
  const {
    categoryClassName = "text-[11.4px] font-bold uppercase tracking-[0.12em] text-slate-700 opacity-95",
    wrapperClassName = "mt-3 space-y-3.5",
    itemWrapperClassName,
    itemClassName = "",
    emptyClassName = "text-slate-500",
  } = options;
  const gapClassName = itemWrapperClassName || `flex flex-wrap ${templateStyle.skillGap || "gap-2"}`;

  if (!skillCategories.length) {
    return <p className={emptyClassName}>Add skills to populate the preview.</p>;
  }

  return (
    <div className={wrapperClassName}>
      {skillCategories.map((group, groupIndex) => (
        <div key={`skill-category-${group.category}-${groupIndex}`} className="min-w-0 max-w-full break-inside-avoid">
          <p className={categoryClassName}>{group.category}</p>
          <div className={`mt-2 min-w-0 max-w-full ${gapClassName}`}>
            {group.items.map((skill, skillIndex) => (
              <span
                key={`${group.category}-${skill}-preview-${skillIndex}`}
                className={`${templateStyle.skill || ""} ${itemClassName} min-w-0 max-w-full break-words whitespace-normal [overflow-wrap:anywhere]`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TemplateThumbnail = ({ templateId }) => {
  const normalizedTemplateId = normalizeTemplateId(templateId);

  if (normalizedTemplateId === "contemporary") {
    return (
      <div className="grid h-16 grid-cols-[0.72fr_0.28fr] overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-16 rounded-full bg-slate-800" />
          <div className="h-2 w-10 rounded-full bg-cyan-400" />
          <div className="pt-1 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-5/6 rounded-full bg-slate-100" />
            <div className="h-2 w-4/6 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="flex items-start justify-end p-2.5">
          <div className="h-6 w-6 rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "timeline") {
    return (
      <div className="grid h-16 grid-cols-[0.18fr_0.82fr] overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="relative bg-slate-50">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-200" />
          <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400" />
          <div className="absolute left-1/2 top-7 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300" />
          <div className="absolute left-1/2 top-11 h-2 w-2 -translate-x-1/2 rounded-full bg-slate-300" />
        </div>
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-14 rounded-full bg-slate-800" />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="h-2 w-10 rounded-full bg-slate-200" />
            <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="h-2 w-8 rounded-full bg-slate-200" />
            <div className="mt-1.5 h-2 w-5/6 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "compact") {
    return (
      <div className="grid h-16 grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-14 rounded-full bg-slate-800" />
          <div className="h-2 w-9 rounded-full bg-cyan-400" />
          <div className="pt-1 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-5/6 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-12 rounded-full bg-slate-300" />
          <div className="h-2 w-full rounded-full bg-slate-100" />
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div className="h-3 rounded-md bg-cyan-50" />
            <div className="h-3 rounded-md bg-cyan-50" />
            <div className="h-3 rounded-md bg-cyan-50" />
            <div className="h-3 rounded-md bg-cyan-50" />
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "single-column") {
    return (
      <div className="h-16 overflow-hidden rounded-2xl border border-white/10 bg-white p-2.5">
        <div className="mx-auto h-2 w-20 rounded-full bg-slate-800" />
        <div className="mx-auto mt-2 h-2 w-12 rounded-full bg-slate-300" />
        <div className="pt-3 space-y-1.5">
          <div className="h-px w-full bg-slate-300" />
          <div className="h-2 w-full rounded-full bg-slate-100" />
          <div className="h-2 w-5/6 rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "creative") {
    return (
      <div className="grid h-16 grid-cols-[0.34fr_0.66fr] overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="bg-slate-900" />
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-16 rounded-full bg-cyan-200" />
          <div className="h-2 w-20 rounded-full bg-slate-300" />
          <div className="h-2 w-full rounded-full bg-slate-100" />
          <div className="h-2 w-5/6 rounded-full bg-slate-100" />
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-full rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "enhancv-replica") {
    return (
      <div className="grid h-16 grid-cols-[0.26fr_0.74fr] overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="border-r border-slate-200 bg-white px-2 py-2">
          <div className="h-3 w-16 rounded-full bg-blue-900" />
          <div className="mt-2 h-2 w-12 rounded-full bg-orange-400" />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="space-y-1 px-2.5 py-2">
          <div className="grid grid-cols-[0.24fr_0.06fr_0.7fr] gap-2">
            <div className="space-y-1">
              <div className="h-1.5 w-10 rounded-full bg-blue-200" />
              <div className="h-1.5 w-8 rounded-full bg-slate-100" />
            </div>
            <div className="relative">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-300" />
              <div className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" />
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-8 rounded-full bg-slate-300" />
              <div className="h-2 w-16 rounded-full bg-orange-300" />
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "enhancv-columns") {
    return (
      <div className="grid h-16 grid-cols-[0.56fr_0.26fr_0.18fr] overflow-hidden rounded-2xl border border-white/10 bg-white">
        <div className="border-r border-slate-200 px-2.5 py-2">
          <div className="h-3 w-16 rounded-full bg-emerald-900" />
          <div className="mt-1.5 h-2 w-11 rounded-full bg-emerald-400" />
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
            <div className="h-1.5 w-4/6 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="border-r border-slate-200 px-2 py-2">
          <div className="h-1.5 w-10 rounded-full bg-emerald-900" />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-7 rounded-full bg-slate-300" />
            <div className="h-2 w-12 rounded-full bg-emerald-200" />
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="px-2 py-2">
          <div className="mx-auto h-6 w-6 rounded-full border-2 border-slate-300" />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTemplateId === "socs-official") {
    return (
      <div className="h-16 overflow-hidden rounded-2xl border border-white/10 bg-white px-3 py-2 font-sans">
        <div className="mx-auto h-2.5 w-20 rounded-full bg-slate-900" />
        <div className="mx-auto mt-1.5 h-1.5 w-28 rounded-full bg-slate-300" />
        <div className="mt-3 space-y-1">
          <div className="h-1.5 w-24 rounded-full bg-slate-900" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
          <div className="h-1.5 w-20 rounded-full bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 rounded-2xl border border-white/10 bg-white p-3">
      <div className="h-2 w-20 rounded-full bg-slate-800" />
      <div
        className={`mt-2 h-2 w-14 rounded-full bg-gradient-to-r ${
          normalizedTemplateId === "single-column"
            ? "from-stone-400 to-slate-300"
            : "from-cyan-300 to-blue-400"
        }`}
      />
      <div
        className={`mt-3 h-px w-full ${
          normalizedTemplateId === "single-column" ? "bg-slate-900" : "bg-slate-200"
        }`}
      />
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100" />
      <div className="mt-2 h-2 w-5/6 rounded-full bg-slate-100" />
      {normalizedTemplateId === "compact" ? (
        <div className="mt-3 flex gap-2">
          <div className="h-3 w-10 rounded-full bg-cyan-50" />
          <div className="h-3 w-10 rounded-full bg-cyan-50" />
        </div>
      ) : null}
    </div>
  );
};

const templatePreviewClasses = {
  contemporary: {
    layout: "standard",
    shell: "border-slate-200 bg-white",
    header: "border-b border-slate-200 pb-5",
    name: "text-[2.15rem] font-bold tracking-tight text-slate-900",
    title: "mt-1.5 text-lg font-semibold text-cyan-800",
    sectionTitle: "text-[13px] font-bold uppercase tracking-[0.22em] text-slate-700",
    skill: "text-[13px] font-medium text-slate-800",
    skillGap: "gap-4",
  },
  "single-column": {
    layout: "single-column",
    shell: "border-slate-300 bg-white",
    header: "border-b-2 border-slate-900 pb-4",
    name: "text-[2.15rem] font-serif font-bold tracking-tight text-slate-900",
    title: "mt-1.5 text-[15px] font-semibold uppercase tracking-[0.14em] text-slate-700",
    sectionTitle: "text-[15px] font-bold uppercase tracking-[0.18em] text-slate-800",
    skill: "rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-800",
  },
  compact: {
    layout: "compact",
    shell: "border-slate-200 bg-white",
    header: "border-b border-slate-300 pb-4",
    name: "text-[2.15rem] font-black tracking-[0.03em] text-slate-900",
    title: "mt-1.5 text-[15px] font-semibold text-slate-700",
    sectionTitle: "text-[12px] font-black uppercase tracking-[0.24em] text-slate-800",
    skill: "rounded-full bg-cyan-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-cyan-900",
  },
  creative: {
    layout: "creative",
    shell: "border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50/50",
    header: "border-b border-cyan-100 pb-5",
    name: "text-[2.1rem] font-bold tracking-tight text-slate-900",
    title: "mt-1.5 text-lg font-semibold text-cyan-900",
    sectionTitle: "text-[13px] font-bold uppercase tracking-[0.24em] text-cyan-900",
    skill: "rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-900",
  },
  timeline: {
    layout: "timeline",
    shell: "border-slate-200 bg-slate-50",
    header: "border-b border-slate-300 pb-5",
    name: "text-[2.1rem] font-semibold tracking-tight text-slate-950",
    title: "mt-1.5 text-[15px] font-semibold uppercase tracking-[0.16em] text-slate-700",
    sectionTitle: "text-[13px] font-semibold uppercase tracking-[0.22em] text-cyan-800",
    skill: "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-800",
  },
  "enhancv-replica": {
    layout: "enhancv-replica",
    shell: "border-slate-300 bg-white",
    header: "border-b border-slate-200 pb-3",
    name: "text-[2.2rem] font-black tracking-[0.02em] text-blue-950",
    title: "mt-1.5 text-[17px] font-bold text-orange-600",
    sectionTitle: "text-[15px] font-black uppercase tracking-[0.02em] text-blue-950",
    skill: "border-b border-slate-500 pb-1.5 text-[13px] font-semibold text-slate-700",
  },
  "enhancv-columns": {
    layout: "enhancv-columns",
    shell: "border-slate-300 bg-white",
    header: "border-b border-slate-200 pb-3",
    name: "text-[2.15rem] font-black tracking-[0.01em] text-emerald-950",
    title: "mt-1 text-[16px] font-bold text-emerald-700",
    sectionTitle: "text-[13px] font-black uppercase tracking-[0.01em] text-emerald-950",
    skill: "border-b border-slate-500 pb-1.5 text-[12px] font-semibold text-emerald-950",
  },
  "socs-official": {
    layout: "socs-official",
    shell: "border-slate-300 bg-white",
    header: "",
    name: "text-[18.7px] font-bold leading-[1.12] text-black",
    title: "",
    sectionTitle: "text-[16px] font-bold leading-[1.15] text-black",
    skill: "",
  },
};

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

const getSocsSectionItems = (customSections = [], pattern) =>
  (customSections || [])
    .filter((section) => pattern.test(String(section?.title || "")))
    .flatMap((section) => splitCustomSectionItems(section.items || []));

const getSocsOtherCustomSections = (customSections = []) =>
  (customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: splitCustomSectionItems(section?.items || []),
    }))
    .filter((section) => section.title || section.items.length)
    .filter((section) => !/(research|publication|paper|journal|conference|certification|certificate|course|accomplishment|leadership|activity|activities|achievement|award)/i.test(section.title));

const compareByEndDateDesc = (a = {}, b = {}) =>
  String(b.endDate || b.startDate || "").localeCompare(String(a.endDate || a.startDate || ""));

const getSocsSkillGroups = (skills = []) => {
  const groups = sanitizeRenderedSkillCategories(skills);
  if (!groups.length) return [];

  return groups.map((group) => {
    const category = String(group.category || "").trim();
    if (/^skills?$/i.test(category)) {
      return { ...group, category: "Programming/Scripting Languages" };
    }
    if (/programming|language/i.test(category)) return { ...group, category: "Programming/Scripting Languages" };
    if (/database/i.test(category)) return { ...group, category: "Databases" };
    if (/framework/i.test(category)) return { ...group, category: "Frameworks" };
    if (/tool|platform|other/i.test(category)) return { ...group, category: "Tools" };
    if (/operating|os\b/i.test(category)) return { ...group, category: "Operating Systems" };
    return group;
  });
};

const getPreviewSections = (formData) => {
  const renderedSkillCategories = sanitizeRenderedSkillCategories(formData.skills);

  return [
  {
    key: "summary",
    title: "Summary",
    render: () => (
      <p className="mt-2 text-slate-700">
        {formData.summary || "Your professional summary will appear here as you write or generate it."}
      </p>
    ),
  },
  {
    key: "skills",
    title: "Skills",
    render: (templateStyle) => renderSkillCategoryGroups(renderedSkillCategories, templateStyle),
  },
  {
    key: "experience",
    title: "Experience",
    render: () => (
      <div className="mt-2 space-y-4">
        {formData.experience.filter((item) => item.company || item.role || item.description).length ? (
          formData.experience
            .filter((item) => item.company || item.role || item.description)
            .map((item, index) => (
              <div key={`experience-preview-${index}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.role || "Role"} {item.company ? `at ${item.company}` : ""}
                    </p>
                    {([item.startDate, item.endDate].filter(Boolean).length ? (
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                      </p>
                    ) : null)}
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {(splitLines(item.description).length ? splitLines(item.description) : [item.description || "Impact and achievements will appear here."]).map((line, lineIndex) => (
                    <p key={`experience-line-${index}-${lineIndex}`} className="text-slate-700">
                      - {line}
                    </p>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <p className="text-slate-500">Add experience entries to build your preview.</p>
        )}
      </div>
    ),
  },
  {
    key: "education",
    title: "Education",
    render: () => (
      <div className="mt-2 space-y-3">
        {formData.education.filter(hasEducationContent).length ? (
          formData.education
            .filter(hasEducationContent)
            .map((item, index) => {
              const educationMetaItems = getEducationMetaItems(item);
              const educationTitle = item.degree || item.institution || "Education";
              const showInstitution = item.institution && item.institution !== educationTitle;

              return (
                <div key={`education-preview-${index}`}>
                  <p className="font-semibold text-slate-900">
                    {educationTitle}
                    {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}
                  </p>
                  {showInstitution ? <p className="text-slate-700">{item.institution}</p> : null}
                  {educationMetaItems.length ? (
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {educationMetaItems.join(" | ")}
                    </p>
                  ) : null}
                </div>
              );
            })
        ) : (
          <p className="text-slate-500">Add education details to complete the preview.</p>
        )}
      </div>
    ),
  },
  {
    key: "projects",
    title: "Projects",
    render: () => (
      <div className="mt-2 space-y-4">
        {(formData.projects || []).filter(hasProjectContent).length ? (
          (formData.projects || [])
            .filter(hasProjectContent)
            .map((project, index) => {
              const bullets = getProjectBullets(project);

              return (
                <div key={`project-preview-${index}`}>
                  <p className="font-semibold text-slate-900">
                    {project.name || `Project ${index + 1}`}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {bullets.length ? (
                      bullets.map((bullet, bulletIndex) => (
                        <p key={`project-preview-bullet-${index}-${bulletIndex}`} className="text-slate-700">
                          - {bullet}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500">Add project details as bullet points.</p>
                    )}
                  </div>
                </div>
              );
            })
        ) : (
          <p className="text-slate-500">Add projects to highlight practical work.</p>
        )}
      </div>
    ),
  },
  ...((formData.customSections || [])
    .filter((section) => section.title || section.items.some((item) => item.trim()))
    .map((section, sectionIndex) => ({
      key: `custom-${sectionIndex}`,
      sortKey: getCustomSectionSortKey(section.title),
      title: section.title || "Custom Section",
      render: () => (
        <div className="mt-2 space-y-2">
          {section.items.filter((item) => item.trim()).length ? (
            section.items
              .filter((item) => item.trim())
              .map((item, itemIndex) => (
                <p key={`preview-custom-item-${sectionIndex}-${itemIndex}`} className="text-slate-700">
                  - {item}
                </p>
              ))
          ) : (
            <p className="text-slate-500">Add items to populate this section.</p>
          )}
        </div>
      ),
    })) || []),
];
};

function ResumeForm({
  formData,
  setFormData,
  onSave,
  onSaveHardCopy,
  onSaveDraft,
  onAIAction,
  onImportResume,
  onBeginFromScratch,
  onDiscardResume,
  onImportFileChange,
  importFile,
  importLoading,
  saveAction,
  aiLoading,
  error,
  successMessage,
  exportError,
  summaryUpdateSuccess,
  aiInsights,
  resumePhoto,
  onPhotoUpload,
  onPhotoRemove,
  onPhotoPlacementChange,
  onPhotoCropChange,
  onPhotoZoomChange,
  onPhotoFrameScaleChange,
  previewRef,
}) {
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);
  const [activeSkillInput, setActiveSkillInput] = useState(null);
  const aiInsightsRef = useRef(null);
  const aiScrollPendingActionRef = useRef("");
  const previewCanvasRef = useRef(null);
  const photoDragRef = useRef(null);
  const photoImageRef = useRef(null);
  const editorSectionRef = useRef(null);
  const templatePickerTimeoutRef = useRef(null);
  const templatePickerCloseTimeoutRef = useRef(null);

  const isPersistentAiInsightsPanel =
    aiInsights?.title === "Suggested Skills" || aiInsights?.title === "Optimization Suggestions";
  const shouldShowAiLoadingCard = aiLoading === "optimize" || aiLoading === "skills";
  const showAiInsightsPanel = isPersistentAiInsightsPanel || shouldShowAiLoadingCard;
  const aiInsightsTitle = shouldShowAiLoadingCard
    ? aiLoading === "optimize"
      ? "Optimization Suggestions"
      : "Suggested Skills"
    : aiInsights?.title;
  const draftSaveConfirmation = successMessage?.startsWith("Draft saved successfully");

  const scrollAiInsightsIntoView = () => {
    if (!aiInsightsRef.current || typeof window === "undefined") {
      return;
    }

    const headerOffset = 132;
    const elementTop = aiInsightsRef.current.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(elementTop - headerOffset, 0);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!shouldShowAiLoadingCard) {
      return;
    }

    aiScrollPendingActionRef.current = aiLoading;
    scrollAiInsightsIntoView();
  }, [aiLoading, shouldShowAiLoadingCard]);

  useEffect(() => {
    if (!aiScrollPendingActionRef.current || aiLoading) {
      return;
    }

    const expectedTitle =
      aiScrollPendingActionRef.current === "optimize"
        ? "Optimization Suggestions"
        : aiScrollPendingActionRef.current === "skills"
          ? "Suggested Skills"
          : "";

    if (!expectedTitle || aiInsights?.title !== expectedTitle) {
      return;
    }

    scrollAiInsightsIntoView();
    aiScrollPendingActionRef.current = "";
  }, [aiInsights, aiLoading]);

  useEffect(() => {
    if (!activeSkillInput || typeof document === "undefined") {
      return;
    }

    const selector = `[data-skill-input="${activeSkillInput.categoryIndex}-${activeSkillInput.skillIndex}"]`;
    const input = document.querySelector(selector);
    if (!input) {
      return;
    }

    input.focus();
  }, [activeSkillInput]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (!isTemplatePickerOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsTemplatePickerVisible(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    templatePickerTimeoutRef.current = window.setTimeout(() => {
      setIsTemplatePickerVisible(true);
    }, 10);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (templatePickerTimeoutRef.current) {
        window.clearTimeout(templatePickerTimeoutRef.current);
        templatePickerTimeoutRef.current = null;
      }
    };
  }, [isTemplatePickerOpen]);

  useEffect(() => {
    if (!isTemplatePickerOpen || isTemplatePickerVisible) {
      return undefined;
    }

    templatePickerCloseTimeoutRef.current = window.setTimeout(() => {
      setIsTemplatePickerOpen(false);
    }, 220);

    return () => {
      if (templatePickerCloseTimeoutRef.current) {
        window.clearTimeout(templatePickerCloseTimeoutRef.current);
        templatePickerCloseTimeoutRef.current = null;
      }
    };
  }, [isTemplatePickerOpen, isTemplatePickerVisible]);

  const openTemplatePicker = () => {
    if (templatePickerCloseTimeoutRef.current) {
      window.clearTimeout(templatePickerCloseTimeoutRef.current);
      templatePickerCloseTimeoutRef.current = null;
    }
    if (isTemplatePickerOpen) {
      setIsTemplatePickerVisible(true);
      return;
    }
    setIsTemplatePickerOpen(true);
    setIsTemplatePickerVisible(false);
  };

  const closeTemplatePicker = () => {
    setIsTemplatePickerVisible(false);
  };

  const updatePersonalInfo = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value,
      },
    }));
  };

  const updateCollectionItem = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addCollectionItem = (section, template) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], template],
    }));
  };

  const removeCollectionItem = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), blankProject],
    }));
  };

  const updateProject = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects?.length ? prev.projects : [blankProject]).map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project,
      ),
    }));
  };

  const updateProjectDetails = (projectIndex, value) => {
    const bullets = splitLines(value);

    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects?.length ? prev.projects : [blankProject]).map((project, currentProjectIndex) =>
        currentProjectIndex === projectIndex
          ? {
              ...project,
              description: value,
              bullets: bullets.length ? bullets : [""],
            }
          : project,
      ),
    }));
  };

  const scrollEditorIntoView = () => {
    if (!editorSectionRef.current || typeof window === "undefined") {
      return;
    }

    const headerOffset = 132;
    const elementTop = editorSectionRef.current.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(elementTop - headerOffset, 0);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  const handleBeginFromScratchClick = () => {
    onBeginFromScratch?.();
    requestAnimationFrame(() => {
      scrollEditorIntoView();
    });
  };

  const handleProjectDetailsKeyDown = (projectIndex, event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const el = event.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const prefix = value ? "\n- " : "- ";
    const nextValue =
      value.slice(0, selectionStart) + prefix + value.slice(selectionEnd);

    updateProjectDetails(projectIndex, nextValue);

    requestAnimationFrame(() => {
      if (!el) {
        return;
      }
      el.selectionStart = selectionStart + prefix.length;
      el.selectionEnd = selectionStart + prefix.length;
    });
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, projectIndex) => projectIndex !== index),
    }));
  };

  const withEditableSkillCategories = (skills = []) => {
    if (!Array.isArray(skills) || !skills.length) {
      return [];
    }

    const hasCategoryObjects = skills.some((skill) => skill && typeof skill === "object" && !Array.isArray(skill));
    if (!hasCategoryObjects) {
      return normalizeSkillCategories(skills).map((group) => ({
        category: group.category,
        items: group.items,
      }));
    }

    return skills.flatMap((group) => {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        return [];
      }

      const rawCategory = group.category ?? group.name ?? group.title ?? "";
      const rawItems = Array.isArray(group.items)
        ? group.items
        : Array.isArray(group.skills)
          ? group.skills
          : Array.isArray(group.values)
            ? group.values
            : [];
      const hasGenericCategory = /^skills?$/i.test(String(rawCategory || "").trim());
      const hasMeaningfulItems = rawItems.filter((item) => String(item || "").trim()).length > 1;

      if (hasGenericCategory && hasMeaningfulItems) {
        return normalizeSkillCategories([{ category: rawCategory, items: rawItems }]).map((normalizedGroup) => ({
          category: normalizedGroup.category,
          items: normalizedGroup.items,
        }));
      }

      return [{
        category: String(rawCategory ?? ""),
        items: rawItems.map((item) => String(item ?? "")),
      }];
    });
  };

  const addSkillCategory = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...withEditableSkillCategories(prev.skills),
        {
          category: "",
          items: [],
        },
      ],
    }));
  };

  const updateSkillCategory = (categoryIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      skills: withEditableSkillCategories(prev.skills).map((group, currentIndex) =>
        currentIndex === categoryIndex ? { ...group, category: value } : group,
      ),
    }));
  };

  const removeSkillCategory = (categoryIndex) => {
    setFormData((prev) => ({
      ...prev,
      skills: withEditableSkillCategories(prev.skills).filter((_, currentIndex) => currentIndex !== categoryIndex),
    }));
  };

  const addSkillToCategory = (categoryIndex) => {
    const nextSkillIndex = withEditableSkillCategories(formData.skills)[categoryIndex]?.items?.length || 0;
    setFormData((prev) => ({
      ...prev,
      skills: withEditableSkillCategories(prev.skills).map((group, currentIndex) =>
        currentIndex === categoryIndex ? { ...group, items: [...(group.items || []), ""] } : group,
      ),
    }));
    setActiveSkillInput({ categoryIndex, skillIndex: nextSkillIndex });
  };

  const updateSkillItem = (categoryIndex, skillIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      skills: withEditableSkillCategories(prev.skills).map((group, currentIndex) =>
        currentIndex === categoryIndex
          ? {
              ...group,
              items: (group.items || []).map((item, currentSkillIndex) =>
                currentSkillIndex === skillIndex ? value : item,
              ),
            }
          : group,
      ),
    }));
  };

  const removeSkillItem = (categoryIndex, skillIndex) => {
    setFormData((prev) => ({
      ...prev,
      skills: withEditableSkillCategories(prev.skills).map((group, currentIndex) =>
        currentIndex === categoryIndex
          ? {
              ...group,
              items: (group.items || []).filter((_, currentSkillIndex) => currentSkillIndex !== skillIndex),
            }
          : group,
      ),
    }));
  };

  const removeEmptySkillItem = (categoryIndex, skillIndex, value) => {
    if (String(value || "").trim()) {
      return;
    }

    removeSkillItem(categoryIndex, skillIndex);
    setActiveSkillInput(null);
  };

  const addCustomSection = () => {
    setFormData((prev) => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        {
          title: "",
          items: [""],
        },
      ],
    }));
  };

  const updateCustomSectionTitle = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, title: value } : section,
      ),
    }));
  };

  const updateCustomSectionItem = (sectionIndex, itemIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              items: section.items.map((item, currentItemIndex) =>
                currentItemIndex === itemIndex ? value : item,
              ),
            }
          : section,
      ),
    }));
  };

  const addCustomSectionItem = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? { ...section, items: [...section.items, ""] }
          : section,
      ),
    }));
  };

  const removeCustomSectionItem = (sectionIndex, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              items: section.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
            }
          : section,
      ),
    }));
  };

  const removeCustomSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((_, currentIndex) => currentIndex !== sectionIndex),
    }));
  };

  const previewName = formData.personalInfo.fullName || formData.personalInfo.name || "Your Name";
  const previewTitle = formData.personalInfo.title || "Professional Title";
  const renderedSkillCategories = useMemo(() => sanitizeRenderedSkillCategories(formData.skills), [formData.skills]);
  const editableSkillCategories = useMemo(
    () => withEditableSkillCategories(formData.skills),
    [formData.skills],
  );
  const normalizedTemplate = normalizeTemplateId(formData.template);
  const selectedTemplateOption =
    TEMPLATE_OPTIONS.find((template) => template.id === normalizedTemplate) || TEMPLATE_OPTIONS[0];
  const templateUsesBuiltInPhoto = ["creative", "enhancv-columns", "socs-official"].includes(normalizedTemplate);
  const templateStyle =
    templatePreviewClasses[normalizedTemplate] || templatePreviewClasses.contemporary;

  const filledExperience = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const filledEducation = (formData.education || []).filter(hasEducationContent);
  const filledProjects = (formData.projects || []).filter(hasProjectContent);
  const filledCustomSections = (formData.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length);

  const previewSections = useMemo(() => {
    const allSections = getPreviewSections(formData);
    const orderMap = {
      contemporary: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      "single-column": ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      compact: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      creative: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      timeline: ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      "enhancv-replica": ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      "enhancv-columns": ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "interests", "custom"],
      "socs-official": ["summary", "education", "skills", "experience", "projects", "research", "certifications", "achievements", "custom"],
    };

    const desiredOrder = orderMap[normalizedTemplate] || orderMap.contemporary;
    const weight = (sortKey) => {
      const resolvedKey = sortKey || "custom";
      const index = desiredOrder.indexOf(resolvedKey);
      return index === -1 ? desiredOrder.length + 1 : index;
    };

    return [...allSections].sort((a, b) => {
      const weightA = weight(a.sortKey || a.key);
      const weightB = weight(b.sortKey || b.key);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }, [formData, normalizedTemplate]);

  const skillsPreviewSection = previewSections.find((section) => section.key === "skills");
  const mainPreviewSections = previewSections.filter((section) => section.key !== "skills");
  const isPreviewSectionEmpty = (section) => {
    if (section.key === "summary") return !String(formData.summary || "").trim();
    if (section.key === "skills") return renderedSkillCategories.length === 0;
    if (section.key === "experience") return filledExperience.length === 0;
    if (section.key === "education") return filledEducation.length === 0;
    if (section.key === "projects") return filledProjects.length === 0;
    return false;
  };
  const creativeSidebarSectionKeys = ["summary", "education", "skills"];
  const creativeLeftSections = previewSections.filter((section) =>
    creativeSidebarSectionKeys.includes(section.key),
  );
  const creativeRightSections = previewSections.filter(
    (section) => !creativeSidebarSectionKeys.includes(section.key),
  );
  const creativeTemplateStyle = {
    ...templateStyle,
    skill: "rounded-md px-3 py-1.5 text-[12px] font-semibold text-cyan-950",
  };
  const photoCropX = clamp(resumePhoto?.crop?.x ?? 0.5, 0, 1);
  const photoCropY = clamp(resumePhoto?.crop?.y ?? 0.5, 0, 1);
  const photoZoom = clamp(resumePhoto?.zoom ?? 1, 1, 3.5);
  const photoFrameScale = clamp(resumePhoto?.frameScale ?? 1, 0.5, 1.4);
  const isSocsTemplate = normalizedTemplate === "socs-official";
  const socsEducation = [...filledEducation].sort(compareByEndDateDesc);
  const socsInternships = [...filledExperience].sort(compareByEndDateDesc);
  const socsSkillGroups = getSocsSkillGroups(formData.skills);
  const socsResearchItems = getSocsSectionItems(formData.customSections, /research|publication|paper|journal|conference/i);
  const socsCertificationItems = getSocsSectionItems(formData.customSections, /certification|certificate|course|accomplishment/i);
  const socsLeadershipItems = getSocsSectionItems(formData.customSections, /leadership|activity|activities|achievement|award/i);
  const socsOtherSections = getSocsOtherCustomSections(formData.customSections);
  const socsSummaryWords = String(formData.summary || "").trim().split(/\s+/).filter(Boolean).length;
  const socsPhoneLooksValid = !formData.personalInfo.phone || /^\+91\s?\d{10}$/.test(String(formData.personalInfo.phone).replace(/[-()]/g, "").trim());
  const socsLinkedInLooksValid = !formData.personalInfo.portfolio || /linkedin\.com\/in\/[A-Za-z0-9-]+\/?$/i.test(stripProtocol(formData.personalInfo.portfolio));
  const socsGithubLooksValid = !formData.personalInfo.github || /github\.com\/[A-Za-z0-9-]+\/?$/i.test(stripProtocol(formData.personalInfo.github));

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!photoDragRef.current || !previewCanvasRef.current || !photoImageRef.current) {
        return;
      }

      const previewRect = previewCanvasRef.current.getBoundingClientRect();
      const photoRect = photoImageRef.current.getBoundingClientRect();
      const maxLeft = Math.max(previewRect.width - photoRect.width, 0);
      const maxTop = Math.max(previewRect.height - photoRect.height, 0);
      const nextLeft = Math.min(
        Math.max(event.clientX - previewRect.left - photoDragRef.current.offsetX, 0),
        maxLeft,
      );
      const nextTop = Math.min(
        Math.max(event.clientY - previewRect.top - photoDragRef.current.offsetY, 0),
        maxTop,
      );

      onPhotoPlacementChange?.({
        x: maxLeft ? nextLeft / maxLeft : 0,
        y: maxTop ? nextTop / maxTop : 0,
      });
    };

    const handlePointerUp = () => {
      photoDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onPhotoPlacementChange]);

  const handlePhotoPointerDown = (event) => {
    if (!resumePhoto || templateUsesBuiltInPhoto || !photoImageRef.current) {
      return;
    }

    const photoRect = photoImageRef.current.getBoundingClientRect();
    photoDragRef.current = {
      offsetX: event.clientX - photoRect.left,
      offsetY: event.clientY - photoRect.top,
    };
  };

  const syncPreviewRef = (node) => {
    previewCanvasRef.current = node;
    if (previewRef && typeof previewRef === "object") {
      previewRef.current = node;
    }
  };

  const renderFloatingResumePhoto = () =>
    resumePhoto && !templateUsesBuiltInPhoto ? (
      <div
        ref={photoImageRef}
        className="absolute z-20 aspect-square cursor-grab overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-[0_18px_35px_rgba(15,23,42,0.2)] active:cursor-grabbing"
        style={{
          left: `${(resumePhoto.placement?.x ?? 0.72) * 100}%`,
          top: `${(resumePhoto.placement?.y ?? 0.06) * 100}%`,
          width: `clamp(${96 * photoFrameScale}px, ${19.5 * photoFrameScale}%, ${128 * photoFrameScale}px)`,
        }}
        onPointerDown={handlePhotoPointerDown}
      >
        <img
          src={resumePhoto.src}
          alt="Resume profile"
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${photoCropX * 100}% ${photoCropY * 100}%`,
            transform: `scale(${photoZoom})`,
            transformOrigin: `${photoCropX * 100}% ${photoCropY * 100}%`,
          }}
          draggable={false}
        />
      </div>
    ) : null;

  const renderSocsSection = (title, isEmpty, content, placeholder) => (
    <section data-resume-section-empty={isEmpty ? "true" : undefined} className="mt-[14px] first:mt-0">
      <h3 className="mb-[5px] text-[16px] font-bold leading-[1.15] text-black">{title}</h3>
      {isEmpty ? <p className="text-[13.3px] leading-[1.15] text-slate-500">{placeholder}</p> : content}
    </section>
  );

  const renderSocsBulletList = (items = []) => (
    <ul className="ml-[18px] list-disc space-y-[2px] pl-0">
      {items.map((item, index) => (
        <li key={`socs-bullet-${index}`} className="pl-[2px] text-[13.3px] leading-[1.15]">
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-8">
      <section className="glass-card panel-grid p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Resume Studio</p>
            <h2 className="section-title">Craft a resume that passes both people and bots</h2>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
            {error}
          </div>
        ) : null}

        {successMessage && !draftSaveConfirmation ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        {exportError ? (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-[0_10px_24px_rgba(250,179,8,0.08)]">
            {exportError}
          </div>
        ) : null}

        <button
          type="button"
          className="mb-8 flex w-full items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white/90 p-5 text-left shadow-[0_18px_45px_rgba(148,163,184,0.12)] transition hover:border-slate-300 hover:bg-slate-50"
          onClick={openTemplatePicker}
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Resume Template</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Select a template</h3>
            <p className="mt-2 text-sm text-slate-500">
              Current: <span className="font-medium text-slate-700">{selectedTemplateOption.name}</span>
            </p>
          </div>
          <div className={`w-[148px] shrink-0 rounded-[1.25rem] bg-gradient-to-br p-[1px] ${selectedTemplateOption.accent}`}>
            <TemplateThumbnail templateId={selectedTemplateOption.id} />
          </div>
        </button>

        <div className="mb-8 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-4 shadow-[0_20px_46px_rgba(148,163,184,0.12)]">
            <div className="flex h-full flex-col gap-4">
              <div className="max-w-lg">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Import Existing Resume</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Upload a resume and continue upgrading it here</h3>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white/90 p-3">
                <span className="block text-sm font-medium text-slate-600">Choose a resume file to import</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                  onChange={(event) => onImportFileChange(event.target.files?.[0] || null)}
                />
                {importFile ? (
                  <span className="mt-4 block text-sm text-slate-900">{importFile.name}</span>
                ) : (
                  <span className="mt-4 block text-sm text-slate-400">No file selected yet.</span>
                )}
              </div>
              <button
                type="button"
                className="mt-auto inline-flex w-full items-center justify-center rounded-[16px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_14px_24px_rgba(15,23,42,0.14)] transition hover:bg-slate-800 hover:!text-white"
                disabled={!importFile || importLoading}
                onClick={onImportResume}
              >
                {importLoading ? <Loader label="Importing your resume..." /> : importFile ? "Import Into Builder" : "Choose a Resume to Import"}
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Privacy: your resume is used only to parse content into this builder.
              </p>
              <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Import note: parsing may not be 100% accurate for every resume format. Please manually review the imported sections before saving or downloading.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-4 shadow-[0_20px_46px_rgba(148,163,184,0.12)]">
            <div className="flex h-full flex-col gap-4">
              <div className="max-w-lg">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Fresh Start</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Begin from scratch and write directly in the builder</h3>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white/90 p-3">
                <span className="block text-sm font-medium text-slate-600">Start with a clean editor</span>
                <div className="mt-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-sm leading-6 text-slate-500">
                  This will clear imported details, reset the live preview, and scroll you straight to the editor section.
                </div>
              </div>
              <button
                type="button"
                className="mt-auto inline-flex w-full items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_12px_22px_rgba(148,163,184,0.08)] transition hover:border-slate-300 hover:bg-slate-50"
                onClick={handleBeginFromScratchClick}
              >
                Begin from Scratch
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            ["1", "Import or start"],
            ["2", "Fill details"],
            ["3", "Review preview"],
            ["4", "Save or export"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-[18px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                {step}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div ref={editorSectionRef} className="grid gap-8 xl:h-[calc(100vh-9.5rem)] xl:min-h-[38rem] xl:grid-cols-[0.7fr_0.665fr_1.635fr] xl:items-stretch">
          <div className="space-y-8 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Personal Info</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" name="fullName" placeholder="Full name" value={formData.personalInfo.fullName} onChange={updatePersonalInfo} />
                <input className="field" name="title" placeholder="Professional title" value={formData.personalInfo.title} onChange={updatePersonalInfo} />
                <input className="field" name="email" placeholder="Email" type="email" value={formData.personalInfo.email} onChange={updatePersonalInfo} />
                <input className="field" name="phone" placeholder="Phone" value={formData.personalInfo.phone} onChange={updatePersonalInfo} />
                <input className="field" name="portfolio" placeholder="LinkedIn / Portfolio URL" value={formData.personalInfo.portfolio || ""} onChange={updatePersonalInfo} />
                <input className="field" name="github" placeholder="GitHub URL" value={formData.personalInfo.github || ""} onChange={updatePersonalInfo} />
                <input className="field md:col-span-2" name="location" placeholder="Location" value={formData.personalInfo.location} onChange={updatePersonalInfo} />
              </div>
              {isSocsTemplate ? (
                <div className="mt-4 space-y-1.5 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                  <p className={socsPhoneLooksValid ? "" : "font-semibold text-amber-700"}>SOCS phone format: +91 followed by 10 digits.</p>
                  <p className={socsLinkedInLooksValid ? "" : "font-semibold text-amber-700"}>LinkedIn should be shortened, e.g. linkedin.com/in/firstname-lastname.</p>
                  <p className={socsGithubLooksValid ? "" : "font-semibold text-amber-700"}>GitHub should be concise, e.g. github.com/firstname-lastname.</p>
                </div>
              ) : null}
            </div>


            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Education</h3>
                <button type="button" className="button-secondary" onClick={() => addCollectionItem("education", blankEducation)}>
                  Add Education
                </button>
              </div>
              <div className="space-y-4">
                {formData.education.map((item, index) => (
                  <div key={`education-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Entry {index + 1}</p>
                      <RemoveIconButton onClick={() => removeCollectionItem("education", index)} label={`Remove education entry ${index + 1}`} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="field md:col-span-2" placeholder="Institution / School / University" value={item.institution} onChange={(event) => updateCollectionItem("education", index, "institution", event.target.value)} />
                      <input className="field md:col-span-2" placeholder="Degree / Certificate" value={item.degree} onChange={(event) => updateCollectionItem("education", index, "degree", event.target.value)} />
                      <input className="field md:col-span-2" placeholder="Field of study / Branch / Stream" value={item.fieldOfStudy} onChange={(event) => updateCollectionItem("education", index, "fieldOfStudy", event.target.value)} />
                      <input className="field" placeholder="Location" value={item.location || ""} onChange={(event) => updateCollectionItem("education", index, "location", event.target.value)} />
                      <input className="field" placeholder="GPA / CGPA / Percentage" value={item.score || ""} onChange={(event) => updateCollectionItem("education", index, "score", event.target.value)} />
                      <input className="field" placeholder="Start date" value={item.startDate} onChange={(event) => updateCollectionItem("education", index, "startDate", event.target.value)} />
                      <input className="field" placeholder="End date" value={item.endDate} onChange={(event) => updateCollectionItem("education", index, "endDate", event.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{isSocsTemplate ? "Internships" : "Experience"}</h3>
                <button type="button" className="button-secondary" onClick={() => addCollectionItem("experience", blankExperience)}>
                  {isSocsTemplate ? "Add Internship" : "Add Experience"}
                </button>
              </div>
              <div className="space-y-4">
                {formData.experience.map((item, index) => (
                  <div key={`experience-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">{isSocsTemplate ? "Internship" : "Role"} {index + 1}</p>
                      <RemoveIconButton onClick={() => removeCollectionItem("experience", index)} label={`Remove experience entry ${index + 1}`} />
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <input className="field" placeholder="Company" value={item.company} onChange={(event) => updateCollectionItem("experience", index, "company", event.target.value)} />
                        <input className="field" placeholder="Role" value={item.role} onChange={(event) => updateCollectionItem("experience", index, "role", event.target.value)} />
                        <input className="field" placeholder="Start date" value={item.startDate} onChange={(event) => updateCollectionItem("experience", index, "startDate", event.target.value)} />
                        <input className="field" placeholder="End date" value={item.endDate} onChange={(event) => updateCollectionItem("experience", index, "endDate", event.target.value)} />
                      </div>
                      <textarea className="field min-h-28" placeholder={isSocsTemplate ? "Skills Learnt, Responsibilities, and 2-3 quantified contribution bullets" : "Describe impact, achievements, and tools used"} value={item.description} onChange={(event) => updateCollectionItem("experience", index, "description", event.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
                  <p className="mt-1 text-sm text-slate-500">Add a bold project name and supporting details.</p>
                </div>
                <button type="button" className="button-secondary" onClick={addProject}>
                  Add Project
                </button>
              </div>
              <div className="space-y-4">
                {(formData.projects?.length ? formData.projects : [blankProject]).map((project, projectIndex) => {
                  const projectDetailsValue = formatProjectDetailsEditorValue(project);

                  return (
                    <div key={`project-${projectIndex}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Project {projectIndex + 1}</p>
                        <RemoveIconButton
                          onClick={() => removeProject(projectIndex)}
                          disabled={!formData.projects?.length}
                          label={`Remove project ${projectIndex + 1}`}
                        />
                      </div>
                      <div className="space-y-3">
                        <input
                          className="field"
                          placeholder="Project name"
                          value={project.name || ""}
                          onChange={(event) => updateProject(projectIndex, "name", event.target.value)}
                        />
                        <textarea
                          className="field min-h-32"
                          placeholder={isSocsTemplate ? "Tech Stack, Skills Learnt, Description, and Contribution bullets. Press Enter to add the next bullet point." : "Describe the project. Press Enter to add the next bullet point."}
                          value={projectDetailsValue}
                          onChange={(event) => updateProjectDetails(projectIndex, event.target.value)}
                          onKeyDown={(event) => handleProjectDetailsKeyDown(projectIndex, event)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Additional Sections</h3>
                <button type="button" className="button-secondary" onClick={addCustomSection}>
                  Add Section
                </button>
              </div>
              <div className="space-y-4">
                {formData.customSections?.length ? (
                  formData.customSections.map((section, sectionIndex) => (
                    <div
                      key={`custom-section-${sectionIndex}`}
                      className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Custom Section {sectionIndex + 1}</p>
                        <RemoveIconButton
                          onClick={() => removeCustomSection(sectionIndex)}
                          label={`Remove custom section ${sectionIndex + 1}`}
                        />
                      </div>
                      <div className="space-y-3">
                        <input
                          className="field"
                          placeholder="Section title (Projects, Certifications, Achievements...)"
                          value={section.title}
                          onChange={(event) =>
                            updateCustomSectionTitle(sectionIndex, event.target.value)
                          }
                        />
                        {section.items.map((item, itemIndex) => (
                          <div key={`custom-item-${sectionIndex}-${itemIndex}`} className="flex gap-3">
                            <input
                              className="field"
                              placeholder="Section item"
                              value={item}
                              onChange={(event) =>
                                updateCustomSectionItem(sectionIndex, itemIndex, event.target.value)
                              }
                            />
                            <RemoveIconButton
                              onClick={() => removeCustomSectionItem(sectionIndex, itemIndex)}
                              disabled={section.items.length === 1}
                              label={`Remove item ${itemIndex + 1} from custom section ${sectionIndex + 1}`}
                              className="border border-slate-200 text-slate-400 transition hover:border-rose-100 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-35"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => addCustomSectionItem(sectionIndex)}
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Add projects, certifications, achievements, languages, or any custom section you need.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Resume Photo</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload an image up to 2 MB. Drag it anywhere in the preview, then adjust the frame size, zoom, and crop until it sits right.
                  </p>
                </div>
                {resumePhoto ? (
                  <RemoveIconButton
                    onClick={onPhotoRemove}
                    label="Remove resume photo"
                    className="text-slate-400 transition hover:text-rose-400"
                  />
                ) : null}
              </div>
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    onPhotoUpload?.(file);
                    event.target.value = "";
                  }}
                />
                {resumePhoto ? (
                  <div className="mt-4 flex items-center gap-4 rounded-[18px] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <img
                      src={resumePhoto.src}
                      alt="Resume profile preview"
                      className="h-16 w-16 rounded-full object-cover"
                      style={{
                        objectPosition: `${photoCropX * 100}% ${photoCropY * 100}%`,
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{resumePhoto.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(resumePhoto.size / (1024 * 1024)).toFixed(2)} MB
                        {templateUsesBuiltInPhoto
                          ? " • Auto-fitted into this template"
                          : " • Drag it inside the preview to place it"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No photo uploaded yet.</p>
                )}
                {resumePhoto ? (
                  <div className="mt-4 space-y-3 rounded-[18px] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <label className="block">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        <span>Frame size</span>
                        <span>{Math.round(photoFrameScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.4"
                        step="0.01"
                        value={photoFrameScale}
                        className="w-full accent-slate-900"
                        onChange={(event) => onPhotoFrameScaleChange?.(Number(event.target.value))}
                      />
                    </label>
                    <label className="block">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        <span>Zoom</span>
                        <span>{photoZoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3.5"
                        step="0.01"
                        value={photoZoom}
                        className="w-full accent-slate-900"
                        onChange={(event) => onPhotoZoomChange?.(Number(event.target.value))}
                      />
                    </label>
                    <label className="block">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        <span>Horizontal</span>
                        <span>{Math.round(photoCropX * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={photoCropX}
                        className="w-full accent-slate-900"
                        onChange={(event) => onPhotoCropChange?.({ x: Number(event.target.value) })}
                      />
                    </label>
                    <label className="block">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        <span>Vertical</span>
                        <span>{Math.round(photoCropY * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={photoCropY}
                        className="w-full accent-slate-900"
                        onChange={(event) => onPhotoCropChange?.({ y: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Professional Summary</h3>
              <textarea className="field min-h-44" placeholder={isSocsTemplate ? "Write 30-40 words with skills, measurable outcomes, project impact, and action words." : "Write a concise, impact-focused professional summary"} value={formData.summary} onChange={(event) => setFormData((prev) => ({ ...prev, summary: event.target.value }))} />
              {isSocsTemplate ? (
                <p className={`mt-2 text-xs ${socsSummaryWords && (socsSummaryWords < 30 || socsSummaryWords > 40) ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                  SOCS guidance: keep the summary to 2-3 lines, roughly 30-40 words, with measurable impact.
                </p>
              ) : null}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(aiLoading)}
                  onClick={() => onAIAction("summary")}
                >
                  {aiLoading === "summary" ? <Loader label="Updating..." /> : "Update Summary"}
                </button>
                {summaryUpdateSuccess ? (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"
                    aria-label="Summary updated successfully"
                    title="Summary updated successfully"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M20 7L10 17l-5-5" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Skills</h3>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(aiLoading)}
                    onClick={() => onAIAction("skills")}
                  >
                    {aiLoading === "skills" ? <Loader label="Suggesting..." /> : "Suggest Skills"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white"
                    onClick={addSkillCategory}
                  >
                    Add Category
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {editableSkillCategories.length ? (
                  editableSkillCategories.map((group, categoryIndex) => (
                    <div
                      key={`skill-editor-category-${categoryIndex}`}
                      className="group rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          className="field"
                          placeholder="Category name, e.g. Technical Skills"
                          value={group.category}
                          onChange={(event) => updateSkillCategory(categoryIndex, event.target.value)}
                        />
                        <div className="opacity-40 transition group-hover:opacity-100 focus-within:opacity-100">
                          <RemoveIconButton
                            onClick={() => removeSkillCategory(categoryIndex)}
                            label="Remove skill category"
                            className="text-slate-400 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-35"
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {(group.items || []).map((skill, skillIndex) => (
                          <div key={`skill-editor-item-${categoryIndex}-${skillIndex}`} className="group/skill flex items-center gap-2">
                            <input
                              className="field"
                              placeholder="Skill"
                              value={skill}
                              data-skill-input={`${categoryIndex}-${skillIndex}`}
                              onChange={(event) => updateSkillItem(categoryIndex, skillIndex, event.target.value)}
                              onBlur={(event) => removeEmptySkillItem(categoryIndex, skillIndex, event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addSkillToCategory(categoryIndex);
                                }
                              }}
                            />
                            <span className="opacity-0 transition group-hover/skill:opacity-100 focus-within:opacity-100">
                              <InlineRemoveButton
                                onClick={() => removeSkillItem(categoryIndex, skillIndex)}
                                label="Remove skill"
                              />
                            </span>
                          </div>
                        ))}
                        {!(group.items || []).length ? (
                          <p className="rounded-[16px] border border-dashed border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-400">
                            No skills in this category yet.
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        onClick={() => addSkillToCategory(categoryIndex)}
                      >
                        Add Skill
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
                    No skill categories added yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Ready to ship</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Save once, reuse across ATS analysis and job matching
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The selected template is saved with your resume and used for the live preview and PDF download.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_26px_rgba(148,163,184,0.1)] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(saveAction)}
                  onClick={onSaveDraft}
                >
                  {saveAction === "draft" ? <Loader label="Saving draft..." /> : "Save Draft"}
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(saveAction)}
                  onClick={onSave}
                >
                  {saveAction === "resume" ? <Loader label="Saving resume..." /> : "Save Resume"}
                </button>
              </div>
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center rounded-[18px] border border-cyan-700 bg-cyan-700 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(8,145,178,0.16)] transition hover:bg-cyan-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={Boolean(saveAction)}
                onClick={onSaveHardCopy}
              >
                {saveAction === "hard-copy" ? <Loader label="Preparing hard copy..." /> : "Save Hard Copy Mode"}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center rounded-[18px] border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-[0_12px_22px_rgba(244,63,94,0.08)] transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={Boolean(saveAction)}
                onClick={onDiscardResume}
              >
                {saveAction === "discard" ? <Loader label="Discarding resume..." /> : "Discard Resume"}
              </button>
              {draftSaveConfirmation ? (
                <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              ) : null}
            </div>

            {showAiInsightsPanel ? (
              <div
                ref={aiInsightsRef}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]"
              >
                <h3 className="mb-4 text-lg font-semibold text-slate-900">{aiInsightsTitle}</h3>
                {shouldShowAiLoadingCard ? (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Loader
                      label={
                        aiLoading === "optimize"
                          ? "Optimizing your resume. Your suggestions will appear here in a moment..."
                          : "Suggesting new skills. Your recommendations will appear here in a moment..."
                      }
                    />
                  </div>
                ) : (
                  <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
                    {aiInsights?.lines.map((line, index) => (
                      <div
                        key={`${aiInsightsTitle}-${index}`}
                        className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </aside>

          <aside className="space-y-6 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_22px_50px_rgba(148,163,184,0.14)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Preview</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                {TEMPLATE_OPTIONS.find((template) => template.id === formData.template)?.name ||
                  TEMPLATE_OPTIONS.find((template) => template.id === normalizedTemplate)?.name ||
                  "Contemporary"}
              </p>
              <div
                ref={syncPreviewRef}
                data-resume-pdf-root="true"
                data-resume-template={normalizedTemplate}
                className={`relative mt-4 min-h-[720px] overflow-visible rounded-[1.75rem] border text-slate-900 shadow-2xl ${isSocsTemplate ? "p-0" : "p-6"} ${templateStyle.shell}`}
              >
                {renderFloatingResumePhoto()}
                {templateStyle.layout === "socs-official" ? (
                  <div
                    className="mx-auto min-h-[1123px] bg-white px-[72px] py-[72px] text-[13.3px] leading-[1.15] text-black"
                    style={{ fontFamily: "Calibri, Arial, sans-serif" }}
                  >
                    <header className="text-center">
                      <h2 className={templateStyle.name}>{previewName}</h2>
                      <div className="mt-[6px] flex flex-wrap justify-center gap-x-[7px] gap-y-[2px] text-[14.7px] leading-[1.15] text-black">
                        <span className="break-all">{formData.personalInfo.email || "professional.email@example.com"}</span>
                        <span>|</span>
                        <span className="break-words">{formData.personalInfo.phone || "+91 9999999999"}</span>
                        <span>|</span>
                        {renderSocsContactLink(formData.personalInfo.portfolio, "linkedin.com/in/firstname-lastname")}
                        <span>|</span>
                        {renderSocsContactLink(formData.personalInfo.github, "github.com/firstname-lastname")}
                      </div>
                    </header>

                    <div className="mt-[18px]">
                      {renderSocsSection(
                        "Professional Summary",
                        !String(formData.summary || "").trim(),
                        <p>{formData.summary}</p>,
                        "Write 30-40 words with role fit, measurable outcomes, project impact, and strong action words.",
                      )}

                      {renderSocsSection(
                        "Education",
                        socsEducation.length === 0,
                        <div className="space-y-[4px]">
                          {socsEducation.map((item, index) => (
                            <p key={`socs-education-${index}`}>
                              {[item.degree, item.fieldOfStudy].filter(Boolean).join(" in ") || "Degree"}
                              {item.institution ? `, ${item.institution}` : ""}
                              {item.location ? `, ${item.location}` : ""}
                              {item.score ? ` | ${item.score}` : ""}
                              {getEducationDateDisplay(item) ? ` ${getEducationDateDisplay(item)}` : ""}
                            </p>
                          ))}
                        </div>,
                        "Add qualifications in reverse chronological order without tables.",
                      )}

                      {renderSocsSection(
                        "Technical Skills",
                        socsSkillGroups.length === 0,
                        <div className="space-y-[3px]">
                          {socsSkillGroups.map((group, index) => (
                            <p key={`socs-skill-${index}`}>
                              <span className="font-bold">{group.category}: </span>
                              {group.items.join(", ")}
                            </p>
                          ))}
                        </div>,
                        "Add categories such as Programming Languages, Frameworks, Databases, Tools, and Operating Systems.",
                      )}

                      {renderSocsSection(
                        "Internships",
                        socsInternships.length === 0,
                        <div className="space-y-[8px]">
                          {socsInternships.map((item, index) => {
                            const lines = splitLines(item.description);
                            return (
                              <div key={`socs-internship-${index}`}>
                                <p className="font-bold">
                                  {[item.company, item.role].filter(Boolean).join(" | ") || "Company"}
                                  {formatDateRange(item.startDate, item.endDate) ? ` ${formatDateRange(item.startDate, item.endDate)}` : ""}
                                </p>
                                <p className="font-bold">Responsibilities:</p>
                                {lines.length ? renderSocsBulletList(lines) : null}
                              </div>
                            );
                          })}
                        </div>,
                        "Add internship organisation, duration, skills learnt, responsibilities, and quantified contributions.",
                      )}

                      {renderSocsSection(
                        "Projects",
                        filledProjects.length === 0,
                        <div className="space-y-[8px]">
                          {filledProjects.map((project, index) => (
                            <div key={`socs-project-${index}`}>
                              <p className="font-bold">{project.name || `Project ${index + 1}`}</p>
                              {renderSocsBulletList(getProjectBullets(project))}
                            </div>
                          ))}
                        </div>,
                        "Add project name, tech stack, skills learnt, description, and contribution bullets with measurable outcomes.",
                      )}

                      {renderSocsSection(
                        "Research and Publications",
                        socsResearchItems.length === 0,
                        renderSocsBulletList(socsResearchItems),
                        "Add publication title, journal/conference details, techniques used, and quantified outcomes.",
                      )}

                      {renderSocsSection(
                        "Certifications and Accomplishments",
                        socsCertificationItems.length === 0,
                        renderSocsBulletList(socsCertificationItems),
                        "Add certifications, completion dates, in-progress items, awards, and relevant accomplishments.",
                      )}

                      {renderSocsSection(
                        "Leadership / Activities / Achievements",
                        socsLeadershipItems.length === 0,
                        renderSocsBulletList(socsLeadershipItems),
                        "Add leadership, activities, or achievements using evidence-based language.",
                      )}

                      {socsOtherSections.map((section, index) =>
                        renderSocsSection(
                          section.title || `Additional Section ${index + 1}`,
                          !section.items.length,
                          renderSocsBulletList(section.items),
                          "Add relevant, accurate, and verifiable details.",
                        ),
                      )}
                    </div>
                  </div>
                ) : templateStyle.layout === "enhancv-columns" ? (
                  <div className="min-h-[672px] bg-white px-5 py-5 text-slate-900">
                    <div data-emerald-header="true" className="flex items-start justify-between gap-5 border-b border-slate-300 pb-3.5">
                      <div className="min-w-0 flex-1">
                        <h2 className={templateStyle.name}>{previewName}</h2>
                        <p className={templateStyle.title}>{previewTitle}</p>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-slate-700">
                          <span className="break-words">{formData.personalInfo.phone || "[Phone Number]"}</span>
                          <span className="break-all">{formData.personalInfo.email || "yourname@email.com"}</span>
                          {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                          <span className="break-words">{formData.personalInfo.location || "[Location]"}</span>
                        </div>
                      </div>
                      <div
                        className="mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10"
                        style={{
                          width: `${128 * photoFrameScale}px`,
                          height: `${128 * photoFrameScale}px`,
                        }}
                      >
                        {resumePhoto ? (
                          <img
                            src={resumePhoto.src}
                            alt="Resume profile"
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${photoCropX * 100}% ${photoCropY * 100}%`,
                              transform: `scale(${photoZoom})`,
                              transformOrigin: `${photoCropX * 100}% ${photoCropY * 100}%`,
                            }}
                            draggable={false}
                          />
                        ) : (
                          <div className="relative h-14 w-14 rounded-full border-[3px] border-slate-500">
                            <div className="absolute left-1/2 top-2 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-slate-500" />
                            <div className="absolute left-1/2 bottom-1 h-6 w-9 -translate-x-1/2 rounded-t-full border-[3px] border-b-0 border-slate-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div data-emerald-columns-body="true" className="mt-5 columns-1 gap-6 md:columns-3 [column-fill:balance]">
                      <div className="contents">
                        <section data-emerald-section="summary" className="mb-5 break-inside-avoid">
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>SUMMARY</h3>
                          </div>
                          <p className="mt-2.5 text-[12px] leading-[1.6] text-slate-700">
                            {formData.summary || "Your professional summary will appear here once you add it."}
                          </p>
                        </section>

                        {filledCustomSections.map((section, index) => (
                          <section key={`columns-custom-${index}`} data-emerald-section="custom" className="mb-5 break-inside-avoid">
                            <div className="border-b border-emerald-900 pb-1">
                              <h3 className={templateStyle.sectionTitle}>
                                {section.title || `SECTION ${index + 1}`}
                              </h3>
                            </div>
                            <div className="mt-2 space-y-1.5">
                              {section.items.length ? (
                                splitCustomSectionItems(section.items).map((item, itemIndex) => (
                                  <p
                                    key={`columns-custom-item-${index}-${itemIndex}`}
                                    className="break-words text-[11px] leading-[1.6] text-slate-700"
                                  >
                                    - {item}
                                  </p>
                                ))
                              ) : (
                                <p className="text-[11px] leading-[1.6] text-slate-500">
                                  Add items to populate this section.
                                </p>
                              )}
                            </div>
                          </section>
                        ))}
                      </div>

                      <div className="contents">
                        {filledEducation.length ? (
                        <section data-emerald-section="education" className="mb-5 break-inside-avoid">
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>EDUCATION</h3>
                          </div>
                          <div className="mt-3 space-y-3">
                            {filledEducation.map((item, index) => (
                                <div key={`columns-edu-${index}`} data-emerald-item="education" className="min-w-0 break-inside-avoid-column break-inside-avoid">
                                  <p className="break-words text-[14px] font-semibold leading-5 text-slate-900">
                                    {item.degree || "Degree / Program"}
                                    {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}
                                  </p>
                                  <p className="mt-1 break-words text-[14px] font-bold leading-5 text-emerald-700">
                                    {item.institution || "Institution Name"}
                                  </p>
                                  {getEducationMetaItems(item).length ? (
                                    <p className="mt-1.5 break-words text-[11px] text-slate-600">
                                      {getEducationMetaItems(item).join(" | ")}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                          </div>
                        </section>
                        ) : null}

                        <section data-emerald-section="skills" className="mb-5 break-inside-avoid">
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>SKILLS</h3>
                          </div>
                          {renderedSkillCategories.length ? (
                            <div className="mt-3 space-y-3">
                              {renderedSkillCategories.map((group, groupIndex) => (
                                <div key={`columns-skill-category-${groupIndex}`} data-emerald-item="skills" className="min-w-0 break-inside-avoid-column break-inside-avoid">
                                  <p className="text-[10.45px] font-bold uppercase tracking-[0.13em] text-slate-700 opacity-95">
                                    {group.category}
                                  </p>
                                  <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-x-[8%] gap-y-2">
                                    {group.items.map((skill, index) => {
                                      const isWideSkill = skill.length >= 16;
                                      return (
                                        <div
                                          key={`columns-skill-${groupIndex}-${index}-${skill}`}
                                          className={`min-w-0 max-w-full text-[11px] font-semibold leading-5 text-emerald-900 break-words whitespace-normal [overflow-wrap:anywhere] ${
                                            isWideSkill ? "basis-full" : "basis-[46%]"
                                          }`}
                                        >
                                          {skill}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-[11px] leading-5 text-slate-500">Add skills to populate the preview.</p>
                          )}
                        </section>
                      </div>

                      <div className="contents">
                        {filledExperience.length ? (
                        <section data-emerald-section="experience" className="mb-5 break-inside-avoid">
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>EXPERIENCE</h3>
                          </div>
                          <div className="mt-3 space-y-4">
                            {filledExperience.map((item, index) => {
                                const bullets = splitLines(item.description);
                                return (
                                  <div key={`columns-exp-${index}`} data-emerald-item="experience" className="min-w-0 break-inside-avoid-column break-inside-avoid">
                                    <p className="break-words text-[13px] font-semibold leading-5 text-slate-700">
                                      {item.role || "Title"}
                                    </p>
                                    <p className="break-words text-[16px] font-bold leading-5 text-emerald-700">
                                      {item.company || "Company Name"}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                      <span>{formatDateRange(item.startDate, item.endDate)}</span>
                                      <span className="break-words">{formData.personalInfo.location || "Location"}</span>
                                    </div>
                                    <ul className="mt-2 list-disc pl-4 text-[11px] leading-[1.55] text-slate-700">
                                      {(bullets.length ? bullets : ["Highlight your accomplishments, using numbers if possible."]).slice(0, 4).map((bullet, bulletIndex) => (
                                        <li key={`columns-exp-bullet-${index}-${bulletIndex}`} className="break-words">
                                          {bullet}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                          </div>
                        </section>
                        ) : null}

                        {filledProjects.length ? (
                        <section data-emerald-section="projects" className="mb-5 break-inside-avoid">
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>PROJECTS</h3>
                          </div>
                          <div className="mt-3 space-y-4">
                            {filledProjects.map((project, index) => {
                                const bullets = getProjectBullets(project);
                                return (
                                  <div key={`columns-project-${index}`} data-emerald-item="projects" className="min-w-0 break-inside-avoid-column break-inside-avoid">
                                    <p className="break-words text-[13px] font-semibold leading-5 text-slate-700">
                                      {project.name || `Project ${index + 1}`}
                                    </p>
                                    <ul className="mt-2 list-disc pl-4 text-[11px] leading-[1.55] text-slate-700">
                                      {(bullets.length ? bullets : ["Add project details as bullet points."]).slice(0, 4).map((bullet, bulletIndex) => (
                                        <li key={`columns-project-bullet-${index}-${bulletIndex}`} className="break-words">
                                          {bullet}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                          </div>
                        </section>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : templateStyle.layout === "enhancv-replica" ? (
                  <div className="min-h-[672px] bg-white px-5 py-6 text-slate-900">
                    <div className="border-b border-slate-300 pb-3.5">
                      <h2 className={templateStyle.name}>{previewName}</h2>
                      <p className={templateStyle.title}>{previewTitle}</p>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-slate-700">
                        <span className="break-words">{formData.personalInfo.phone || "[Phone Number]"}</span>
                        <span className="break-all">{formData.personalInfo.email || "yourname@email.com"}</span>
                        {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                        <span className="break-words">{formData.personalInfo.location || "[Location]"}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      <section>
                        <h3 className={templateStyle.sectionTitle}>SUMMARY</h3>
                        <p className="mt-2.5 text-[12px] leading-[1.65] text-slate-700">
                          {formData.summary ||
                            "Your professional summary will appear here once you add it."}
                        </p>
                      </section>

                      {filledEducation.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>EDUCATION</h3>
                        <div className="mt-3 space-y-3">
                          {filledEducation.map((item, index) => (
                                <div key={`enhancv-edu-${index}`} className="grid grid-cols-[96px_18px_minmax(0,1fr)] gap-3">
                                  <div className="text-[11px] leading-[1.5] text-slate-600">
                                    {getEducationMetaItems(item).map((metaItem, metaIndex) => (
                                      <p
                                        key={`enhancv-edu-meta-${index}-${metaIndex}`}
                                        className={metaIndex === 0 ? "font-bold text-blue-700" : ""}
                                      >
                                        {metaItem}
                                      </p>
                                    ))}
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" />
                                    <span className="absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-slate-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[14px] font-semibold leading-5 text-blue-700">
                                      {item.degree || "Bachelor of Technology"}
                                      {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}
                                    </p>
                                    <p className="text-[14px] font-bold leading-5 text-orange-600">
                                      {item.institution || "University / Institute"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                        </div>
                      </section>
                      ) : null}

                      {renderedSkillCategories.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>SKILLS</h3>
                        {renderSkillCategoryGroups(renderedSkillCategories, templateStyle, {
                          wrapperClassName: "mt-3 space-y-3",
                          categoryClassName: "text-[10.45px] font-bold uppercase tracking-[0.13em] text-slate-700 opacity-95",
                          itemWrapperClassName: "flex flex-wrap gap-x-5 gap-y-3",
                          itemClassName: "leading-4",
                        })}
                      </section>
                      ) : null}

                      {filledExperience.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>EXPERIENCE</h3>
                        <div className="mt-3 space-y-4">
                          {filledExperience.map((item, index) => {
                                const bullets = splitLines(item.description);
                                return (
                                  <div key={`enhancv-exp-${index}`} className="grid grid-cols-[96px_18px_minmax(0,1fr)] gap-3">
                                    <div className="text-[11px] leading-[1.5] text-slate-600">
                                      <p className="font-bold text-blue-700">{formatDateRange(item.startDate, item.endDate)}</p>
                                      <p>{formData.personalInfo.location || "Location"}</p>
                                    </div>
                                    <div className="relative">
                                      <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" />
                                      <span className="absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-semibold text-slate-700">{item.role || "Title"}</p>
                                      <p className="text-[16px] font-bold leading-5 text-orange-600">{item.company || "Company Name"}</p>
                                      {bullets.length ? (
                                        <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-[1.55] text-slate-700">
                                          {bullets.map((bullet, bulletIndex) => (
                                            <li key={`enhancv-exp-bullet-${index}-${bulletIndex}`}>{bullet}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <ul className="mt-2 list-disc pl-4 text-[11px] leading-[1.55] text-slate-700">
                                          <li>Highlight your accomplishments, using numbers if possible.</li>
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                      </section>
                      ) : null}

                      {filledProjects.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>PROJECTS</h3>
                        <div className="mt-3 space-y-4">
                          {filledProjects.map((project, index) => {
                                const bullets = getProjectBullets(project);
                                return (
                                  <div key={`enhancv-project-${index}`} className="grid grid-cols-[96px_18px_minmax(0,1fr)] gap-3">
                                    <div className="text-[11px] leading-[1.5] text-slate-600">
                                      <p className="font-bold text-blue-700">Project</p>
                                    </div>
                                    <div className="relative">
                                      <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" />
                                      <span className="absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-semibold text-slate-700">
                                        {project.name || `Project ${index + 1}`}
                                      </p>
                                      {bullets.length ? (
                                        <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-[1.55] text-slate-700">
                                          {bullets.map((bullet, bulletIndex) => (
                                            <li key={`enhancv-project-bullet-${index}-${bulletIndex}`}>{bullet}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <ul className="mt-2 list-disc pl-4 text-[11px] leading-[1.55] text-slate-700">
                                          <li>Add project details as bullet points.</li>
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                      </section>
                      ) : null}

                      {filledCustomSections.map((section, index) => (
                        <section key={`enhancv-custom-${index}`}>
                          <h3 className={templateStyle.sectionTitle}>
                            {section.title || `SECTION ${index + 1}`}
                          </h3>
                          <div className="mt-2 space-y-1.5">
                            {section.items.length ? (
                              splitCustomSectionItems(section.items).map((item, itemIndex) => (
                                <p
                                  key={`enhancv-custom-item-${index}-${itemIndex}`}
                                  className="break-words text-[11px] leading-[1.6] text-slate-700"
                                >
                                  - {item}
                                </p>
                              ))
                            ) : (
                              <p className="text-[11px] leading-[1.6] text-slate-500">
                                Add items to populate this section.
                              </p>
                            )}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : templateStyle.layout === "creative" ? (
                  <div className="min-h-[672px] rounded-[1.5rem] border border-slate-200">
                    <div className="grid gap-6 bg-slate-900 px-6 py-6 !text-white [color:#ffffff] md:grid-cols-[1fr_180px] md:items-center">
                      <div>
                        <h2 className="text-4xl font-bold tracking-tight !text-white [color:#ffffff]">{previewName}</h2>
                        <p className="mt-2 text-xl font-semibold !text-white [color:#ffffff]">{previewTitle}</p>
                        <div className="mt-4 grid gap-2 text-sm !text-slate-200 [color:#e2e8f0] md:grid-cols-2">
                          <p>{formData.personalInfo.phone || "[Phone Number]"}</p>
                          <p>{formData.personalInfo.email || "[Email]"}</p>
                          <p>{formData.personalInfo.location || "[Location]"}</p>
                          {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                        </div>
                      </div>
                      <div
                        className="mx-auto flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10"
                        style={{
                          width: `${128 * photoFrameScale}px`,
                          height: `${128 * photoFrameScale}px`,
                        }}
                      >
                        {resumePhoto ? (
                          <img
                            src={resumePhoto.src}
                            alt="Resume profile"
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${photoCropX * 100}% ${photoCropY * 100}%`,
                              transform: `scale(${photoZoom})`,
                              transformOrigin: `${photoCropX * 100}% ${photoCropY * 100}%`,
                            }}
                            draggable={false}
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full border-[6px] border-slate-300/60">
                            <div className="mx-auto mt-4 h-9 w-9 rounded-full border-[5px] border-slate-300/60" />
                            <div className="mx-auto mt-3 h-10 w-16 rounded-t-full border-[5px] border-b-0 border-slate-300/60" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 bg-white px-6 py-7 md:grid-cols-[0.88fr_1.32fr]">
                      <div className="space-y-5">
                        {creativeLeftSections.map((section) => (
                          <section
                            key={section.key}
                            data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          >
                            <div className="border-b-2 border-cyan-800 pb-1">
                              <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-cyan-900">
                                {section.title}
                              </h3>
                            </div>
                            <div className="mt-3 text-sm leading-6">
                              {section.render(creativeTemplateStyle)}
                            </div>
                          </section>
                        ))}
                      </div>

                      <div className="space-y-5">
                        {creativeRightSections.map((section) => (
                          <section
                            key={section.key}
                            data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          >
                            <div className="border-b-2 border-cyan-800 pb-1">
                              <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-cyan-900">
                                {section.title}
                              </h3>
                            </div>
                            {section.key === "skills" ? (
                              renderSkillCategoryGroups(renderedSkillCategories, templateStyle, {
                                wrapperClassName: "mt-4 space-y-3",
                                categoryClassName: "text-[11.4px] font-bold uppercase tracking-[0.12em] text-cyan-950 opacity-95",
                                itemWrapperClassName: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-semibold text-slate-800",
                                itemClassName: "min-w-0",
                                emptyClassName: "mt-4 text-sm text-slate-400",
                              })
                            ) : (
                              <div className="mt-3 text-sm leading-6">{section.render(templateStyle)}</div>
                            )}
                          </section>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : templateStyle.layout === "single-column" ? (
                  <>
                    <div className={`${templateStyle.header} text-center`}>
                      <h2 className={templateStyle.name}>{previewName}</h2>
                      <p className={templateStyle.title}>{previewTitle}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span>{formData.personalInfo.email || "email@example.com"}</span>
                        <span>{formData.personalInfo.phone || "+91 0000000000"}</span>
                        {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-6 text-sm leading-7">
                      {previewSections.map((section) => (
                        <section
                          key={section.key}
                          data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          className="border-b border-slate-200/80 pb-5 last:border-b-0 last:pb-0"
                        >
                          <h3 className={templateStyle.sectionTitle}>{section.title}</h3>
                          {section.render(templateStyle)}
                        </section>
                      ))}
                    </div>
                  </>
                ) : templateStyle.layout === "timeline" ? (
                  <>
                    <div className={templateStyle.header}>
                      <h2 className={templateStyle.name}>{previewName}</h2>
                      <p className={templateStyle.title}>{previewTitle}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span>{formData.personalInfo.email || "email@example.com"}</span>
                        <span>{formData.personalInfo.phone || "+91 0000000000"}</span>
                        {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-6 text-sm leading-6">
                      {previewSections.map((section) => (
                        <section
                          key={section.key}
                          data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          className="relative pl-6"
                        >
                          <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                          <span className="absolute left-[4px] top-5 h-[calc(100%-0.5rem)] w-px bg-slate-300" />
                          <h3 className={templateStyle.sectionTitle}>{section.title}</h3>
                          {section.render(templateStyle)}
                        </section>
                      ))}
                    </div>
                  </>
                ) : templateStyle.layout === "compact" ? (
                  <>
                    <div className={templateStyle.header}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className={templateStyle.name}>{previewName}</h2>
                          <p className={templateStyle.title}>{previewTitle}</p>
                        </div>
                        <div className="grid gap-1 text-right text-[11px] tracking-[0.18em] text-slate-500">
                          <span>{formData.personalInfo.email || "email@example.com"}</span>
                          <span>{formData.personalInfo.phone || "+91 0000000000"}</span>
                          {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                          <span>{formData.personalInfo.location || "Your location"}</span>
                        </div>
                      </div>
                    </div>

                    <div data-compact-sections-grid="true" className="mt-5 grid gap-5 text-sm leading-5 lg:grid-cols-2">
                      {previewSections.map((section) => (
                        <section
                          key={section.key}
                          data-compact-section={section.key}
                          data-compact-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                          className="break-inside-avoid rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                        >
                          <h3 className={templateStyle.sectionTitle}>{section.title}</h3>
                          <div className="mt-2">{section.render(templateStyle)}</div>
                        </section>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={templateStyle.header}>
                      <h2 className={templateStyle.name}>{previewName}</h2>
                      <p className={templateStyle.title}>{previewTitle}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span>{formData.personalInfo.email || "email@example.com"}</span>
                        <span>{formData.personalInfo.phone || "+91 0000000000"}</span>
                        {renderPortfolioPreviewLink(formData.personalInfo.portfolio)}
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5 text-sm leading-6">
                      {previewSections.map((section) => (
                        <section
                          key={section.key}
                          data-resume-section-empty={isPreviewSectionEmpty(section) ? "true" : undefined}
                        >
                          <h3 className={templateStyle.sectionTitle}>{section.title}</h3>
                          {section.render(templateStyle)}
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="mx-auto mt-3 inline-flex w-full max-w-[270px] items-center justify-center self-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(aiLoading)}
              onClick={() => onAIAction("optimize")}
            >
              {aiLoading === "optimize" ? <Loader label="Optimizing..." /> : "Optimize Resume"}
            </button>
          </aside>
        </div>
      </section>

      {isTemplatePickerOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 transition-opacity duration-200 ${
                isTemplatePickerVisible
                  ? "pointer-events-auto bg-slate-950/45 opacity-100"
                  : "pointer-events-none bg-slate-950/0 opacity-0"
              }`}
              onClick={closeTemplatePicker}
            >
              <div
                className={`w-full max-w-6xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition-[transform,opacity] duration-200 will-change-transform ${
                  isTemplatePickerVisible
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-4 scale-[0.985] opacity-0"
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Resume Template</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Choose the layout you want to work with</h3>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                    onClick={closeTemplatePicker}
                    aria-label="Close template picker"
                    title="Close"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto overscroll-contain pr-1 [contain:layout_paint]">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {TEMPLATE_OPTIONS.map((template) => {
                      const active = normalizedTemplate === template.id;
                      const locked = Boolean(template.locked);
                      return (
                        <button
                          key={template.id}
                          type="button"
                          disabled={locked}
                          onClick={() => {
                            if (locked) return;
                            setFormData((prev) => ({ ...prev, template: template.id }));
                            closeTemplatePicker();
                          }}
                          className={`flex min-h-[15.5rem] flex-col rounded-3xl border p-4 text-left transition ${
                            locked
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-65"
                              : active
                              ? "border-slate-900 bg-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`mb-4 rounded-[1.4rem] bg-gradient-to-br p-[1px] ${template.accent}`}>
                            <TemplateThumbnail templateId={template.id} />
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                            {locked ? (
                              <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Locked
                              </span>
                            ) : template.recommended ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 min-h-[4.75rem] text-xs leading-5 text-slate-500">{template.blurb}</p>
                          <p className="mt-auto pt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
                            {locked ? "Locked" : active ? "Selected" : "Use Template"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default ResumeForm;
