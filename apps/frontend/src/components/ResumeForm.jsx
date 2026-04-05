import { useMemo, useState } from "react";
import Loader from "./Loader";

const blankEducation = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
};

const blankExperience = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  description: "",
};

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
};

const normalizeTemplateId = (templateId) => TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";

const TEMPLATE_OPTIONS = [
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
  return start || end || "Date period";
};

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
    skill: "rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-800",
  },
  "single-column": {
    layout: "single-column",
    shell: "border-slate-300 bg-white",
    header: "border-b-2 border-slate-900 pb-4",
    name: "text-[2.15rem] font-serif font-bold tracking-tight text-slate-900",
    title: "mt-1.5 text-[15px] font-semibold uppercase tracking-[0.14em] text-slate-700",
    sectionTitle: "text-[15px] font-bold uppercase tracking-[0.18em] text-slate-800",
    skill: "rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-800",
  },
  compact: {
    layout: "compact",
    shell: "border-slate-200 bg-white",
    header: "border-b border-slate-300 pb-4",
    name: "text-[2.15rem] font-black uppercase tracking-[0.03em] text-slate-900",
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
    skill: "rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white",
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
    name: "text-[2.2rem] font-black uppercase tracking-[0.02em] text-blue-950",
    title: "mt-1.5 text-[17px] font-bold text-orange-600",
    sectionTitle: "text-[15px] font-black uppercase tracking-[0.02em] text-blue-950",
    skill: "border-b border-slate-500 pb-1.5 text-[13px] font-semibold text-slate-700",
  },
  "enhancv-columns": {
    layout: "enhancv-columns",
    shell: "border-slate-300 bg-white",
    header: "border-b border-slate-200 pb-3",
    name: "text-[2.15rem] font-black uppercase tracking-[0.01em] text-emerald-950",
    title: "mt-1 text-[16px] font-bold text-emerald-700",
    sectionTitle: "text-[13px] font-black uppercase tracking-[0.01em] text-emerald-950",
    skill: "border-b border-slate-500 pb-1.5 text-[12px] font-semibold text-emerald-950",
  },
};

const getCustomSectionSortKey = (title = "") => {
  const normalized = String(title || "").trim().toLowerCase();
  if (/project/.test(normalized)) return "projects";
  if (/certification|certificate|course/.test(normalized)) return "certifications";
  if (/achievement|award/.test(normalized)) return "achievements";
  if (/language/.test(normalized)) return "languages";
  if (/interest/.test(normalized)) return "interests";
  return "custom";
};

