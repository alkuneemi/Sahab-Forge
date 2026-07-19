export interface StoredUser {
  fullName: string;
  email: string;
  password: string;
}

export interface Session {
  email: string;
  fullName: string;
}
