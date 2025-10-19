"use client";
import { useMemo, useState } from "react";
import PagePreview from "@/components/PagePreview";

// ---------------- helpers ----------------
const wc = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Plain-text paste that also notifies React (so the preview updates immediately). */
function plainPaste(e: React.ClipboardEvent<any>) {
  e.preventDefault();
  const text = e.clipboardData
    .getData("text/plain")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n");

  const target = e.target as HTMLTextAreaElement | HTMLInputElement;
  const s = target.selectionStart ?? target.value.length;
  const epos = target.selectionEnd ?? s;
  target.setRangeText(text, s, epos, "end");

  // Important: tell React the value changed so state updates immediately.
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

// Trim to max words (keeps whole words)
function trimToMaxWords(input: string, max: number): string {
  const rawWords = input.replace(/\n/g, " ").trim().split(/\s+/).filter(Boolean);
  if (rawWords.length <= max) return input;
  let i = 0, words = 0, inWord = false;
  while (i < input.length && words < max) {
    const ch = input[i];
    if (/\s/.test(ch)) inWord = false;
    else if (!inWord) { inWord = true; words++; }
    i++;
  }
  return input.slice(0, i).replace(/\s+$/, "");
}

// phone/email
const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 10);
const phoneFmt = (d: string) =>
  d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
const isGmu = (s: string) => /^\S+@gmu\.edu$/i.test(s.trim());
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// ---------------- word limits ----------------
const BIO_MIN = 120, BIO_MAX = 170;   // fits your 5.59" column with 11pt/1.35
const SUM_MIN = 150, SUM_MAX = 170;

// ---------------- fit-to-box (exact) ----------------
function fitToPreviewBox(boxId: "bio-box" | "summary-box", text: string): string {
  const box = document.getElementById(boxId);
  if (!box) return text;

  const cs = getComputedStyle(box);
  const padL = parseFloat(cs.paddingLeft || "0");
  const padR = parseFloat(cs.paddingRight || "0");
  const padT = parseFloat(cs.paddingTop || "0");
  const padB = parseFloat(cs.paddingBottom || "0");

  const contentW = box.clientWidth - padL - padR;
  const contentH = box.clientHeight - padT - padB;

  const meas = document.createElement("div");
  meas.style.position = "absolute";
  meas.style.left = "-100000px";
  meas.style.top = "0";
  meas.style.visibility = "hidden";
  meas.style.boxSizing = "content-box";
  meas.style.width = `${contentW}px`;
  meas.style.height = `${contentH}px`;

  // mirror the preview’s text settings EXACTLY
  meas.style.fontFamily = cs.fontFamily || "Poppins,system-ui,Arial,sans-serif";
  meas.style.fontSize = cs.fontSize;
  meas.style.lineHeight = cs.lineHeight;
  meas.style.fontWeight = cs.fontWeight;
  meas.style.textAlign = cs.textAlign;

  // keep newlines, allow natural wrapping
  meas.style.whiteSpace = "pre-wrap";
  (meas.style as any).wordBreak = "break-word";
  (meas.style as any).overflowWrap = "anywhere";

  meas.style.overflow = "auto";
  document.body.appendChild(meas);

  const words = text.trim().split(/\s+/);
  if (!words.length) { document.body.removeChild(meas); return ""; }

  const fits = (k: number) => {
    meas.textContent = words.slice(0, k).join(" ");
    return meas.scrollHeight <= meas.clientHeight;
  };

  if (fits(words.length)) {
    document.body.removeChild(meas);
    return words.join(" ");
  }

  let lo = 0, hi = words.length, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (mid === 0) { lo = 1; continue; }
    if (fits(mid)) { best = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }

  const out = words.slice(0, best).join(" ");
  document.body.removeChild(meas);
  return out;
}

