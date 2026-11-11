const peftPhiMiniContent = {
    header: "Tuning microsoft/Phi-3.5-mini-instruct",
    text: `Phi-3.5-mini is a lightweight, state-of-the-art open model built upon datasets used for Phi-3 - synthetic data and filtered publicly available websites - with a focus on very high-quality, reasoning dense data. The model belongs to the Phi-3 model family and supports 128K token context length. The model underwent a rigorous enhancement process, incorporating both supervised fine-tuning, proximal policy optimization, and direct preference optimization to ensure precise instruction adherence and robust safety measures.`,
    contents: [
        {
            type: "reference",
            href: "https://huggingface.co/microsoft/Phi-3.5-mini-instruct",
            text: "microsoft/Phi-3.5-mini-instruct"
        },
        {
            type: "header",
            text: "Project creation using poetry"
        },
        {
            type: "code",
            code: `poetry new finetune-llm`
        },
        ,
        {
            type: "text",
            text: `Open Project in visual studio code.`
        },
        {
            type: "header",
            text: "Apply Parameter-Efficient Fine-Tuning (LoRA)"
        },
        {
            type: "text",
            text: `Create Virtual Environment.`
        },
        {
            type: "code",
            code: `python -m venv .env`
        },
        {
            type: "text",
            text: `Activate Virtual Environment.`
        },
        {
            type: "code",
            code: `cd .venv
cd Scripts
./activate
cd ../..`
        },
        {
            type: "text",
            text: `Visual Studio Code will ask to add the Python interpreter as per virtual env. Select yes.`
        },
        {
            type: "header",
            text: "Install Poetry"
        },
        {
            type: "code",
            code: `python -m pip install poetry`
        },
        {
            type: "header",
            text: "Add dependencies using Poetry"
        },
        {
            type: "code",
            code: `python -m poetry add langchain langchain-community llama-cpp-python`
        },
        {
            type: "header",
            text: "Add dependencies using Poetry"
        },
        {
            type: "code",
            code: `// know your cuda version
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
python -m pip install "unsloth[cu126-torch260] @ git+https://github.com/unslothai/unsloth.git"
python -m pip install "https://github.com/woct0rdho/triton-windows/releases/download/v3.2.0-windows.post9/triton-3.2.0-cp312-cp312-win_amd64.whl"
python -m pip install -U xformers --index-url https://download.pytorch.org/whl/cu126
`
        },
        {
            type: "header",
            text: "Build llama.cpp"
        },
        {
            type: "code",
            code: `git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release`
        },
        {
            type: "header",
            text: "Get the Dataset"
        },
        {
            type: "reference",
            href: "https://huggingface.co/datasets/haripritam/function-calling-alpaca",
            text: "function-calling-alpaca"
        },
        {
            type: "text",
            text: `Download parquet file`
        },
        {
            type: "header",
            text: "Start Training"
        },
        {
            type: "code",
            code: `from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments, AutoModelForCausalLM
from peft import PeftModel

max_seq_length = 2048 # Choose any! We auto support RoPE Scaling internally!
dtype = None          # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
load_in_4bit = True   # Use 4bit quantization to reduce memory usage. Can be False.

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "microsoft/Phi-3.5-mini-instruct",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit
)

model = FastLanguageModel.get_peft_model(
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

#dataset = load_dataset("json", data_files="instruct.json", split='train')

dataset = load_dataset("parquet", data_files={'train': "../datasets/haripritam_function_calling_alpaca.parquet"},split='train')
dataset = dataset.map(formatting_prompts_func, batched = True)

print(f"Dataset loaded : {dataset}")

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

gpu_stats = torch.cuda.get_device_properties(0)
start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
print(f"GPU = {gpu_stats.name}. Max memory = {max_memory} GB.")
print(f"{start_gpu_memory} GB of memory reserved.")

trainer_stats = trainer.train()

used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
used_memory_for_lora = round(used_memory - start_gpu_memory, 3)
used_percentage = round(used_memory         /max_memory*100, 3)
lora_percentage = round(used_memory_for_lora/max_memory*100, 3)
print(f"{trainer_stats.metrics['train_runtime']} seconds used for training.")
print(f"{round(trainer_stats.metrics['train_runtime']/60, 2)} minutes used for training.")
print(f"Peak reserved memory = {used_memory} GB.")
print(f"Peak reserved memory for training = {used_memory_for_lora} GB.")
print(f"Peak reserved memory % of max memory = {used_percentage} %.")
print(f"Peak reserved memory for training % of max memory = {lora_percentage} %.")


model.save_pretrained("tuned_model")
tokenizer.save_pretrained("tuned_model")

# model.save_pretrained("tuned_model")
# tokenizer.save_pretrained("tuned_model")
# model.config.to_json_file("tuned_config.json")


model = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3.5-mini-instruct")
model = PeftModel.from_pretrained(model, "tuned_model")

model = model.merge_and_unload()
model.save_pretrained("tuned_model")
`
        },
        {
            type: "header",
            text: "Convert Tuned Model to gguf format"
        },
        {
            type: "code",
            code: `python <path of llama.cpp>/llama.cpp/convert_hf_to_gguf.py ./tuned_model --outfile Phi-3.5-mini-instruct-tuned-f16.gguf --outtype f16`
        },
        {
            type: "header",
            text: "Quantize the Model"
        },
        {
            type: "code",
            code: `<path of llama.cpp>/llama.cpp/build/bin/Release/llama-quantize.exe Phi-3.5-mini-instruct-tuned-f16.gguf Phi-3.5-mini-instruct-tuned-f16-Q4-K.gguf Q4_K`
        },
        {
            type: "header",
            text: "Test the Quantized Model"
        },
        {
            type: "code",
            code: `from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler, StdOutCallbackHandler
from langchain_core.prompts import PromptTemplate

# Callbacks support token-wise streaming
callback_manager = CallbackManager([StdOutCallbackHandler()])

# Make sure the model path is correct for your system!
llm = LlamaCpp(
    model_path="./tuned_model_Phi_3.5_mini_instruct/Phi-3.5-mini-instruct-tuned-f16-Q4-K.gguf",
    temperature=0,
    max_tokens=2000,
    top_p=1,
    callback_manager=callback_manager,
    verbose=False,  # Verbose is required to pass to the callback manager,
    stop=["Human"] # Necessary To give the model a hint to stop generating text after the prompt. Otherwise it's going in lengthy question answer mode.
)

question = """
You are a helpful assistant with access to the following functions. Use them if required - { "name": "calculate_median", "description": "Calculate the median of a list of numbers", "parameters": { "type": "object", "properties": { "numbers": { "type": "array", "items": { "type": "number" }, "description": "The list of numbers" } }, "required": [ "numbers" ] } }
Human: Hi, I have a list of numbers and I need to find the median. The numbers are 5, 2, 9, 1, 7, 4, 6, 3, 8.
AI :
"""
result = llm.invoke(question)
print(result)


# Callbacks support token-wise streaming
callback_manager_original = CallbackManager([StdOutCallbackHandler()])

llm_original = LlamaCpp(
    model_path="./tuned_model_Phi_3.5_mini_instruct/original_model/Phi-3.5-mini-instruct-Q4_0.gguf",
    temperature=0,
    max_tokens=2000,
    top_p=1,
    callback_manager=callback_manager_original,
    verbose=False,  # Verbose is required to pass to the callback manager,
    stop=["Human"] # Necessary To give the model a hint to stop generating text after the prompt. Otherwise it's going in lengthy question answer mode.
)

question_original = """
You are a helpful assistant with access to the following functions. Use them if required - { "name": "calculate_median", "description": "Calculate the median of a list of numbers", "parameters": { "type": "object", "properties": { "numbers": { "type": "array", "items": { "type": "number" }, "description": "The list of numbers" } }, "required": [ "numbers" ] } }
Human: Hi, I have a list of numbers and I need to find the median. The numbers are 5, 2, 9, 1, 7, 4, 6, 3, 8.
AI :
"""
result_original = llm_original.invoke(question_original)
print(result_original)
`
        },
        {
            type: "header",
            text: "Test Result"
        },
        {
            type: "code",
            code: `// Result of Tuned Model

{
  "name": "calculate_median",
  "arguments": {
    "numbers": [5, 2, 9, 1, 7, 4, 6, 3, 8]
  }
}
}
Here is the result: The median of your list (sorted in ascending order) is 5. If you need further assistance or have any other questions, feel freHere is the result: The median of your list (sorted in ascending order) is 5. If you need further assistance or have any other questions, feel free to ask! I'm here to help.

e to ask! I'm here to help.

// Result of original Model

To find the median of your list, I will use a function designed for this purpose. Here's how it works:

1. Firstly, we need to sort the numbers in ascending order which would be 1, 2, 3, 4, 5, 6, 7, 8, and 9.

1. Firstly, we need to sort the numbers in ascending order which would be 1, 2, 3, 4, 5, 6, 7, 8, and 9.
2. Since there are nine numbers (an odd amount), the median will simply be the middle number of this sorted list. In our case:
2. Since there are nine numbers (an odd amount), the median will simply be the middle number of this sorted list. In our case:
   - Sorted List = [1, 2, 3, 4, 5, 6, 7, 8, 9]
   - Sorted List = [1, 2, 3, 4, 5, 6, 7, 8, 9]
   - Median Position = Number of values / 2 = 9/2 = 4.5 (which means we take the average between fourth and fifth numbers)
   - Median Position = Number of values / 2 = 9/2 = 4.5 (which means we take the average between fourth and fifth numbers)

Since there's no actual function call here but a manual calculation:
- The middle two numbers are both at position number four in our sorted list, which is '3'. There isn’t an exact midpoint since it has odd count of values. Therefore we don't need to average anything; the median value itself will be 3 as per your ordered set.

So, for your given data: The median is **3**.
`
        },
        {
            type: "reference",
            href: "https://discuss.huggingface.co/t/config-json-is-not-saving-after-finetuning-llama-2/56871/5",
            text: "config-json-is-not-saving-after-finetuning-llama"
        },
        {
            type: "reference",
            href: "https://discuss.huggingface.co/t/how-to-create-a-config-json-after-saving-a-model/10459/11",
            text: "how-to-create-a-config-json-after-saving-a-model"
        },
        {
            type: "reference",
            href: "https://huggingface.co/docs/datasets/en/loading#parquet",
            text: "parquet format"
        }
    ]
}
export default peftPhiMiniContent;