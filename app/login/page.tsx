"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";

export default function LoginPage() {
  return (
    <div className="flex w-full grow items-center px-4 sm:justify-center h-screen bg-slate-200">
      <Card className="w-full sm:w-96">
        <CardHeader>
          <CardTitle>Sign in to Excentrix</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-y-4">
          <div className="space-y-2">
            <Label htmlFor="usn">ID</Label>
            <Input type="text" id="usn" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" required />
          </div>
        </CardContent>
        <CardFooter>
          <div className="grid w-full gap-y-4">
            <Button type="submit">
              {/* <Icons.spinner className="size-4 animate-spin" /> */}
              Continue
            </Button>
            <Link href="/forgot-password">
              <Button type="button" variant="link">
                Forgot password?
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
