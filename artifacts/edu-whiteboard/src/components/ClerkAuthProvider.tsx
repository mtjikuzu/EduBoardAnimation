import React, { type ReactNode } from "react";

interface ClerkAuthProviderProps {
  children: ReactNode;
}

export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  const clerkKey =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY) ||
    undefined;

  if (clerkKey) {
    return <ClerkProdProvider clerkKey={clerkKey} children={children} />;
  }

  // Dev mode fallback
  const [DevProvider, setDevProvider] = React.useState<any>(null);
  React.useEffect(() => {
    import("./AuthProvider").then((m) => setDevProvider(() => m.AuthProvider));
  }, []);

  if (!DevProvider) {
    return <>{children}</>;
  }

  return React.createElement(DevProvider, null, children);
}

function ClerkProdProvider({ clerkKey, children }: { clerkKey: string; children: ReactNode }) {
  const [ClerkProvider, setClerkProvider] = React.useState<any>(null);

  React.useEffect(() => {
    import("@clerk/clerk-react").then((mod) => {
      setClerkProvider(() => mod.ClerkProvider);
    });
  }, []);

  if (!ClerkProvider) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return React.createElement(
    ClerkProvider,
    {
      publishableKey: clerkKey,
      afterSignOutUrl: "/",
      signInUrl: "/signin",
    },
    children,
  );
}
