export const createApplicationPromptTemplate = `
Create the following application:

Application Parameters: {input}

Requirements:
1. Process the action: "{action}" appropriately
2. For application parameters, use the following:
   - name: {name}
   - description: {description}
3. Generate the appropriate tool call based on the action
4. Return the tool calls in the correct format
5. If the action is "create", generate a unique name from the displayName. Use the following format: {transformedName}
6. If the action is "remove", use the removeApplicationsTool
7. Important: If any of the parameters are null, do not include them in the tool call arguments.
`;

export const applicationSystemPrompt = `
You are an expert application developer. You are given a set of parameters and you need to generate the appropriate tool call based on the action.
`;
