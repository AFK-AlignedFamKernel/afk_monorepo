
import { LLMChain } from "langchain/chains";
import { OpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

const initPinecone = async () => {
    const pinecone = new Pinecone();
    return pinecone.index("test");
}

const initializeLangchain = async () => {
    const llm = new OpenAI({
        model: "gpt-3.5-turbo",
        apiKey: process.env.OPENAI_API_KEY,
    });
    return llm;
}

export const classifyPost = async (content: string) => {

    // Define post classification criteria
    const classificationCriteria = [
        "value sharing and constructive",
        "pedagogy",
        "story telling and hooks",
        "emotions feeling",
        "way to talk",
    ];
//     // Create a prompt template for classification
//     const classificationPrompt = new PromptTemplate({
//         inputVariables: ["content"],
//         template: `Classify the following post based on these criteria: ${classificationCriteria.join(", ")}
  
//   Post: {content}
  
//   Classification:`,
//     });

//     const llm = initializeLangchain();


//     const classificationChain = new LLMChain({ llm, prompt: classificationPrompt });

//     // Initialize Classification Model on top of the LLM
//     const classifier = new ClassificationModel({
//         labels: classificationCriteria,
//         model: llm,
//     });

//     const response = await classificationChain.run({ content });
//     const classification = await classifier.predict(content);
//     return { response, classification };
}

// // Function to classify a post based on criteria
// async function classifyPost(content: string) {
//     const response = await classificationChain.run({ content });
//     const classification = await classifier.predict(content);
//     return { response, classification };
// }