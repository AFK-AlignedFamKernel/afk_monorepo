import StarknetProvider from './StarknetProvider.js';
import './index.css';
import App from './App';
import AppOld from './AppOld.js';

interface IAppRender {
  artPeaceAddress?: string
}
const AppRender = ({ artPeaceAddress }: IAppRender) => {
  return (
    <StarknetProvider>
      <App contractAddress={artPeaceAddress} />
      {/* <AppOld /> */}
    </StarknetProvider>
  )
}
export { App, AppRender };

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <StarknetProvider>
//       <App />
//     </StarknetProvider>
//   </React.StrictMode>
// );