// components/data-management/criteria-manager.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface Criterion {
  id: number;
  code: string;
  name: string;
  description: string;
  weightage: number;
}

export function CriteriaManager() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const fetchCriteria = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/criteria/");
      setCriteria(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch criteria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Criteria</h2>
          <p className="text-muted-foreground">
            Manage assessment criteria and weightages
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Criterion
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Weightage</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : criteria.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No criteria found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              criteria.map((criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell className="font-medium">
                    {criterion.code}
                  </TableCell>
                  <TableCell>{criterion.name}</TableCell>
                  <TableCell>{criterion.description}</TableCell>
                  <TableCell>{criterion.weightage}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCriterion(criterion);
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {}}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
