import styles from "./regulatory.module.css";

// Preserve the supplied reference table separately from export sheet names.
const groups = [
  {
    agency: "CIC",
    frequency: "Quarterly",
    format: "TBC",
    reports: [
      { name: "Charging Infra Deployment Report" },
      { name: "Charging Sessions Report" },
      { name: "Interval Load Profile" },
      { name: "Uptime & Reliability" },
    ],
  },
  {
    agency: "CEC",
    frequency: "Semiannual",
    format: ".csv",
    reports: [
      { name: "Charger Usage and Throughput Report" },
      { name: "Uptime Reporting" },
      { name: "Excluded Downtime Reporting" },
      { name: "Contact Information and Inventory" },
      { name: "Utilization Session", frequency: "Quarterly" },
      { name: "Utilization Interval", frequency: "Quarterly" },
      { name: "Reliability Downtime", frequency: "Quarterly" },
      { name: "Reliability Uptime", frequency: "Quarterly" },
      { name: "Utilization Inventory", frequency: "Quarterly" },
    ],
  },
  {
    agency: "Cal-EvIP",
    frequency: "TBC",
    format: "TBC",
    reports: [
      { name: "Sites/Stations" },
      { name: "Charging Sessions" },
      { name: "Charger Interval Report" },
      { name: "Downtime Events" },
    ],
  },
];

export function ReportingReference() {
  return (
    <section
      className={styles.reference}
      aria-labelledby="reporting-reference-heading"
    >
      <h2 id="reporting-reference-heading">Reporting Reference</h2>
      <div
        className={styles.referenceScroll}
        role="region"
        aria-label="Reporting reference table"
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">
            Agency reporting names, frequency, format and submission mechanism
          </caption>
          <thead>
            <tr>
              {[
                "Agency",
                "Report Name",
                "Frequency",
                "Format",
                "Mechanism",
              ].map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.agency}>
              {group.reports.map((report, index) => (
                <tr key={report.name}>
                  {index === 0 && (
                    <th scope="rowgroup" rowSpan={group.reports.length}>
                      {group.agency}
                    </th>
                  )}
                  <td>{report.name}</td>
                  <td>{"frequency" in report ? report.frequency : group.frequency}</td>
                  <td>{group.format}</td>
                  <td>
                    {group.agency === "CEC" ? (
                      <>
                        Manual upload to Data Submission portal{" "}
                        <a
                          href="https://datasubmission.energy.ca.gov/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          https://datasubmission.energy.ca.gov/
                        </a>
                      </>
                    ) : (
                      "TBC"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
