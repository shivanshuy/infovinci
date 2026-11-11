const developmentInLangChainContent = {
    header: "How to start development in LangChain?",
    text: "Tooling, Libraries, Frameworks, and more.",
    contents: [
        {
            type: "reference",
            href: "https://python.langchain.com/docs/tutorials",
            text: "Langchain Tutorials"
        },
        {
            type: "header",
            text: "Install LangChain"
        },
        {
            type: "text",
            text: `To install LangChain run:`
        },
        {
            type: "code",
            code: `.venv/Scripts/activate
python -m pip install poetry
poetry add langchain`
        },
        {
            type: "reference",
            href: "https://python.langchain.com/v0.1/docs/get_started/quickstart",
            text: "LangChain Quickstart"
        },
        {
            type: "header",
            text: "Working with DeepSeek using Llama.cpp"
        },
        {
            type: "text",
            text: `DeepSeek is a open-source AI model that matches OpenAI o1. The main goal of llama.cpp is to enable LLM inference with minimal setup and state-of-the-art performance on a wide range of hardware - locally and in the cloud.`
        },
        {
            type: "header",
            text: "Llama.cpp"
        },
        {
            type: "text",
            text: `llama-cpp-python is a Python binding for llama.cpp. It is a C++ library for large language models (LLMs) that provides a simple and efficient interface for inference. It supports inference for many LLMs models, which can be accessed on Hugging Face.
            Note: new versions of llama-cpp-python use GGUF model files.`
        },
        {
            type: "reference",
            href: "https://python.langchain.com/docs/integrations/llms/llamacpp/",
            text: "Llama.cpp Documentation"
        },
        {
            type: "header",
            text: "Getting Model File in GGUF Format"
        },
        {
            type: "text",
            text: `GPT-Generated Unified Format (GGUF) is a binary file format for storing and loading large language models (LLMs). It's designed to be fast and efficient, and to work well on consumer-grade computers.`
        },
        {
            type: "reference",
            href: "https://huggingface.co/TheBloke/deepseek-llm-7B-base-GGUF",
            text: "TheBloke/deepseek-llm-7B-base-GGUF"
        },
        {
            type: "header",
            text: "Code setup in LsngChain and Poetry"
        },
        {
            type: "code",
            code: `// Poetry pyproject.toml
[project]
name = "langchain-ai-server"
version = "0.1.0"
description = ""
authors = [
    {name = "Your Name",email = "you@example.com"}
]
readme = "README.md"
requires-python = ">=3.13,<4.0"
dependencies = [
    "langchain (>=0.3.15,<0.4.0)",
    "llama-cpp-python (>=0.3.6,<0.4.0)",
    "langchain-community (>=0.3.15,<0.4.0)"
]
[build-system]
requires = ["poetry-core>=2.0.0,<3.0.0"]
build-backend = "poetry.core.masonry.api"`
        },
        {
            type: "code",
            code: `// deep_seek_server.py
from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler, StdOutCallbackHandler
from langchain_core.prompts import PromptTemplate

# Callbacks support token-wise streaming
callback_manager = CallbackManager([StdOutCallbackHandler()])

# Make sure the model path is correct for your system!
llm = LlamaCpp(
    model_path="./deepseek-llm-7b-base.Q4_K_M.gguf",
    temperature=0,
    max_tokens=2000,
    top_p=1,
    callback_manager=callback_manager,
    verbose=True,  # Verbose is required to pass to the callback manager,
    stop=["Human"] # Necessary To give the model a hint to stop generating text after the prompt. Otherwise it's going in lengthy question answer mode.
)

question = """
Yuou are a friendly AI Assistant. Please respond in friendly manner.
Human: What are 2 famous hill stations in Maharashtra? Give me a very brief description of each.
AI :
"""
result = llm.invoke(question)
print(result)`
        },
        {
            type: "header",
            text: "Working with DeepSeek using ollama"
        },
        {
            type: "text",
            text: `Ollama is a free, open-source tool that allows users to run large language models (LLMs) locally on their system.
            Follow below link to install Ollama`
        },
        {
            type: "reference",
            href: "https://ollama.com/download",
            text: "ollama.com"
        },
        {
            type: "header",
            text: "Pull and run the DeepSeek model"
        },
        {
            type: "text",
            text: `Ollama offers DeepSeek Models in different sizes. Select one and run it.`
        },
        {
            type: "reference",
            href: "https://ollama.com/library/deepseek-r1:7b",
            text: "ollama deepseek-r1"
        },
        {
            type: "reference",
            href: "https://www.youtube.com/watch?v=YlphofDY3SY",
            text: "DeepSeek-R1 python code"
        },
        {
            type: "code",
            code: `ollama run deepseek-r1:671b`
        },
        {
            type: "header",
            text: "Code setup in LsngChain and Poetry"
        },
        {
            type: "code",
            code: `[project]
name = "langchain-ai-server"
version = "0.1.0"
description = ""
authors = [
    {name = "Your Name",email = "you@example.com"}
]
readme = "README.md"
requires-python = ">=3.13,<4.0"
dependencies = [
    "langchain (>=0.3.15,<0.4.0)",
    "llama-cpp-python (>=0.3.6,<0.4.0)",
    "langchain-community (>=0.3.15,<0.4.0)",
    "langchain-ollama (>=0.2.2,<0.3.0)"
]


[build-system]
requires = ["poetry-core>=2.0.0,<3.0.0"]
build-backend = "poetry.core.masonry.api"`
        },
        {
            type: "code",
            code: `// deep_seek_ollama_server.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

template = """Question: {question}

Answer: Let's think step by step."""

prompt = ChatPromptTemplate.from_template(template)

model = OllamaLLM(model="deepseek-r1:7b",base_url='http://127.0.0.1:11434/',verbose=True)

chain = prompt | model

result = chain.invoke({"question": "What are 2 famous hill stations in Maharashtra? Give me a very brief description of each?"})

print(result)`
        }
    ]
}
export default developmentInLangChainContent;