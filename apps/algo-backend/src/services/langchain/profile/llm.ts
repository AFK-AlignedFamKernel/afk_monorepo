
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts"

import { z } from "zod";
import { initLLMChatOpenAI, initLocalLLM } from "../index";


export const handleClassificationProfile = async (profileContent: string, contents: string[]) => {
    try {
        const llm = await initLocalLLM();
        // const llm = await initLLMChatOpenAI();

        if (!llm || typeof llm !== "object" || llm === undefined || typeof llm === "undefined" || !llm?.withStructuredOutput) {
            return {
                status: "error",
                message: "LLM not found",
                res: undefined
            }
        }

        // Initialize Pinecone for knowledge storage
        const pinecone = new Pinecone({
            apiKey: process.env.PINECODE_API_KEY!,
        });

        // Define post classification criteria
        const classificationCriteria = [
            "value sharing and constructive",
            "pedagogy",
            "story telling and hooks",
            "emotions feeling",
            "way to talk",
            "introduction, body, and conclusion"
        ];

        // Create a prompt template for classification
        const classificationPrompt = ChatPromptTemplate.fromTemplate(`Classify the following post based on these criteria: ${classificationCriteria.join(", ")}
            
            Post: {content}
            
            Classification:`,
        );
        const taggingPrompt = ChatPromptTemplate.fromTemplate(
            `Extract the desired information from the following content.
          
          Only extract the properties mentioned in the 'Classification' function Schema and theses:
          ${classificationCriteria.join(", ")}
          
        Profile:
          {profileContent}
          Contents:
          {inputs}
          `
        );
        // const classificationSchema = z.object({
        //     sentiment: z.string().describe("The sentiment of the text"),
        //     aggressiveness: z
        //         .number()
        //         .int()
        //         .describe("How aggressive the text is on a scale from 1 to 10"),
        //     language: z.string().describe("The language the text is written in"),
        // });


        const classificationSchema = z.object({
            topics: z
                .array(z.string())
                .describe("The topics of the text"),
            sentiment: z
                .enum(["happy", "neutral", "sad", "critical", "passionate", "optimistic", "pessimistic"])
                .describe("The sentiment of the text"),
            typeOfContent: z
                .enum(["education", "opinion", "shitposting", "meme", "news", "other"])
                .describe("The type of content of the text"),
            clarity: z
                .enum(["clear", "confusing", "ambiguous", "complex", "simple"])
                .describe("The clarity of the text"),
            emotionsFeeling: z
                .boolean()
                .describe("If the text is emotions feeling"),
            emotionsFeelingScore: z
                .number()
                .int()
                .describe("The score of the text in the emotions feeling criteria"),
            conclusionSummary: z
                .enum(["yes", "no"])
                .describe("If the text has a conclusion summary"),

            education: z
                .boolean()
                .describe("If the text is educational sharing knowledge, insights, and information"),
            educationalScore: z
                .number()
                .int()
                .describe("The score of the text in the educational criteria"),
            shitpostingScore: z
                .number()
                .int()
                .describe("The score of the text in the shitposting criteria"),
            interesting: z
                .boolean()
                .describe("If the text is interesting"),
            interestingScore: z
                .number()
                .int()
                .describe("The score of the text in the interesting criteria"),
            valueSharingAndConstructive: z
                .boolean()
                .describe("If the text is value sharing and constructive"),
            valueSharingAndConstructiveScore: z
                .number()
                .int()
                .describe("The score of the text about the values occurences, value provided, sharing info and insights and constructive criteria"),
            positionalScore: z
                .number()
                .int()
                .describe("The score of the text in the positional criteria"),
            pedagogy: z
                .boolean()
                .describe("If the text is pedagogic"),

            // Copy writing skills
            storyTellingAndHooks: z
                .boolean()
                .describe("If the text have a good story telling and hooks, intro, narrative"),
            storyTellingAndHooksScore: z
                .number()
                .int()
                .describe("The score of the text in the story telling and hooks criteria"),

            wayToTalkScore: z
                .number()
                .int()
                .describe("The score of the text in the way to talk criteria"),
            tone: z
                .enum(["formal", "informal", 'friendly', 'casual'])
                .describe("The tone of the text"),
            introductionBodyConclusionScore: z
                .number()
                .int()
                .describe("The score of the text in the introduction, body, and conclusion criteria"),
            copyWritingScore: z
                .number()
                .int()
                .describe("The score of the text in the copy writing criteria and skills"),
            overallScore: z
                .number()
                .int()
                .describe("The score of the text in the copy writing criteria: hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
            aggressiveness: z
                .number()
                .int()
                .describe(
                    "describes how aggressive the statement is on a scale from 1 to 5. The higher the number the more aggressive"
                ),
            language: z
                .enum(["spanish", "english", "french", "german", "italian", "chinese", "russian", "arabic"])
                .describe("The language the text is written in"),
        });

        console.log("llmWihStructuredOutput");
        // Name is optional, but gives the models more clues as to what your schema represents
        const llmWihStructuredOutput = llm.withStructuredOutput(classificationSchema, {
            name: "extractor",
        });

        console.log("llmWihStructuredOutput",llmWihStructuredOutput);
        const prompt = await taggingPrompt.invoke({
            inputs: contents,
            profileContent: profileContent
        });
        console.log("prompt", prompt);

        const res = await llmWihStructuredOutput?.invoke(prompt);

        console.log("result profile classification", res);
        return {
            status: "success",
            message: "Profile classification successful",
            res: res,
            result: res,
            prompt: prompt,
            classificationSchema: classificationSchema,
            taggingPrompt: taggingPrompt,
            llmWihStructuredOutput: llmWihStructuredOutput,
        }

    } catch (error) {
        console.log("handleClassification error", error);
        return {
            status: "error",
            message: "Error",
            res: undefined
        }
    }

}
