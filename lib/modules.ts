import type { CareModule } from "./types";
import { S } from "./strings";

// Illustrative placeholder data only. QTY = population incidence, AVG CARE =
// example first-year care value. Amounts are demo sums, not personal forecasts,
// insurance quotes, diagnoses, or medical advice. Replace with validated local
// data before any public use.

// Frisco, Texas — cardiometabolic prevention (USD, annual horizon)
const frisco: CareModule = {
  id: "frisco",
  tab: "Frisco",
  languages: ["en", "es"],
  style: "detailed",
  currency: "usd",
  profileTitle: { en: "DEMO PROFILE", es: "PERFIL DEMO" },
  profileLines: [
    { en: "Collin County adults · illustrative", es: "Adultos del condado de Collin · ilustrativo" },
    { en: "Community cost context · annual", es: "Contexto de costo comunitario · anual" },
    { en: "USD · Not a diagnosis", es: "USD · No es un diagnóstico" },
  ],
  items: [
    {
      name: { en: "Type 2 diabetes", es: "Diabetes tipo 2" },
      incidencePer100: 9.5,
      avgCareValue: 12022,
      source: { en: "PLACES 2023 · ADA 2022", es: "PLACES 2023 · ADA 2022" },
    },
    {
      name: { en: "High blood pressure", es: "Presión arterial alta" },
      incidencePer100: 30.4,
      avgCareValue: 2759,
      source: { en: "PLACES 2023 · CDC 2019", es: "PLACES 2023 · CDC 2019" },
    },
  ],
  exposureLabel: { en: "COMMUNITY COST CONTEXT", es: "CONTEXTO DE COSTO COMUNITARIO" },
  exposureCaption: {
    en: "Annual, community-average — not what you will personally pay.",
    es: "Anual, promedio comunitario — no es lo que pagarás personalmente.",
  },
  dataNote: {
    en: "US$ · per-person annual attributable cost × Collin County prevalence. Prevalence: CDC PLACES (2023, model-based small-area estimates). Cost: ADA (2022, diabetes), CDC (2019, hypertension); ranges apply. Small-area estimates are not individual diagnoses. Also: ~34% of Texas adults have prediabetes (DSHS 2023).",
    es: "US$ · costo anual atribuible por persona × prevalencia del condado de Collin. Prevalencia: CDC PLACES (2023, estimaciones de área pequeña basadas en modelos). Costo: ADA (2022, diabetes), CDC (2019, hipertensión); aplican rangos. Las estimaciones de área pequeña no son diagnósticos individuales. Además: ~34% de los adultos de Texas tiene prediabetes (DSHS 2023).",
  },
  prevention: [
    { label: { en: "Blood pressure check", es: "Chequeo de presión arterial" }, cost: "$0–$50" },
    { label: { en: "HbA1c + lipid screening", es: "HbA1c + perfil lipídico" }, cost: "$50–$150" },
    { label: { en: "PHQ-2 depression check", es: "Chequeo de depresión PHQ-2" }, cost: "$0" },
    { label: { en: "Brisk walk, 30 min × 5 days", es: "Caminata rápida, 30 min × 5 días" }, cost: "$0" },
  ],
  referrals: [
    {
      name: { en: "YMCA of Metropolitan Dallas", es: "YMCA del área metropolitana de Dallas" },
      role: { en: "Year-long Diabetes Prevention Program (DPP) + blood-pressure programs", es: "Programa de Prevención de Diabetes (DPP) de un año + programas de presión arterial" },
      access: { en: "Group lifestyle program · check eligibility and cost", es: "Programa grupal de estilo de vida · consulta elegibilidad y costo" },
      url: "https://www.ymcadallas.org/",
    },
    {
      name: { en: "Collin County Health Care Services", es: "Servicios de Salud del Condado de Collin" },
      role: { en: "Public-health prevention and low-income care pathway", es: "Prevención de salud pública y ruta de atención de bajos ingresos" },
      access: { en: "Income-based eligibility · sliding scale", es: "Elegibilidad por ingresos · escala móvil" },
      url: "https://www.collincountytx.gov/healthcare_services",
    },
    {
      name: { en: "Frisco ISD School Health Advisory Committee", es: "Comité Asesor de Salud Escolar de Frisco ISD" },
      role: { en: "Family-health events and community wellness", es: "Eventos de salud familiar y bienestar comunitario" },
      access: { en: "Free community events", es: "Eventos comunitarios gratuitos" },
      url: "https://www.friscoisd.org/",
    },
    {
      name: { en: "Local primary care / community clinic", es: "Atención primaria / clínica comunitaria local" },
      role: { en: "Screening, abnormal-result care, diagnosis, treatment", es: "Detección, atención de resultados anormales, diagnóstico, tratamiento" },
      access: { en: "Bring this receipt · a clinician owns your results", es: "Lleva este recibo · un médico es responsable de tus resultados" },
      url: null,
    },
  ],
  footnote: {
    en: "Community estimates, not individual bills. Amount = Collin County prevalence (CDC PLACES, model-based) × per-person annual attributable cost, matched to an annual horizon; conditions may overlap. Sources and years shown per row. Small-area model estimates are not personal diagnoses; charges are not payments or system costs. Not a diagnosis, insurance quote, or medical advice.",
    es: "Estimaciones comunitarias, no facturas individuales. Monto = prevalencia del condado de Collin (CDC PLACES, basada en modelos) × costo anual atribuible por persona, con horizonte anual; las condiciones pueden superponerse. Fuentes y años por fila. Las estimaciones de área pequeña no son diagnósticos personales; los cargos no son pagos ni costos del sistema. No es un diagnóstico, cotización de seguro ni consejo médico.",
  },
};

