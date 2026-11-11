const ggufContent = {
    header: "What is GGUF Format?",
    text: `GGUF - GPT-Generated Unified Format (GGUF) is a binary file format for storing and loading large language models (LLMs). It's designed to be fast and efficient, and to work well on consumer-grade computers.
    GGUF files contain all the information needed to load a model, including configuration attributes, tokenizer vocabulary, and tensors.
    GGUF was developed by @ggerganov who is also the developer of llama.cpp, a popular C/C++ LLM inference framework.GGUF is a new format introduced by the llama.cpp team on August 21st 2023. It is a replacement for GGML, which is no longer supported by llama.cpp.`,
    contents: [
        {
            type: "header",
            text: "GGUF vs GGML"
        },
        {
            type: "text",
            text: `GGML was an initial effort to create quantized LLMs, but it has been replaced by GGUF. GGML and GGUF are the same thing, GGUF is the new version that adds more data about the model so it's easy to support multiple architectures, and also includes prompt templates. These can run CPU only, be partially or fully offloaded to a GPU.`
        },
        {
            type: "reference",
            href: "https://huggingface.co/docs/hub/en/gguf", 
            text: "GGUF format"        
        }
    ]
}
export default ggufContent;