import { Request, Response } from "express";
import * as executionService from "../services/executionService";

export const runCode = async (req: Request, res: Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
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

  const result = await executionService.runTerminal(command);
  res.json(result);
};
