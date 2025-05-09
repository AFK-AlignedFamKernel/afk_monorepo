import React from "react";
import { Text, Platform, KeyboardAvoidingView, SafeAreaView, ScrollView } from "react-native";
import {actions, RichEditor, RichToolbar} from "react-native-pell-rich-editor";


const handleHead = ({tintColor}) => <Text style={{color: tintColor}}>H1</Text>
const RichEditorForm = () => {
	const richText = React.useRef();
	return (
    <SafeAreaView>
      <ScrollView>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}	style={{ flex: 1 }}>
          <Text>Description:</Text>
          <RichEditor
              ref={richText}
              onChange={ descriptionText => {
                  console.log("descriptionText:", descriptionText);
              }}
          />
        </KeyboardAvoidingView>
      </ScrollView>

      <RichToolbar
        editor={richText}
        actions={[ actions.setBold, actions.setItalic, actions.setUnderline, actions.heading1 ]}
        iconMap={{ [actions.heading1]: handleHead }}
      />
    </SafeAreaView>
  );
};

  export default RichEditorForm;