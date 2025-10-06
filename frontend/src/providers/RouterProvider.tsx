import React from "react";
import { BrowserRouter } from "react-router-dom";

interface RouterProviderProps {
  children: React.ReactNode;
}

const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

export default RouterProvider;