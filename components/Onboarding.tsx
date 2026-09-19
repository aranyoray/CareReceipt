"use client";

import { useState } from "react";
import { type Lang, type LStr, LANG_SHORT, tr } from "@/lib/i18n";
import { S } from "@/lib/strings";
import { Segmented } from "./ReceiptTab";

interface Point {
  icon: string;
  title: LStr;
  body: LStr;
}

const POINTS: Point[] = [
  {
    icon: "🧾",
    title: { en: "A receipt, not a diagnosis", es: "Un recibo, no un diagnóstico", hi: "रसीद, निदान नहीं" },
    body: {
      en: "CareReceipt shows population risk and one affordable next step. It is not a diagnosis.",
      es: "CareReceipt muestra el riesgo poblacional y un próximo paso asequible. No es un diagnóstico.",
      hi: "CareReceipt जनसंख्या जोखिम और एक किफ़ायती अगला कदम दिखाता है। यह निदान नहीं है।",
    },
  },
  {
    icon: "💲",
    title: { en: "Community context, not your bill", es: "Contexto comunitario, no tu factura", hi: "समुदाय संदर्भ, आपका बिल नहीं" },
    body: {
      en: "Cost figures describe populations — not what you will personally pay.",
      es: "Las cifras de costo describen poblaciones — no lo que pagarás personalmente.",
      hi: "लागत आंकड़े जनसंख्या का वर्णन करते हैं — वह नहीं जो आप स्वयं चुकाएंगे।",
    },
  },
  {
    icon: "🔒",
    title: { en: "Private by design", es: "Privado por diseño", hi: "डिज़ाइन से निजी" },
    body: {
      en: "No account. No ads. No tracking. Everything is computed on this device and shared with no one.",
      es: "Sin cuenta. Sin anuncios. Sin rastreo. Todo se calcula en este dispositivo y no se comparte con nadie.",
      hi: "कोई खाता नहीं। कोई विज्ञापन नहीं। कोई ट्रैकिंग नहीं। सब कुछ इसी डिवाइस पर गणना होता है और किसी से साझा नहीं।",
    },
  },
  {
    icon: "⚠️",
    title: { en: "Illustrative data", es: "Datos ilustrativos", hi: "उदाहरणात्मक डेटा" },
    body: {
      en: "Cost figures are sourced examples for a prototype; US Risk prevalence comes from CDC survey microdata. A licensed clinician owns any results, diagnosis, and treatment.",
      es: "Las cifras de costo son ejemplos con fuentes para un prototipo; la prevalencia de US Risk proviene de microdatos de encuestas de los CDC. Un médico con licencia es responsable de cualquier resultado, diagnóstico y tratamiento.",
      hi: "लागत आंकड़े प्रोटोटाइप के लिए स्रोत-आधारित उदाहरण हैं; US Risk की व्यापकता CDC सर्वेक्षण माइक्रोडेटा से आती है। किसी भी परिणाम, निदान और उपचार का दायित्व लाइसेंस प्राप्त चिकित्सक का है।",
    },
  },
];

const BUTTON: LStr = { en: "I understand", es: "Entiendo", hi: "मैं समझता हूँ" };

export function Onboarding({ onAccept }: { onAccept: (lang: Lang) => void }) {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <div style={{ fontSize: 44, color: "var(--rc-orange)" }}>❤️</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>CareReceipt</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{tr(S.tagline, lang)}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 150, marginTop: 12 }}>
            <Segmented
              options={(["en", "es", "hi"] as Lang[]).map((l) => ({ id: l, label: LANG_SHORT[l] }))}
              value={lang}
              onChange={(id) => setLang(id as Lang)}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 36 }}>
          {POINTS.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              <div style={{ fontSize: 22, width: 30, textAlign: "center" }}>{p.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{tr(p.title, lang)}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                  {tr(p.body, lang)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <button
          onClick={() => onAccept(lang)}
          style={{
            width: "100%",
            background: "var(--rc-orange)",
            color: "var(--rc-teal-deep)",
            fontSize: 16,
            fontWeight: 700,
            padding: "16px",
            borderRadius: 12,
          }}
        >
          {tr(BUTTON, lang)}
        </button>
      </div>
    </div>
  );
}
