import { useStyles } from "../../hooks";
import { View, Text } from "react-native";
import stylesheet from "./styles";

interface NameCardProps {
    name: string;
    owner: string;
    expiryTime: Date;
  }
  
  export const NameCard: React.FC<NameCardProps> = ({ name, owner, expiryTime }) => {
    const styles = useStyles(stylesheet);
    
    return (
      <View style={styles.card}>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.ownerText}>Owner: {owner}</Text>    
        <Text style={styles.expiryText}>
          Expires: {new Date(expiryTime).toLocaleDateString()}
        </Text>
      </View>
    );
  };