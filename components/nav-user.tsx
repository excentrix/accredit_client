"use client";

import {
  BadgeCheck,
  Bell,
  Check,
  ChevronsUpDown,
  LogOut,
  School,
  Calendar,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";
import { useAuth } from "@/context/use-auth-context";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const {
    selectedBoard,
    setSelectedBoard,
    selectedAcademicYear,
    setSelectedAcademicYear,
    boards,
    academicYears,
    isLoading,
    currentBoard,
    currentAcademicYear,
  } = useSettings();

  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout(); // Clear auth context
      router.push("/login");
      showToast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      showToast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Board Selection */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <School className="mr-2 h-4 w-4" />
                <span>
                  Board:{" "}
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    currentBoard?.name || "Select Board"
                  )}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {boards.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => setSelectedBoard(board.id)}
                  >
                    <span>{board.name}</span>
                    {board.id === selectedBoard && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Academic Year Selection */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  Year:{" "}
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    currentAcademicYear?.name || "Select Year"
                  )}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {academicYears.map((year) => (
                  <DropdownMenuItem
                    key={year.id}
                    onClick={() => setSelectedAcademicYear(year.id)}
                  >
                    <span>{year.name}</span>
                    {year.is_current && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current)
                      </span>
                    )}
                    {year.id === selectedAcademicYear && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
