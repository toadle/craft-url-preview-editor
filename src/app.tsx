import { CraftUrlBlock } from "@craftdocs/craft-extension-api";
import * as React from "react";
import * as ReactDOM from "react-dom";
import craftXIconSrc from "./craftx-icon.png";
import _ from "lodash";

const App: React.FC<{}> = () => {
  const isDarkMode = useCraftDarkMode();
  const [messageText, setMessageText] = React.useState("");
  const [urlBlock, setUrlBlock] = React.useState<CraftUrlBlock>();

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);


  async function editUrlPreview() {
    setMessageText("");
    const response = await craft.editorApi.getSelection();  
    if (response.status !== "success") {
      throw new Error(response.message);
    } else {
      const selectedBlocks = response.data
      const urlBlocks = selectedBlocks.filter((b) => b.type === "urlBlock").map((b) => b as CraftUrlBlock);

      if (urlBlocks.length === 0) {
        setMessageText("No URL blocks selected");
        return;
      } else if (urlBlocks.length === 1) {
        setUrlBlock(urlBlocks[0]);
        return;
      } else {
        setMessageText("Multiple URL blocks selected. Please select only one.");
        return;
      }
    }
  }

  async function updateUrlBlock(newValues: Partial<CraftUrlBlock>) {
    if(!urlBlock) return;
    setUrlBlock(_.merge({}, urlBlock, newValues));
  }

  async function saveUrlBlock() {
    if(!urlBlock) return;
    const response = await craft.dataApi.updateBlocks([urlBlock]);
    setUrlBlock(undefined);
  }

  return (
    <div>
      <h1>URL Preview Editor</h1>
      <div className="message">{messageText}</div>
      <button
        onClick={editUrlPreview}
      >
        Edit selected
      </button>
      {urlBlock && (
        <div className="urlBlockItem">
          <span>{urlBlock.url}</span>
          <img className="coverImage" src={urlBlock.imageUrl} />
          <label>Title</label>
          <input type="text" value={urlBlock.title} onChange={(e) => updateUrlBlock({ title: e.target.value } )} />
          <label>Description</label>
          <input type="text" value={urlBlock.pageDescription} onChange={(e) => updateUrlBlock({ pageDescription: e.target.value } )}/>
          <label>Image-URL</label>
          <input type="text" value={urlBlock.imageUrl} onChange={(e) => updateUrlBlock({ imageUrl: e.target.value } )}/>
          <button onClick={saveUrlBlock}>Save</button>
        </div>
      )}
    </div>
  );
};

function useCraftDarkMode() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    craft.env.setListener((env) => setIsDarkMode(env.colorScheme === "dark"));
  }, []);

  return isDarkMode;
}

export function initApp() {
  ReactDOM.render(<App />, document.getElementById("react-root"));
}
