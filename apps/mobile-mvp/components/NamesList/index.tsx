import {View, FlatList, ActivityIndicator} from 'react-native';
import {NameCard} from '../NameCard/nameCard';
import {useStyles} from '../../hooks';
import stylesheet from './styles';

interface Name {
  name: string;
  owner: string;
  expiryTime: Date;
}

interface NamesListProps {
  names: Name[];
  isLoading?: boolean;
}

export const NamesList: React.FC<NamesListProps> = ({names, isLoading}) => {
  const styles = useStyles(stylesheet);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={names}
        renderItem={({item}) => (
          <NameCard name={item.name} owner={item.owner} expiryTime={item.expiryTime} />
        )}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};
