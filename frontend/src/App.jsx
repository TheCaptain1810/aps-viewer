import Header from "./components/Header";
import ViewerInitializer from "./components/ViewerInitializer";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <>
      <Header />
      <div id="preview"></div>
      <div id="overlay"></div>
      <Sidebar>
        <ViewerInitializer />
      </Sidebar>
    </>
  );
}

export default App;
