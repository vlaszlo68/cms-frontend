export type UserRole = "ADMIN" | "USER";

export type RegistrationStatus =
  | "PENDING"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "COMPLETED"
  | "REJECTED";

export type User = {
  id: number;
  loginName: string;
  userName: string;
  emailAddress: string;
  role: UserRole;
  active: boolean;
  registrationStatus: RegistrationStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateUserRequest = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password: string;
  role: UserRole;
  active: boolean;
  registrationStatus?: RegistrationStatus | null;
};

export type UpdateUserRequest = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password?: string | null;
  role: UserRole;
  active: boolean;
  registrationStatus?: RegistrationStatus | null;
};
