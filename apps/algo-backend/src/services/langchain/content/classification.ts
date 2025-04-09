import NDK, { NDKEvent, NDKRelay, NostrEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { pipeline } from '@huggingface/transformers';

export const handleClassifySentiment = async (content: string) => {
    const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
        dtype: "fp32"
    });
    const output = await classifier(content);
    console.log(output);
    return output;
}

export const handleClassifyScore = async (content: string) => {
    const classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment', {
        dtype: "fp32"
    });

    const output = await classifier(content);
    console.log(output);
    return output;
}

export const handleToxicityScore = async (content: string) => {
    const classifier = await pipeline('text-classification', 'Xenova/toxic-bert', {
        dtype: "fp32"
    });

    const output = await classifier(content);
    console.log(output);
    return output;
}


export const handleQuestionAnswering = async (content: string) => {
    const answerer = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', {
        dtype: "fp32"
    });
    const question = 'Who was Jim Henson?';
    const context = 'Jim Henson was a nice puppet.';
    const output = await answerer(question, context);
    console.log(output);
    return output;
}

export const handleZeroShotClassification = async (content: string, labels?: string[]) => {
    try {
        // const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
        const truncate = (text: string, maxLength: number = 512) => {
            return text.split(' ').slice(0, maxLength).join(' ');
          };
          
          const input = truncate(content, 512);

        // const classifier = await pipeline('zero-shot-classification', 'Xenova/distilbart-mnli-12-3', {
        const classifier = await pipeline('zero-shot-classification', 'nli-deberta-v3-xsmall', {
            // const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {


            dtype: "fp32",
        });
        const output = await classifier(input, labels ?? [
            'value sharing and constructive',
            'pedagogy',
            'storytelling and hooks',
            'emotions and feeling',
            'way to talk',
        ]);
        console.log(output);
        return output;
    } catch (error) {
        console.log("handleZeroShotClassification error", error);
        return null;
    }

}

export const handleNostrEventsClassififierMultiple = async (events: NDKEvent[], labels: string[]) => {
    const classifier = await pipeline('zero-shot-classification', 'Xenova/distilbart-mnli-12-3', {
        dtype: "fp32"
    });
    const results = await Promise.all(events.map(event => {
        const res = classifier(event.content, [
            'value sharing and constructive',
            'pedagogy',
            'storytelling and hooks',
            'emotions and feeling',
            'way to talk',
        ]);
        return { note: event, res };
    }));


    return results;
}

