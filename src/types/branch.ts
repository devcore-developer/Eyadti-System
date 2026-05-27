// src/types/branch.ts

export interface BranchType {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  manager?: { id: string; name: string } | null;
  _count?: {
    patients: number;
    appointments: number;
  };
}

export interface BranchWithStats extends BranchType {
  doctorCount: number;
  patientCount: number;
  appointmentCount: number;
}