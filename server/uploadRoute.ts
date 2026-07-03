import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerUploadRoutes(app: Router) {
  // POST /api/upload/medication-image
  app.post(
    "/api/upload/medication-image",
    upload.array("images", 10),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          res.status(400).json({ error: "No files uploaded" });
          return;
        }

        const results = await Promise.all(
          files.map(async (file: Express.Multer.File) => {
            const ext = file.originalname.split(".").pop() || "jpg";
            const key = `medication-images/${nanoid()}.${ext}`;
            const { url } = await storagePut(key, file.buffer, file.mimetype);
            return {
              key,
              url,
              originalName: file.originalname,
              mimeType: file.mimetype,
            };
          })
        );

        res.json({ success: true, files: results });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Upload failed";
        console.error("[Upload] Error:", error);
        res.status(500).json({ error: msg });
      }
    }
  );
}
