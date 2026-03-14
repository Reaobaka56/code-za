import { Request, Response } from "express";
import * as completionService from "../services/completionService";

export const getCompletions = async (req: Request, res: Response) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  if (typeof code !== "string" || code.length > 50_000) {
    return res.status(413).json({ error: "Code payload too large for completions." });
  }

  try {
    const result = await completionService.getCodeCompletions({ code, language });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const explainCode = async (req: Request, res: Response) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  if (typeof code !== "string" || code.length > 50_000) {
    return res.status(413).json({ error: "Code payload too large for explanation." });
  }

  try {
    const explanation = await completionService.explainCode(code, language);
    res.json({ explanation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