// ---------------- component ----------------
export default function SubmitPage() {
  const [form, setForm] = useState<any>({
    email: "",
    full_name: "",
    program: "",
    project_title: "",
    bio: "",
    summary: "",
    contact_phone: "",
    contact_gmu: "",
    contact_personal: "",
    headshotUrl: "",
    headshotName: "",
  });

  const bioCount = useMemo(() => wc(form.bio), [form.bio]);
  const sumCount = useMemo(() => wc(form.summary), [form.summary]);
  const bioOk = bioCount >= BIO_MIN && bioCount <= BIO_MAX;
  const sumOk = sumCount >= SUM_MIN && sumCount <= SUM_MAX;

  const errors = useMemo(
    () => ({
      gmu: form.contact_gmu ? !isGmu(form.contact_gmu) : false,
      personal: form.contact_personal ? !isEmail(form.contact_personal) : false,
      phone: form.contact_phone ? onlyDigits(form.contact_phone).length !== 10 : false,
    }),
    [form.contact_gmu, form.contact_personal, form.contact_phone]
  );

  const set = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  // STRICT: cap by words, then fit to the preview box (no overflow possible)
  const onBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const capped = trimToMaxWords(e.target.value, BIO_MAX);
    const fitted = fitToPreviewBox("bio-box", capped);
    setForm((p: any) => ({ ...p, bio: fitted }));
  };

  const onSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const capped = trimToMaxWords(e.target.value, SUM_MAX);
    const fitted = fitToPreviewBox("summary-box", capped);
    setForm((p: any) => ({ ...p, summary: fitted }));
  };

  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p: any) => ({ ...p, contact_phone: phoneFmt(onlyDigits(e.target.value)) }));

  // Headshot upload → instant preview + 5:6 crop/resize to 1200×1440
  async function onHeadshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\//.test(file.type)) { alert("Upload an image file (JPG/PNG)."); return; }
    if (file.size > 20 * 1024 * 1024) { alert("Image must be ≤ 20 MB."); return; }

    setForm((p:any) => ({ ...p, headshotName: file.name }));

    // Show something immediately
    const rawUrl = URL.createObjectURL(file);
    setForm((p: any) => ({ ...p, headshotUrl: rawUrl }));

    // Process to exact 5:6 and high-res for print
    const targetW = 1200, targetH = 1440;
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const r = targetW / targetH;   // 0.8333…
      const sr = W / H;

      // Center-crop to 5:6
      let sx = 0, sy = 0, sw = W, sh = H;
      if (sr > r) { sw = H * r; sx = (W - sw) / 2; }    // too wide → crop sides
      else        { sh = W / r; sy = (H - sh) / 2; }    // too tall → crop top/bottom

      const c = document.createElement("canvas");
      c.width = targetW; c.height = targetH;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      c.toBlob((blob) => {
        if (blob) {
          const processedUrl = URL.createObjectURL(blob);
          setForm((p: any) => ({ ...p, headshotUrl: processedUrl }));
        } else {
          const dataUrl = c.toDataURL("image/jpeg", 0.92);
          setForm((p: any) => ({ ...p, headshotUrl: dataUrl }));
        }
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => { alert("Could not read image."); };
    img.src = rawUrl;

    // allow re-selecting the same file later
    e.currentTarget.value = "";
  }

  function saveLocally() {
    if (!form.email || !form.full_name || !form.program || !form.project_title) { alert("Fill required fields."); return; }
    if (!bioOk) { alert(`Bio must be ${BIO_MIN}–${BIO_MAX} words.`); return; }
    if (!sumOk) { alert(`Project Summary must be ${SUM_MIN}–${SUM_MAX} words.`); return; }
    if (!form.headshotUrl) { alert("Upload a headshot."); return; }
    if (errors.phone || errors.gmu || errors.personal) { alert("Fix contact fields."); return; }
    localStorage.setItem("capstoneDraft", JSON.stringify(form));
    alert("Saved locally.");
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 font-[Poppins,system-ui,Arial,sans-serif]">
      {/* Form */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Capstone Page — Student Form</h1>
        <p className="text-sm text-neutral-600">Pasting from Word/Docs is OK — formatting is removed.</p>

        <label className="block text-sm font-medium">Email *</label>
        <input className="border rounded px-3 py-2 w-full" placeholder="your@email.com" value={form.email} onChange={set("email")} onPaste={plainPaste} />

        <label className="block text-sm font-medium">Full Name *</label>
        <input className="border rounded px-3 py-2 w-full" placeholder="First Last" value={form.full_name} onChange={set("full_name")} onPaste={plainPaste} maxLength={120} />

        <label className="block text-sm font-medium">Program / Course *</label>
        <select className="border rounded px-3 py-2 w-full" value={form.program} onChange={set("program")}>
          <option value="">Select…</option>
          <option>MHA — Health Administration</option>
          <option>MS — Health Informatics</option>
        </select>

        <label className="block text-sm font-medium">Capstone Title *</label>
        <input className="border rounded px-3 py-2 w-full" placeholder="Your capstone title" value={form.project_title} onChange={set("project_title")} onPaste={plainPaste} maxLength={200} />

        <div>
          <label className="block text-sm font-medium">Bio ({BIO_MIN}–{BIO_MAX} words) *</label>
          <textarea
            className={`border rounded px-3 py-2 w-full ${bioOk ? "" : "border-red-500"}`}
            rows={7}
            placeholder="Write your bio here…"
            value={form.bio}
            onChange={onBioChange}
            onPaste={plainPaste}
          />
          <p className={`text-xs mt-1 ${bioCount <= BIO_MAX ? "text-neutral-600" : "text-red-600"}`}>
            {bioCount} / {BIO_MIN}–{BIO_MAX} words
            {bioCount >= BIO_MAX && <span className="ml-2 font-medium">Max word limit reached</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Project Summary ({SUM_MIN}–{SUM_MAX} words) *</label>
          <textarea
            className={`border rounded px-3 py-2 w-full ${sumOk ? "" : "border-red-500"}`}
            rows={9}
            placeholder="Describe your project…"
            value={form.summary}
            onChange={onSummaryChange}
            onPaste={plainPaste}
          />
          <p className={`text-xs mt-1 ${sumCount <= SUM_MAX ? "text-neutral-600" : "text-red-600"}`}>
            {sumCount} / {SUM_MIN}–{SUM_MAX} words
            {sumCount >= SUM_MAX && <span className="ml-2 font-medium">Max word limit reached</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Cell phone (123-456-7890)</label>
            <input
              className={`border rounded px-3 py-2 w-full ${errors.phone ? "border-red-500" : ""}`}
              placeholder="123-456-7890"
              value={form.contact_phone}
              onChange={onPhone}
              onPaste={plainPaste}
              inputMode="numeric"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">Phone must be 10 digits.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">GMU email (@gmu.edu)</label>
            <input
              className={`border rounded px-3 py-2 w-full ${errors.gmu ? "border-red-500" : ""}`}
              placeholder="name@gmu.edu"
              value={form.contact_gmu}
              onChange={set("contact_gmu")}
              onPaste={plainPaste}
            />
            {errors.gmu && <p className="text-xs text-red-600 mt-1">GMU email must end with @gmu.edu</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Personal email (@…)</label>
            <input
              className={`border rounded px-3 py-2 w-full ${errors.personal ? "border-red-500" : ""}`}
              placeholder="name@gmail.com"
              value={form.contact_personal}
              onChange={set("contact_personal")}
              onPaste={plainPaste}
            />
            {errors.personal && <p className="text-xs text-red-600 mt-1">Enter a valid email address</p>}
          </div>
        </div>

        {/* Headshot upload — bullet-proof button driving a hidden file input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Headshot (JPG/PNG, ≥1200×1440; will be center-cropped to 5:6)
          </label>

          {/* Hidden native file input */}
          <input
            id="headshot-input"
            type="file"
            accept="image/*"
            onChange={onHeadshot}
            className="hidden"
          />

          {/* Visible button (label) that opens the hidden input */}
          <label
            htmlFor="headshot-input"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                (document.getElementById("headshot-input") as HTMLInputElement | null)?.click();
                e.preventDefault();
              }
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded text-white font-medium shadow-sm cursor-pointer select-none"
            style={{ backgroundColor: "#005239" }}  // Mason green
            aria-label="Upload headshot"
          >
            Upload headshot
          </label>

          <span className="ml-3 text-sm text-neutral-700 align-middle">
            {form.headshotName || "No file chosen"}
          </span>
        </div>

        <button onClick={saveLocally} className="bg-black text-white px-4 py-2 rounded">Save (local)</button>
      </section>

      {/* Preview */}
      <section>
        <PagePreview data={form} />
      </section>
    </div>
  );
}
