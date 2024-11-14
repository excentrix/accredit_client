"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { ROUTES } from '@/config/routes';

import { useAuth } from '@/context/use-auth-context';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      const route = Object.values(ROUTES).find(route => 
        pathname.startsWith(route.path)
      );

      if (route && !route.permission.roles.includes(user.role)) {
        router.push(route.permission.redirect || '/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* <Spinner size={40} /> */}
        Loading..
      </div>
    );
  }

  return <>{children}</>;
}