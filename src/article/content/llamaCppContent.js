const llamaCppContent = {
    header: "llama.cpp",
    text: `llama.cpp is an open source software library that performs inference on various large language models such as Llama. It is co-developed alongside the GGML project, a general-purpose tensor library.
            The main goal of llama.cpp is to enable LLM inference with minimal setup and state-of-the-art performance on a wide range of hardware - locally and in the cloud.`,
    contents: [
        {
            type: "header",
            text: "llama.cpp",
        },
        {
            type: "text",
            text: `llama.cpp is an open source software library that performs inference on various large language models such as Llama. It is co-developed alongside the GGML project, a general-purpose tensor library.
            The main goal of llama.cpp is to enable LLM inference with minimal setup and state-of-the-art performance on a wide range of hardware - locally and in the cloud.`
        },
        {
            type: "code",
            code: `git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release`
        },
        {
            type: "reference",
            href: "https://github.com/ggerganov/llama.cpp/blob/master/docs/build.md#cuda",
            text: "installing-llama.cpp"
        },
        {
            type: "reference",
            href: "https://github.com/ggerganov/llama.cpp",
            text: "llama.cpp"
        },
        {
            type: "reference",
            href: "https://blog.steelph0enix.dev/posts/llama-cpp-guide/",
            text: "llama-cpp-guide"
        }
    ]
}
export default llamaCppContent;