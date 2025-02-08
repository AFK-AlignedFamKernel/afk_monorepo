import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, useGetSingleEvent } from "afk_nostr_sdk";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSocketContext } from "../../context/SocketContext";
import { useStyles } from "../../hooks";
import { LiveChatView } from "./LiveChat";
import { useWebStream } from "./stream/useWebStream";
import { ViewerVideoView } from "./StreamVideoPlayer";
import stylesheet from "./styles";
import { MainStackParams } from "../../types";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";


type ViewStreamProps = {
  route: RouteProp<MainStackParams, "Stream">;
  navigation: StackNavigationProp<MainStackParams, "Stream">;
};


export const ViewStreamModuleView: React.FC<ViewStreamProps> = ({ route }) => {
  const { publicKey } = useAuth();
  const isStreamer = false;
  const streamKey = route.params.streamId;
  const streamerUserId = publicKey;

  const styles = useStyles(stylesheet);
  const { socketRef, isConnected } = useSocketContext();
  const { isChatOpen, setNewMessage, newMessage, setIsChatOpen, viewerCount } = useWebStream({
    socketRef,
    streamerUserId,
    streamKey,
    isStreamer,
    isConnected,
  });

  const { data: eventData } = useGetSingleEvent({ eventId: streamKey });

  const renderStreamContent = () => {
    if (!eventData) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading stream information...</Text>
        </View>
      );
    }

    switch (eventData.status) {
      case "planned":
        return (
          <View style={styles.centerContent}>
            <Text style={styles.plannedText}>This stream is scheduled to start soon.</Text>
          </View>
        );
      case "live":
        return (
          <>
            <View style={styles.videoContainer}>
              <ViewerVideoView playbackUrl={eventData.streamingUrl || ""} />
              <View style={styles.overlay}>
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>
                    {isConnected ? "LIVE" : "NOT CONNECTED CHECK YOUR NETWORK CONNECTION"}
                  </Text>
                </View>
                <View style={styles.viewerContainer}>
                  <Text style={styles.viewerCount}>{viewerCount} viewers</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={styles.chatToggle}
              onPress={() => setIsChatOpen(!isChatOpen)}
              accessibilityLabel={isChatOpen ? "Close chat" : "Open chat"}
            >
              <MaterialIcons name={isChatOpen ? "chat" : "chat-bubble"} size={24} color="white" />
            </Pressable>
          </>
        );
      case "ended":
        return (
          <>
            <View style={styles.videoContainer}>
              <ViewerVideoView playbackUrl={eventData.streamingUrl || ""} />
              <View style={styles.overlay}>
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>STREAM ENDED</Text>
                </View>
                <View style={styles.viewerContainer}>
                  <Text style={styles.viewerCount}>{viewerCount} viewers</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={styles.chatToggle}
              onPress={() => setIsChatOpen(!isChatOpen)}
              accessibilityLabel={isChatOpen ? "Close chat" : "Open chat"}
            >
              <MaterialIcons name={isChatOpen ? "chat" : "chat-bubble"} size={24} color="white" />
            </Pressable>
          </>
        );
      default:
        return (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Stream information unavailable.</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderStreamContent()}
      {isChatOpen && eventData?.status === "live" && (
        <LiveChatView
          eventId={route.params.streamId}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          setIsChatOpen={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </View>
  );
};
