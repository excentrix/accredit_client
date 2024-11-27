// components/layouts/protected-layout.tsx
import { useAuth } from "@/hooks";
import { AppRoute } from "@/types";
import { useRouter } from "next/navigation";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
}

export function ProtectedLayout({
  children,
  requiredRoles,
}: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !requiredRoles.includes(user.role)) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
