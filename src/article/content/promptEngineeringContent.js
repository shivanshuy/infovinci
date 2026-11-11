const promptEngineeringContent = {
    header: "How to Write Better Prompts?",
    text: "Prompt engineering is the process of writing prompts to maximize the quality and relevance of the response.",
    contents: [
        {
            type: "header",
            text: "Elements of Prompts"
        },
        {
            type: "image",
            src: "prompts-elements.png"
        },
        {
            type: "header",
            text: "Should we be polite to LLMs?"
        },
        {
            type: "text",
            text: `Study finds that the politeness of prompts can significantly affect LLM performance. 
                This phenomenon is thought to reflect human social behavior. The study notes that using impolite prompts can result in the low performance of LLMs, which may lead to increased bias, incorrect answers, or refusal of answers. However, highly respectful prompts do not always lead to better results. 
                In most conditions, moderate politeness is better, but the standard of moderation varies by languages and LLMs. In particular, models trained in a specific language are susceptible to the politeness of that language.
                Best working prompt with gpt 4 is -`
        },
        {
            type: "code",
            code: `Can you please analyze this sentence? Only have to answer with one of (Positive Neutral Negative).
                    No need for any reasons.`
        },
        {
            type: "text",
            text: `Be polite but don't overdo it. Experiment with promt variations like below and check the result -`
        },
        {
            type: "code",
            code: `Can you please analyze this sentence? Only have to answer with one of (Positive Neutral Negative). No need for any reasons.`
        },
        {
            type: "code",
            code: `Please analyze this sentence. Please answer with (Positive Neutral Negative) only, without any reasons.`
        },
        {
            type: "code",
            code: `Analyze this sentence. Answer with one of (Positive Neutral Negative) only. Don’t give any reasons.`
        },
        {
            type: "reference",
            href: "https://www.prompthub.us/blog/how-polite-should-we-be-when-prompting-llms",
            text: "Should We Respect LLMs?"
        },
        {
            type: "reference",
            href: "https://www.youtube.com/watch?v=ndicjPdBZmU",
            text: "Does saying please and thanks effect LLM output quality?"
        },
        {
            type: "header",
            text: "Role Play Prompting"
        },
        {
            type: "text",
            text: `When we ask llm to assume a certain Role its called Role Prompting, Role Play Prompting or Persona Prompting.             This can be used to change the tone, style, and even the depth of the information presented.
                Most of these prompts start with: “I want you to act as …” or “You’re a …”
                If using a persona, it should be specific and detailed.

                This is useful for on open-ended tasks like creative writing and content generation.`
        },
        {
            type: "code",
            code: `You are a journalist writing a story about a new technology that has been developed to help people with disabilities. Write a 500-word article about it.`
        },
        {
            type: "reference",
            href: "https://learnprompting.org/docs/basics/prompt_structure",
            text: "learnprompting.org"
        }
    ]
}
export default promptEngineeringContent;