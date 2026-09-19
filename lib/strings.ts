import type { LStr } from "./i18n";

/** Fixed receipt chrome, localized. Item/prevention text lives in modules.ts. */
export const S = {
  done: { en: "Done", es: "Listo", hi: "पूर्ण" },
  title: { en: "CARE RECEIPT", es: "RECIBO DE CUIDADO", hi: "केयर रसीद" },
  tagline: {
    en: "THE BILL BEFORE THE BILL",
    es: "LA CUENTA ANTES DE LA CUENTA",
    hi: "बिल से पहले का बिल",
  },
  demoStamp: {
    en: "DEMO · NOT A BILL",
    es: "DEMO · NO ES FACTURA",
    hi: "डेमो · बिल नहीं",
  },
  colItem: { en: "ITEM", es: "CONCEPTO", hi: "मद" },
  colQty: { en: "QTY", es: "CANT", hi: "मात्रा" },
  colCare: { en: "AVG CARE", es: "CUIDADO", hi: "औसत" },
  colAmt: { en: "AMT", es: "MONTO", hi: "राशि" },
  inWord: { en: "in", es: "en", hi: "में" },
  todaysSignal: { en: "TODAY'S SIGNAL", es: "SEÑAL DE HOY", hi: "आज का संकेत" },
  whyItMatters: {
    en: "WHY IT MATTERS",
    es: "POR QUÉ IMPORTA",
    hi: "यह क्यों मायने रखता है",
  },
  populationContext: {
    en: "POPULATION CONTEXT",
    es: "CONTEXTO POBLACIONAL",
    hi: "जनसंख्या संदर्भ",
  },
  preventionTitle: {
    en: "PREVENTION RECEIPT",
    es: "RECIBO DE PREVENCIÓN",
    hi: "रोकथाम रसीद",
  },
  payToday: {
    en: "PAY TODAY: ATTENTION",
    es: "PAGA HOY: ATENCIÓN",
    hi: "आज दें: ध्यान",
  },
  nextStep: {
    en: "NEXT STEP: KNOW YOUR NUMBERS",
    es: "PRÓXIMO PASO: CONOCE TUS CIFRAS",
    hi: "अगला कदम: अपने आंकड़े जानें",
  },
  privacyTitle: { en: "PRIVACY", es: "PRIVACIDAD", hi: "गोपनीयता" },
  privacyBody: {
    en: "No account. No ads. Computed on this device. Nothing shared with school, employer, or insurer.",
    es: "Sin cuenta. Sin anuncios. Calculado en este dispositivo. Nada se comparte con escuela, empleador o aseguradora.",
    hi: "कोई खाता नहीं. कोई विज्ञापन नहीं. इसी डिवाइस पर गणना. स्कूल, नियोक्ता या बीमाकर्ता से कुछ साझा नहीं.",
  },
  takeToClinician: {
    en: "Take this receipt to a clinician if you have concerns.",
    es: "Lleva este recibo a un médico si tienes dudas.",
    hi: "चिंता हो तो यह रसीद किसी चिकित्सक को दिखाएं।",
  },
  exploreCta: {
    en: "Scan to explore prevention",
    es: "Escanea para explorar prevención",
    hi: "रोकथाम जानने के लिए स्कैन करें",
  },
  findCareCta: {
    en: "Find local care  ›",
    es: "Buscar atención local  ›",
    hi: "स्थानीय देखभाल खोजें  ›",
  },
  referralTitle: { en: "Local pathways", es: "Rutas locales", hi: "स्थानीय रास्ते" },
  referralDisclaimer: {
    en: "Pathways to explore — not endorsements or a referral to any specific provider. A licensed clinician owns any results, diagnosis, and treatment.",
    es: "Rutas para explorar — no son recomendaciones ni una derivación a un proveedor específico. Un médico con licencia es responsable de cualquier resultado, diagnóstico y tratamiento.",
    hi: "जानने के लिए रास्ते — किसी विशेष प्रदाता की सिफ़ारिश या रेफ़रल नहीं। किसी भी परिणाम, निदान और उपचार का दायित्व लाइसेंस प्राप्त चिकित्सक का है।",
  },
  accessLabel: { en: "ACCESS", es: "ACCESO", hi: "पहुंच" },
  visitSite: { en: "Visit site", es: "Visitar sitio", hi: "साइट देखें" },
} satisfies Record<string, LStr>;
