import { sign, verify, type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Add it to .env (see .env.example)."
  );
}

const JWT_SECRET_STRING: string = JWT_SECRET;

export type SessionUser = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

export function signToken(payload: SessionUser): string {
  return sign(payload, JWT_SECRET_STRING, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = verify(token, JWT_SECRET_STRING) as JwtPayload;
    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string" ||
      (typeof decoded.name !== "string" && decoded.name !== null) ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}