const getPreviewSections = (formData) => [
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
    render: (templateStyle) => (
      <div className="mt-2 flex flex-wrap gap-2">
        {formData.skills.length ? (
          formData.skills.map((skill, index) => (
            <span
              key={`${skill}-preview-${index}`}
              className={`${templateStyle.skill} max-w-full break-words whitespace-normal`}
            >
              {skill}
            </span>
          ))
        ) : (
          <p className="text-slate-500">Add skills to populate the preview.</p>
        )}
      </div>
    ),
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
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Dates"}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-slate-700">
                  {item.description || "Impact and achievements will appear here."}
                </p>
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
        {formData.education.filter((item) => item.institution || item.degree || item.fieldOfStudy).length ? (
          formData.education
            .filter((item) => item.institution || item.degree || item.fieldOfStudy)
            .map((item, index) => (
              <div key={`education-preview-${index}`}>
                <p className="font-semibold text-slate-900">
                  {item.degree || "Degree"}
                  {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}
                </p>
                <p className="text-slate-700">{item.institution || "Institution"}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {[item.startDate, item.endDate].filter(Boolean).join(" - ") || "Dates"}
                </p>
              </div>
            ))
        ) : (
          <p className="text-slate-500">Add education details to complete the preview.</p>
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

function ResumeForm({
  formData,
  setFormData,
  onSave,
  onAIAction,
  onImportResume,
  onImportFileChange,
  importFile,
  importLoading,
  loading,
  aiLoading,
  error,
  successMessage,
  aiInsights,
  previewRef,
}) {
  const [skillInput, setSkillInput] = useState("");

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

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (!nextSkill) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, nextSkill])),
    }));
    setSkillInput("");
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
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

  const previewName = formData.personalInfo.fullName || "Your Name";
  const previewTitle = formData.personalInfo.title || "Professional Title";
  const normalizedTemplate = normalizeTemplateId(formData.template);
  const templateStyle =
    templatePreviewClasses[normalizedTemplate] || templatePreviewClasses.contemporary;
  const filledExperience = (formData.experience || []).filter(
    (item) => item.company || item.role || item.description,
  );
  const filledEducation = (formData.education || []).filter(
    (item) => item.institution || item.degree || item.fieldOfStudy,
  );
  const filledCustomSections = (formData.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length);

  const previewSections = useMemo(() => {
    const allSections = getPreviewSections(formData);
    const orderMap = {
      contemporary: ["summary", "skills", "experience", "projects", "education", "certifications", "achievements", "languages", "interests", "custom"],
      "single-column": ["summary", "experience", "projects", "education", "certifications", "skills", "achievements", "languages", "interests", "custom"],
      compact: ["summary", "experience", "projects", "skills", "education", "certifications", "achievements", "languages", "interests", "custom"],
      creative: ["skills", "summary", "experience", "projects", "education", "certifications", "achievements", "languages", "interests", "custom"],
      timeline: ["summary", "experience", "projects", "education", "certifications", "skills", "achievements", "languages", "interests", "custom"],
      "enhancv-replica": ["summary", "experience", "projects", "education", "certifications", "achievements", "skills", "languages", "interests", "custom"],
      "enhancv-columns": ["summary", "experience", "projects", "education", "certifications", "achievements", "skills", "languages", "interests", "custom"],
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
  const creativeLeftSections = previewSections.filter((section) =>
    ["experience", "education"].includes(section.key) || section.key.startsWith("custom-"),
  );
  const creativeRightSections = previewSections.filter((section) =>
    ["summary", "skills"].includes(section.key),
  );

  return (
    <div className="space-y-8">
      <section className="glass-card panel-grid p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Resume Studio</p>
            <h2 className="section-title">Craft a resume that passes both people and bots</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="button-secondary"
              disabled={Boolean(aiLoading)}
              onClick={() => onAIAction("summary")}
            >
              {aiLoading === "summary" ? <Loader label="Generating..." /> : "Generate Summary"}
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={Boolean(aiLoading)}
              onClick={() => onAIAction("skills")}
            >
              {aiLoading === "skills" ? <Loader label="Suggesting..." /> : "Suggest Skills"}
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={Boolean(aiLoading)}
              onClick={() => onAIAction("optimize")}
            >
              {aiLoading === "optimize" ? <Loader label="Optimizing..." /> : "Optimize Resume"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="mb-8 rounded-[30px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-6 shadow-[0_24px_60px_rgba(148,163,184,0.14)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Import Existing Resume</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Upload a resume and continue upgrading it here</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Bring in your current PDF, DOCX, or TXT resume. We will extract the visible content into the
                builder so you can refine sections, improve wording, and use the existing AI tools without
                rebuilding everything from scratch.
              </p>
            </div>
            <div className="w-full max-w-xl space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
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
                className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white"
                disabled={importLoading}
                onClick={onImportResume}
              >
                {importLoading ? <Loader label="Importing your resume..." /> : "Import Into Builder"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_45px_rgba(148,163,184,0.12)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">ATS-Friendly Templates</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Pick one of five layouts designed to stay readable for recruiters while keeping a
                straightforward structure for ATS parsing and PDF export.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {TEMPLATE_OPTIONS.map((template) => {
              const active = normalizedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, template: template.id }))}
                  className={`flex min-h-[15.5rem] flex-col rounded-3xl border p-4 text-left transition ${
                    active
                      ? "border-slate-900 bg-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`mb-4 rounded-[1.4rem] bg-gradient-to-br p-[1px] ${template.accent}`}>
                    <TemplateThumbnail templateId={template.id} />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                    {template.recommended ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 min-h-[4.75rem] text-xs leading-5 text-slate-500">{template.blurb}</p>
                  <p className="mt-auto pt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
                    {active ? "Selected" : "Use Template"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.7fr_0.95fr_1.35fr]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Personal Info</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" name="fullName" placeholder="Full name" value={formData.personalInfo.fullName} onChange={updatePersonalInfo} />
                <input className="field" name="title" placeholder="Professional title" value={formData.personalInfo.title} onChange={updatePersonalInfo} />
                <input className="field" name="email" placeholder="Email" type="email" value={formData.personalInfo.email} onChange={updatePersonalInfo} />
                <input className="field" name="phone" placeholder="Phone" value={formData.personalInfo.phone} onChange={updatePersonalInfo} />
                <input className="field" name="portfolio" placeholder="LinkedIn / Portfolio URL" value={formData.personalInfo.portfolio || ""} onChange={updatePersonalInfo} />
                <input className="field md:col-span-2" name="location" placeholder="Location" value={formData.personalInfo.location} onChange={updatePersonalInfo} />
              </div>
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
                      <button type="button" className="text-sm text-rose-500 transition hover:text-rose-600" onClick={() => removeCollectionItem("education", index)}>
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="field" placeholder="Institution" value={item.institution} onChange={(event) => updateCollectionItem("education", index, "institution", event.target.value)} />
                      <input className="field" placeholder="Degree" value={item.degree} onChange={(event) => updateCollectionItem("education", index, "degree", event.target.value)} />
                      <input className="field" placeholder="Field of study" value={item.fieldOfStudy} onChange={(event) => updateCollectionItem("education", index, "fieldOfStudy", event.target.value)} />
                      <div className="grid grid-cols-2 gap-4">
                        <input className="field" placeholder="Start date" value={item.startDate} onChange={(event) => updateCollectionItem("education", index, "startDate", event.target.value)} />
                        <input className="field" placeholder="End date" value={item.endDate} onChange={(event) => updateCollectionItem("education", index, "endDate", event.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Experience</h3>
                <button type="button" className="button-secondary" onClick={() => addCollectionItem("experience", blankExperience)}>
                  Add Experience
                </button>
              </div>
              <div className="space-y-4">
                {formData.experience.map((item, index) => (
                  <div key={`experience-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Role {index + 1}</p>
                      <button type="button" className="text-sm text-rose-500 transition hover:text-rose-600" onClick={() => removeCollectionItem("experience", index)}>
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <input className="field" placeholder="Company" value={item.company} onChange={(event) => updateCollectionItem("experience", index, "company", event.target.value)} />
                        <input className="field" placeholder="Role" value={item.role} onChange={(event) => updateCollectionItem("experience", index, "role", event.target.value)} />
                        <input className="field" placeholder="Start date" value={item.startDate} onChange={(event) => updateCollectionItem("experience", index, "startDate", event.target.value)} />
                        <input className="field" placeholder="End date" value={item.endDate} onChange={(event) => updateCollectionItem("experience", index, "endDate", event.target.value)} />
                      </div>
                      <textarea className="field min-h-28" placeholder="Describe impact, achievements, and tools used" value={item.description} onChange={(event) => updateCollectionItem("experience", index, "description", event.target.value)} />
                    </div>
                  </div>
                ))}
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
                        <button
                          type="button"
                          className="text-sm text-rose-500 transition hover:text-rose-600"
                          onClick={() => removeCustomSection(sectionIndex)}
                        >
                          Remove
                        </button>
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
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => removeCustomSectionItem(sectionIndex, itemIndex)}
                              disabled={section.items.length === 1}
                            >
                              Remove
                            </button>
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

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Professional Summary</h3>
              <textarea className="field min-h-44" placeholder="Write a concise, impact-focused professional summary" value={formData.summary} onChange={(event) => setFormData((prev) => ({ ...prev, summary: event.target.value }))} />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Skills</h3>
              <div className="flex gap-3">
                <input
                  className="field"
                  placeholder="Add a skill"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white"
                  onClick={addSkill}
                >
                  Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.skills.length ? (
                  formData.skills.map((skill, index) => (
                    <button key={`${skill}-${index}`} type="button" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700" onClick={() => removeSkill(index)}>
                      {skill} x
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills added yet.</p>
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
              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                onClick={onSave}
              >
                {loading ? <Loader label="Saving resume..." /> : "Save Resume"}
              </button>
            </div>

            {aiInsights ? (
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.1)]">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">{aiInsights.title}</h3>
                <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
                  {aiInsights.lines.map((line, index) => (
                    <div
                      key={`${aiInsights.title}-${index}`}
                      className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_22px_50px_rgba(148,163,184,0.14)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Preview</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                {TEMPLATE_OPTIONS.find((template) => template.id === formData.template)?.name ||
                  TEMPLATE_OPTIONS.find((template) => template.id === normalizedTemplate)?.name ||
                  "Contemporary"}
              </p>
              <div
                ref={previewRef}
                className={`mt-4 min-h-[720px] rounded-[1.75rem] border p-6 text-slate-900 shadow-2xl ${templateStyle.shell}`}
              >
                {templateStyle.layout === "enhancv-columns" ? (
                  <div className="min-h-[672px] bg-white px-5 py-5 text-slate-900">
                    <div className="flex items-start justify-between gap-5 border-b border-slate-300 pb-3.5">
                      <div className="min-w-0 flex-1">
                        <h2 className={templateStyle.name}>{previewName}</h2>
                        <p className={templateStyle.title}>{previewTitle}</p>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-slate-700">
                          <span className="break-words">{formData.personalInfo.phone || "[Phone Number]"}</span>
                          <span className="break-all">{formData.personalInfo.email || "yourname@email.com"}</span>
                          <span className="break-all">{formData.personalInfo.portfolio || "LinkedIn/Portfolio"}</span>
                          <span className="break-words">{formData.personalInfo.location || "[Location]"}</span>
                        </div>
                      </div>
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <div className="relative h-14 w-14 rounded-full border-[3px] border-slate-500">
                          <div className="absolute left-1/2 top-2 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-slate-500" />
                          <div className="absolute left-1/2 bottom-1 h-6 w-9 -translate-x-1/2 rounded-t-full border-[3px] border-b-0 border-slate-500" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-[1.04fr_1.42fr_1.12fr]">
                      <div className="space-y-5">
                        <section>
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>SUMMARY</h3>
                          </div>
                          <p className="mt-2.5 text-[12px] leading-[1.6] text-slate-700">
                            {formData.summary || "Your professional summary will appear here once you add it."}
                          </p>
                        </section>

                        {filledCustomSections.map((section, index) => (
                          <section key={`columns-custom-${index}`}>
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

                      <div className="space-y-5">
                        {filledExperience.length ? (
                        <section>
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>EXPERIENCE</h3>
                          </div>
                          <div className="mt-3 space-y-4">
                            {filledExperience.map((item, index) => {
                                const bullets = splitLines(item.description);
                                return (
                                  <div key={`columns-exp-${index}`} className="min-w-0">
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
                      </div>

                      <div className="space-y-5">
                        {filledEducation.length ? (
                        <section>
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>EDUCATION</h3>
                          </div>
                          <div className="mt-3 space-y-3">
                            {filledEducation.map((item, index) => (
                                <div key={`columns-edu-${index}`} className="min-w-0">
                                  <p className="break-words text-[14px] font-semibold leading-5 text-slate-900">
                                    {item.degree || "Degree / Program"}
                                  </p>
                                  <p className="mt-1 break-words text-[14px] font-bold leading-5 text-emerald-700">
                                    {item.institution || "Institution Name"}
                                  </p>
                                  <p className="mt-1.5 text-[11px] text-slate-600">{formatDateRange(item.startDate, item.endDate)}</p>
                                  <p className="break-words text-[11px] text-slate-600">{formData.personalInfo.location || "[Location]"}</p>
                                </div>
                              ))}
                          </div>
                        </section>
                        ) : null}

                        <section>
                          <div className="border-b border-emerald-900 pb-1">
                            <h3 className={templateStyle.sectionTitle}>SKILLS</h3>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-[8%] gap-y-2">
                            {(formData.skills.length
                              ? formData.skills
                              : ["Skill One", "Skill Two", "Skill Three", "Skill Four", "Skill Five", "Skill Six"]
                            ).map((skill, index) => {
                              const label = String(skill || "").trim();
                              const isWideSkill = label.length >= 16;
                              return (
                                <div
                                  key={`columns-skill-${index}-${skill}`}
                                  className={`min-w-0 border-b border-slate-500 pb-1 text-[11px] font-semibold leading-5 text-emerald-900 break-words whitespace-normal ${
                                    isWideSkill ? "basis-full" : "basis-[46%]"
                                  }`}
                                >
                                  {label}
                                </div>
                              );
                            })}
                          </div>
                        </section>
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
                        <span className="break-all">{formData.personalInfo.portfolio || "LinkedIn/Portfolio"}</span>
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

                      {filledEducation.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>EDUCATION</h3>
                        <div className="mt-3 space-y-3">
                          {filledEducation.map((item, index) => (
                                <div key={`enhancv-edu-${index}`} className="grid grid-cols-[96px_18px_minmax(0,1fr)] gap-3">
                                  <div className="text-[11px] leading-[1.5] text-slate-600">
                                    <p className="font-bold text-blue-700">{formatDateRange(item.startDate, item.endDate)}</p>
                                    <p>{formData.personalInfo.location || "Location"}</p>
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

                      {formData.skills.length ? (
                      <section>
                        <h3 className={templateStyle.sectionTitle}>SKILLS</h3>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                          {formData.skills.map((skill, index) => (
                            <span
                              key={`${skill}-enhancv-${index}`}
                              className={`${templateStyle.skill} max-w-full break-words whitespace-normal leading-4`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                      ) : null}
                    </div>
                  </div>
                ) : templateStyle.layout === "creative" ? (
                  <div className="min-h-[672px] overflow-hidden rounded-[1.5rem] border border-slate-200">
                    <div className="grid gap-6 bg-slate-900 px-6 py-6 text-white md:grid-cols-[1fr_180px] md:items-center">
                      <div>
                        <h2 className="text-4xl font-bold tracking-tight text-white">{previewName}</h2>
                        <p className="mt-2 text-xl font-semibold text-white/95">{previewTitle}</p>
                        <div className="mt-4 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
                          <p>{formData.personalInfo.phone || "[Phone Number]"}</p>
                          <p>{formData.personalInfo.email || "[Email]"}</p>
                          <p>{formData.personalInfo.location || "[Location]"}</p>
                          <p>LinkedIn / Portfolio</p>
                        </div>
                      </div>
                      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-white/10">
                        <div className="h-24 w-24 rounded-full border-[6px] border-slate-300/60">
                          <div className="mx-auto mt-4 h-9 w-9 rounded-full border-[5px] border-slate-300/60" />
                          <div className="mx-auto mt-3 h-10 w-16 rounded-t-full border-[5px] border-b-0 border-slate-300/60" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 bg-white px-6 py-7 md:grid-cols-[1.35fr_0.9fr]">
                      <div className="space-y-6">
                        {creativeLeftSections.map((section) => (
                          <section key={section.key}>
                            <div className="border-b-2 border-cyan-800 pb-1">
                              <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-cyan-900">
                                {section.title}
                              </h3>
                            </div>
                            <div className="mt-3 text-sm leading-6">
                              {section.render(templateStyle)}
                            </div>
                          </section>
                        ))}
                      </div>

                      <div className="space-y-6">
                        {creativeRightSections.map((section) => (
                          <section key={section.key}>
                            <div className="border-b-2 border-cyan-800 pb-1">
                              <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-cyan-900">
                                {section.title}
                              </h3>
                            </div>
                            {section.key === "skills" ? (
                              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-semibold text-slate-800">
                                {formData.skills.length ? (
                                  formData.skills.map((skill, index) => (
                                    <span
                                      key={`${skill}-creative-${index}`}
                                      className="min-w-0 break-words border-b border-slate-300 pb-1 whitespace-normal"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-sm text-slate-400">Add skills to populate the preview.</p>
                                )}
                              </div>
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
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-6 text-sm leading-7">
                      {previewSections.map((section) => (
                        <section key={section.key} className="border-b border-slate-200/80 pb-5 last:border-b-0 last:pb-0">
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
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-6 text-sm leading-6">
                      {previewSections.map((section) => (
                        <section key={section.key} className="relative pl-6">
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
                        <div className="grid gap-1 text-right text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          <span>{formData.personalInfo.email || "email@example.com"}</span>
                          <span>{formData.personalInfo.phone || "+91 0000000000"}</span>
                          <span>{formData.personalInfo.location || "Your location"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 text-sm leading-5 lg:grid-cols-2">
                      {previewSections.map((section) => (
                        <section key={section.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
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
                        <span>{formData.personalInfo.location || "Your location"}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5 text-sm leading-6">
                      {previewSections.map((section) => (
                        <section key={section.key}>
                          <h3 className={templateStyle.sectionTitle}>{section.title}</h3>
                          {section.render(templateStyle)}
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default ResumeForm;
