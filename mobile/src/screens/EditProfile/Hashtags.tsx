import { TouchableOpacity, View, } from "react-native";

import { Text, SquareInput } from "../../components";
import { useState } from "react";
import { useTheme } from "../../hooks";
import { useAddHashtagInterests } from "afk_nostr_sdk";
import { useToast } from "../../hooks/modals";

export const Hashtags = ({
    values,
    setFieldValue,
}: {
    values: { tags?: string[] };
    setFieldValue: (field: string, value: any) => void;
}) => {
    const { theme } = useTheme();
    const [isSetInterest, setIsSetInterest] = useState(false);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const { showToast } = useToast();
    const [hashtagInput, setHashtagInput] = useState<string>();
    const addHashtagInterests = useAddHashtagInterests();
    return (
        <View>
            <Text>Hashtags</Text>

            <SquareInput
                placeholder="Add hashtag"
                value={hashtagInput}
                onChangeText={setHashtagInput}
                right={
                    <TouchableOpacity
                        onPress={() => {
                            const tag = hashtagInput?.trim().toLowerCase();
                            if (tag) {
                                const newTags = [...(values.tags || []), tag];
                                setFieldValue('tags', newTags);
                                setHashtagInput('');
                            }
                        }}
                        style={{ padding: 8 }}
                    >
                        <Text style={{ color: '#007AFF' }}>Add</Text>
                    </TouchableOpacity>
                }
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {values?.tags?.map((tag, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.background,
                            padding: 8,
                            borderRadius: 16,
                            marginBottom: 8
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>#{tag}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                const newTags = [...(values.tags || [])];
                                newTags.splice(index, 1);
                                setFieldValue('tags', newTags);
                            }}
                            style={{ marginLeft: 8 }}
                        >
                            <Text>Remove</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                onPress={async () => {
                    if (values.tags?.length) {
                        const tags = values.tags.map(tag => ['t', tag]);

                        console.log(tags);


                        await addHashtagInterests.mutateAsync({
                            tags,
                            isSetInterest: true,
                            isEncrypted: false,
                            isList: false,
                        });
                    } else {
                        showToast({ type: 'error', title: 'No tags to save' });
                    }
                }}
                style={{
                    backgroundColor: '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '500' }}>
                    Save Hashtag Interests
                </Text>
            </TouchableOpacity>
        </View>
    );
};