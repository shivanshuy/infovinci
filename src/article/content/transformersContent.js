const aiAgentContent = {
    header: "Transformers",
    text: `<>`,
    contents: [
        {
            type: "header",
            code: "Can computers understand Natural Language?"
        },
        {
            type: "text",
            text: "<>"
        },
        {
            type: "header",
            text: `Symbolic NLP`
        },
        {
            type: "text",
            text: `Given a collection of rules (e.g., a Chinese phrasebook, with questions and matching answers), the computer emulates natural language understanding (or other NLP tasks) by applying those rules to the data it confronts. For example, a prompt of "You are very helpful" would first be matched with the pattern of "you are {something}," corresponding to a response of "What makes you think I am {something}?". The drawbacks of early symbolic NLP models are obvious. First, symbolic NLP models are not scalable. To expand the capability of such models, for example, building a chatbot that can have conversations as a teacher, you would need to define a new set of rules from scratch. Moreover, natural languages are ever evolving, which requires engineers to apply recurring updates and additions to the rules.`
        },
        {
            type: "header",
            text: `Statistical NLP`
        },
        {
            type: "text",
            text: `"statistical NLP" refers to a traditional approach that uses statistical methods to analyze text based on probability distributions and patterns found in large datasets. This approach is based on the idea that language is a complex system that can be modeled using statistical methods. The goal of statistical NLP is to develop algorithms that can automatically analyze and understand human language.`
        },
        {
            type: "header",
            text: `Neural NLP`
        },
        {
            type: "text",
            text: `The statistical approach has been replaced by the neural networks approach, using semantic networks and word embeddings to capture semantic properties of words. Statistical NLP relies on established statistical techniques like n-grams and probability calculations to understand language, while neural networks learn complex representations through interconnected layers of nodes, adapting to data automatically.`
        },
        {
            type: "header",
            text: `You shall know a word by the company it keeps - "J. R. Firth"`
        },
        {
            type: "text",
            text: `Words are more than just a collection of letters. When a word is weaved into a sentence its meaning comes from the context its being used. So how do we teach machines the semantic relationship between words? A computer can look at two strings and tell you whether they are the same or not. However, can it learn to recognize different but closely related words?`
        },
        {
            type: "header",
            text: `Birth of Word Embeddings (Vector Embeddings)`
        },
        {
            type: "text",
            text: `Word embeddings, such as Word2Vec, GloVe, and FastText, generate dense vector representations where the vector values are trained to predict the word’s context. Consequently, words that appear in similar contexts have vectors that are closer together, preserving both semantic and syntactic relationships.
            In 2013, NLP researcher Tomáš Mikolov and his team introduced the innovative Word2Vec method, which represented words' semantic and syntactic properties through word embeddings. This approach is based on the idea that the meaning of a word is encapsulated in its distributional propertiesm , the contexts in which a word appears across large text corpora. In the high-dimensional Word2Vec embedding space, similar words lie close to each other.
            Word2Vec's introduction marked a shift towards leveraging unsupervised learning in NLP, allowing models to learn from raw text data without explicit annotations. This has opened doors to even more sophisticated techniques in understanding and generating human language.
            `
        },
        {
            type: "code",
            code: `          Semantics Dimension 2 (e.g., Masculine)
                   ↑
                   |
            king   |             man
                   |
                   |
                   |
    queen          |             woman
                   |
                   |
                   |
    ---------------+--------------------→ Semantics Dimension 1 (e.g., Royalty)
                   |
                   |
                   |
                   |
`
        },
        {
            type: "header",
            text: `Static vs Contextaul Embeddings`
        },
        {
            type: "text",
            text: `Word embeddings provided by word2vec or fastText has a vocabulary (dictionary) of words. The elements of this vocabulary (or dictionary) are words and its corresponding word embeddings. Hence, given a word, its embeddings is always the same in whichever sentence it occurs. Here, the pre-trained word embeddings are static.
However, contextual embeddings (are generally obtained from the transformer based models). The emeddings are obtained from a model by passing the entire sentence to the pre-trained model.
ontextual embedding heavily relies on the attention mechanism to capture the context of a word by dynamically weighting the importance of surrounding words, allowing the model to generate different representations for the same word depending on its context within a sentence; this is a key feature of models like BERT and other transformers that produce contextual embeddings.
Consider the following two sentences:

1 - "My father is a bank teller", 

2 - "The river bank has been polluted."

In these two sentences, static word embeddings like word2vec will give the word "bank" the same vector.

Dynamic embeddings (from a BERT kr a DNN in general) will give two different vectors for the same word because it has two different contexts.`
        },
        {
            type: "code",
            code: `Sentence 1:
            "He swung the __bat__ and hit a home run."

                   +--------------------------+
                   |  swung     hit    home   |
                   |          __bat__         |
                   |                  run     |
                   +--------------------------+
                              |
                          [bat 🏏]
                         (Sports Equipment)


Sentence 2:
            "The __bat__ flew silently through the night sky."

                   +--------------------------+
                   |  flew   silently  night  |
                   |          __bat__         |
                   |                  sky     |
                   +--------------------------+
                              |
                          [bat 🦇]
                         (Nocturnal Animal)

In traditional embeddings, the word "bat" would have a single representation regardless of context.

Contextual embeddings generate different vector representations for "bat" based on the words surrounding it.
`
        },
        {
            type: "header",
            text: `Attention Mechanism"`
        },
        {
            type: "text",
            text: `An attention mechanism is a technique used in machine learning and deep learning models to selectively focus on specific parts of the input data when making predictions. This mechanism is inspired by the human ability to concentrate on relevant information while ignoring less important details. It allows models to assign varying levels of importance or weights to different elements of the input data, enhancing their ability to capture essential patterns and dependencies.`
        },
        {
            type: "code",
            code: `
Input Sequence:           x₁       x₂       x₃       ...       xₙ

                                  ↓        ↓        ↓                   ↓
                              +-------+-------+-------+   ...   +-------+
                              |       |       |       |         |       |
                              |  h₁   |  h₂   |  h₃   |         |  hₙ   |
                              |       |       |       |         |       |
                              +-------+-------+-------+         +-------+
                                    ↘       ↘      ↘                  ↘
                                      ↘       ↘      ↘                  ↘            
                                        +----------------+         +----------------+
                                        |                |         |                |
                                        | Attention Weights αₖᵢ    |                |
                                        |                |         |                |
                                        +----------------+         +----------------+
                                                 ↓                          ↓
                                            +----------+               +----------+
                                            | Context  |               | Context  |
                                            |  Vector  |               |  Vector  |
                                            |    c₁    |               |    cₙ    |
                                            +----------+               +----------+
                                                 ↓                          ↓
                                            +----------+               +----------+
                                            |  Output  |               |  Output  |
                                            |   y₁     |               |   yₙ     |
                                            +----------+               +----------+

`
        },
        {
            type: "header",
            text: `Seq2Seq Models`
        },
        {
            type: "text",
            text: `Seq2Seq Models are a type of machine learning architecture designed to transform input sequences into output sequences. They are widely used in natural language processing tasks such as machine translation, text summarization, and speech recognition. The name “seq2seq” comes from the fact that these models are trained to convert a sequence of input data (such as a sentence in one language) into a sequence of output data (such as a sentence in another language). Seq2Seq models typically consist of two main components: an encoder and a decoder. The encoder processes the input sequence and generates a fixed-length representation of the input data, which is then passed to the decoder to generate the output sequence.`
        },
        ,
        {
            type: "code",
            code: `
[ Input Sequence ]
   x₁ → x₂ → x₃ → ... → xₙ
        |
        v
+--------------------+
|      Encoder       |
| (RNN/LSTM/GRU)     |
+---------+----------+
          |
          v
   [ Context Vector ]
          |
          v
+---------+----------+
|      Decoder       |
| (RNN/LSTM/GRU)     |
          |
      y₁ → y₂ → y₃ → ... → yₘ
[ Output Sequence ]  


`
        },
        {
            type: "header",
            text: `Limitations of Seq2Seq Models`
        },
        {
            type: "text",   
            text: `Seq2Seq (Sequence-to-Sequence) models are powerful tools for a variety of tasks, such as translation, summarization, and text generation. However, they do have several limitations like the memory of RNNs can diminish over long sequences, leading to a loss of crucial information from earlier parts of the sequence. They suffer from Vanishing Gradient issue. Vanishing gradients occur when the gradients of the error with respect to the network’s parameters become very small, making it difficult for the network to learn long-term dependencies.
            Early mistakes during the decoding phase can propagate through the sequence, affecting the quality of the entire output.
            `
        }
    ]
}
export default aiAgentContent;