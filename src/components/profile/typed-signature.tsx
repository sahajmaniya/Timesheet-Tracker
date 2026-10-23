"use client";

import { Allura, Caveat, Dancing_Script, Great_Vibes, Mrs_Saint_Delafield, Sacramento } from "next/font/google";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], display: "swap" });
const allura = Allura({ weight: "400", subsets: ["latin"], display: "swap" });
const dancingScript = Dancing_Script({ weight: "500", subsets: ["latin"], display: "swap" });
const sacramento = Sacramento({ weight: "400", subsets: ["latin"], display: "swap" });
const mrsSaintDelafield = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], display: "swap" });
const caveat = Caveat({ weight: "500", subsets: ["latin"], display: "swap" });

const SIGNATURE_STYLES = [
  { id: "formal", label: "Formal", font: mrsSaintDelafield },
  { id: "elegant", label: "Elegant", font: greatVibes },
  { id: "classic", label: "Classic", font: allura },
  { id: "light", label: "Light", font: sacramento },
  { id: "modern", label: "Modern", font: dancingScript },
  { id: "casual", label: "Casual", font: caveat },
] as const;

const INK = "#14286b";

/** Renders the name in a script font to a tightly cropped, transparent PNG. */
function renderSignaturePng(text: string, fontFamily: string) {
  const fontSize = 120;
  const pixelRatio = 2;
  const font = `${fontSize}px ${fontFamily}`;

  const measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = font;
  const metrics = measureCtx.measureText(text);
  const padding = 16;
  const width = Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + padding * 2;
  const height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(pixelRatio, pixelRatio);
  ctx.font = font;
  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, padding + metrics.actualBoundingBoxLeft, padding + metrics.actualBoundingBoxAscent);
  return canvas.toDataURL("image/png");
}

export function TypedSignaturePicker({
  defaultName,
  saving,
  onAdopt,
}: {
  defaultName: string;
  saving: boolean;
  onAdopt: (dataUrl: string) => Promise<void>;
}) {
  const [name, setName] = useState(defaultName);
  const [styleId, setStyleId] = useState<(typeof SIGNATURE_STYLES)[number]["id"]>(SIGNATURE_STYLES[0].id);
  const previewText = name.trim() || "Your Name";

  const adopt = async () => {
    const text = name.trim();
    if (!text) {
      toast.error("Type your name first.");
      return;
    }
    const style = SIGNATURE_STYLES.find((item) => item.id === styleId) ?? SIGNATURE_STYLES[0];
    const fontFamily = style.font.style.fontFamily;
    // The font must be loaded before drawing it onto the canvas.
    await document.fonts.load(`120px ${fontFamily}`, text);
    const dataUrl = renderSignaturePng(text, fontFamily);
    if (!dataUrl) {
      toast.error("Could not create the signature image.");
      return;
    }
    await onAdopt(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="typed-signature-name" className="text-xs text-muted-foreground">
          Your name as it should appear
        </label>
        <Input id="typed-signature-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Signature style">
        {SIGNATURE_STYLES.map((style) => {
          const selected = style.id === styleId;
          return (
            <button
              key={style.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setStyleId(style.id)}
              className={`flex min-w-0 flex-col items-start rounded-lg border bg-white px-3 py-2 text-left transition ${
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-slate-200 hover:border-slate-400 dark:border-slate-500"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{style.label}</span>
              <span
                className={`${style.font.className} block w-full truncate text-2xl leading-[1.4] min-[380px]:text-3xl`}
                style={{ color: INK }}
              >
                {previewText}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => void adopt()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adopt signature"}
        </Button>
      </div>
    </div>
  );
}
