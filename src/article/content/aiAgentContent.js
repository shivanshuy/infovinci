const aiAgentContent = {
    header: "What is an AI agent?",
    text: `AI Agents be described as a system that can use a LLM to reason through a problem, create a plan to solve the problem, and execute the plan with the help of a provided set of tools.`,
    contents: [
        {
            type: "header",
            text: "Workflows and Agents"
        },
        {
            type: "text",
            text: `"Workflows" are systems where LLMs and tools are orchestrated through predefined code paths.
            "Agents", on the other hand, are systems where LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks.`
        },
        {
            type: "image",
            src: "./wf-ag.png"
        },
        {
            type: "header",
            text: "TAO (Thought-Action-Observation) Loop"
        },
        {
            type: "text",
            text: `The Thought-Action-Observation Loop is a reasoning paradigm used in frameworks like ReACT to improve the problem-solving capabilities of large language models (LLMs). This iterative process enables models to generate accurate, dynamic, and grounded outputs by integrating reasoning, actions (tool use), and real-world observations.
            Language models are getting better at reasoning (e.g. chain-of-thought prompting) and acting (e.g. WebGPT, SayCan, ACT-1), but these two directions have remained separate. The TAO loop aims to bridge this gap by integrating reasoning and action in a single, iterative process.
            By combining these capabilities, ReAct enhances decision-making, making AI more reliable and useful in real-world applications.`
        },
        {
            type: "image",
            src: "./tao.png"
        },
        {
            type: "text",
            text: `The Thought-Action-Observation Loop is a structured, multi-step process where an LLM iteratively where an LLM iteratively :
            "Generates a Thought" - The LLM generates a thought or plan based on the input it receives. It uses logical reasoning or planning to determine the next step in solving the problem.
            "Executes an Action" - The LLM executes an action based on the thought it generated. This action can be a tool call or a decision to take a specific course of action. Tool such as searching a knowledge base, using a calculator, or querying an API.
            "Observes the Outcome" - Processes the output or results from the action. It evaluates whether the action was successful or not, and uses this information to generate a new thought or plan.`
        },
        {
            type: "header",
            text: "COT (Chain-of-Thought) vs ReAct"
        },
        {
            type: "text",
            text: `“Chain-of-thought” reasoning is a static black box, in that the model uses
its own internal representations to generate thoughts and is not grounded in the external world,
which limits its ability to reason reactively or update its knowledge. This can lead to issues like fact
hallucination.
ReAct prompts LLMs to generate both verbal reasoning traces and actions pertaining to a task in an
interleaved manner, which allows the model to perform dynamic reasoning to create, maintain, and
adjust high-level plans for acting (reason to act), while also interact with the external environments using tools
(e.g. Wikipedia) to incorporate additional information into reasoning (act to reason).`
        },
        {
            type: "header",
            text: "Tools"
        },
        {
            type: "text",
            text: `By themselves, language models can't take actions - they just output text. A big use case for LangChain is creating agents. Agents are systems that use LLMs as reasoning engines to determine which actions to take and the inputs necessary to perform the action. After executing actions, the results can be fed back into the LLM to determine whether more actions are needed, or whether it is okay to finish. This is often achieved via tool-calling.
            AI Agents are provided with a set of tools. They are free to decide which tool they can use based on the tool’s description and the task at hand.`
        },
        {
            type: "header",
            text: "ReAct Prompting - The Magical Prompt that Makes the AI Agent Think"
        },
        ,
        {
            type: "code",
            code: `// Agent 
You are an exprt AI Agent. Answer the following questions as best you can. 

// Tools
You have access to the following tools:
DASA_search: Search for information about DASA. For any questions about DASA, you must use this tool
tavily_search_results_json: A search engine optimized for comprehensive, accurate, and trusted results. Useful for when you need to answer questions about current events. Input should be a search query.

// Format
Use the following format:

Question: the input question you must answer

// Thought-Action-Observation Loop
Thought: you should always think about what to do
Action: the action to take, should be one of [DASA_search, tavily_search_results_json]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

// Query
Question: What technological advancements have significantly impacted renewable energy production in the last decade?
Thought: `
        },
        {
            type: "link",
            href: "#/ai-agent-langchain",
            text: "ai agent using langchain langgraph"
        },
        {
            type: "reference",
            href: "https://agiflow.io/blog/optimise-cost-and-speed-of-agentic-workflow",
            text: "optimise-cost-and-speed-of-agentic-workflow"
        },
        {
            type: "reference",
            href: "https://www.linkedin.com/pulse/fascinating-mind-ai-agent-from-langchain-vijaykumar-kartha-wpolc",
            text: "fascinating-mind-ai-agent-from-langchain-vijaykumar-kartha-wpolc"
        },
        {
            type: "reference",
            href: "https://www.anthropic.com/research/building-effective-agents",
            text: "building-effective-agents"
        },
        {
            type: "reference",
            href: "https://arxiv.org/pdf/2210.03629",
            text: "SYNERGIZING REASONING AND ACTING IN LANGUAGE MODELS"
        },
        {
            type: "reference",
            href: "https://publish.obsidian.md/drjerryasmith/Notes/Public/Thought-Action-Observation+Loop",
            text: "Thought-Action-Observation-Loop"
        },
        {
            type: "reference",
            href: "https://blog.devgenius.io/the-tao-of-prompt-engineering-part-1-understanding-the-react-framework-46559a0c9e5e",
            text: "understanding-the-react-framework"
        },
        {
            type: "reference",
            href: "https://react-lm.github.io/",
            text: "ReAct: Synergizing Reasoning and Acting in Language Models"
        },
        {
            type: "reference",
            href: "https://langchain-ai.github.io/langgraph/tutorials/workflows/",
            text: "workflows"
        },
        {
            type: "reference",
            href: "https://towardsdatascience.com/building-a-math-application-with-langchain-agents-23919d09a4d3/",
            text: "building-a-math-application-with-langchain-agents"
        }
    ]
}
export default aiAgentContent;