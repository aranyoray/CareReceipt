// Rights and deadlines: which billing protections apply to a bill, how long the
// patient has to use each one, and the letter that goes with it.
//
// Every deadline is counted in calendar days from dates the patient enters.
// The rules:
//
//   Texas Health and Safety Code chapter 185 (Senate Bill 490, 2023, amended by
//   House Bill 216, 2025). A provider asking a patient for payment must send a
//   written itemized bill, and may not pursue debt collection until it has.
//
//   No Surprises Act, patient-provider dispute resolution (45 CFR 149.620). An
//   uninsured or self-pay patient whose bill from a provider is at least $400
//   above that provider's good faith estimate can dispute it within 120 days of
//   the bill, for a $25 fee. The provider may not send the bill to collections
//   while the dispute is open.
//
//   IRS section 501(r) (26 CFR 1.501(r)-1 and 1.501(r)-6). A nonprofit hospital
//   must accept a financial assistance application for at least 240 days after
//   the first post-discharge bill, may not begin extraordinary collection
//   actions before day 120, must give 30 days' written notice before it does,
//   and must suspend them while an application is pending.
//
//   Internal appeals. Most employer and marketplace plans must allow at least
//   180 days from a denial notice to appeal (45 CFR 147.136). Medicare and
//   Medicaid set their own, shorter limits, printed on the notice.
//
// This is general information about the rules, not legal advice, and the
// screen says so.

export type Coverage = "uninsured" | "insured";
export type Answer = "yes" | "no" | "unsure";

export interface RightsInput {
  /** Two-letter state code, "" when the ZIP code is not known yet. */
  state: string;
  coverage: Coverage;
  nonprofit: Answer;
  /** Date of the first bill after the visit or discharge, yyyy-mm-dd. */
  firstBill: string;
  /** Has an itemized bill arrived? */
  itemized: Answer;
  /** Has anyone started collecting, such as a collection agency? */
  collections: Answer;
  /** Uninsured only: did the provider give a good faith estimate? */
  estimate: Answer;
  /** That provider's estimate, in dollars. */
  estimateAmount: number;
  /** That same provider's bill, in dollars. */
  billed: number;
  /** Insured only: date on a denial notice, yyyy-mm-dd, "" if none. */
  denial: string;
  /** The bill check raised a surprise-billing flag. */
  surprise: boolean;
  /** yyyy-mm-dd, passed in so the rules can be tested on fixed dates. */
  today: string;
}

/**
 * act: a protection applies and a clock may be running.
 * check: might apply; one more fact settles it.
 * met: already satisfied, or a protection currently in force.
 * closed: the window has passed.
 * none: checked, and it does not apply to this bill.
 */
export type RightStatus = "act" | "check" | "met" | "closed" | "none";

export interface Letter {
  title: string;
  body: string;
}

export interface Right {
  id: "itemized" | "dispute" | "assistance" | "collection" | "appeal" | "surprise";
  title: string;
  status: RightStatus;
  /** yyyy-mm-dd the patient must act by, when there is one. */
  deadline: string | null;
  /** Days from today to the deadline; negative once it has passed. */
  daysLeft: number | null;
  /** The rule, in words a patient can quote. */
  basis: string;
  summary: string;
  steps: string[];
  letter: Letter | null;
}

export interface Mark {
  date: string;
  /** Days after the first bill. */
  day: number;
  label: string;
  tone: "start" | "deadline" | "protection" | "today";
}

export interface RightsReport {
  /** Everything that applies, most urgent first. */
  rights: Right[];
  /** Checked and found not to apply, with the reason. */
  ruledOut: Right[];
  /** The soonest deadline still running. */
  next: Right | null;
  /** Dated points for the timeline, oldest first; empty without a first bill date. */
  marks: Mark[];
}

/* ------------------------------------------------------------------ dates */

const DAY_MS = 86_400_000;

/** yyyy-mm-dd to a UTC timestamp, or null when it is not a real date. */
export function parseDay(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t;
}

function iso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const t = parseDay(day);
  if (t === null) throw new Error(`Not a date: ${day}`);
  return iso(t + n * DAY_MS);
}