// Houston / Harris County, Texas — cardiometabolic prevention (USD, annual).
// Same national per-person cost figures as Frisco; county prevalence differs.
const houston: CareModule = {
  id: "houston",
  tab: "Houston",
  languages: ["en", "es"],
  style: "detailed",
  currency: "usd",
  profileTitle: { en: "DEMO PROFILE", es: "PERFIL DEMO" },
  profileLines: [
    { en: "Harris County adults · illustrative", es: "Adultos del condado de Harris · ilustrativo" },
    { en: "Community cost context · annual", es: "Contexto de costo comunitario · anual" },
    { en: "USD · Not a diagnosis", es: "USD · No es un diagnóstico" },
  ],
  items: [
    {
      name: { en: "Type 2 diabetes", es: "Diabetes tipo 2" },
      incidencePer100: 11.3,
      avgCareValue: 12022,
      source: { en: "PLACES 2023 · ADA 2022 · illustrative", es: "PLACES 2023 · ADA 2022 · ilustrativo" },
    },
    {
      name: { en: "High blood pressure", es: "Presión arterial alta" },
      incidencePer100: 31.7,
      avgCareValue: 2759,
      source: { en: "PLACES 2023 · CDC 2019 · illustrative", es: "PLACES 2023 · CDC 2019 · ilustrativo" },
    },
  ],
  exposureLabel: { en: "COMMUNITY COST CONTEXT", es: "CONTEXTO DE COSTO COMUNITARIO" },
  exposureCaption: {
    en: "Annual, community-average — not what you will personally pay.",
    es: "Anual, promedio comunitario — no es lo que pagarás personalmente.",
  },
  dataNote: {
    en: "US$ · per-person annual attributable cost × Harris County prevalence. Prevalence: CDC PLACES (2023, model-based small-area estimates), shown illustratively. Cost: ADA (2022, diabetes), CDC (2019, hypertension); ranges apply. Small-area estimates are not individual diagnoses.",
    es: "US$ · costo anual atribuible por persona × prevalencia del condado de Harris. Prevalencia: CDC PLACES (2023, estimaciones de área pequeña basadas en modelos), mostradas de forma ilustrativa. Costo: ADA (2022, diabetes), CDC (2019, hipertensión); aplican rangos. Las estimaciones de área pequeña no son diagnósticos individuales.",
  },
  prevention: [
    { label: { en: "Blood pressure check", es: "Chequeo de presión arterial" }, cost: "$0–$50" },
    { label: { en: "HbA1c + lipid screening", es: "HbA1c + perfil lipídico" }, cost: "$50–$150" },
    { label: { en: "PHQ-2 depression check", es: "Chequeo de depresión PHQ-2" }, cost: "$0" },
    { label: { en: "Brisk walk, 30 min × 5 days", es: "Caminata rápida, 30 min × 5 días" }, cost: "$0" },
  ],
  referrals: [
    {
      name: { en: "Harris Health System", es: "Sistema de Salud de Harris" },
      role: { en: "Public hospital district: screening and low-income care pathway", es: "Distrito hospitalario público: detección y ruta de atención de bajos ingresos" },
      access: { en: "Financial-assistance eligibility · sliding scale", es: "Elegibilidad de asistencia financiera · escala móvil" },
      url: "https://www.harrishealth.org/",
    },
    {
      name: { en: "YMCA of Greater Houston", es: "YMCA del área metropolitana de Houston" },
      role: { en: "Diabetes Prevention Program (DPP) + blood-pressure programs", es: "Programa de Prevención de Diabetes (DPP) + programas de presión arterial" },
      access: { en: "Group lifestyle program · check eligibility and cost", es: "Programa grupal de estilo de vida · consulta elegibilidad y costo" },
      url: "https://www.ymcahouston.org/",
    },
    {
      name: { en: "Houston Health Department", es: "Departamento de Salud de Houston" },
      role: { en: "Community clinics and public-health prevention", es: "Clínicas comunitarias y prevención de salud pública" },
      access: { en: "Multi-service centers · check eligibility", es: "Centros multiservicio · consulta elegibilidad" },
      url: "https://www.houstonhealth.org/",
    },
    {
      name: { en: "Local primary care / community clinic", es: "Atención primaria / clínica comunitaria local" },
      role: { en: "Screening, abnormal-result care, diagnosis, treatment", es: "Detección, atención de resultados anormales, diagnóstico, tratamiento" },
      access: { en: "Bring this receipt · a clinician owns your results", es: "Lleva este recibo · un médico es responsable de tus resultados" },
      url: null,
    },
  ],
  footnote: {
    en: "Community estimates, not individual bills. Amount = Harris County prevalence (CDC PLACES, model-based, illustrative) × per-person annual attributable cost, matched to an annual horizon; conditions may overlap. Small-area model estimates are not personal diagnoses. Not a diagnosis, insurance quote, or medical advice.",
    es: "Estimaciones comunitarias, no facturas individuales. Monto = prevalencia del condado de Harris (CDC PLACES, basada en modelos, ilustrativa) × costo anual atribuible por persona, con horizonte anual; las condiciones pueden superponerse. Las estimaciones de área pequeña no son diagnósticos personales. No es un diagnóstico, cotización de seguro ni consejo médico.",
  },
};

