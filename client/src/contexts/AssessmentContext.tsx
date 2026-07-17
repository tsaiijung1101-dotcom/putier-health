import React, { createContext, useContext, useState, ReactNode } from "react";

export type Gender = "male" | "female";

export interface MedicationImage {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
}

export interface BasicInfo {
  lineId: string;
  nickname: string;
  birthdate: string; // YYYY-MM-DD
  gender: Gender | "";
  height: string;
  weight: string;
  medications: string;
  surgeryHistory: string;
  medicationImages: MedicationImage[];
}

export interface LeaderInfo {
  lineUrl: string;
  name: string;
  status: string;
  expiredAt: string | null;
}

export interface AssessmentState {
  step: number;
  basicInfo: BasicInfo;
  selectedSymptoms: string[];
  savedAssessmentId: number | null;
  leader: LeaderInfo | null;
}

interface AssessmentContextType {
  state: AssessmentState;
  setStep: (step: number) => void;
  updateBasicInfo: (info: Partial<BasicInfo>) => void;
  setSelectedSymptoms: (symptoms: string[]) => void;
  toggleSymptom: (symptomId: string) => void;
  setSavedAssessmentId: (id: number) => void;
  setLeader: (leader: LeaderInfo | null) => void;
  logoutLeader: () => void;
  resetAssessment: () => void;
}

const defaultBasicInfo: BasicInfo = {
  lineId: "",
  nickname: "",
  birthdate: "",
  gender: "",
  height: "",
  weight: "",
  medications: "",
  surgeryHistory: "",
  medicationImages: [],
};

const defaultState: AssessmentState = {
  step: 1,
  basicInfo: defaultBasicInfo,
  selectedSymptoms: [],
  savedAssessmentId: null,
  leader: JSON.parse(localStorage.getItem("putier_leader") || "null"),
};

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(defaultState);

  const setStep = (step: number) => setState(s => ({ ...s, step }));

  const updateBasicInfo = (info: Partial<BasicInfo>) =>
    setState(s => ({ ...s, basicInfo: { ...s.basicInfo, ...info } }));

  const setSelectedSymptoms = (symptoms: string[]) =>
    setState(s => ({ ...s, selectedSymptoms: symptoms }));

  const toggleSymptom = (symptomId: string) =>
    setState(s => ({
      ...s,
      selectedSymptoms: s.selectedSymptoms.includes(symptomId)
        ? s.selectedSymptoms.filter(id => id !== symptomId)
        : [...s.selectedSymptoms, symptomId],
    }));

  const setSavedAssessmentId = (id: number) =>
    setState(s => ({ ...s, savedAssessmentId: id }));

  const setLeader = (leader: LeaderInfo | null) => {
    setState(s => ({ ...s, leader }));
    if (leader) {
      localStorage.setItem("putier_leader", JSON.stringify(leader));
    } else {
      localStorage.removeItem("putier_leader");
    }
  };

  const logoutLeader = () => {
    setLeader(null);
  };

  const resetAssessment = () => setState(s => ({ ...defaultState, leader: s.leader }));

  return (
    <AssessmentContext.Provider
      value={{
        state,
        setStep,
        updateBasicInfo,
        setSelectedSymptoms,
        toggleSymptom,
        setSavedAssessmentId,
        setLeader,
        logoutLeader,
        resetAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
