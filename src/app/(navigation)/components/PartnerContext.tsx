"use client";
import { createContext, useContext } from "react";

const PartnerContext = createContext<{
  hasPartner: boolean;
  role: "ATHLETE" | "TRAINER";
}>({
  hasPartner: false,
  role: "ATHLETE",
});

export function PartnerProvider({
  children,
  hasPartner,
  role,
}: {
  children: React.ReactNode;
  hasPartner: boolean;
  role: "ATHLETE" | "TRAINER";
}) {
  return (
    <PartnerContext.Provider value={{ hasPartner, role }}>
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartner() {
  return useContext(PartnerContext);
}
