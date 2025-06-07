import { z } from "zod";


export const ContentCreatorAnalyticsSchema = z.object({
    summary: z.string().describe("Summary of the user's recent tweets and overall content"),
    style: z.enum(["shitpost", "corporate", 'personal']).describe("The style of the text"),
    polarity: z.enum(["positive", "neutral", "negative"]).describe("The polarity of the text"),
    tone: z.enum(["formal", "informal", 'friendly', 'casual']).describe("The tone of the text"),
    sentiment: z
        .enum(["happy", "neutral", "sad", "critical", "passionate", "optimistic", "pessimistic"])
        .describe("The sentiment of the text"),
    mainTopics: z.array(z.string()).describe("Array of main topics the user frequently discusses (max 3)"),
    mainSubjects: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions (max 3)"),
    mainSubjectsPessimistic: z.array(z.string()).describe("Array of main subjects that discuss in a pessimistic way the user frequently discusses, references, or mentions negatively (max 3)"),
    mainSubjectsNeutral: z.array(z.string()).describe("Array of main subjects that discuss in a neutral way the user frequently discusses, references, or mentions neutrally (max 3)"),
    mainSubjectsOptimistic: z.array(z.string()).describe("Array of main subjects that discuss in an optimistic way, where the user frequently discusses, references, or mentions positively (max 3)"),
    expertiseLevel: z.number().min(0).max(3).describe("User's level of expertise in their main topics"),
    reputationScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's reputation based on consistency and community trust"),
    sentimentProfile: z.string().describe("Overall sentiment of user's content"),
    keyMessages: z.array(z.string()).describe("The key messages of the user's content"),
    truthfulnessEstimate: z.string().describe("Assessment of content truthfulness"),
    copywritingStyle: z.string().describe("Style of writing and communication"),
    polarizationLevel: z.number().min(0).max(3).describe("Level of content polarization"),
    trustScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's trust based on consistency and community trust"),

    mindShare: z.number().min(0).max(100).describe("Measure of user's influence and reach (0-100)"),
    introductionBodyConclusionScore: z.number().min(0).max(100).describe("The score of the text in the introduction, body, and conclusion criteria"),
    copyWritingScore: z.number().min(0).max(100).describe("The score of the text in the copy writing criteria and skills"),
    storyTellingAndHooksScore: z.number().min(0).max(100).describe("The score of the text in the story telling and hooks criteria"),

    editingScore: z.number().min(0).max(100).describe("The score of the text in the editing criteria: like grammar, spelling, punctuation, etc."),
    educationalScore: z.number().min(0).max(100).describe("The score of the text in the educational criteria: like pedagogy, way to talk, tone, introduction, body, and conclusion"),
    buildingScore: z.number().min(0).max(100).describe("The score of the text in the building criteria, like founder, working on an company, etc."),
    contentScore: z.number().min(0).max(100).describe("The score of the text in the content criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    consistencyScore: z.number().min(0).max(100).describe("The score of the text in the consistency criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    relevanceScore: z.number().min(0).max(100).describe("The score of the text in the relevance criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    clarityScore: z.number().min(0).max(100).describe("The score of the text in the clarity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    creativityScore: z.number().min(0).max(100).describe("The score of the text in the creativity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    overallScore: z
        .number()
        .min(0)
        .max(100)
        .int()
        .describe("The score of the text in the copy writing criteria: hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
})

export const ComplexContentCreatorAnalyticsSchema = z.object({
    summary: z.string().describe("Summary of the user's recent tweets and overall content"),
    mainTopics: z.array(z.string()).describe("Array of main topics the user frequently discusses (max 3)"),
    mainSubjects: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions (max 3)"),
    mainSubjectsPessimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions negatively (max 3)"),
    mainSubjectsNeutral: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions neutrally (max 3)"),
    mainSubjectsOptimistic: z.array(z.string()).describe("Array of main subjects the user frequently discusses, references, or mentions positively (max 3)"),
    expertiseLevel: z.number().min(0).max(3).describe("User's level of expertise in their main topics"),
    reputationScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's reputation based on consistency and community trust"),
    sentimentProfile: z.string().describe("Overall sentiment of user's content"),
    
    sentiment: z
    .enum(["happy", "neutral", "sad", "critical", "passionate", "optimistic", "pessimistic"])
    .describe("The sentiment of the text"),

    polarizationLevel: z.number().min(0).max(3).describe("Level of content polarization"),
    trustScore: z.number().min(0).max(100).describe("Numerical score (0-100) representing user's trust based on consistency and community trust"),
    truthfulnessEstimate: z.string().describe("Assessment of content truthfulness"),
    copywritingStyle: z.string().describe("Style of writing and communication"),
    mindShare: z.number().min(0).max(100).describe("Measure of user's influence and reach (0-100)"),
    tone: z.enum(["formal", "informal", 'friendly', 'casual']).describe("The tone of the text"),
    introductionBodyConclusionScore: z.number().min(0).max(100).describe("The score of the text in the introduction, body, and conclusion criteria"),
    copyWritingScore: z.number().min(0).max(100).describe("The score of the text in the copy writing criteria and skills"),
    storyTellingAndHooksScore: z.number().min(0).max(100).describe("The score of the text in the story telling and hooks criteria"),

    editingScore: z.number().min(0).max(100).describe("The score of the text in the editing criteria: like grammar, spelling, punctuation, etc."),
    educationalScore: z.number().min(0).max(100).describe("The score of the text in the educational criteria: like pedagogy, way to talk, tone, introduction, body, and conclusion"),
    buildingScore: z.number().min(0).max(100).describe("The score of the text in the building criteria, like founder, working on an company, etc."),
    contentScore: z.number().min(0).max(100).describe("The score of the text in the content criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    consistencyScore: z.number().min(0).max(100).describe("The score of the text in the consistency criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    relevanceScore: z.number().min(0).max(100).describe("The score of the text in the relevance criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    clarityScore: z.number().min(0).max(100).describe("The score of the text in the clarity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    creativityScore: z.number().min(0).max(100).describe("The score of the text in the creativity criteria: like hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
    overallScore: z
        .number()
        .min(0)
        .max(100)
        .int()
        .describe("The score of the text in the copy writing criteria: hooks, body, intro, narrative, conclusion, story telling, emotions feeling, value sharing and constructive, educational, pedagogy, way to talk, tone, introduction, body, and conclusion"),
})