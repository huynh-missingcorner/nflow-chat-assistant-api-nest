import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Loads the content of a file as a string
 * @param filePath - The path to the file (can be relative or absolute)
 * @returns The file content as a string
 * @throws Error if the file cannot be read
 */
export function loadFileContent(filePath: string): string {
  try {
    const absolutePath = join(process.cwd(), filePath);
    return readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load file content from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Loads the content of a file as a string with fallback
 * @param filePath - The path to the file (can be relative or absolute)
 * @param fallback - The fallback content if file cannot be read
 * @returns The file content as a string or fallback
 */
export function loadFileContentSafe(filePath: string, fallback: string = ''): string {
  try {
    return loadFileContent(filePath);
  } catch {
    return fallback;
  }
}
