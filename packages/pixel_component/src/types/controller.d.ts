import { Connector } from '@starknet-react/core';
import { ControllerProvider } from '@cartridge/controller';

declare module '@cartridge/controller' {
  export class ControllerConnector extends Connector implements ControllerProvider {
    username(): Promise<string>;
  }
  export default ControllerConnector;
} 