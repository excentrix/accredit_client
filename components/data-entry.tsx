import React from "react";
import { NaacFile } from "@/schema/file-schema";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader } from "./ui/card";

type Props = {
  files: NaacFile[];
};

const DataEntry = ({ files }: Props) => {
  return (
    <div className="p-2 bg-gray-200 h-screen">
      {/* {files.map((file, index) => (
        <div key={index}>
          {Array.isArray(file.structure) &&
            file.structure.map((field, fieldIndex) => {
              console.log("field", field);
              return (
                <div key={fieldIndex}>
                  <label>{field.label}</label>
                  <input type={field.type} name={field.name} />
                </div>
              );
            })} */}
      {files.map((file, index) => {
        return (
          <Card key={index}>
            <CardHeader>{file.heading}</CardHeader>
            <CardContent>
              {Object.keys(file.structure).map((key, keyIndex) => {
                return (
                  <div key={keyIndex} className="flex gap-3 items-center p-2">
                    <Label>{key}</Label>
                    <Input type={file.structure[key].type} name={key} placeholder="" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DataEntry;
