/**
 * Represents the extracted features and components from a user's prompt
 */
export interface ExtractedIntent {
  /** List of high-level features requested by the user */
  features: string[];

  /** List of UI components or pages needed */
  components: string[];

  /** Brief summary of the user's goal */
  summary: string;
}

/**
 * Input parameters for the intent extraction process
 */
export interface ExtractIntentParams {
  /** The user's original message/prompt */
  message: string;

  /** Previous chat context if available */
  chatContext?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
