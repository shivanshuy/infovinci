const promptEngineeringContent = {
    header: "What is Function Calling?",
    text: "Tool/Function calling allows a model to respond to a given prompt by generating output that matches a user-defined schema. While the name implies that the model is performing some action, this is actually not the case! The model is merely coming up with the arguments to a tool, and actually running a tool (or not) is up to the user.",
    contents: [        
        {
            type: "reference",
            href: "https://js.langchain.com/v0.1/docs/modules/model_io/chat/function_calling",
            text: "Langchain Tool/function calling?"
        },
        {
            type: "reference",
            href: "https://platform.openai.com/docs/guides/function-calling",
            text: "OpenAi Function calling"
        },
        {
            type: "header",
            text: "When to use Function Calling?"
        },
        {
            type: "text",
            text: `If you want to extract output matching some schema from unstructured text, you could give the model an “extraction” tool that takes parameters matching the desired schema, then treat the generated output as your final result. If you actually do want to execute called tools, you can use the Tool Calling Agent.`
        },
        {
            type: "header",
            text: "Ways to extract structured information from llm"
        },
        {
            type: "text",
            text: `There are 3 broad approaches for structured information extraction using LLMs - Tool/Function Calling, JSON Schema, Prompting.`
        },
        {
            type: "header",
            text: "Tool/Function Calling"
        },
        {
            type: "text",
            text: `LLMs can structure output according to a given schema. Generally, this approach is the easiest to work with and is expected to yield good results.`
        },
        {
            type: "header",
            text: "JSON Schema"
        },
        {
            type: "text",
            text: `This is similar to tool/function calling approach, except that the schema is provided as part of the prompt. Generally, our intuition is that this performs worse than a tool/function calling approach, especially for complex schemas, but you should verify for your own use case!`
        },
        {
            type: "header",
            text: "Prompting"
        },
        {
            type: "text",
            text: `LLMs that can follow instructions well can be instructed to generate text in a desired format.This approach can be used with LLMs that do not support JSON mode or tool/function calling modes. This approach is more broadly applicable, though may yield worse results.`
        },
        {
            type: "header",
            text: "Format of Function/Tool Calling"
        },
        {
            type: "text",
            text: `LLms adopt different conventions for formatting tool schemas and tool calls.`
        },
        {
            type: "code",
            code: `{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current temperature for a given location.",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "City and country e.g. Bogotá, Colombia"
        }
      },
      "required": [
        "location"
      ]
    }
  }
}`
        },
        {
            type: "header",
            text: "How the output looks like after information extraction?"
        },
        {
            type: "code",
            code: `{
  "id": "call_12345xyz",
  "type": "function",
  "function": {
    "name": "get_weather",
    "arguments": {
      "location": "Paris, France"
    }
  }
}`
        }
    ]
}
export default promptEngineeringContent;