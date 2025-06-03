import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verify(token, JWT_SECRET);
    if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    (req as any).userId = (decoded as any).id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}
