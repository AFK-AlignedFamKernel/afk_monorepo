import { spawn } from 'child_process';
import path from 'path';

interface PythonResult<T = any> {
  status: 'success' | 'error';
  processed_data?: T;
  error?: string;
}

export async function runPythonScript<T = any>(
  scriptName: string,
  inputData: any
): Promise<PythonResult<T>> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../python_scripts', scriptName);
    const venvPythonPath = path.join(__dirname, '../../python_scripts/venv/bin/python3');
    const pythonProcess = spawn(venvPythonPath, [scriptPath]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${errorData}`));
        return;
      }

      try {
        const result = JSON.parse(outputData) as PythonResult<T>;
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output: ${error}`));
      }
    });

    // Send input data to Python script
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
} 