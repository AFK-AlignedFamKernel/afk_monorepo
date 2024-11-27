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
        <View style={styles.innerContainer}>
          <Text style={styles.nameText}>{name}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.ownerContainer}>
              <Text style={styles.label}>Owner:</Text>
              <Text style={styles.value}>
                {owner.slice(0, 6)}...{owner.slice(-4)}
              </Text>
            </View>
            
            <View style={styles.expiryContainer}>
              <Text style={styles.label}>Expires:</Text>
              <Text style={styles.value}>
                {new Date(expiryTime).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };