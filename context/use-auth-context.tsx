"use client";

import React, { useState } from "react";
import { NaacFile } from "../schema/file-schema";

type InitialValuesProps = {
  files: NaacFile[];
  setFiles: React.Dispatch<React.SetStateAction<NaacFile[]>>;
};

const InitialValues: InitialValuesProps = {
  files: [],
  setFiles: () => undefined,
};

const useAuthContext = React.createContext(InitialValues);

const { Provider } = useAuthContext;

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [files, setFiles] = useState<NaacFile[]>([]);
  const values = {
    files,
    setFiles,
  };
  return <Provider value={values}>{children}</Provider>;
};

export const useAuth = () => {
  const state = React.useContext(useAuthContext);
  return state;
};
