const instructionTuningContent = {
    header: "Instruction Tuning",
    text: `The main difference between instruction tuning and standard supervised fine-tuning lies in the data that the model is trained on. 
    Whereas supervised fine-tuning trains models on input examples and their corresponding outputs, instruction tuning augments input-output examples with instructions, 
    which enables instruction-tuned models to generalize more easily to new tasks.`,
    contents: [
        {
            type: "header",
            text: "Instruction Tuning Datasets"
        },
        {
            type: "text",
            text: `Instruction datasets are used to fine-tune LLMs. The input and output string follow a template known as an instruction dataset format.
            Some popular ones are Alpaca, Vicuna, Databricks, LIMA.`
        },
        {
            type: "reference",
            href: "https://www.ruder.io/an-overview-of-instruction-tuning-data",
            text: "an-overview-of-instruction-tuning-data"
        },
        {
            type: "reference",
            href: "https://lightning.ai/pages/community/tutorial/optimizing-llms-from-a-dataset-perspective/",
            text: "optimizing-llms-from-a-dataset-perspective"
        },
        {
            type: "header",
            text: "Alpaca Instruction Dataset"
        },
        {
            type: "text",
            text: `52k English instruction examples generated using OpenAI’s text-davinci-003 with self-instruct.
            This instruction data can be used to conduct instruction-tuning for language models and make the language model follow instruction better.`
        },
        {
            type: "reference",
            href: "https://huggingface.co/datasets/tatsu-lab/alpaca",
            text: "alpaca"
        },
        {
            type: "reference",
            href: "https://zackproser.com/blog/how-to-create-a-custom-alpaca-dataset",
            text: "how-to-create-a-custom-alpaca-dataset"
        },
        {
            type: "header",
            text: "Alpaca Dataset format"
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
        },
        {
            type: "header",
            text: "Which small LLM to tune?"
        },
        {
            type: "text",
            text: `We are going to choose Qwen2–0.5B and Phi-3-mini beacuse they are small and powerful.`
        },
        {
            type: "reference",
            href: "https://medium.com/@darrenoberst/best-small-language-models-for-accuracy-and-enterprise-use-cases-benchmark-results-cf71964759c8",
            text: "best-small-language-models-for-accuracy-and-enterprise-use-cases"
        },
        {
            type: "reference",
            href: "https://www.reddit.com/r/LocalLLaMA/comments/1fjxkxy/qwen25_a_party_of_foundation_models/",
            text: "qwen25_a_party_of_foundation_models"
        },
        {
            type: "reference",
            href: "https://ai.gopubby.com/qwen2-trying-to-beat-llama3-70b-and-phi-3-mini-d19717fb83a2",
            text: "qwen2-trying-to-beat-llama3-70b-and-phi-3-mini"
        },
        {
            type: "header",
            text: "Qwen2.5–0.5B"
        },
        {
            type: "text",
            text: `Qwen2 has generally surpassed most opensource models and demonstrated competitiveness against proprietary models across a series of benchmarks targeting for language understanding, language generation, multilingual capability, coding, mathematics, reasoning.
            Its open-source model is available on GitHub.
            We asre going to use Qwen2.5-Coder which is a small model with Coding capabilities.Its supporting 92 coding languages.`
        },
        {
            type: "reference",
            href: "https://qwenlm.github.io/blog/qwen2/",
            text: "Hello Qwen2"
        },
        {
            type: "reference",
            href: "https://qwen.readthedocs.io/en/latest/index.html",
            text: "Welcome to Qwen"
        },
        {
            type: "reference",
            href: "https://github.com/QwenLM/Qwen2.5",
            text: "Github Qwen2.5"
        },
        {
            type: "reference",
            href: "https://github.com/QwenLM/Qwen2.5-Coder",
            text: "Qwen2.5-Coder"
        },
        {
            type: "header",
            text: "Getting GGUF file to run with Langchain and llama.cpp"
        },
        {
            type: "text",
            text: `Refer Below Links to get GGUF file.`
        },
        {
            type: "reference",
            href: "https://qwen.readthedocs.io/en/latest/run_locally/llama.cpp.html#getting-the-gguf",
            text: "getting-the-gguf"
        },
        {
            type: "reference",
            href: "https://huggingface.co/Qwen/Qwen2-0.5B-Instruct",
            text: "Qwen2-0.5B-Instruct"
        },
        {
            type: "reference",
            href: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF",
            text: "Qwen2.5-0.5B-Instruct-GGUF"
        },
        {
            type: "reference",
            href: "https://huggingface.co/bartowski/Qwen2.5-Coder-0.5B-GGUF",
            text: "Qwen2.5-Coder-0.5B-GGUF"
        },
        {
            type: "header",
            text: "Unsloth.ai : Optimize and Speed Up LLM Fine-Tuning"
        },
        {
            type: "text",
            text: `Unsloth is an open-source Python framework that speeds up the fine-tuning of large language models (LLMs). It's designed to help developers and researchers create custom models more quickly and efficiently. 
            Unsloth makes finetuning large language models like Llama-3, Mistral, Phi-4 and Gemma 2x faster, use 70% less memory, and with no degradation in accuracy!`
        },
        {
            type: "reference",
            href: "https://docs.unsloth.ai/",
            text: "docs.unsloth.ai"
        },
    ]
}
export default instructionTuningContent;