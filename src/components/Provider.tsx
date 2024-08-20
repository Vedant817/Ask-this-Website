"use client";

import { PropsWithChildren } from "react";
import { NextUIProvider } from "@nextui-org/react";

export const Provider = ({ children }: PropsWithChildren) => {
    return <NextUIProvider>{children}</NextUIProvider>;
};