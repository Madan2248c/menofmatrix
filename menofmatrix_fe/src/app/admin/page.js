"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, clearToken, getToken } from "@/lib/auth";

const SECTIONS = [
  ["overview", "Overview"],
  ["news", "Feed news"],
  ["polls", "Community Pulse"],
  ["challenges", "Challenges"],
  ["ideas", "Idea submissions"],
  ["picks", "Idea Board"],
  ["trending", "Trending"],
  ["media", "Media"],
  ["tools", "Tools"],
  ["members", "Members"],
  ["reports", "Reports"],
];

const emptyForms = {
  news: { source: "", title: "", link: "", summary: "", image_url: "", is_featured: false },
  polls: { kind: "opinion", question: "", options: "", status: "draft" },
  challenges: { brief: "", status: "open" },
  picks: { title: "", url: "", blurb: "", category: "", is_featured: false },
  trending: { label: "", url: "", rank: 0, is_active: true },
  media: { outlet: "", quote: "", url: "", logo_url: "" },
  tools: { slug: "", name: "", category: "", icon_url: "" },
};

function Field({ label, ...props }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-neutral-600">
      {label}
      <input {...props} className="rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-sm font-normal text-neutral-900 outline-none transition focus:border-neutral-500" />
    </label>
  );
}

function SectionHeader({ title, count, description }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-600">Content studio</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {count !== undefined && <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">{count}</span>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState("overview");
  const [data, setData] = useState({});
  const [forms, setForms] = useState(emptyForms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const names = ["news", "polls", "challenges", "ideas", "picks", "trending", "media", "tools", "members", "reports"];
    try {
      const responses = await Promise.all(names.map(async (name) => {
        const response = await authFetch(`/api/admin/${name}`);
        if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || `Could not load ${name}`);
        return [name, json.data || []];
      }));
      setData(Object.fromEntries(responses));
    } catch (err) {
      setError(err.message);
      if (err.message.includes("session")) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    load();
  }, [load, router]);

  const updateForm = (key, value) => setForms((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));

  const create = async (event) => {
    event.preventDefault();
    const form = forms[section];
    const payload = { ...form };
    if (section === "polls") payload.options = form.options.split("\n").map((item) => item.trim()).filter(Boolean);
    if (section === "trending") payload.rank = Number(form.rank) || 0;
    setSaving(true); setNotice(""); setError("");
    try {
      const endpoint = section === "tools"
        ? `/api/admin/tools/${encodeURIComponent(payload.slug)}`
        : editing ? `/api/admin/${section}/${editing.id}` : `/api/admin/${section}`;
      const response = await authFetch(endpoint, { method: section === "tools" ? "PUT" : editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Could not save item");
      setNotice("Saved — the public page will use this content on its next fetch.");
      setForms((current) => ({ ...current, [section]: emptyForms[section] }));
      setEditing(null);
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const startEdit = (item) => {
    const template = emptyForms[section];
    if (!template) return;
    setForms((current) => ({
      ...current,
      [section]: Object.fromEntries(Object.keys(template).map((key) => [key, item[key] ?? template[key]])),
    }));
    setEditing(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const update = async (endpoint, body) => {
    const response = await authFetch(endpoint, { method: "PATCH", body: JSON.stringify(body) });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Update failed");
    await load();
  };

  const remove = async (endpoint) => {
    if (!window.confirm("Remove this item?")) return;
    try {
      const response = await authFetch(endpoint, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Remove failed");
      await load();
    } catch (err) { setError(err.message); }
  };

  const counts = useMemo(() => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.length])), [data]);
  const rows = data[section] || [];

  if (loading && !Object.keys(data).length) return <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500">Loading admin studio…</div>;

  return (
    <main className="min-h-dvh bg-[#f5f4f1] px-5 py-6 text-neutral-900 md:px-10 md:py-8">
      <div className="mx-auto flex max-w-7xl gap-6">
        <aside className="hidden w-56 shrink-0 rounded-3xl border border-white/80 bg-white/60 p-3 backdrop-blur-xl md:block">
          <div className="px-3 py-4"><p className="text-lg font-semibold">M<span className="text-orange-600">/</span>M</p><p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Admin studio</p></div>
          <nav className="grid gap-1">
            {SECTIONS.map(([key, label]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${section === key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-white"}`}><span>{label}</span>{counts[key] !== undefined && <span className={section === key ? "text-white/60" : "text-neutral-400"}>{counts[key]}</span>}</button>)}
          </nav>
          <button onClick={() => { clearToken(); router.replace("/login"); }} className="mt-8 px-3 text-xs text-neutral-500 underline">Log out</button>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3 md:hidden"><p className="font-semibold">M<span className="text-orange-600">/</span>M Admin</p><select value={section} onChange={(e) => setSection(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">{SECTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          {error && <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

          {section === "overview" ? <>
            <SectionHeader title="Everything in one place" description="Manage the content that powers the root page, Community Pulse, Idea Board, and Feed." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SECTIONS.slice(1).map(([key, label]) => <button key={key} onClick={() => setSection(key)} className="rounded-3xl border border-white/80 bg-white/65 p-5 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"><p className="text-3xl font-semibold">{counts[key] ?? 0}</p><p className="mt-2 text-sm font-medium">{label}</p><p className="mt-1 text-xs text-neutral-500">Open workspace →</p></button>)}</div>
          </> : <>
            <SectionHeader title={SECTIONS.find(([key]) => key === section)?.[1]} count={rows.length} description="Create new content and update the live catalog." />
            {emptyForms[section] && <form onSubmit={create} className="mb-6 rounded-3xl border border-white/80 bg-white/65 p-5 backdrop-blur-xl"><div className="grid gap-3 md:grid-cols-2">
              {section === "news" && <><Field label="Source" value={forms.news.source} onChange={(e) => updateForm("source", e.target.value)} required placeholder="OpenAI" /><Field label="Title" value={forms.news.title} onChange={(e) => updateForm("title", e.target.value)} required /><Field label="Source URL" value={forms.news.link} onChange={(e) => updateForm("link", e.target.value)} required /><Field label="Image URL (optional)" value={forms.news.image_url} onChange={(e) => updateForm("image_url", e.target.value)} /><label className="grid gap-1 text-xs font-medium text-neutral-600 md:col-span-2">Summary<textarea rows={3} value={forms.news.summary} onChange={(e) => updateForm("summary", e.target.value)} className="rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-sm font-normal outline-none" /></label></>}
              {section === "polls" && <><Field label="Question" value={forms.polls.question} onChange={(e) => updateForm("question", e.target.value)} required placeholder="What matters most right now?" /><Field label="Kind" value={forms.polls.kind} onChange={(e) => updateForm("kind", e.target.value)} placeholder="opinion" /><label className="grid gap-1 text-xs font-medium text-neutral-600 md:col-span-2">Options <textarea required rows={4} value={forms.polls.options} onChange={(e) => updateForm("options", e.target.value)} placeholder="One option per line" className="rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-sm font-normal outline-none" /></label></>}
              {section === "challenges" && <Field label="Brief" value={forms.challenges.brief} onChange={(e) => updateForm("brief", e.target.value)} required placeholder="Build something useful this week" />}
              {section === "picks" && <><Field label="Title" value={forms.picks.title} onChange={(e) => updateForm("title", e.target.value)} required /><Field label="URL" value={forms.picks.url} onChange={(e) => updateForm("url", e.target.value)} /><Field label="Category" value={forms.picks.category} onChange={(e) => updateForm("category", e.target.value)} /><Field label="Blurb" value={forms.picks.blurb} onChange={(e) => updateForm("blurb", e.target.value)} /></>}
              {section === "trending" && <><Field label="Topic" value={forms.trending.label} onChange={(e) => updateForm("label", e.target.value)} required /><Field label="URL" value={forms.trending.url} onChange={(e) => updateForm("url", e.target.value)} /><Field label="Rank" type="number" value={forms.trending.rank} onChange={(e) => updateForm("rank", e.target.value)} /></>}
              {section === "media" && <><Field label="Outlet" value={forms.media.outlet} onChange={(e) => updateForm("outlet", e.target.value)} required /><Field label="URL" value={forms.media.url} onChange={(e) => updateForm("url", e.target.value)} required /><Field label="Quote" value={forms.media.quote} onChange={(e) => updateForm("quote", e.target.value)} /><Field label="Logo URL" value={forms.media.logo_url} onChange={(e) => updateForm("logo_url", e.target.value)} /></>}
              {section === "tools" && <><Field label="Slug" value={forms.tools.slug} onChange={(e) => updateForm("slug", e.target.value)} required /><Field label="Name" value={forms.tools.name} onChange={(e) => updateForm("name", e.target.value)} required /><Field label="Category" value={forms.tools.category} onChange={(e) => updateForm("category", e.target.value)} /><Field label="Icon URL" value={forms.tools.icon_url} onChange={(e) => updateForm("icon_url", e.target.value)} /></>}
            </div><div className="mt-4 flex gap-2"><button disabled={saving} className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Create item"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForms((current) => ({ ...current, [section]: emptyForms[section] })); }} className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium">Cancel</button>}</div></form>}
            <div className="grid gap-2">{rows.map((item, rowIndex) => <div key={item.id ?? item.slug ?? `${section}-${rowIndex}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/55 px-4 py-3 backdrop-blur-xl"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.question || item.brief || item.title || item.label || item.name || item.outlet || item.handle || `${item.entity_type || "Report"} #${item.entity_id || ""}`}</p><p className="mt-1 truncate text-xs text-neutral-500">{item.status || item.category || item.url || item.email || (item.reports ? `${item.reports} reports` : "Catalog item")}</p></div><div className="flex shrink-0 gap-2">{["news", "challenges", "picks", "trending", "media", "tools"].includes(section) && <button onClick={() => startEdit(item)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">Edit</button>}{section === "news" && <button onClick={() => update(`/api/admin/news/${item.id}`, { status: item.status === "published" ? "draft" : "published" })} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">{item.status === "published" ? "Unpublish" : "Publish"}</button>}{section === "polls" && <button onClick={() => update(`/api/admin/polls/${item.id}`, { status: item.status === "live" ? "closed" : "live" })} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">{item.status === "live" ? "Close" : "Publish"}</button>}{section === "challenges" && <button onClick={() => update(`/api/admin/challenges/${item.id}`, { status: item.status === "open" ? "voting" : item.status === "voting" ? "closed" : "open" })} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">Advance</button>}{section === "trending" && <button onClick={() => update(`/api/admin/trending/${item.id}`, { is_active: !item.is_active })} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">{item.is_active ? "Hide" : "Show"}</button>}{section === "members" && <button onClick={() => update(`/api/admin/members/${item.id}`, { is_blocked: !item.is_blocked })} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs">{item.is_blocked ? "Unblock" : "Block"}</button>}{["news", "picks", "media", "trending", "ideas"].includes(section) && <button onClick={() => remove(`/api/admin/${section}/${item.id}`)} className="rounded-full border border-red-100 px-3 py-1.5 text-xs text-red-600">Remove</button>}</div></div>)}</div>
          </>}
        </section>
      </div>
    </main>
  );
}
