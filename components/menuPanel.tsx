"use client";

import React, { useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useAuth } from "@/context/use-auth-context";

interface MenuPanelProps {
  title: string;
}

export function MenuPanel({ title }: MenuPanelProps) {
  const { files, setFiles } = useAuth();
  useEffect(() => {
    fetch("http://127.0.0.1:8000/naac")
      .then((res) => res.json())
      .then((data: any) => {
        console.log(data);
        setFiles(data);
      });
  }, [title]);

  return (
    <>
      <div className="flex items-center px-4 py-2 h-[52px]">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <Separator />
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </form>
      </div>
      <div className="w-full px-4">
        {files.map((file: any) => (
          <Link
            key={
              file.subsection
                ? `/${file.section}.${file.subsection}`
                : `/${file.section}`
            }
            replace={true}
            href={
              {
                pathname:
                  title === "Register"
                    ? file.subsection
                      ? `/register/${file.section}.${file.subsection}`
                      : `/register/${file.section}`
                    : title === "Data Management"
                    ? file.subsection
                      ? `/data-management/${file.section}.${file.subsection}`
                      : `/data-management/${file.section}`
                    : "",
                query: { file: file.id },
              }
              // title === "Register"
              //   ? file.subsection
              //     ? `/${file.section}.${file.subsection}?id=${file.id}`
              //     : `/${file.section}?id=${file.id}`
              //   : title === "Data Management"
              //   ? file.subsection
              //     ? `data-management/${file.section}.${file.subsection}?id=${file.id}`
              //     : `data-management/${file.section}?id=${file.id}`
              //   : ""
            }
          >
            <Card key={file.section + file.subsection} className="p-4">
              <CardContent className="flex items-center space-x-4 py-2">
                <Badge className="text-base tracking-wider">
                  {file.section}
                </Badge>
                <span>{file.heading}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
