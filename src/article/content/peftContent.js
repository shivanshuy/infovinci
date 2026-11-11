const peftContent = {
    header: "Parameter Efficient Fine Tuning (PEFT)",
    text: `Fine-tuning Large Language Models (LLMs) often results in substantial challenges, such as handling massive weights and requiring immense computational power. As models grow in size and depth, the need for multiple high-performance GPUs becomes crucial, driving up the computational demands for training and fine-tuning. The size of fine-tuned models also poses significant challenges in terms of storage and portability. Full fine-tuning of LLMs typically results in large checkpoints, often reaching gigabytes in size.
    PEFT is a great choice when dealing with domain-specific tasks that necessitate model adaptation. By employing PEFT, we can strike a balance between retaining valuable knowledge from the pre-trained model and adapting it effectively to the target task with fewer parameters. There are various ways of achieving Parameter efficient fine-tuning. Low Rank Parameter or LoRA & QLoRA are most widely used and effective.`,
    contents: [
        {
            type: "header",
            text: "Full Fine Tuning vs PEFT"
        },
        {
            type: "text",
            text: `Traditional full fine-tuning methods involve slight adjustments to all the parameters in pretrained LLMs to adapt them for specific tasks. But as developments in artificial intelligence (AI) and deep learning (DL) have led models to grow larger and more complex, the fine-tuning process has become too demanding on computational resources and energy.
            Also, each fine-tuned model is the same size as the original. All these models take up significant amounts of storage space, further driving up costs for the organizations that use them. While fine-tuning does create more efficient machine learning (ML), the process of fine-tuning LLMs has itself become inefficient.
            PEFT adjusts the handful of parameters that are most relevant to the model’s intended use case to deliver specialized model performance while reducing model weights for significant computational cost and time savings.`
        },
        {
            type: "header",
            text: "PEFT Techniques"
        },
        {
            type: "text",
            text: `The sheer size of these models makes them cumbersome to handle, emphasizing the need for efficient fine-tuning techniques to manage their substantial computational and storage demands effectively.
             By employing PEFT, we can strike a balance between retaining valuable knowledge from the pre-trained model and adapting it effectively to the target task with fewer parameters. There are various ways of achieving Parameter efficient fine-tuning. 
             Low Rank Parameter or LoRA & QLoRA are most widely used and effective.`
        },
        {
            type: "header",
            text: "LoRA (Low-Rank Adaptation)"
        },
        {
            type: "text",
            text: `LoRA (Low-Rank Adaptation) is a more efficient approach that decomposes the weight update matrix (ΔW) into two lower-dimensional matrices (A) and (B). This decomposition reduces the number of trainable parameters, making fine-tuning more efficient.
            LoRA represents (ΔW) as the product of two smaller matrices (A) and (B), with a lower rank. The updated weight matrix (W') becomes W + BA, where W remains frozen and A and B are updated during training.
            The LoRA approach reduces the number of trainable parameters, making fine-tuning more efficient. For example, if W is a (d x d) matrix, traditional fine-tuning would require (d²) parameters, but LoRA reduces this to (2dr), which is much smaller when (r << d).`
        },
        {
            type: "header",
            text: "QLoRA(Quantized Low-Rank Adaptation)"
        },
        {
            type: "text",
            text: `uilding on the success of LoRA, QLoRA(Quantized Low-Rank Adaptation) takes efficient fine-tuning to the next level. Traditionally, model parameters are stored in 32/16-bit format, but QLoRA compresses them to a 4-bit format, resulting in a significant reduction in memory requirements. 
            This innovation enables fine-tuning of large language models on a single GPU, making it possible to deploy these models on less powerful hardware, including consumer-grade GPUs.
            Thanks to quantization, the space occupied by the model in memory is even smaller, while there is very little loss in performance.`
        },
        {
            type: "reference",
            href: "https://www.linkedin.com/pulse/lora-qlora-simplified-approach-fine-tuning-large-language-prakash-hfv0f",
            text: "lora-qlora-simplified"
        },
        {
            type: "reference",
            href: "https://huggingface.co/blog/mlabonne/sft-llama3",
            text: "sft-llama3"
        },
        {
            type: "reference",
            href: "https://www.mercity.ai/blog-post/guide-to-fine-tuning-llms-with-lora-and-qlora",
            text: "guide-to-fine-tuning-llms-with-lora-and-qlora"
        }
    ]
}
export default peftContent;