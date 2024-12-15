// app/(dashboard)/admin/settings/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { academicYearServices, boardServices } from "@/services/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  PlusCircle,
  School,
  CalendarRange,
  Trash2,
  Edit,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showToast } from "@/lib/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/context/settings-context";

const boardFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
});

const academicYearFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  start_date: z.string(),
  end_date: z.string(),
  is_current: z.boolean().optional(),
});

type BoardFormValues = z.infer<typeof boardFormSchema>;
type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;

export default function SettingsPage() {
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showAcademicYearDialog, setShowAcademicYearDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [editingAcademicYear, setEditingAcademicYear] = useState<any>(null);
  const [deletingBoard, setDeletingBoard] = useState<any>(null);
  const [deletingAcademicYear, setDeletingAcademicYear] = useState<any>(null);

  const { selectedBoard, selectedAcademicYear } = useSettings();

  const queryClient = useQueryClient();

  const boardForm = useForm<BoardFormValues>({
    resolver: zodResolver(boardFormSchema),
  });

  const academicYearForm = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearFormSchema),
  });

  const { data: boardsData, isLoading: loadingBoards } = useQuery({
    queryKey: ["boards"],
    queryFn: boardServices.fetchBoards,
    select: (data) => {
      // If your API returns { data: [] }, extract the data array
      return Array.isArray(data) ? data : data.data || [];
    },
  });

  const { data: academicYearsData, isLoading: loadingAcademicYears } = useQuery(
    {
      queryKey: ["academic-years"],
      queryFn: academicYearServices.fetchAcademicYears,
      select: (data) => {
        // If your API returns { data: [] }, extract the data array
        return Array.isArray(data) ? data : data.data || [];
      },
    }
  );

  const boards = Array.isArray(boardsData) ? boardsData : [];
  const academicYears = Array.isArray(academicYearsData)
    ? academicYearsData
    : [];

  const onBoardSubmit = async (data: BoardFormValues) => {
    const loadingToast = showToast.loading("Saving board...");
    try {
      if (editingBoard) {
        await boardServices.updateBoard(editingBoard.id, data);
        showToast.success("Board updated successfully");
      } else {
        await boardServices.createBoard(data);
        showToast.success("Board created successfully");
      }
      setShowBoardDialog(false);
      setEditingBoard(null);
      boardForm.reset();
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    } catch (error: any) {
      showToast.error(error.message || "Failed to save board");
    } finally {
      showToast.dismiss(loadingToast);
    }
  };

  const onAcademicYearSubmit = async (data: AcademicYearFormValues) => {
    const loadingToast = showToast.loading("Saving academic year...");
    try {
      if (editingAcademicYear) {
        await academicYearServices.updateAcademicYear(
          editingAcademicYear.id,
          data
        );
        showToast.success("Academic Year updated successfully");
      } else {
        await academicYearServices.createAcademicYear(data);
        showToast.success("Academic Year created successfully");
      }
      setShowAcademicYearDialog(false);
      setEditingAcademicYear(null);
      academicYearForm.reset();
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    } catch (error: any) {
      showToast.error(error.message || "Failed to save academic year");
    } finally {
      showToast.dismiss(loadingToast);
    }
  };

  const handleDeleteBoard = async () => {
    const loadingToast = showToast.loading("Deleting board...");
    try {
      await boardServices.deleteBoard(deletingBoard.id);
      showToast.success("Board deleted successfully");
      setDeletingBoard(null);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    } catch (error: any) {
      showToast.error(error.message || "Failed to delete board");
    } finally {
      showToast.dismiss(loadingToast);
    }
  };

  const handleDeleteAcademicYear = async () => {
    const loadingToast = showToast.loading("Deleting academic year...");
    try {
      await academicYearServices.deleteAcademicYear(deletingAcademicYear.id);
      showToast.success("Academic Year deleted successfully");
      setDeletingAcademicYear(null);
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    } catch (error: any) {
      showToast.error(error.message || "Failed to delete academic year");
    } finally {
      showToast.dismiss(loadingToast);
    }
  };
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="boards">
        <TabsList>
          <TabsTrigger value="boards" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Boards
          </TabsTrigger>
          <TabsTrigger
            value="academic-years"
            className="flex items-center gap-2"
          >
            <CalendarRange className="h-4 w-4" />
            Academic Years
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Boards</h2>
            <Button onClick={() => setShowBoardDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Board
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingBoards ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : boards.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No boards found
              </div>
            ) : (
              boards.map((board: any) => (
                <Card
                  key={board.id}
                  className={`${
                    board.id === selectedBoard
                      ? "border-green-300 border-2"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>Code: {board.code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-1/2"
                        onClick={() => {
                          setEditingBoard(board);
                          boardForm.reset({
                            name: board.name,
                            code: board.code,
                          });
                          setShowBoardDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="w-1/2"
                        onClick={() => setDeletingBoard(board)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="academic-years" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Academic Years</h2>
            <Button onClick={() => setShowAcademicYearDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingAcademicYears ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : academicYears.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No academic years found
              </div>
            ) : (
              academicYears.map((year: any) => (
                <Card
                  key={year.id}
                  className={`w-fit ${
                    year.id === selectedAcademicYear
                      ? "border-green-300 border-2"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle>
                      {year.name}
                      {year.is_current && (
                        <span className="text-sm ml-2 text-gray-400 tracking-wide">
                          (current)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="w-fit">
                    <div className="space-y-2">
                      <div className="flex items-center p-2 border rounded space-x-3 tracking-wider font-semibold text-gray-600 justify-center w-fit">
                        <span className="text-sm">
                          {/* Start Date:{" "} */}
                          {new Date(year.start_date).toLocaleDateString(
                            "en-IN"
                          )}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-sm">
                          {/* End Date:{" "} */}
                          {new Date(year.end_date).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="w-1/2"
                          size="icon"
                          onClick={() => {
                            setEditingAcademicYear(year);
                            academicYearForm.reset({
                              name: year.name,
                              is_current: year.is_current,
                              start_date: year.start_date.split("T")[0],
                              end_date: year.end_date.split("T")[0],
                            });
                            setShowAcademicYearDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-1/2"
                          size="icon"
                          onClick={() => setDeletingAcademicYear(year)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Board Dialog */}
      <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBoard ? "Edit Board" : "Add New Board"}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the board below.
            </DialogDescription>
          </DialogHeader>

          <Form {...boardForm}>
            <form
              onSubmit={boardForm.handleSubmit(onBoardSubmit)}
              className="space-y-4"
            >
              <FormField
                control={boardForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={boardForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBoardDialog(false);
                    setEditingBoard(null);
                    boardForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {boardForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingBoard ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Academic Year Dialog */}
      <Dialog
        open={showAcademicYearDialog}
        onOpenChange={setShowAcademicYearDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAcademicYear
                ? "Edit Academic Year"
                : "Add New Academic Year"}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the academic year below.
            </DialogDescription>
          </DialogHeader>

          <Form {...academicYearForm}>
            <form
              onSubmit={academicYearForm.handleSubmit(onAcademicYearSubmit)}
              className="space-y-4"
            >
              <FormField
                control={academicYearForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={academicYearForm.control}
                name="is_current"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormLabel>Is Current</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={academicYearForm.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={academicYearForm.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAcademicYearDialog(false);
                    setEditingAcademicYear(null);
                    academicYearForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {academicYearForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAcademicYear ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Board Dialog */}
      <AlertDialog
        open={!!deletingBoard}
        onOpenChange={(open) => !open && setDeletingBoard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              board and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Academic Year Dialog */}
      <AlertDialog
        open={!!deletingAcademicYear}
        onOpenChange={(open) => !open && setDeletingAcademicYear(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              academic year and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAcademicYear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
