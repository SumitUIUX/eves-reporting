import styles from "./regulatory.module.css";

// Preserve the supplied reference table separately from export sheet names.
const groups = [
  {
    agency: "CIC",
    frequency: "Quarterly",
    format: "TBC",
    reports: [
      "Charging Infra Deployment Report",
      "Charging Sessions Report",
      "Interval Load Profile",
      "Uptime & Reliability",
    ],
  },
  {
    agency: "CEC",
    frequency: "Semiannual",
    format: ".csv",
    reports: [
      "Charger Usage and Throughput Report",
      "Uptime Reporting",
      "Excluded Downtime Reporting",
      "Contact Information and Inventory",
    ],
  },
  {
    agency: "Cal-EvIP",
    frequency: "TBC",
    format: "TBC",
    reports: [
      "Sites/Stations",
      "Charging Sessions",
      "Charger Interval Report",
      "Downtime Events",
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
              {group.reports.map((name, index) => (
                <tr key={name}>
                  {index === 0 && (
                    <th scope="rowgroup" rowSpan={group.reports.length}>
                      {group.agency}
                    </th>
                  )}
                  <td>{name}</td>
                  <td>{group.frequency}</td>
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