// India — anemia action module (signal receipt, no personalized cost).
const india: CareModule = {
  id: "india",
  tab: "India",
  languages: ["en", "hi"],
  style: "condensed",
  currency: "inr",
  profileTitle: { en: "DEMO PROFILE", hi: "डेमो प्रोफ़ाइल" },
  profileLines: [
    { en: "Adult woman, 18-49", hi: "वयस्क महिला, 18-49" },
    { en: "Illustrative population profile", hi: "उदाहरणात्मक जनसंख्या प्रोफ़ाइल" },
    { en: "Anemia understanding · Not a diagnosis", hi: "एनीमिया समझ · निदान नहीं" },
  ],
  items: [],
  signal: {
    signal: {
      en: "Timely hemoglobin (Hb) test recommended. This is not a diagnosis.",
      hi: "समय पर हीमोग्लोबिन (Hb) जांच की सलाह। यह निदान नहीं है।",
    },
    whyItMatters: {
      en: "Anemia is common and often unnoticed — it can lower energy, work capacity, and pregnancy health. Timely testing, iron-rich foods, and a clinician conversation help. Aligned to Anaemia Mukt Bharat.",
      hi: "एनीमिया आम है और अक्सर बिना पहचाने रहता है — यह ऊर्जा, कार्यक्षमता और गर्भावस्था स्वास्थ्य को कम कर सकता है। समय पर जांच, आयरन-युक्त भोजन और चिकित्सक से बातचीत मदद करती है। एनीमिया मुक्त भारत से संरेखित।",
    },
    contextTitle: S.populationContext,
    contextRows: [
      { label: { en: "Women 15-49 anemic (NFHS-5)", hi: "महिलाएं 15-49 एनीमिक (NFHS-5)" }, value: { en: "57.0%", hi: "57.0%" } },
      { label: { en: "Adolescent girls anemic (NFHS-5)", hi: "किशोरियां एनीमिक (NFHS-5)" }, value: { en: "59.1%", hi: "59.1%" } },
      { label: { en: "Children 6-59 mo anemic (NFHS-5)", hi: "बच्चे 6-59 माह एनीमिक (NFHS-5)" }, value: { en: "67.1%", hi: "67.1%" } },
      { label: { en: "National strategy", hi: "राष्ट्रीय रणनीति" }, value: { en: "Anaemia Mukt Bharat", hi: "एनीमिया मुक्त भारत" } },
    ],
  },
  prevention: [
    { label: { en: "Hemoglobin (Hb) test", hi: "हीमोग्लोबिन (Hb) जांच" }, cost: "₹0–₹100" },
    { label: { en: "Iron-rich foods + vitamin C", hi: "आयरन-युक्त भोजन + विटामिन C" }, cost: "₹0" },
    { label: { en: "Iron / folic acid — via clinician", hi: "आयरन / फोलिक एसिड — चिकित्सक द्वारा" }, cost: "low cost" },
    { label: { en: "One clinician conversation", hi: "एक चिकित्सक से बातचीत" }, cost: "PRICELESS" },
  ],
  referrals: [
    {
      name: { en: "Anaemia Mukt Bharat · ASHA / ANM", hi: "एनीमिया मुक्त भारत · आशा / ANM" },
      role: { en: "Government anemia program: Hb testing and iron–folic acid", hi: "सरकारी एनीमिया कार्यक्रम: Hb जांच और आयरन–फोलिक एसिड" },
      access: { en: "Free at public facilities · ask your ASHA worker", hi: "सार्वजनिक केंद्रों पर निःशुल्क · अपनी आशा कार्यकर्ता से पूछें" },
      url: "https://www.anemiamuktbharat.info/",
    },
    {
      name: { en: "Nearest PHC / CHC", hi: "नज़दीकी PHC / CHC" },
      role: { en: "Clinician for Hb testing, result explanation, treatment", hi: "Hb जांच, परिणाम व्याख्या, उपचार के लिए चिकित्सक" },
      access: { en: "Low or no cost · government facility", hi: "कम या निःशुल्क · सरकारी केंद्र" },
      url: null,
    },
    {
      name: { en: "Local partner NGO / clinic", hi: "स्थानीय साझेदार NGO / क्लिनिक" },
      role: { en: "Co-designed testing and follow-up (partner-led)", hi: "सह-डिज़ाइन जांच और फॉलो-अप (साझेदार द्वारा)" },
      access: { en: "Set by the local partner", hi: "स्थानीय साझेदार द्वारा निर्धारित" },
      url: null,
    },
  ],
  footnote: {
    en: "Illustrative population figures (NFHS-5 references), not a diagnosis or personal prediction. Hb testing, result explanation, and any treatment are done only by authorized clinical personnel; iron supplementation is never prescribed by the student team. Align to Anaemia Mukt Bharat. Replace with partner-validated data before public use.",
    hi: "उदाहरणात्मक जनसंख्या आंकड़े (NFHS-5 संदर्भ), निदान या व्यक्तिगत भविष्यवाणी नहीं। Hb जांच, परिणाम व्याख्या और कोई भी उपचार केवल अधिकृत चिकित्सा कर्मियों द्वारा; आयरन अनुपूरण छात्र टीम द्वारा कभी निर्धारित नहीं। एनीमिया मुक्त भारत से संरेखित। सार्वजनिक उपयोग से पहले साझेदार-मान्य डेटा से बदलें।",
  },
};

export const MODULES: CareModule[] = [frisco, houston, india];
