import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      grade: string;
      role: string;
      isActive: boolean;
    };
    accessToken?: string;
  }
}
