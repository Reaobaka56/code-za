import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface ExecutionResult {
  output: string;
  error: string;
  duration: number;
}

export const runCode = async (language: string, code: string): Promise<ExecutionResult> => {
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
      runCmd = "./solution";
      break;
    case "python":
      fileName = "solution.py";
      runCmd = `python3 ${fileName}`;
      break;
    case "java":
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : "Main";
      fileName = `${className}.java`;
      compileCmd = `javac ${fileName}`;
      runCmd = `java ${className}`;
      break;
    case "javascript":
      fileName = "solution.js";
      runCmd = `node ${fileName}`;
      break;
    default:
      throw new Error("Unsupported language");
  }

  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, code);

  const fullCommand = compileCmd 
    ? `${compileCmd} && ${runCmd}` 
    : runCmd;

  const startTime = Date.now();
  
  return new Promise((resolve) => {
    exec(fullCommand, { 
      cwd: tempDir,
      timeout: 5000,
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }

      if (error) {
        let errorMessage = stderr || error.message;
        if (errorMessage.includes("not found")) {
          let cmd = "compiler/runtime";
          if (errorMessage.includes("g++")) cmd = "g++ (C++)";
          else if (errorMessage.includes("javac")) cmd = "javac (Java)";
          else if (errorMessage.includes("java")) cmd = "java (Java)";
          else if (errorMessage.includes("python3")) cmd = "python3 (Python)";
          else if (errorMessage.includes("node")) cmd = "node (JavaScript)";
          
          errorMessage = `Error: The ${language} ${cmd} is not installed in this environment.`;
        }

        resolve({ 
          output: stdout, 
          error: errorMessage, 
          duration 
        });
      } else {
        resolve({ 
          output: stdout, 
          error: stderr, 
          duration 
        });
      }
    });
  });
};

export const runTerminal = async (command: string): Promise<{ output: string; error: string }> => {
  const forbidden = ["rm -rf /", ":(){ :|:& };:", "dd if=/dev/random"];
  if (forbidden.some(f => command.includes(f))) {
    return { output: "", error: "Forbidden command" };
  }

  return new Promise((resolve) => {
    exec(command, { 
      timeout: 10000,
      maxBuffer: 1024 * 1024 
    }, (error, stdout, stderr) => {
      let terminalError = stderr || (error ? error.message : "");
      
      if (terminalError.includes("404 Not Found") && command.includes("npm install")) {
        const pkg = command.split("npm install")[1]?.trim().split(" ")[0];
        if (pkg && pkg.includes("sdk-name")) {
          terminalError += `\n\n💡 HINT: "@sdk-name/react" is likely a placeholder from a tutorial.`;
        }
      }

      resolve({ 
        output: stdout, 
        error: terminalError,
      });
    });
  });
};
