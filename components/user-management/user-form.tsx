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

interface BaseUserFormData {
  username: string;
  email: string;
  usn: string;
  first_name?: string;
  last_name?: string;
  department_id: string;
  roles: string[]; // Role names for form
  is_active: boolean;
}

// Form data for creating a user
export interface CreateUserFormData extends BaseUserFormData {
  password: string;
  confirm_password: string;
}

// Form data for updating a user
export interface UpdateUserFormData extends BaseUserFormData {
  password?: string;
  confirm_password?: string;
}

export interface UserApiData {
  username: string;
  email: string;
  usn: string;
  first_name?: string;
  last_name?: string;
  department_id: string;
  role_ids: number[];
  is_active: boolean;
  password?: string;
  confirm_password?: string;
}

const baseUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  usn: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department_id: z.string({
    required_error: "Please select a department",
  }),
  roles: z.array(z.string()).min(1, "Please select at least one role"),
  is_active: z.boolean().default(true),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirm_password: z.string(),
});

const createUserFormSchema = baseUserSchema.merge(passwordSchema).refine(
  (data) => {
    if (data.password !== data.confirm_password) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords don't match",
    path: ["confirm_password"],
  }
);

const updateUserFormSchema = baseUserSchema;

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export function UserForm({ userId, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!userId;

  // Use different schemas based on mode
  const userFormSchema = isEditMode
    ? baseUserSchema
    : baseUserSchema.merge(passwordSchema);

  // Form initialization with the correct type
  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(
      isEditMode ? updateUserFormSchema : createUserFormSchema
    ),
    defaultValues: {
      is_active: true,
      roles: [],
      ...(isEditMode ? {} : { password: "", confirm_password: "" }),
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
    mutationFn: (data: CreateUserFormData) => {
      const apiData: UserApiData = {
        ...data,
        role_ids: data.roles
          .map((roleName) => {
            const role = rolesData?.find((r: Role) => r.name === roleName);
            return role?.id;
          })
          .filter((id): id is number => id !== undefined),
        password: data.password,
        confirm_password: data.confirm_password,
      };
      return userManagementService.createUser(apiData);
    },
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
    mutationFn: (data: UpdateUserFormData) => {
      const apiData: UserApiData = {
        ...data,
        role_ids: data.roles
          .map((roleName) => {
            const role = rolesData?.find((r: Role) => r.name === roleName);
            return role?.id;
          })
          .filter((id): id is number => id !== undefined),
      };

      // Only include password fields if they are provided
      if (data.password && data.confirm_password) {
        apiData.password = data.password;
        apiData.confirm_password = data.confirm_password;
      }

      return userManagementService.updateUser(Number(userId), apiData);
    },
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
  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    if (isEditMode) {
      updateUserMutation.mutate(data as UpdateUserFormData);
    } else {
      createUserMutation.mutate(data as CreateUserFormData);
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
