const llmTrainingContent = {
    header: "How to train LLM locally?",
    text: "Tooling, Libraries, Frameworks, and more.",
    contents: [
        {
            type: "header",
            text: "Which small LLM to train?"
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
            type: "code",
            code: `.venv/Scripts/activate
python -m pip install poetry
poetry add langchain`
        }
    ]
}
export default llmTrainingContent;