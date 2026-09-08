import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The report you are looking for is not available at this address.
      </p>
      <Link
        className="inline-block mt-6 text-primary"
        href="/reports/project-tags"
      >
        Back to project tagging
      </Link>
    </div>
  );
}
