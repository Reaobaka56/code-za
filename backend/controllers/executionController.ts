import { Request, Response } from "express";
import * as executionService from "../services/executionService";

export const runCode = async (req: Request, res: Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  if (typeof code !== "string" || code.length > 100_000) {
    return res.status(413).json({ error: "Code payload too large. Max 100,000 characters." });
  }

  try {
    const result = await executionService.runCode(language, code);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const runTerminal = async (req: Request, res: Response) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  if (typeof command !== "string" || command.length > 300) {
    return res.status(413).json({ error: "Command too long. Max 300 characters." });
  }

  const result = await executionService.runTerminal(command);
  res.json(result);
};
