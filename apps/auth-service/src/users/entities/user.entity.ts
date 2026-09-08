export class User {
  id: string;
  email: string;
  fullName?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  nicNumber?: string;
  city?: string;
  profilePicture?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
