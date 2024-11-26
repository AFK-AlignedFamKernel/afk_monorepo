// components/CopyableLink.tsx
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  useClipboard,
  useToast,
} from '@chakra-ui/react';

interface CopyableLinkProps {
  link: string;
}

const CopyableLink: React.FC<CopyableLinkProps> = ({link}) => {
  const {hasCopied, onCopy} = useClipboard(link);
  const toast = useToast();

  const handleCopy = () => {
    onCopy();
    toast({
      title: 'Copied to clipboard!',
      description: 'The link has been copied to your clipboard.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box maxWidth="400px" mx="auto" p={5}>
      <InputGroup size="md">
        <Input value={link} isReadOnly placeholder="Generated link will appear here" />
        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleCopy}>
            {hasCopied ? 'Copied' : 'Copy'}
          </Button>
        </InputRightElement>
      </InputGroup>
    </Box>
  );
};

export default CopyableLink;
