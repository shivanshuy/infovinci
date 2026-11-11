const aiAgentContent = {
    header: "Neural Netrwork and Types",
    text: `A neural network is a computational model inspired by the structure and function of the human brain, primarily used in machine learning and artificial intelligence. It consists of interconnected nodes, or artificial neurons, organized into layers: an input layer, one or more hidden layers, and an output layer. Each node processes input data and transmits outputs to other nodes, mimicking how biological neurons operate in the brain.`,
    contents: [
        {
            type: "code",
            code: `[Input Layer] → [Hidden Layer(s)] → [Output Layer]`
        },
        {
            type: "image",
            src: "./Illustration-of-a-neural-net.png"
        },
        {
            type: "header",
            text: `Types of Neural Networks.`
        },
        {
            type: "text",
            text: "Neural networks come in a variety of flavors, each with unique architectures and specializations. Some common types include:"
        },
        {
            type: "header",
            text: "1 - Feed-Forward Neural Network (FNNs) - The Basic"
        },
        {
            type: "text",
            text: "Feedforward neural networks (FNNs) are one of the first major developments in the field of neural networks.  It also became popular thanks to the discovery of the backpropagation algorithm by Geoff Hinton in 1990. They laid the groundwork for more complex architectures that followed. They are comprised of an input layer, a hidden layer or layers, and an output layer. These neural networks are also commonly referred to as MLPs(multi-layer perceptrons). In FFNs, data flows in one direction, from the input layer to the output layer, without any feedback loops. This makes them simple and easy to understand, but also limits their ability to handle complex tasks. "
        },
        {
            type: "header",
            text: "2 - Convolutional neural network (CNN) - The Vision Expert"
        },
        {
            type: "text",
            text: "A Convolutional Neural Network (CNN) is a type of artificial neural network designed for processing structured grid data, such as images. This concept was first presented by Yann le cun in 1998 via LeNet-5 for handwritten digit recognition. CNNs are particularly effective in computer vision tasks, where the goal is to recognize patterns and extract features from visual data."
        },
        {
            type: "header",
            text: "3 - Recurrent Neural Network (RNN) - The Sequence Master"
        },
        {
            type: "text",
            text: "The distinctive feature of looping connections in RNNs enables the network to maintain an internal memory or hidden state to capture dependencies and patterns. Recurrent Neural Networks (RNNs) stand out in the neural network landscape for their unique ability to process sequential data dynamically ideal for natural language processing (NLP) and time series analysis. What CNN means for images Recurrent Neural Networks are meant for text. RNNs can help us learn the sequential structure of text where each word is dependent on previous words, or sentences ideal for language translation, sentiment analysis, and text generation. (Though transformers have taken over here."
        },
        {
            type: "header",
            text: "3a - Long Short-Term Memory (LSTM) - The Memory Keeper"
        },
        {
            type: "text",
            text: "LSTMs are a specialized type of RNN designed to handle long-term dependencies better. They use gates to control what information is stored or discarded. They are a subclass of RNN, specialized in remembering information for extended periods (addressing the Vanishing Gradient Problem) by introducing various gates which regulate the cell state by adding or removing information from it. RNNs/LSTM have been predominantly used for various Language modeling tasks where the objective is to predict the next word given a stream of input Word or for tasks which have a sequential pattern to them."
        },
        {
            type: "header",
            text: "4 - Transformer - The generator"
        },
        {
            type: "text",
            text: "Transformers have become the DeFacto standard for any Natural Language Processing (NLP) task. Transformers revolutionized AI by replacing RNNs in natural language processing (NLP). Instead of processing data sequentially, they use an attention mechanism to analyze entire sentences at once, drastically improving efficiency. In the past, the LSTM and GRU architecture, along with the attention mechanism, used to be the State-of-the-Art approach for language modeling problems and translation systems. The main problem with these architectures is that they are recurrent in nature, and the runtime increases as the sequence length increases. That is why for smaller datasets, they do well, but larger data sets, they struggle. That is, these architectures take a sentence and process each word in a sequential way, so when the sentence length increases so does the whole runtime. Transformer, a model architecture first explained in the paper Attention is all you need, omits the recurrence and instead relies entirely on an attention mechanism to draw global dependencies between input and output simultaneously over the entire dataset. And that makes it fast, more accurate and the architecture of choice to solve various problems in the NLP domain working with more words and more complex text-based tasks."
        },
        {
            type: "image",
            src: "./transformer.png"
        },
        {
            type: "header",
            text: "5 - Generative Adversarial Network (GAN) - The Creator"
        },
        {
            type: "text",
            text: "Back in 2014, Ian Goodfellow and his colleagues unveiled Generative Adversarial Networks (GANs), a revolutionary class of AI models. GANs operate on this brilliant idea of adversarial training, where two neural networks—the generator and the discriminator—engage in a creative face-off to produce ultra-realistic synthetic data. The generator is like an artist, striving to create data that's indistinguishable from the real thing. The discriminator acts as the critic, evaluating data and determining whether it's genuine or generated. This intense back-and-forth keeps rolling until the generator's data becomes so convincing that the discriminator can't tell the difference anymore—they reach an equilibrium. At this point, the generator is producing synthetic data that's virtually indistinguishable from reality, marking a significant breakthrough in creating lifelike data through AI."
        },
        {
            type: "header",
            text: "5a - Diffusion Models - The Future"
        },
        {
            type: "text",
            text: "While diffusion models and Generative Adversarial Networks (GANs) are fundamentally different in their architectures and training methods, they overlap significantly in their applications. Inspired by physical diffusion, these models gradually transform random noise into structured outputs like images, videos, or molecular designs. When generating new data, the model starts with pure noise and iteratively refines it into a coherent result. Diffusion models have already shown transformative potential in applications such as image synthesis, where they power systems like Stable Diffusion to create stunningly realistic visuals from textual prompts."
        },
        {
            type: "code",
            code: `[Original Data]
       |
   +---+---+
   |       |
[Add Noise]  (Forward Diffusion)
   |       |
   v       v
[Noisy Data] --- (Repeat over many steps) ---> [Pure Noise]
       |
       v
[Start Here for Generation]
       |
[Remove Noise]  (Reverse Diffusion)
       |
   +---+---+
   |       |
   v       v
[Recovered Data] --- (Repeat over many steps) ---> [Generated Data]
`
        },
        {
            type: "link",
            href: "#/transformers",
            text: "Transformers"
        },
        {
            type: "reference",
            href: "https://www.sabrepc.com/blog/Deep-Learning-and-AI/6-types-of-neural-networks-to-know-about?srsltid=AfmBOor9CiJx48xp96rlwaliVJYjWMxVbX_LkMnkaYDsPlXDIh-9aU1I",
            text: "types-of-neural-networks-to-know-about"
        },
        {
            type: "reference",
            href: "https://www.ibm.com/think/topics/neural-networks",
            text: "neural-networks"
        },
        {
            type: "reference",
            href: "https://blog.arunangshudas.com/6-types-of-neural-networks-you-should-know/",
            text: "types-of-neural-networks-you-should-know"
        }
    ]
}
export default aiAgentContent;