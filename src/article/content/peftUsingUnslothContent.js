const peftContent = {
    header: "Parameter Efficient Fine Tuning (PEFT) using Unsloth",
    text: `Unsloth is an open-source Python framework that speeds up the fine-tuning of large language models (LLMs). It's designed to help developers and researchers create custom models more quickly and efficiently. 
        Unsloth makes finetuning large language models like Llama-3, Mistral, Phi-4 and Gemma 2x faster, use 70% less memory, and with no degradation in accuracy. It is fully compatible with the Hugging Face ecosystem (Hub, transformers, PEFT, TRL). 
        The library is actively developed by the Unsloth team (Daniel and Michael) and the open source community. The library supports most NVIDIA GPUs –from GTX 1070 all the way up to H100s–, and can be used with the entire trainer suite from the TRL library (SFTTrainer, DPOTrainer, PPOTrainer).`,
    contents: [
        {
            type: "header",
            text: "Loading Model"
        },
        {
            type: "text",
            text: `Just load your model with FastLanguageModel.from_pretrained! Currently, Unsloth supports Llama and Mistral type architectures (Yi, Deepseek, TinyLlama, Llamafied Qwen).`
        },
        {
            type: "code",
            code: `from unsloth import FastLanguageModel
import torch

max_seq_length = 2048 # Choose any! We auto support RoPE Scaling internally!
dtype = None          # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
load_in_4bit = True   # Use 4bit quantization to reduce memory usage. Can be False.

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-Coder-0.5B",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit
)
    
#   from unsloth import FastLanguageModel: Imports the FastLanguageModel class from the Unsloth library.
#   import torch: Imports PyTorch for tensor operations and GPU management.
#   max_seq_length = 2048: Sets the maximum sequence length for input data. FastLanguageModel supports RoPE Scaling internally, allowing dynamic adjustment for larger sequences.
#   dtype = None: Specifies the data type for model weights. Setting to None enables automatic detection based on the hardware. Alternatives include float16 for GPUs like Tesla T4 or V100, and bfloat16 for newer GPUs like Ampere.
#   load_in_4bit = True: Enables 4-bit quantization to reduce memory usage, facilitating the loading of larger models without running out of memory (OOM). Setting to False would load the model in higher precision but with higher memory consumption.`
        },
        {
            type: "header",
            text: "Apply Parameter-Efficient Fine-Tuning (LoRA)"
        },
        {
            type: "text",
            text: `Parameter-efficient fine-tuning (PEFT) is a more efficient form of instruction-based fine-tuning. Full LLM fine-tuning is resource-intensive, demanding considerable computational power, memory, and storage. PEFT addresses this by updating only a select set of parameters while keeping the rest frozen. This reduces the memory load during training and prevents the model from forgetting previously learned information. PEFT is particularly useful when fine-tuning for multiple tasks. Among the common techniques to achieve PEFT, LoRA, and QLoRA are widely recognized for their effectiveness.`
        },
        {
            type: "code",
            code: `model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Choose any number > 0 ! Suggested 8, 16, 32, 64, 128
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0, # Currently only supports dropout = 0
    bias = "none",    # Currently only supports bias = "none"
    use_gradient_checkpointing = True,
    random_state = 3407,
    max_seq_length = max_seq_length,
)

#   model: The pre-trained model loaded in the previous cell is passed as input to apply PEFT.
#   r = 16: The rank of the LoRA matrices. Higher values allow more capacity but consume more memory. Suggested values range from 8 to 128.
#   target_modules: Specifies which modules within the model to apply LoRA. In this case, projection layers like q_proj, k_proj, v_proj, etc., are targeted.
#   lora_alpha = 16: A scaling factor for LoRA. Balances the contribution of the LoRA layers to the model's output.
#   lora_dropout = 0: Dropout rate applied within LoRA layers. Set to 0 for optimized performance.
#   bias = "none": Indicates that biases are not being fine-tuned. This setting is optimized for memory and performance.
#   use_gradient_checkpointing = "unsloth": Enables gradient checkpointing to save memory during training. The "unsloth" setting optimizes VRAM usage, allowing for larger batch sizes and handling longer contexts.
#   random_state = 3407: Sets the seed for reproducibility.
#   use_rslora = False: Indicates whether to use Rank Stabilized LoRA. Set to False in this configuration.
#   loftq_config = None: Placeholder for additional LoftQ configurations if needed.
`
        },
        {
            type: "header",
            text: "Load and Preprocess the Dataset for Fine-Tuning"
        },
        {
            type: "text",
            text: `Parameter-efficient fine-tuning (PEFT) is a more efficient form of instruction-based fine-tuning. Full LLM fine-tuning is resource-intensive, demanding considerable computational power, memory, and storage. PEFT addresses this by updating only a select set of parameters while keeping the rest frozen. This reduces the memory load during training and prevents the model from forgetting previously learned information. PEFT is particularly useful when fine-tuning for multiple tasks. Among the common techniques to achieve PEFT, LoRA, and QLoRA are widely recognized for their effectiveness.`
        },
        {
            type: "link",
            href: "#/data-sets", 
            text: "Finetuning Datasets Types"
        },
        {
            type: "reference",
            href: "https://huggingface.co/docs/trl/en/sft_trainer#dataset-format-support",
            text: "sft_trainer_dataset-format-support"
        },
        {
            type: "code",
            code: `from datasets import load_dataset;

alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input, output)
        texts.append(text)
    return { "text" : texts, }
pass

dataset = load_dataset("json", data_files="instruct.json", split='train')
dataset = dataset.map(formatting_prompts_func, batched = True)
`
        },
        {
            type: "header",
            text: "Model Training using SFTTrainer(Supervised Fine-Tuning Trainer)"
        },
        {
            type: "text",
            text: `The SFTTrainer is specifically designed for this instruction-based fine-tuning.`
        },
        {
            type: "code",
            code: `from trl import SFTTrainer;

trainer = SFTTrainer(
model = model,
tokenizer = tokenizer,
train_dataset = dataset,
dataset_text_field = "text",
max_seq_length = max_seq_length,
    args = TrainingArguments(
        per_device_train_batch_size = 4,
        gradient_accumulation_steps = 4,
        warmup_steps = 10,
        max_steps = 120,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)
`
        },
        {
            type: "header",
            text: "Start Training"
        },
        {
            type: "text",
            text: `trainer.train(): Initiates the training loop using the configured trainer. The train() method runs the training process based on the previously defined TrainingArguments and dataset.`
        },
        {
            type: "code",
            code: `trainer_stats = trainer.train()`
        },
        {
            type: "header",
            text: "Saving Model"
        },
        {
            type: "text",
            text: `Saves the trained model and tokenizer for future use.`
        },
        {
            type: "code",
            code: `model.save_pretrained("lora_model") # Local saving
tokenizer.save_pretrained("lora_model")

# model.save_pretrained("lora_model"): Saves the fine-tuned model weights and configuration to a directory named "lora_model".
# tokenizer.save_pretrained("lora_model"): Saves the tokenizer configuration to the same directory, ensuring that the model can be reloaded with the correct tokenizer.
`
        },
        {
            type: "header",
            text: "Saving Trained Model to GGUF Format"
        },
        {
            type: "text",
            text: `We need llama.cpp scripts to convert the trained model to GGUF format.`
        },
        {
            type: "link",
            href: "#/install-llamacpp", 
            text: "Install Llama.cpp"
        },
        {
            type: "text",
            text: `By following these steps, you can convert a Hugging Face model to GGUF format and take advantage of the benefits of GGUF for CPU-based deployment of machine learning models. For running the model on local setups use software like ollama, lmstudio, etc gguf file are required. These files help in efficient storage of model and faster inference.`
        },
        {
            type: "reference",
            href: "https://huggingface.co/AmpereComputing/llama-3.1-8b-gguf",
            text: "llama-3.1-8b-gguf"
        },
        {
            type: "reference",
            href: "https://blog.steelph0enix.dev/posts/llama-cpp-guide/#converting-huggingface-model-to-gguf",
            text: "converting-huggingface-model-to-gguf"
        },
        {
            type: "code",
            code: `python llama.cpp/convert-hf-to-gguf.py path/to/llama2 --outtype f16 --outfile llama-2-7b-f16.gguf

# python llama.cpp/convert-hf-to-gguf.py [path to the original model] --outtype [f32, f16, bf16 or q8_0] --outfile [output path]

# llama.cpp/convert-hf-to-gguf.py : the path to the convert-hf-to-gguf.py file. relative to the current directory of the terminal
# path/to/llama2 : path to the HF model folder. relative to the current directory of the terminal
# --outfile llama-2-7b-f16.gguf : the ouput file, it need to have the .gguf extension at the end
# --outtype f16 : the quantization method
`
        },
        {
            type: "header",
            text: "Quantizing the model"
        },
        {
            type: "text",
            text: `We can finally quantize our model! To do that, we’ll use llama-quantize executable that we previously compiled with other llama.cpp executables.`
        },
        {
            type: "reference",
            href: "https://blog.steelph0enix.dev/posts/llama-cpp-guide/#quantizing-the-model",
            text: "quantizing-the-model"
        },
        {
            type: "reference",
            href: "https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-quantization",
            text: "a-visual-guide-to-quantization"
        },
        {
            type: "code",
            code: `llama.cpp/build/bin/Release/llama-quantize.exe my_tuned_llm.gguf my_tuned_llm_Q4_K.gguf Q4_K
# To check what quantizations we have available run - llama-quantize.exe --help
# Input gguf file - my_tuned_llm.gguf
# Output gguf file - my_tuned_llm_Q4_K.gguf
# Quantization method - Q4_K
`
        },
        {
            type: "header",
            text: "Tuning Examples"
        },
        {
            type: "link",
            href: "#/tune-phi3.5-mini",
            text: "Tune microsoft/Phi-3.5-mini-instruct"
        },
        {
            type: "header",
            text: "References"
        },
        {
            type: "reference",
            href: "https://www.kaggle.com/code/ksmooi/fine-tuning-qwen-2-5-coder-14b-llm-sft-peft",
            text: "fine-tuning-qwen-2-5-coder-14b-llm-sft-peft"
        },
        {
            type: "reference",
            href: "https://ubiai.tools/fine-tune-llama-3-psychology-question-unsloth/",
            text: "fine-tune-llama-3-psychology-question-unsloth"
        },
        {
            type: "reference",
            href: "https://huggingface.co/datasets/unsloth/notebooks/blob/main/Alpaca_%2B_Codellama_34b_full_example.ipynb",
            text: "Alpaca_Codellama_34b_full_example"
        }
    ]
}
export default peftContent;