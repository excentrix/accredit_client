// app/(auth)/reset-password/request/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import userManagementService from "@/services/user_management";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";

const resetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetRequestValues = z.infer<typeof resetRequestSchema>;

export default function RequestResetPage() {
  const form = useForm<ResetRequestValues>({
    resolver: zodResolver(resetRequestSchema),
  });

  const onSubmit = async (values: ResetRequestValues) => {
    const loadingToast = showToast.loading("Sending reset link...");
    try {
      await userManagementService.resetPasswordRequest(values.email);
      showToast.success(
        "If an account exists with this email, you will receive a password reset link"
      );
      form.reset();
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message ||
          "Failed to send reset link. Please try again."
      );
    } finally {
      showToast.dismiss(loadingToast);
    }
  };

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <Button
            asChild
            className="mb-3 border w-fit p-2 rounded-lg flex items-center gap-x-1 text-sm text-gray-500 font-medium"
            variant="ghost"
          >
            <Link href="/login">
              <ArrowLeft className="w-4 h-4" />
              back to log in
            </Link>
          </Button>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Reset Link
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