/** Whole days from a to b; positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const ta = parseDay(a);
  const tb = parseDay(b);
  if (ta === null || tb === null) throw new Error(`Not a date: ${a} or ${b}`);
  return Math.round((tb - ta) / DAY_MS);
}

/** "March 12, 2027". */
export function longDate(day: string): string {
  const t = parseDay(day);
  if (t === null) return day;
  return new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Today on the device's own calendar, yyyy-mm-dd. */
export function todayISO(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function dollars(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/* -------------------------------------------------------------- the rules */

const TX_BASIS = "Texas Health and Safety Code, chapter 185 (Senate Bill 490, 2023, as amended in 2025)";
const NSA_BASIS = "No Surprises Act, patient-provider dispute resolution (45 CFR 149.620)";
const FAP_BASIS = "IRS rules for nonprofit hospitals, section 501(r) (26 CFR 1.501(r)-1 and 1.501(r)-6)";
const APPEAL_BASIS = "Affordable Care Act internal appeals rule (45 CFR 147.136)";

const DISPUTE_DAYS = 120;
const DISPUTE_OVER = 400;
const ECA_DAYS = 120;
const FAP_DAYS = 240;
const APPEAL_DAYS = 180;

const HEADER = [
  "Re: Account number [account number]",
  "Patient: [patient name]",
  "Date(s) of service: [dates]",
];

const SIGN = ["", "Thank you.", "", "[Your name]", "[Phone or email]", "[Today's date]"];

function letter(title: string, to: string, body: string[]): Letter {
  return { title, body: [to, "", ...HEADER, "", ...body, ...SIGN].join("\n") };
}

/** A first-bill date only counts when it is real and not in the future. */
function usableDate(day: string, today: string): string | null {
  if (parseDay(day) === null) return null;
  return daysBetween(day, today) >= 0 ? day : null;
}

function itemizedRight(i: RightsInput): Right | null {
  const collecting = i.collections === "yes";
  if (i.state === "TX") {
    if (i.itemized === "yes") {
      return {
        id: "itemized",
        title: "Itemized bill",
        status: "met",
        deadline: null,
        daysLeft: null,
        basis: TX_BASIS,
        summary: "You have the itemized bill Texas law requires, and you can ask for it again at any time.",
        steps: [
          "Check that it gives a plain-language description of each service and supply, any billing code sent to an insurer with what the insurer was billed and paid, and the amount said to be due for each item.",
          "Check every line on the Bill check screen.",
        ],
        letter: null,
      };
    }
    return {
      id: "itemized",
      title: "Ask for the itemized bill",
      status: "act",
      deadline: null,
      daysLeft: null,
      basis: TX_BASIS,
      summary: collecting
        ? "Collection has started, but a Texas provider may not pursue debt collection until it has sent a written itemized bill. Ask for the bill, and ask in writing for collection to stop until it arrives."
        : "A Texas provider that asks you for payment must send a written itemized bill, and may not pursue debt collection until it has. Ask for it before you pay anything.",
      steps: [
        "Send the letter to the billing department by email, through the patient portal or by post, and keep a copy.",
        "Hold off paying until the itemized bill arrives, then check it line by line.",
      ],
      letter: letter("Itemized bill request", "To the billing department,", [
        "Under Texas Health and Safety Code section 185.002, please send me a written, itemized bill for this account. It should give a plain-language description of each service and supply, any billing codes submitted to an insurer with the amounts billed to and paid by the insurer, and the amount you say is due for each item.",
        ...(collecting
          ? [
              "",
              "Collection activity has started on this account. Section 185.002 does not allow a provider to pursue debt collection until it has provided the itemized bill, so please stop all collection activity until you have sent it.",
            ]
          : []),
      ]),
    };
  }
  if (i.itemized === "yes") return null;
  return {
    id: "itemized",
    title: "Ask for an itemized bill",
    status: "check",
    deadline: null,
    daysLeft: null,
    basis: "Standard practice. Some states, including Texas, require it by law.",
    summary:
      "A summary statement is not enough to check a bill. Ask for the itemized version, with every service, its billing code and its charge. Providers routinely send one on request.",
    steps: ["Send the request and keep a copy.", "Hold off paying until it arrives, then check every line on the Bill check screen."],
    letter: letter("Itemized bill request", "To the billing department,", [
      "Please send me a fully itemized bill for this account, listing each service and supply with its date, billing code, description and charge, and any payments or adjustments. I would like to review it before making a payment.",
    ]),
  };
}

function disputeRight(i: RightsInput, first: string | null): Right | null {
  if (i.coverage !== "uninsured") return null;
  const base = { id: "dispute" as const, basis: NSA_BASIS, deadline: null, daysLeft: null, letter: null };

  if (i.estimate !== "yes") {
    return {
      ...base,
      title: "Ask whether there was a good faith estimate",
      status: "check",
      summary:
        "Uninsured and self-pay patients are owed a written good faith estimate when care is booked at least 3 business days ahead, or whenever they ask. A bill $400 or more above that estimate can be disputed. Emergency care has no estimate.",
      steps: ["Ask the provider for a copy of any good faith estimate it gave you.", "If there was one, enter it here to test the $400 rule."],
    };
  }

  if (i.estimateAmount <= 0 || i.billed <= 0) {
    return {
      ...base,
      title: "Compare the bill with the estimate",
      status: "check",
      summary: "Enter the estimate and the bill from the same provider to see whether the bill is $400 or more above it.",
      steps: ["Compare one provider's bill with that same provider's estimate; each provider is tested on its own."],
    };
  }

  const over = i.billed - i.estimateAmount;
  if (over < DISPUTE_OVER) {
    return {
      ...base,
      title: "Dispute against the estimate",
      status: "none",
      summary:
        over <= 0
          ? `The bill is within the ${dollars(i.estimateAmount)} estimate, so there is nothing to dispute on this rule.`
          : `The bill is ${dollars(over)} above the estimate. The federal dispute process starts at $400 above.`,
      steps: [],
    };
  }

  const note = letter("Notice of dispute", "To the billing department,", [
    `I was uninsured or paying for this care myself, and you gave me a good faith estimate of ${dollars(i.estimateAmount)}. Your bill is ${dollars(i.billed)}, which is ${dollars(over)} more than the estimate. I am starting the federal patient-provider dispute resolution process under the No Surprises Act.`,
    "",
    "While the dispute is open, please do not send this bill to collections, and suspend any collection activity already under way.",
  ]);

  if (!first) {
    return {
      ...base,
      title: "Dispute the bill against the estimate",
      status: "check",
      summary: `This provider billed ${dollars(over)} more than its estimate, which qualifies. Add the date on the bill to see how long you have; the limit is 120 days.`,
      steps: ["Enter the date on the bill."],
      letter: note,
    };
  }

  const deadline = addDays(first, DISPUTE_DAYS);
  const daysLeft = daysBetween(i.today, deadline);
  if (daysLeft < 0) {
    return {
      ...base,
      title: "Dispute the bill against the estimate",
      status: "closed",
      deadline,
      daysLeft,
      summary: `The 120 days to start a federal dispute ended on ${longDate(deadline)}. You can still ask the provider in writing to honour its own estimate.`,
      steps: ["Write to the billing department with the estimate and the bill, and ask for the bill to be reduced to the estimate."],
      letter: null,
    };
  }
  return {
    ...base,
    title: "Dispute the bill against the estimate",
    status: "act",
    deadline,
    daysLeft,
    summary: `This provider billed ${dollars(over)} more than its estimate. You can start a federal dispute until ${longDate(deadline)}, 120 days after the bill. While it is open the provider may not send the bill to collections.`,
    steps: [
      "Start the dispute on the CMS medical bill rights website, cms.gov/medical-bill-rights, or through the No Surprises Help Desk on 1-800-985-3059. The fee is $25.",
      "Have the bill and the good faith estimate ready, and count the 120 days from the date on the bill you are disputing.",
      "Send the provider the notice below so it knows the dispute has started.",
    ],
    letter: note,
  };
}

function assistanceRights(i: RightsInput, first: string | null): Right[] {
  if (i.nonprofit === "no") {
    return [
      {
        id: "assistance",
        title: "Ask about discounts",
        status: "check",
        deadline: null,
        daysLeft: null,
        basis: "The federal financial assistance rules cover nonprofit hospitals only.",
        summary:
          "For-profit hospitals do not have to run a financial assistance programme, but many offer uninsured and prompt-pay discounts. Ask before you pay.",
        steps: ["Ask the billing department for any uninsured, self-pay or prompt-payment discount, and for a payment plan without interest."],
        letter: null,
      },
    ];
  }

  const unsure = i.nonprofit === "unsure";
  /** Opens a sentence about the hospital, hedged when its status is not known. */
  const it = (rest: string) => (unsure ? `If the hospital is a nonprofit, it ${rest}` : `The hospital ${rest}`);
  const request = letter("Financial assistance request", "To the financial assistance office,", [
    `Please send me your financial assistance policy, its plain-language summary and the application form. I intend to apply. The first bill I received after this care was dated ${first ? longDate(first) : "[date]"}.`,
    "",
    "While my application is being considered, please do not report this account to a credit bureau, sell it, or take legal action on it.",
  ]);
  const steps = (deadline: string | null) => [
    "Ask for the financial assistance policy, its plain-language summary and the application form. The letter below asks for all three.",
    deadline
      ? `Send the completed application before ${longDate(deadline)}, and keep a copy with the date you sent it.`
      : "Send the completed application, and keep a copy with the date you sent it.",
    "Applying pauses extraordinary collection actions while the hospital decides.",
    "The Financial help screen writes the full application letter with your income and household.",
  ];

  if (!first) {
    return [
      {
        id: "assistance",
        title: "Apply for financial assistance",
        status: "check",
        deadline: null,
        daysLeft: null,
        basis: FAP_BASIS,
        summary: "A nonprofit hospital must accept a financial assistance application for at least 240 days after the first bill it sends after discharge. Add that date to see your deadline.",
        steps: steps(null),
        letter: request,
      },
    ];
  }

  const deadline = addDays(first, FAP_DAYS);
  const daysLeft = daysBetween(i.today, deadline);
  const out: Right[] = [];

  out.push(
    daysLeft < 0
      ? {
          id: "assistance",
          title: "Apply for financial assistance",
          status: "closed",
          deadline,
          daysLeft,
          basis: FAP_BASIS,
          summary: `The 240 days the federal rules guarantee ended on ${longDate(deadline)}. Many hospitals still take late applications, so apply anyway.`,
          steps: steps(null),
          letter: request,
        }
      : {
          id: "assistance",
          title: "Apply for financial assistance",
          status: i.nonprofit === "unsure" ? "check" : "act",
          deadline,
          daysLeft,
          basis: FAP_BASIS,
          summary: `${it(`must accept your application until at least ${longDate(deadline)}, 240 days after the first bill.`)}${unsure ? " Check the hospital's website; a nonprofit has to publish its policy." : ""}`,
          steps: steps(deadline),
          letter: request,
        },
  );

  const ecaDate = addDays(first, ECA_DAYS);
  const ecaLeft = daysBetween(i.today, ecaDate);
  out.push({
    id: "collection",
    title: "Protection from extraordinary collection",
    status: ecaLeft > 0 ? "met" : "check",
    deadline: ecaDate,
    daysLeft: ecaLeft,
    basis: FAP_BASIS,
    summary:
      ecaLeft > 0
        ? it(
            `may not report this bill to a credit bureau, sell it or sue over it before ${longDate(ecaDate)}, and must give you 30 days' written notice before it starts any of these.`,
          )
        : it(
            `may start extraordinary collection actions from ${longDate(ecaDate)}, but only after 30 days' written notice, and must pause them while a financial assistance application is pending.`,
          ),
    steps:
      ecaLeft > 0
        ? ["Apply for financial assistance before this date if you can; a pending application keeps these actions paused."]
        : ["If you have received a collection notice, apply for financial assistance now and tell the hospital in writing that you have applied."],
    letter: null,
  });

  return out;
}

function appealRight(i: RightsInput): Right | null {
  if (i.coverage !== "insured") return null;
  const denial = parseDay(i.denial) !== null && daysBetween(i.denial, i.today) >= 0 ? i.denial : null;
  const caveat = "Medicare and Medicaid set their own, shorter limits; the notice states yours.";
  if (!denial) {
    return {
      id: "appeal",
      title: "If your insurer denied part of the bill",
      status: "check",
      deadline: null,
      daysLeft: null,
      basis: APPEAL_BASIS,
      summary: `Most employer and marketplace plans must give you at least 180 days from a denial notice to appeal. ${caveat} Add the date on the notice to see your deadline.`,
      steps: ["Find the denial notice or the Explanation of Benefits that shows the denied line.", "Enter the date on it."],
      letter: null,
    };
  }
  const deadline = addDays(denial, APPEAL_DAYS);
  const daysLeft = daysBetween(i.today, deadline);
  const appeal = {
    title: "Internal appeal",
    body: [
      "To the appeals department,",
      "",
      "Re: Member ID [member ID]",
      "Claim number: [claim number]",
      "Date(s) of service: [dates]",
      "",
      `I am appealing your decision of ${longDate(denial)} to deny coverage for [service]. Please treat this letter as my request for an internal appeal, and send me a copy of my claim file, including the reasons for the denial and any rules or guidelines you relied on.`,
      "",
      "[Why this care should be covered, and any letter from my doctor]",
      ...SIGN,
    ].join("\n"),
  };
  return {
    id: "appeal",
    title: "Appeal the denial",
    status: daysLeft < 0 ? "closed" : "act",
    deadline,
    daysLeft,
    basis: APPEAL_BASIS,
    summary:
      daysLeft < 0
        ? `The 180 days most plans must allow ended on ${longDate(deadline)}. ${caveat} Ask the plan whether it will still hear the appeal.`
        : `Most employer and marketplace plans must accept an internal appeal until at least ${longDate(deadline)}, 180 days after the denial. ${caveat}`,
    steps: [
      "Send the appeal in writing and keep a copy with the date you sent it.",
      "Ask your doctor for a short letter saying why the care was needed.",
      "If the internal appeal fails, you can usually ask for an external review by an independent reviewer.",
    ],
    letter: daysLeft < 0 ? null : appeal,
  };
}

function surpriseRight(i: RightsInput): Right | null {
  if (i.coverage !== "insured" || !i.surprise) return null;
  return {
    id: "surprise",
    title: "Surprise billing protection",
    status: "check",
    deadline: null,
    daysLeft: null,
    basis: "No Surprises Act (in force since January 2022)",
    summary:
      "The bill check found charges that look like surprise billing. For emergency care, and for care from an out-of-network clinician at an in-network hospital, you owe no more than your in-network cost sharing.",
    steps: [
      "Compare the bill with your insurer's Explanation of Benefits; you should owe no more than the patient responsibility it shows.",
      "If the provider is billing you for the difference, say in writing that it is a balance bill the law does not allow.",
    ],
    letter: null,
  };
}

const ORDER: Record<RightStatus, number> = { act: 0, check: 1, met: 2, closed: 3, none: 4 };

export function assessRights(input: RightsInput): RightsReport {
  const first = usableDate(input.firstBill, input.today);

  const all = [
    itemizedRight(input),
    disputeRight(input, first),
    ...assistanceRights(input, first),
    appealRight(input),
    surpriseRight(input),
  ].filter((r): r is Right => r !== null);

  const rights = all
    .filter((r) => r.status !== "none")
    .sort((a, b) => {
      const s = ORDER[a.status] - ORDER[b.status];
      if (s !== 0) return s;
      // Within a status, the nearest deadline first. An undated action is
      // something to do straight away, so it leads; anything else undated
      // goes last.
      const key = (r: Right) => r.daysLeft ?? (r.status === "act" ? -1 : Number.POSITIVE_INFINITY);
      return key(a) - key(b);
    });
  const ruledOut = all.filter((r) => r.status === "none");

  const running = rights.filter(
    (r) => (r.status === "act" || r.status === "check") && r.deadline !== null && r.daysLeft !== null && r.daysLeft >= 0,
  );
  const next = running.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0] ?? null;

  const marks: Mark[] = [];
  if (first) {
    marks.push({ date: first, day: 0, label: "First bill", tone: "start" });
    for (const r of rights) {
      if (!r.deadline) continue;
      const label =
        r.id === "dispute"
          ? "Last day to start a federal dispute"
          : r.id === "assistance"
            ? "Financial assistance window guaranteed until"
            : r.id === "collection"
              ? "Earliest extraordinary collection"
              : r.id === "appeal"
                ? "Last day to appeal the denial"
                : r.title;
      marks.push({
        date: r.deadline,
        day: daysBetween(first, r.deadline),
        label,
        tone: r.id === "collection" ? "protection" : "deadline",
      });
    }
    marks.push({ date: input.today, day: daysBetween(first, input.today), label: "Today", tone: "today" });
    const rank: Record<Mark["tone"], number> = { start: 0, today: 1, protection: 2, deadline: 3 };
    marks.sort((a, b) => a.day - b.day || rank[a.tone] - rank[b.tone]);
  }

  return { rights, ruledOut, next, marks };
}
