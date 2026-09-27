import { redirect } from "next/navigation";

// Preserve old bookmarks without retaining a duplicate executive view.
export default function Page() { redirect("/dashboard"); }
