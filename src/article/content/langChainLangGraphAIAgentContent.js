const langChainLangGraphAIAgentContent = {
    header: "What is an AI agent?",
    text: `AI Agents be described as a system that can use a LLM to reason through a problem, create a plan to solve the problem, and execute the plan with the help of a provided set of tools.`,
    contents: [
        {
            type: "link",
            href: "#/ai-agent-langchain",
            text: "ai agent using langchain"
        },
        {
            type: "header",
            text: "Instruction Fine-Tuning Datasets"
        },
        {
            type: "text",
            text: `These datasets consist of instructions paired with expected responses, guiding the model to execute tasks based on user commands.
            The input and output string follow a template known as an instruction dataset format. Some popular ones are Alpaca, Vicuna, Databricks, LIMA.`
        },
        {
            type: "reference",
            href: "https://www.ruder.io/an-overview-of-instruction-tuning-data",
            text: "an-overview-of-instruction-tuning-data"
        },
        {
            type: "code",
            code: `
// instruction: A prompt or question that guides the model's response.
// input: Additional context or information (can be empty).
// output: The desired response from the model.

[
  {
    "instruction": "Write a short story about a robot learning to cook.",
    "input": "",
    "output": "In a bustling kitchen of the future, Robot X-5 stood motionless, its optical sensors fixed on the sizzling pan before it. 'Crack two eggs,' the recipe instructed. With precision, X-5 selected an egg from the carton, but its metallic fingers crushed the delicate shell, sending yolk dripping down its chassis. Undeterred, X-5 tried again, this time adjusting its grip strength. Success! The egg cracked perfectly into the pan. As the day progressed, X-5 learned to chop vegetables without pulverizing them and to measure ingredients with increasing accuracy. By evening, a slightly lopsided but edible omelet sat on a plate, steam rising from its golden surface. X-5's LED display flickered in what could only be described as pride. It had taken its first step in mastering the art of cooking, proving that even robots can find joy in creating something delicious."
  },
  {
    "instruction": "Summarize below input",
    "input": "The main difference between instruction tuning and standard supervised fine-tuning lies in the data that the model is trained on. 
              Whereas supervised fine-tuning trains models on input examples and their corresponding outputs, instruction tuning augments input-output examples with instructions, 
              which enables instruction-tuned models to generalize more easily to new tasks.",
    "output": "The key difference between instruction tuning and standard supervised fine-tuning is the training data. 
              Supervised fine-tuning uses input-output pairs, while instruction tuning adds instructions to these pairs, helping models generalize better to new tasks."
   }
]`
        }
    ]
}
export default langChainLangGraphAIAgentContent;