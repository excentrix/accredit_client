// components/user-management/user-form.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userManagementService from "@/services/user_management";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { Department, Role } from "@/types/auth";

const userFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters"),
    email: z.string().email("Invalid email address"),
    usn: z.string(),
    // .min(3, "USN must be at least 3 characters")
    // .max(20, "USN must not exceed 20 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    department_id: z.string({
      required_error: "Please select a department",
    }),
    roles: z.array(z.string()).min(1, "Please select at least one role"),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
  
}

export function UserForm({ userId, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!userId;

  // Form initialization
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      is_active: true,
      roles: [],
    },
  });

  // Queries
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: userManagementService.fetchRoles,
  });

  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: userManagementService.fetchDepartments,
  });

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userManagementService.fetchUsers(userId),
    enabled: !!userId,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      userManagementService.createUser({
        ...data,
        role_ids: data.roles
          .map((role: string) => {
            const roleObj = rolesData?.find((r: Role) => r.name === role);
            return roleObj ? roleObj.id : null;
          })
          .filter((id: number | null): id is number => id !== null),
        department_id: data.department_id,
      }),
    onSuccess: () => {
      showToast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      showToast.error(error.message || "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      userManagementService.updateUser(Number(userId), {
        ...data,
        role_ids: data.roles.map((role) => role),
        department_id: data.department_id,
      }),
    onSuccess: () => {
      showToast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      showToast.error(error.message || "Failed to update user");
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (isEditMode && userData) {
      console.log("Setting form data:", userData); // Debug log
      form.reset({
        ...userData,
        roles: userData.roles.map((role: Role) => role.name),
        department_id: userData.department_id || userData.department?.id, // Handle both possible structures
      });
    }
  }, [userData, form, isEditMode]);

  // Handle form submission
  const onSubmit = (data: UserFormData) => {
    if (isEditMode) {
      updateUserMutation.mutate(data);
    } else {
      createUserMutation.mutate(data);
    }
  };

  if (isLoadingRoles || isLoadingDepartments || (isEditMode && isLoadingUser)) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* USN Field */}
          <FormField
            control={form.control}
            name="usn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* First Name Field */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name Field */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department Field */}
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => {
              console.log("Department Field:", field); // Debug log
              return (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmentsData?.map((department: Department) => (
                        <SelectItem
                          key={department.id}
                          value={department.id.toString()}
                        >
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Roles Field */}
          <FormField
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roles</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange([value])}
                  defaultValue={field.value?.[0]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rolesData?.map((role: Role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Fields (only show if not editing) */}
          {!isEditMode && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters and contain
                      uppercase, lowercase, and numbers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            type="submit"
            disabled={
              createUserMutation.isPending || updateUserMutation.isPending
            }
          >
            {(createUserMutation.isPending || updateUserMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? "Update" : "Create"} User
          </Button>
        </div>
      </form>
    </Form>
  );
}
