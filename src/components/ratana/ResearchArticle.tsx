import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Rātana home">
      <svg className="size-8 shrink-0 text-primary" viewBox="0 0 40 40" aria-hidden="true" fill="none">
        <path d="M6 35V17.5C6 9.9 12.3 4 20 4s14 5.9 14 13.5V35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 35V19.5a7 7 0 0 1 14 0V35" stroke="currentColor" strokeWidth="1.4" opacity=".45" strokeLinecap="round" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-night">Rātana</span>
    </Link>
  );
}

const marketRows = [
  { market: "Australia", bedDays: "1.7m–5.1m", beds: "4,700–14,100", savings: "A$2.2b" },
  { market: "United States", bedDays: "9.4m–28.1m", beds: "25,600–76,900", savings: "US$15.4b" },
  { market: "European Union", bedDays: "27.7m–83.1m", beds: "75,900–227,700", savings: "€12.8b" },
  { market: "Singapore", bedDays: "217k–651k", beds: "595–1,784", savings: "S$0.19b" },
];

const sources = [
  {
    region: "Australia",
    items: [
      { label: "AIHW, Hospitalisations and patient days", href: "https://www.aihw.gov.au/hospitals/topics/admitted-patient-care/hospitalisations-and-patient-days" },
      { label: "AIHW, Hospitals at a glance", href: "https://www.aihw.gov.au/hospitals/overview/hospitals-at-a-glance" },
      { label: "IHACPA, National Hospital Cost Data Collection Public Sector 2023-24", href: "https://www.ihacpa.gov.au/resources/national-hospital-cost-data-collection-public-sector-2023-24" },
      { label: "Medical Journal of Australia, Home ward bound", href: "https://www.mja.com.au/journal/2020/213/1/home-ward-bound-features-hospital-home-use-major-australian-hospitals-2011-2017" },
    ],
  },
  {
    region: "United States",
    items: [
      { label: "American Hospital Association, Fast Facts on U.S. Hospitals, 2026", href: "https://www.aha.org/statistics/fast-facts-us-hospitals" },
      { label: "AHA, Fact Sheet: Extending the Hospital-at-Home Program", href: "https://www.aha.org/fact-sheets/2024-08-06-fact-sheet-extending-hospital-home-program" },
      { label: "CMS, Acute Hospital Care at Home Data Release Fact Sheet", href: "https://www.cms.gov/newsroom/fact-sheets/acute-hospital-care-home-data-release-fact-sheet-0" },
      { label: "US Census Bureau, AIES62INOUTPAT", href: "https://data.census.gov/table?tid=AIESMISCSECTOR2024.AIES62INOUTPAT" },
      { label: "KFF, Hospital Expenses per Adjusted Inpatient Day", href: "https://www.kff.org/health-costs/state-indicator/expenses-per-inpatient-day/" },
    ],
  },
  {
    region: "Europe",
    items: [
      { label: "Eurostat, EU hospital bed count at 507 per 100,000 people", href: "https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/ddn-20260713-1" },
      { label: "Eurostat, EU counted 2.3 million hospital beds in 2022", href: "https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/ddn-20240711-2" },
      { label: "Eurostat, €3,685 per person spent on healthcare in 2022", href: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20241115-1" },
      { label: "OECD and European Commission, Health at a Glance: Europe 2024", href: "https://www.oecd.org/en/publications/health-at-a-glance-europe-2024_b3704e14-en.html" },
    ],
  },
  {
    region: "Singapore",
    items: [
      { label: "Ministry of Health, Admissions and Outpatient Attendances", href: "https://www.moh.gov.sg/others/resources-and-statistics/admissions-and-outpatient-attendances/" },
      { label: "Ministry of Health, Committee of Supply Debate 2024 speech", href: "https://www.moh.gov.sg/newsroom/speech-by-mr-ong-ye-kung-minister-for-health-at-the-ministry-of-health-committee-of-supply-debate-2024-on-wednesday-6-march-2024/" },
      { label: "MOH Office for Healthcare Transformation, Mobile Inpatient Care @ Home", href: "https://www.moht.com.sg/project-report-cards/mobile-inpatient-carehome-mic/" },
      { label: "data.gov.sg, Government Health Expenditure, Annual", href: "https://data.gov.sg/datasets/d_a40c83a6f36893fc4611eda91f84eb6b/view" },
    ],
  },
  {
    region: "Clinical evidence",
    items: [
      { label: "Shi et al., BMC Medicine, Inpatient-level care at home delivered by virtual wards and hospital at home", href: "https://link.springer.com/article/10.1186/s12916-024-03312-3" },
      { label: "Leong et al., JAMA Network Open, Virtual ward transitional care systematic review and meta-analysis", href: "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2793636" },
    ],
  },
];

export function ResearchArticle() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <Link to="/" hash="problem" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to overview
          </Link>
        </div>
      </header>

      <main id="content" className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <p className="text-xs font-semibold uppercase text-primary">Research</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-night sm:text-5xl">The next hospital bed is at home</h1>
        <p className="mt-5 text-xl leading-8 text-muted-foreground">
          Hospitals are short of beds, staff and time. A modest shift of suitable inpatient care into the home could release millions of bed-days and billions in capacity value.
        </p>

        <div className="mt-12 space-y-6 text-base leading-7 text-foreground/90">
          <p>
            Hospitals are among the most expensive places in the world to wait. A patient who no longer needs an operating theatre, an intensive-care unit or constant bedside intervention may still occupy a staffed bed because the alternative is unsafe, unavailable or badly coordinated. The result is familiar: ambulances queue, emergency departments board patients, elective lists grow and clinicians spend too much of their day finding somewhere for the next patient to go.
          </p>
          <p>
            For health systems, the obvious answer is to build more beds. The trouble is that physical beds are not just furniture. They require nurses, doctors, cleaners, diagnostics, porters, pharmacists, estates, supplies, governance and money. In many countries, the tighter constraint is not concrete but labour. Europe reports large health-workforce shortages. Singapore has described a post-COVID capacity crunch driven by older, more complex patients. Australia continues to face visible pressure in public hospitals and elective waiting lists. In the United States, hospitals have more than 900,000 staffed beds and still struggle with flow.
          </p>
          <p>
            The alternative is no longer theoretical. Hospital-at-Home models treat selected patients in their own homes while they remain under hospital-level clinical governance. The patient receives monitoring, medication, review, escalation pathways and, where needed, in-person visits. The home becomes a temporary extension of the ward.
          </p>
          <p>
            That sounds like a technology story. It is not, or at least not mostly. The easy mistake is to imagine that the prize lies in attaching sensors to patients and streaming more data to clinicians. The evidence points elsewhere. Remote monitoring is useful only when it is embedded in a clinical operating model that can decide who is suitable, detect deterioration, act on alerts, escalate safely and discharge cleanly. The product opportunity is therefore not a gadget. It is the command layer for a distributed hospital.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">The arithmetic is large</h2>
          <p>Across four target markets, even cautious substitution assumptions produce striking numbers.</p>
          <p>
            Australia recorded 34.3m admitted patient days in 2024-25. A 5-15% shift of suitable inpatient activity into Hospital-at-Home would represent 1.7m-5.1m bed-days a year, equivalent to roughly 4,700-14,100 fully occupied beds.
          </p>
          <p>
            The United States is bigger by an order of magnitude. General medical and surgical hospitals recorded about 187m inpatient days in 2024. Shifting 5-15% of suitable activity would represent 9.4m-28.1m bed-days, or 25,600-76,900 full-year beds.
          </p>
          <p>
            Europe's case is different. It is less one market than many health systems, with different payment rules and hospital structures. But the pressure is clear. Eurostat reports that EU hospital-bed density has fallen over time, reaching 507 beds per 100,000 people in 2024. Using a 2022 bed stock of about 2.3m beds and OECD's reported 66% curative-care occupancy rate, a 5-15% substitution scenario implies 27.7m-83.1m addressable bed-days a year. That is equivalent to 75,900-227,700 full-year beds.
          </p>
          <p>
            Singapore is smaller, but in some ways more revealing. It reported 620,169 acute hospital admissions in 2023. Its health minister has said average length of stay rose from about six to seven days after COVID, increasing patient load by 15%. Singapore has also mainstreamed Mobile Inpatient Care at Home, or MIC@Home. In FY2024 the programme enrolled nearly 6,000 patients and substituted nearly 30,000 bed-days. A 5-15% shift of acute bed-days would represent about 217,000-651,000 bed-days a year. That is 7-22 times the FY2024 MIC@Home bed-days.
          </p>

          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 text-right font-semibold">Addressable bed-days (5–15% shift)</th>
                  <th className="px-4 py-3 text-right font-semibold">Equivalent full-year beds</th>
                  <th className="px-4 py-3 text-right font-semibold">Annual capacity value (10% shift)</th>
                </tr>
              </thead>
              <tbody>
                {marketRows.map((row) => (
                  <tr key={row.market} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium">{row.market}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.bedDays}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.beds}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.savings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            The 10% base case is not a prediction. It is a practical planning scenario. It assumes a scaled model across suitable diagnoses, supported by central operations, device logistics, clinical governance and 24-hour escalation. In each market, the true ceiling will depend on case mix, eligibility criteria, reimbursement, home suitability, workforce design and public confidence.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">Savings are real, but not simple</h2>
          <p>
            It is tempting to multiply avoided bed-days by the average cost of a hospital day and call the answer savings. That would be too neat. Hospitals have fixed costs. A ward cannot always close because ten patients went home early. Salaried staff, estates, equipment contracts and overheads often remain.
          </p>
          <p>
            A better measure is capacity value: the mixture of cash savings, avoided marginal cost, deferred capital expenditure and released clinical capacity. Hospital-at-Home may reduce the need for expensive overflow staffing, prevent cancelled elective procedures, shorten emergency-department boarding and delay the next building programme. Some of that shows up in budgets. Some appears as throughput, resilience and service quality.
          </p>
          <p>
            For a cautious financial hypothesis, we model net realisable savings at 15-35% of gross bed-day cost pressure, with 25% as the base case. On that basis, a 10% shift of suitable inpatient bed-days could plausibly create annual net savings or capacity value of about A$2.2b in Australia, US$15.4b in the United States, €12.8b across the European Union and S$0.19b in Singapore, before platform costs and subject to local validation.
          </p>
          <p>
            The numbers are large enough to matter even if the haircut is severe. Indeed, the economics of Hospital-at-Home do not require heroic assumptions. They require a safe way to move a small share of appropriate patients out of physical beds while maintaining hospital-grade responsibility.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">The clinical evidence is encouraging, with caveats</h2>
          <p>The clinical case is not that every patient should be at home. It is that selected patients can be.</p>
          <p>
            A 2024 systematic review and meta-analysis in BMC Medicine examined 69 studies of technology-enabled inpatient-level care at home. It found low-certainty evidence that the care-at-home models studied did not increase readmission risk compared with hospital-based inpatient care. Where mortality evidence was available, there was no clear signal of additional mortality risk. The authors also noted that higher technology intensity itself has not yet been shown to add clear benefit.
          </p>
          <p>
            That finding is important. It suggests that the winning model is unlikely to be the one with the most sensors. It will be the one with the best clinical workflow.
          </p>
          <p>
            A 2022 JAMA Network Open review of 24 randomised clinical trials covering 10,876 patients found that virtual ward transition systems were associated with fewer deaths and readmissions among heart-failure patients. Across all studies, virtual wards were associated with fewer emergency-department visits and shorter readmission length of stay. But benefits were not uniform across every diagnosis.
          </p>
          <p>
            Australia also has local evidence. A Medical Journal of Australia study of 19 major Australian hospitals found that 80,167 of 2,185,421 admissions from 2011-2017 included Hospital-in-the-Home care, or 3.7% of admissions. Hospital-in-the-Home activity grew faster than overall admissions, and the observed cohort had lower in-hospital death and 28-day readmission rates.
          </p>
          <p>
            The sensible conclusion is not that Hospital-at-Home is universally superior. It is that the model is safe enough in selected patients to deserve industrial-grade operating infrastructure.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">The missing layer</h2>
          <p>
            Many hospitals already have pieces of the puzzle: virtual wards, home nursing, telehealth, remote monitoring, discharge teams, command centres, emergency escalation and patient portals. The problem is that these pieces often live in separate workflows.
          </p>
          <p>
            At small scale, coordination can be manual. At 50 or 100 patients, a team can keep much in its head. At 5,000 live home inpatients, that becomes impossible. A distributed hospital needs to know, continuously, who is stable, who is deteriorating, who has missing observations, whose device has failed, who needs medication delivery, who requires a clinician review, who is likely to discharge and who may need rapid transfer back to hospital.
          </p>
          <p>
            That is the platform opportunity. A Hospital-at-Home intelligence layer should not merely display data. It should organise work. It should turn home observations into prioritised action, make clinical accountability visible, maintain audit trails, handle device and logistics exceptions, support patient and caregiver communication, integrate with the hospital record and provide a common operating picture for hospitals, community teams and emergency services.
          </p>
          <p>
            In a physical hospital, much of this coordination is hidden in the ward itself. Nurses notice, doctors pass by, equipment is nearby, escalation routes are familiar. In the home, those same functions must be made explicit. Software becomes part of the ward infrastructure.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">Why now</h2>
          <p>Several forces are converging.</p>
          <p>
            First, demand is rising. Ageing populations increase the number of patients with complex, chronic and overlapping conditions. Singapore's experience is a useful warning: a shift from six to seven average days of stay creates a large increase in patient load without any new disease appearing.
          </p>
          <p>
            Second, workforce is scarce. Europe reports shortages of doctors and nurses across many countries. Australia, Singapore and the United States face their own staffing pressures. A model that extends hospital capacity without requiring a one-for-one increase in physical beds is therefore attractive.
          </p>
          <p>
            Third, the technology stack is finally adequate. Remote observations, video review, connected devices, cloud infrastructure, secure messaging, patient apps and electronic records are good enough to support care at home. The hard part is orchestration.
          </p>
          <p>
            Fourth, policy is moving. In the United States, the Acute Hospital Care at Home initiative has been extended to 2030, and hundreds of hospitals have been approved to participate. Singapore has moved MIC@Home from sandbox to mainstream inpatient service. Australia has long experience with Hospital-in-the-Home. Europe has capacity and workforce pressure that will encourage serious alternatives to conventional admission.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">The prize</h2>
          <p>
            The prize is not a future in which hospitals disappear. They will remain essential for intensive care, surgery, diagnostics, complex emergencies and the sickest patients. The more plausible future is one in which hospitals become more selective about what must happen inside their walls.
          </p>
          <p>
            If 5-15% of suitable inpatient bed-days can move safely into the home, the opportunity is measured in millions of bed-days and billions in capacity value. But the deeper change is operational. Hospitals will need to manage patients who are no longer in the building but are still in the hospital's care.
          </p>
          <p>
            That is a new kind of bed. It is occupied, monitored and governed, but not located on a ward. Its value depends less on the mattress than on the system around it.
          </p>
          <p>
            The next hospital expansion may not begin with a crane. It may begin with a command centre.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">Methodology note</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Addressable bed-days are modelled by applying 5%, 10% and 15% substitution scenarios to published or derived annual bed-day pools. Full-year bed equivalents are calculated as addressable bed-days divided by 365.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Financial scenarios estimate gross cost pressure using published cost proxies where available and conservative modelling ranges where direct comparable cost-per-bed-day data are not available. Net realisable savings are modelled at 15-35% of gross cost pressure, with 25% as a base case. These estimates should be treated as planning hypotheses, not guaranteed savings. Realised savings depend on case mix, staffing model, reimbursement, fixed-cost release, technology cost, clinical governance and local operating design.
          </p>

          <h2 className="pt-6 font-display text-3xl font-semibold text-night">Sources</h2>
          <div className="space-y-5">
            {sources.map((group) => (
              <div key={group.region}>
                <h3 className="text-sm font-semibold">{group.region}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} target="_blank" rel="noreferrer" className="text-primary underline decoration-border underline-offset-2 hover:decoration-primary">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <Link to="/" hash="problem" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to overview
          </Link>
        </div>
      </main>
    </div>
  );
}
