const installUnslothContent = {
    header: "Installiing Unsloth on Windows",
    text: `Unsloth is an open-source Python framework that speeds up the fine-tuning of large language models (LLMs). It's designed to help developers and researchers create custom models more quickly and efficiently. 
        Unsloth makes finetuning large language models like Llama-3, Mistral, Phi-4 and Gemma 2x faster, use 70% less memory, and with no degradation in accuracy. It is fully compatible with the Hugging Face ecosystem (Hub, transformers, PEFT, TRL). 
        The library is actively developed by the Unsloth team (Daniel and Michael) and the open source community. The library supports most NVIDIA GPUs –from GTX 1070 all the way up to H100s–, and can be used with the entire trainer suite from the TRL library (SFTTrainer, DPOTrainer, PPOTrainer).`,
    contents: [
        {
            type: "reference",
            href: "https://huggingface.co/blog/unsloth-trl",
            text: "Make LLM Fine-tuning 2x faster"
        },
        {
            type: "header",
            text: "Prerequsites",
        },
        {
            type: "text",
            text: "Cuda Toollkit for Windows, Python 3.12"
        },
        {
            type: "header",
            text: "PyTorch",
        },
        {
            type: "text",
            text: "PyTorch is an open source machine learning (ML) framework based on the Python programming language and the Torch library."
        },
        {
            type: "code",
            code: `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
# cu126 refers to the CUDA version where cu[cuda version]`
        },
        {
            type: "reference",
            href: "https://pytorch.org/get-started/locally/#windows-pip",
            text: "Installing PyTorch"
        },
        {
            type: "header",
            text: "Unsloth",
        },
        {
            type: "code",
            code: `pip install "unsloth[cu126-torch260] @ git+https://github.com/unslothai/unsloth.git"
# cu126 refers to the CUDA version where cu[cuda version], torch260 refers torch[torch version]
# to get torch version, run python -c "import torch; print(torch.__version__)"`
        },
        {
            type: "header",
            text: "Triton",
        },
        {
            type: "text",
            text: `Unsloth uses triton. Triton and CUDA are both tools for writing high-performance GPU code. 
            Triton is an open-source Python library developed by OpenAI, while CUDA is a tool for writing code on NVIDIA GPUs.
            Officially triton is not supported on Windows, but it can be installed using the following command using wheel file.`
        },
        {
            type: "code",
            code: `pip install "https://github.com/woct0rdho/triton-windows/releases/download/v3.2.0-windows.post9/triton-3.2.0-cp312-cp312-win_amd64.whl"
// Refer https://github.com/woct0rdho/triton-windows/
// https://github.com/woct0rdho/triton-windows/releases`
        },
        {
            type: "reference",
            href: "https://github.com/triton-lang/triton",
            text: "triton"
        },
        {
            type: "reference",
            href: "https://huggingface.co/madbuda/triton-windows-builds/tree/main",
            text: "triton-windows-builds"
        },
        {
            type: "header",
            text: "xFormers",
        },
        {
            type: "text",
            text: `xFormers is a PyTorch extension library for composable and optimized Transformer blocks.`
        },
        {
            type: "code",
            code: `pip install -U xformers --index-url https://download.pytorch.org/whl/cu126`
        },
        {
            type: "reference",
            href: "https://github.com/facebookresearch/xformers#installing-xformers",
            text: "installing-xformers"
        },
        {
            type: "header",
            text: "cmake",
        },
        {
            type: "text",
            text: `CMake is an open source, cross-platform family of tools designed to build, test, and package software. CMake gives you control of the software compilation process using simple independent configuration files. Unlike many cross-platform systems, CMake is designed to be used in conjunction with the native build environment.`
        },
        {
            type: "reference",
            href: "https://cmake.org/download/",
            text: "cmake"
        },
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
            type: "link",
            href: "#/install-llamacpp", 
            text: "Install Llama.cpp"
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
export default installUnslothContent;