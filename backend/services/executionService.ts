import { exec } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface ExecutionResult {
  output: string;
  error: string;
  duration: number;
}

type PistonRuntime = {
  language: string;
  version: string;
  aliases?: string[];
};

const PISTON_BASE_URL = (process.env.PISTON_BASE_URL || "https://emkc.org/api/v2/piston").replace(/\/+$/, "");
const onlineLanguages = new Set(["python", "cpp", "java"]);
const runtimeCache = new Map<string, { language: string; version: string }>();
const runtimeMode = (process.env.CODEZA_RUNTIME_MODE || "auto").toLowerCase(); // auto | online | local
const isWindows = process.platform === "win32";

const runtimeHints: Record<string, string[]> = {
  python: ["python", "py"],
  cpp: ["c++", "cpp"],
  java: ["java"],
};

const getSourceFileName = (language: string, code: string): string => {
  switch (language) {
    case "python":
      return "main.py";
    case "cpp":
      return "main.cpp";
    case "java": {
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : "Main";
      return `${className}.java`;
    }
    case "javascript":
      return "solution.js";
    default:
      return "main.txt";
  }
};

const resolveRuntime = async (language: string): Promise<{ language: string; version: string }> => {
  const cached = runtimeCache.get(language);
  if (cached) return cached;

  const wanted = runtimeHints[language];
  if (!wanted) {
    throw new Error(`Unsupported language for online execution: ${language}`);
  }

  const { data } = await axios.get<PistonRuntime[]>(`${PISTON_BASE_URL}/runtimes`, {
    timeout: 10000,
    proxy: false,
  });

  for (const name of wanted) {
    const runtime = data.find((entry) => entry.language === name || entry.aliases?.includes(name));
    if (runtime) {
      const selected = { language: runtime.language, version: runtime.version };
      runtimeCache.set(language, selected);
      return selected;
    }
  }

  throw new Error(`No runtime found for ${language}`);
};

const runCodeOnline = async (language: string, code: string): Promise<ExecutionResult> => {
  const runtime = await resolveRuntime(language);
  const startedAt = Date.now();

  const { data } = await axios.post(
    `${PISTON_BASE_URL}/execute`,
    {
      language: runtime.language,
      version: runtime.version,
      files: [{ name: getSourceFileName(language, code), content: code }],
      compile_timeout: 12000,
      run_timeout: 7000,
    },
    {
      timeout: 20000,
      proxy: false,
    }
  );

  const compileOut = data?.compile?.stdout ?? "";
  const runOut = data?.run?.stdout ?? "";
  const compileErr = data?.compile?.stderr ?? "";
  const runErr = data?.run?.stderr ?? "";
  const exitCode = data?.run?.code;

  let error = [compileErr, runErr].filter(Boolean).join("\n");
  if (!error && typeof exitCode === "number" && exitCode !== 0) {
    error = `Process exited with code ${exitCode}.`;
  }

  return {
    output: `${compileOut}${runOut}`,
    error,
    duration: Date.now() - startedAt,
  };
};

const runCodeLocally = async (language: string, code: string): Promise<ExecutionResult> => {
  const requestId = uuidv4();
  const tempDir = path.join(process.cwd(), "temp", requestId);

  if (!fs.existsSync(path.join(process.cwd(), "temp"))) {
    fs.mkdirSync(path.join(process.cwd(), "temp"));
  }
  fs.mkdirSync(tempDir);

  let fileName = "";
  let compileCmd = "";
  let runCmd = "";

  switch (language) {
    case "cpp":
      fileName = "solution.cpp";
      compileCmd = `g++ ${fileName} -o solution`;
      runCmd = isWindows ? "solution.exe" : "./solution";
      break;
    case "python":
      fileName = "solution.py";
      runCmd = isWindows ? `py -3 ${fileName}` : `python3 ${fileName}`;
      break;
    case "java": {
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : "Main";
      fileName = `${className}.java`;
      compileCmd = `javac ${fileName}`;
      runCmd = `java ${className}`;
      break;
    }
    case "javascript":
      fileName = "solution.js";
      runCmd = `node ${fileName}`;
      break;
    default:
      throw new Error("Unsupported language");
  }

  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, code);

  const fullCommand = compileCmd ? `${compileCmd} && ${runCmd}` : runCmd;
  const startTime = Date.now();

  return new Promise((resolve) => {
    exec(
      fullCommand,
      {
        cwd: tempDir,
        timeout: 5000,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }

        if (error) {
          let errorMessage = stderr || error.message;
          if (
            errorMessage.includes("not found") ||
            errorMessage.includes("is not recognized as an internal or external command")
          ) {
            let cmd = "compiler/runtime";
            if (errorMessage.includes("g++")) cmd = "g++ (C++)";
            else if (errorMessage.includes("javac")) cmd = "javac (Java)";
            else if (errorMessage.includes("java")) cmd = "java (Java)";
            else if (errorMessage.includes("python3") || errorMessage.includes("py -3") || errorMessage.includes("python")) cmd = "python (Python)";
            else if (errorMessage.includes("node")) cmd = "node (JavaScript)";

            errorMessage = `Error: The ${language} ${cmd} is not installed in this environment.\nInstall the runtime locally or set CODEZA_RUNTIME_MODE=online.`;
          }

          resolve({
            output: stdout,
            error: errorMessage,
            duration,
          });
        } else {
          resolve({
            output: stdout,
            error: stderr,
            duration,
          });
        }
      }
    );
  });
};

export const runCode = async (language: string, code: string): Promise<ExecutionResult> => {
  if (onlineLanguages.has(language) && runtimeMode !== "local") {
    try {
      return await runCodeOnline(language, code);
    } catch (error: any) {
      if (runtimeMode === "online") {
        return {
          output: "",
          error: `Online ${language.toUpperCase()} runtime is currently unavailable. ${error?.message ?? ""}`.trim(),
          duration: 0,
        };
      }

      // auto mode fallback to local runtime
      try {
        const local = await runCodeLocally(language, code);
        if (local.error) {
          local.error = `Online runtime failed: ${error?.message ?? "unknown"}\n\nLocal runtime error:\n${local.error}`;
        }
        return local;
      } catch (localError: any) {
        return {
          output: "",
          error: `Online ${language.toUpperCase()} runtime unavailable (${error?.message ?? "unknown"}). Local fallback also failed (${localError?.message ?? "unknown"}).`,
          duration: 0,
        };
      }
    }
  }

  return runCodeLocally(language, code);
};

export const runTerminal = async (command: string): Promise<{ output: string; error: string }> => {
  const forbidden = ["rm -rf /", ":(){ :|:& };:", "dd if=/dev/random"];
  if (forbidden.some((f) => command.includes(f))) {
    return { output: "", error: "Forbidden command" };
  }

  return new Promise((resolve) => {
    exec(
      command,
      {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        let terminalError = stderr || (error ? error.message : "");

        if (terminalError.includes("404 Not Found") && command.includes("npm install")) {
          const pkg = command.split("npm install")[1]?.trim().split(" ")[0];
          if (pkg && /(sdk-name|your-sdk|your-package|package-name)/i.test(pkg)) {
            terminalError += "\n\nHINT: The package name looks like a tutorial placeholder. Replace it with the real SDK package for your language/framework.";
          }
        }

        resolve({
          output: stdout,
          error: terminalError,
        });
      }
    );
  });
};
