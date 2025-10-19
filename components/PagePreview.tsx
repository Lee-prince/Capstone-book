type Data = {
  full_name?: string;
  program?: string;
  project_title?: string;
  bio?: string;
  summary?: string;
  headshotUrl?: string;
  contact_phone?: string;
  contact_gmu?: string;
  contact_personal?: string;
};

const WRAP = {
  /* preserve user newlines from textareas */
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  overflowWrap: "anywhere" as const,
};

/** line-clamp helper for inline styles (WebKit + modern Chromium/Firefox) */
function clamp(lines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: String(lines),
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

/* US Letter in inches, exact content box is 10.00in high with 0.5in margins */
const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11.0;
const PAD_IN = 0.5;
const GREEN_IN = 0.25;
const HEADER_H_IN = 2.8;   /* fits 2.0 × 2.4 headshot */
const CONTACT_H_IN = 1.0;
const GAP_IN = 0.12;
const CONTENT_H_IN = PAGE_H_IN - 2 * PAD_IN; /* 10.00in */
const MID_H_IN =
  CONTENT_H_IN - (GREEN_IN + HEADER_H_IN + CONTACT_H_IN + 3 * GAP_IN);

export default function PagePreview({ data }: { data: Data }) {
  const name = data.full_name || "Full Name";
  const program = data.program || "MHA — Health Administration";
  const title = data.project_title || "Capstone Title";
  const bio = data.bio || "";
  const summary = data.summary || "";
  const phone = data.contact_phone || "(xxx) xxx-xxxx";
  const gmu = data.contact_gmu || "name@gmu.edu";
  const personal = data.contact_personal || "name@email.com";

  return (
    <div
      className="bg-white shadow mx-auto"
      style={{ width: `${PAGE_W_IN}in`, height: `${PAGE_H_IN}in` }}
    >
      <div
        style={{
          padding: `${PAD_IN}in`,
          height: `${CONTENT_H_IN}in`,
          display: "grid",
          gridTemplateRows: `${GREEN_IN}in ${HEADER_H_IN}in ${MID_H_IN}in ${CONTACT_H_IN}in`,
          rowGap: `${GAP_IN}in`,
          fontFamily: "Poppins, system-ui, Arial, sans-serif",
        }}
      >
        {/* Mason green bar */}
        <div style={{ background: "#006633" }} />

        {/* Header band */}
        <div style={{ border: "1px solid #111", padding: "0.18in" }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "2.6in 1fr",
              columnGap: "0.18in",
              alignItems: "center",
              height: "100%",
            }}
          >
            {/* Headshot frame */}
            <div
              style={{
                width: "2.6in",
                height: "2.6in",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  width: "2.0in",
                  height: "2.4in",
                  border: "1px solid #ddd",
                  overflow: "hidden",
                  background: "#f5f5f5",
                }}
              >
                {data.headshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.headshotUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[10pt] text-neutral-500">
                    2.0″ × 2.4″ photo
                  </div>
                )}
              </div>
            </div>

            {/* Name / Program / Title — centered and clamped */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6pt",
                height: "100%",
                justifyContent: "center",  // vertical centering in header
                alignItems: "center",       // horizontal centering
                textAlign: "center",        // center each line
                minWidth: 0,                // allow clamps to work inside grid
              }}
            >
              {/* Name: bold, max 2 lines */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "20pt",
                  lineHeight: 1.2,
                  ...WRAP,
                  ...clamp(2),
                  maxWidth: "100%",
                }}
              >
                {name}
              </div>

              {/* Program (single line typical; will wrap if needed) */}
              <div style={{ fontWeight: 600, fontSize: "11pt", ...WRAP, maxWidth: "100%" }}>
                {program}
              </div>

              {/* Capstone Title: italic, not bold, max 3 lines */}
              <div
                style={{
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "12pt",
                  lineHeight: 1.25,
                  ...WRAP,
                  ...clamp(3),
                  maxWidth: "100%",
                }}
              >
                {title}
              </div>

              <div style={{ fontWeight: 600, fontSize: "11pt" }}>
                George Mason University
              </div>
            </div>
          </div>
        </div>

        {/* Mid section: two strict-height columns */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 0.20in 1fr", height: "100%" }}>
          <div
            id="bio-box"
            style={{
              border: "1px solid #111",
              padding: "0.22in",
              paddingBottom: "0.18in",
              fontSize: "11pt",
              lineHeight: 1.35,
              textAlign: "left",      // left align for print consistency
              height: "100%",
              overflow: "hidden",
              ...WRAP,
            }}
          >
            {bio}
          </div>
          <div />
          <div
            id="summary-box"
            style={{
              border: "1px solid #111",
              padding: "0.22in",
              paddingBottom: "0.18in",
              fontSize: "11pt",
              lineHeight: 1.35,
              textAlign: "left",
              height: "100%",
              overflow: "hidden",
              ...WRAP,
            }}
          >
            {summary}
          </div>
        </div>

        {/* Contact row (strict height) */}
        <div
          style={{
            border: "1px solid #111",
            padding: "0.16in",
            paddingBottom: "0.22in",
            fontSize: "10pt",
            display: "grid",
            gridTemplateColumns: "1.8in minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
            columnGap: "0.18in",
            height: "100%",
            overflow: "hidden",
            alignItems: "start",
          }}
        >
          <div style={{ fontWeight: 700 }}>Contact Information:</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Cell phone</div>
            <div style={{ ...WRAP }}>{phone}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>GMU email</div>
            <div style={{ ...WRAP }}>{gmu}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Personal email</div>
            <div style={{ ...WRAP }}>{personal}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
