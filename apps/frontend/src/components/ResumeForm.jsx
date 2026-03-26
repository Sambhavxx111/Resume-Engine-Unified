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
    name: "text-3xl font-bold tracking-tight text-slate-900",
    title: "mt-1 text-base font-medium text-cyan-700",
    sectionTitle: "text-xs font-bold uppercase tracking-[0.25em] text-slate-500",
    skill: "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700",
  },
  "single-column": {
    layout: "single-column",
    shell: "border-slate-300 bg-white",
    header: "border-b-2 border-slate-900 pb-4",
    name: "text-3xl font-serif font-bold tracking-tight text-slate-900",
    title: "mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700",
    sectionTitle: "text-sm font-bold uppercase tracking-[0.22em] text-slate-800",
    skill: "rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700",
  },
  compact: {
    layout: "compact",
    shell: "border-slate-200 bg-white",
    header: "border-b border-slate-300 pb-4",
    name: "text-[2rem] font-black uppercase tracking-[0.04em] text-slate-900",
    title: "mt-1 text-sm font-semibold text-slate-600",
    sectionTitle: "text-[11px] font-black uppercase tracking-[0.3em] text-slate-700",
    skill: "rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-800",
  },
  creative: {
    layout: "creative",
    shell: "border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50/50",
    header: "border-b border-cyan-100 pb-5",
    name: "text-3xl font-bold tracking-tight text-slate-900",
    title: "mt-1 text-base font-medium text-cyan-800",
    sectionTitle: "text-xs font-bold uppercase tracking-[0.3em] text-cyan-800",
    skill: "rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white",
  },
  timeline: {
    layout: "timeline",
    shell: "border-slate-200 bg-slate-50",
    header: "border-b border-slate-300 pb-5",
    name: "text-3xl font-semibold tracking-tight text-slate-950",
    title: "mt-1 text-sm font-medium uppercase tracking-[0.22em] text-slate-600",
    sectionTitle: "text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700",
    skill: "rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700",
  },
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
            <span key={`${skill}-preview-${index}`} className={templateStyle.skill}>
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

  const previewSections = useMemo(() => {
    const allSections = getPreviewSections(formData);
    const orderMap = {
      contemporary: ["summary", "skills", "experience", "education"],
      "single-column": ["summary", "experience", "education", "skills"],
      compact: ["summary", "experience", "skills", "education"],
      creative: ["skills", "summary", "experience", "education"],
      timeline: ["summary", "experience", "education", "skills"],
    };

    const desiredOrder = orderMap[normalizedTemplate] || orderMap.contemporary;
    const weight = (key) => {
      const index = desiredOrder.indexOf(key);
      return index === -1 ? desiredOrder.length + 1 : index;
    };

    return [...allSections].sort((a, b) => weight(a.key) - weight(b.key));
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
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">ATS-Friendly Templates</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
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
                      ? "border-cyan-300/60 bg-cyan-400/10 shadow-[0_18px_45px_rgba(34,211,238,0.14)]"
                      : "border-white/10 bg-slate-950/40 hover:border-cyan-300/30 hover:bg-slate-900/80"
                  }`}
                >
                  <div className={`mb-4 rounded-[1.4rem] bg-gradient-to-br p-[1px] ${template.accent}`}>
                    <TemplateThumbnail templateId={template.id} />
                  </div>
                  <p className="text-sm font-semibold text-white">{template.name}</p>
                  <p className="mt-2 min-h-[4.75rem] text-xs leading-5 text-slate-300">{template.blurb}</p>
                  <p className="mt-auto pt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-300">
                    {active ? "Selected" : "Use Template"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.7fr_0.95fr_1.35fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">Personal Info</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" name="fullName" placeholder="Full name" value={formData.personalInfo.fullName} onChange={updatePersonalInfo} />
                <input className="field" name="title" placeholder="Professional title" value={formData.personalInfo.title} onChange={updatePersonalInfo} />
                <input className="field" name="email" placeholder="Email" type="email" value={formData.personalInfo.email} onChange={updatePersonalInfo} />
                <input className="field" name="phone" placeholder="Phone" value={formData.personalInfo.phone} onChange={updatePersonalInfo} />
                <input className="field md:col-span-2" name="location" placeholder="Location" value={formData.personalInfo.location} onChange={updatePersonalInfo} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Education</h3>
                <button type="button" className="button-secondary" onClick={() => addCollectionItem("education", blankEducation)}>
                  Add Education
                </button>
              </div>
              <div className="space-y-4">
                {formData.education.map((item, index) => (
                  <div key={`education-${index}`} className="rounded-2xl border border-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-cyan-200">Entry {index + 1}</p>
                      <button type="button" className="text-sm text-rose-200 transition hover:text-rose-100" onClick={() => removeCollectionItem("education", index)}>
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

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Experience</h3>
                <button type="button" className="button-secondary" onClick={() => addCollectionItem("experience", blankExperience)}>
                  Add Experience
                </button>
              </div>
              <div className="space-y-4">
                {formData.experience.map((item, index) => (
                  <div key={`experience-${index}`} className="rounded-2xl border border-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-cyan-200">Role {index + 1}</p>
                      <button type="button" className="text-sm text-rose-200 transition hover:text-rose-100" onClick={() => removeCollectionItem("experience", index)}>
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

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Additional Sections</h3>
                <button type="button" className="button-secondary" onClick={addCustomSection}>
                  Add Section
                </button>
              </div>
              <div className="space-y-4">
                {formData.customSections?.length ? (
                  formData.customSections.map((section, sectionIndex) => (
                    <div
                      key={`custom-section-${sectionIndex}`}
                      className="rounded-2xl border border-white/10 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-cyan-200">Custom Section {sectionIndex + 1}</p>
                        <button
                          type="button"
                          className="text-sm text-rose-200 transition hover:text-rose-100"
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
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">Professional Summary</h3>
              <textarea className="field min-h-44" placeholder="Write a concise, impact-focused professional summary" value={formData.summary} onChange={(event) => setFormData((prev) => ({ ...prev, summary: event.target.value }))} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">Skills</h3>
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
                <button type="button" className="button-primary" onClick={addSkill}>
                  Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.skills.length ? (
                  formData.skills.map((skill, index) => (
                    <button key={`${skill}-${index}`} type="button" className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100" onClick={() => removeSkill(index)}>
                      {skill} x
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills added yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-slate-900 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Ready to ship</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Save once, reuse across ATS analysis and job matching
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The selected template is saved with your resume and used for the live preview and PDF download.
              </p>
              <button type="button" className="button-primary mt-6 w-full" disabled={loading} onClick={onSave}>
                {loading ? <Loader label="Saving resume..." /> : "Save Resume"}
              </button>
            </div>

            {aiInsights ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">{aiInsights.title}</h3>
                <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
                  {aiInsights.lines.map((line, index) => (
                    <div
                      key={`${aiInsights.title}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Live Preview</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                {TEMPLATE_OPTIONS.find((template) => template.id === formData.template)?.name ||
                  TEMPLATE_OPTIONS.find((template) => template.id === normalizedTemplate)?.name ||
                  "Contemporary"}
              </p>
              <div
                ref={previewRef}
                className={`mt-4 min-h-[720px] rounded-[1.75rem] border p-6 text-slate-900 shadow-2xl ${templateStyle.shell}`}
              >
                {templateStyle.layout === "creative" ? (
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
                                      className="border-b border-slate-300 pb-1"
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
