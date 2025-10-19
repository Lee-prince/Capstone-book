"use client";
import { useState } from "react";
import PagePreview from "@/components/PagePreview";

const wc = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function plainPaste(e: React.ClipboardEvent<any>) {
  e.preventDefault();
  const text = e.clipboardData.getData("text/plain")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n");
  const target = e.target as HTMLTextAreaElement | HTMLInputElement;
  const s = target.selectionStart ?? target.value.length;
  const epos = target.selectionEnd ?? s;
  target.setRangeText(text, s, epos, "end");
}

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
    headshotUrl: "", // data URL preview for now
  });
  const [msg, setMsg] = useState("");

  const set = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  // Image upload + center-crop to 5:6 and resize to 1200x1440
  async function onHeadshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg("Image must be ≤ 5 MB."); return; }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: W, naturalHeight: H } = img;
      if (W < 1200 || H < 1440) { setMsg("Image must be at least 1200×1440 px."); URL.revokeObjectURL(url); return; }
      const targetW = 1200, targetH = 1440, targetRatio = targetW / targetH; // 5:6

      const srcRatio = W / H;
      let sx = 0, sy = 0, sw = W, sh = H;
      if (srcRatio > targetRatio) {
        // source is wider: crop left/right
        sh = H;
        sw = H * targetRatio;
        sx = (W - sw) / 2;
      } else {
        // source is taller: crop top/bottom
        sw = W;
        sh = W / targetRatio;
        sy = (H - sh) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          if (!blob) { setMsg("Failed to process image."); return; }
          const previewUrl = URL.createObjectURL(blob);
          setForm((p: any) => ({ ...p, headshotUrl: previewUrl }));
          setMsg("Headshot ok (cropped to 1200×1440).");
        },
        "image/jpeg",
        0.92
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setMsg("Could not read image."); URL.revokeObjectURL(url); };
    img.src = url;
  }

  function validate() {
    if (!form.email || !form.full_name || !form.program || !form.project_title) {
      alert("Please fill Email, Full Name, Program, and Project Title.");
      return false;
    }
    if (wc(form.bio) < 120 || wc(form.bio) > 150) { alert("Bio must be 120–150 words."); return false; }
    if (wc(form.summary) < 150 || wc(form.summary) > 180) { alert("Project Summary must be 150–180 words."); return false; }
    if (!form.headshotUrl) { alert("Please upload a headshot (will be cropped to 5:6)."); return false; }
    return true;
  }

  function saveLocally() {
    if (!validate()) return;
    localStorage.setItem("capstoneDraft", JSON.stringify(form));
    alert("Saved locally. (Next we’ll wire the cloud save.)");
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Capstone Page — Student Form</h1>
        <p className="text-sm text-neutral-600">Pasting from Word/Docs is OK — formatting is removed.</p>

        <label className="block text-sm font-medium">Email *</label>
        <input className="border rounded px-3 py-2 w-full" value={form.email} onChange={set("email")} />

        <label className="block text-sm font-medium">Full Name *</label>
        <input className="border rounded px-3 py-2 w-full" value={form.full_name} onChange={set("full_name")} onPaste={plainPaste} maxLength={60} />

        <label className="block text-sm font-medium">Program / Course *</label>
        <select className="border rounded px-3 py-2 w-full" value={form.program} onChange={set("program")}>
          <option value="">Select…</option>
          <option>MHA — Health Administration</option>
          <option>MS — Health Informatics</option>
        </select>

        <label className="block text-sm font-medium">Capsone Title *</label>
        <input className="border rounded px-3 py-2 w-full" value={form.project_title} onChange={set("project_title")} onPaste={plainPaste} maxLength={120} />

        <label className="block text-sm font-medium">Bio (120–150 words) *</label>
        <textarea className="border rounded px-3 py-2 w-full" rows={7} value={form.bio} onChange={set("bio")} onPaste={plainPaste} />

        <label className="block text-sm font-medium">Project Summary (150–180 words) *</label>
        <textarea className="border rounded px-3 py-2 w-full" rows={9} value={form.summary} onChange={set("summary")} onPaste={plainPaste} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Cell phone</label>
            <input className="border rounded px-3 py-2 w-full" value={form.contact_phone} onChange={set("contact_phone")} onPaste={plainPaste} />
          </div>
          <div>
            <label className="block text-sm font-medium">GMU email</label>
            <input className="border rounded px-3 py-2 w-full" value={form.contact_gmu} onChange={set("contact_gmu")} onPaste={plainPaste} />
          </div>
          <div>
            <label className="block text-sm font-medium">Personal email</label>
            <input className="border rounded px-3 py-2 w-full" value={form.contact_personal} onChange={set("contact_personal")} onPaste={plainPaste} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Headshot (will be center-cropped to 5:6 and resized to 1200×1440) *</label>
          <input type="file" accept="image/*" onChange={onHeadshotChange} className="block" />
          <p className="text-xs text-neutral-600 mt-1">{msg}</p>
        </div>

        <button onClick={saveLocally} className="bg-black text-white px-4 py-2 rounded">Save (local)</button>
      </section>

      {/* Preview – print identical */}
      <section>
        <PagePreview data={form} />
      </section>
    </div>
  );
}
