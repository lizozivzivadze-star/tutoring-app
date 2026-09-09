import { Suspense } from "react";
import NewTestContent from "./new-test-content";

export default function NewTestPage() {
  return (
    <Suspense fallback={null}>
      <NewTestContent />
    </Suspense>
  );
}
