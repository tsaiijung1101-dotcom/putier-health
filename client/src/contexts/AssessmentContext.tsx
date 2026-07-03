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

export interface AssessmentState {
  step: number;
  basicInfo: BasicInfo;
  selectedSymptoms: string[];
  savedAssessmentId: number | null;
}

interface AssessmentContextType {
  state: AssessmentState;
  setStep: (step: number) => void;
  updateBasicInfo: (info: Partial<BasicInfo>) => void;
  setSelectedSymptoms: (symptoms: string[]) => void;
  toggleSymptom: (symptomId: string) => void;
  setSavedAssessmentId: (id: number) => void;
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

  const resetAssessment = () => setState(defaultState);

  return (
    <AssessmentContext.Provider
      value={{
        state,
        setStep,
        updateBasicInfo,
        setSelectedSymptoms,
        toggleSymptom,
        setSavedAssessmentId,
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
