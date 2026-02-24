declare module "@google/genai" {
  export type GenerateContentResponse = { text?: string };
  export enum Type { ARRAY = "array", OBJECT = "object", STRING = "string" }
  export interface GoogleGenAIOptions { apiKey?: string }
  export class GoogleGenAI {
    constructor(opts?: GoogleGenAIOptions);
    models: {
      generateContent: (opts: any) => Promise<GenerateContentResponse>;
    };
  }
  export { GoogleGenAI as default };
}
