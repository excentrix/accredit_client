// app/(dashboard)/iqac/export/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Loader2,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

interface Template {
  id: string;
  code: string;
  name: string;
  criterion: string;
}

export default function ExportPage() {
  const [selectedCriterion, setSelectedCriterion] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch current academic year
  const { data: currentAcademicYear, isLoading: isLoadingAcademicYear } =
    useQuery({
      queryKey: ["currentAcademicYear"],
      queryFn: async () => {
        const response = await api.get("/academic-years/current/");
        return response.data.data; // Note: Adjust this based on your API response structure
      },
    });

  // Fetch criteria
  const { data: criteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const response = await api.get("/criteria/list/");
      return response.data;
    },
  });

  // Fetch all templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", selectedCriterion],
    queryFn: async () => {
      const response = await api.get(
        selectedCriterion
          ? `/templates/?criterion=${selectedCriterion}`
          : "/templates/"
      );
      return response.data;
    },
  });

  // Filter templates based on search query
  const filteredTemplates = templates?.filter((template: Template) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      template.code.toLowerCase().includes(searchLower) ||
      template.name.toLowerCase().includes(searchLower)
    );
  });

  // Group templates by criterion
  const templatesByCriterion = templates?.reduce(
    (acc: any, template: Template) => {
      const criterion = template.code.split(".")[0];
      if (!acc[criterion]) {
        acc[criterion] = [];
      }
      acc[criterion].push(template);
      return acc;
    },
    {}
  );

  const handleExport = async (
    type: "all" | "criterion" | "template",
    params?: {
      criterion?: string;
      template_code?: string;
    }
  ) => {
    try {
      if (!currentAcademicYear?.id) {
        toast.error("No academic year selected");
        return;
      }

      setIsExporting(true);
      const loadingToast = toast.loading("Generating Excel file...");

      const queryParams = new URLSearchParams({
        type,
        academic_year: currentAcademicYear.id.toString(),
        ...(params?.criterion && { criterion: params.criterion }),
        ...(params?.template_code && { template_code: params.template_code }),
      });

      const response = await api.get(`/templates/export/?${queryParams}`, {
        responseType: "blob",
        // headers: {
        //   Accept:
        //     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // },
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const date = new Date().toISOString().split("T")[0];
      const filename = `${type === "all" ? "all_" : ""}${
        type === "criterion" ? `_${params?.criterion}` : ""
      }${type === "template" ? `_${params?.template_code}` : ""}_${
        currentAcademicYear.name
      }.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("Export completed successfully!");
    } catch (error: any) {
      console.error("Export error:", error);

      // Try to read error message from response
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            toast.error(errorData.error || "Export failed");
          } catch {
            toast.error("Failed to export data");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error("Failed to export data");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Export Data</h1>
          <p className="text-muted-foreground">
            Export department submissions for {currentAcademicYear?.name}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="criterion">Criterion-wise</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Export All Data Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Export All Data</CardTitle>
                  <CardDescription>
                    Export data from all criteria and templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleExport("all")}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Export All
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Export by Criterion Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Export by Criterion</CardTitle>
                  <CardDescription>
                    Quick export for a specific criterion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedCriterion}
                    onValueChange={setSelectedCriterion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select criterion" />
                    </SelectTrigger>
                    <SelectContent>
                      {criteria?.map((criterion: any) => (
                        <SelectItem key={criterion.id} value={criterion.id}>
                          Criterion {criterion.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleExport("criterion", {
                        criterion: selectedCriterion,
                      })
                    }
                    disabled={isExporting || !selectedCriterion}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Export Criterion
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Export by Template Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Export by Template</CardTitle>
                  <CardDescription>
                    Quick export for a specific template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template: Template) => (
                        <SelectItem key={template.id} value={template.code}>
                          {template.code} - {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleExport("template", {
                        template_code: selectedTemplate,
                      })
                    }
                    disabled={isExporting || !selectedTemplate}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Export Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Template List</CardTitle>
                <CardDescription>
                  View and export individual templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select
                      value={selectedCriterion}
                      onValueChange={setSelectedCriterion}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by criterion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Criteria</SelectItem>
                        {criteria?.map((criterion: any) => (
                          <SelectItem key={criterion.id} value={criterion.id}>
                            Criterion {criterion.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Criterion</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates?.map((template: Template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">
                              {template.code}
                            </TableCell>
                            <TableCell>{template.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                Criterion {template.code.split(".")[0]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleExport("template", {
                                    template_code: template.code,
                                  })
                                }
                                disabled={isExporting}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="criterion">
            <Card>
              <CardHeader>
                <CardTitle>Criterion-wise Templates</CardTitle>
                <CardDescription>
                  View and export templates by criterion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(templatesByCriterion || {}).map(
                    ([criterion, templates]: [string, any]) => (
                      <div key={criterion} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Criterion {criterion}
                          </h3>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleExport("criterion", {
                                criterion,
                              })
                            }
                            disabled={isExporting}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export All
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templates.map((template: Template) => (
                              <TableRow key={template.id}>
                                <TableCell className="font-medium">
                                  {template.code}
                                </TableCell>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleExport("template", {
                                        template_code: template.code,
                                      })
                                    }
                                    disabled={isExporting}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
