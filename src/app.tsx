import { CraftUrlBlock, ListStyle, LayoutStyle } from "@craftdocs/craft-extension-api";
import * as React from "react";
import * as ReactDOM from "react-dom";
import craftXIconSrc from "./craftx-icon.png";
import _ from "lodash";
import axios from "axios";
const cheerio = require('cheerio');

declare var process : {
  env: {
    NODE_ENV: string
  }
}

const App: React.FC<{}> = () => {
  const isDarkMode = useCraftDarkMode();
  const [messageText, setMessageText] = React.useState("");
  const [urlBlock, setUrlBlock] = React.useState<CraftUrlBlock>();
  const [suggestionImages, setSuggestionImages] = React.useState<string[]>([]);

  async function getImages(url: string): Promise<string[]> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const imagesSrcs : string[] = [];

    const ogImage = $('meta[property="og:image"]').attr('content');
    if(ogImage) imagesSrcs.push(ogImage);
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if(twitterImage) imagesSrcs.push(twitterImage);
  
    $('img').each((i:any , image:any) => {
      imagesSrcs.push(image.attribs.src);
    });

    const processedImagesSrcs: string[] = []
    imagesSrcs.forEach((imageSrc) => {
      if (imageSrc.indexOf('data:') !== 0) {
        const protocol = new URL(url).protocol;
        const host = new URL(url).host;

        if (imageSrc.indexOf('/') === 0) {
          imageSrc = protocol + '//' + host + imageSrc;
        }
        if (imageSrc.indexOf('./') === 0) {
          imageSrc = protocol + '//' + host + imageSrc.slice(1);
        }

        processedImagesSrcs.push(imageSrc);
      }
    });
  
    return processedImagesSrcs;
  }

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    if(!urlBlock) return;
    const url = urlBlock.url;
    if(!url) return;
    const fetchUrlInfo = async () => {
      const result = await getImages(url);
      setSuggestionImages(result);
    }
    fetchUrlInfo();
  }, [urlBlock]);

  async function editUrlPreview() {
    setMessageText("");
    const response = await craft.editorApi.getSelection();  
    if (response.status !== "success") {
      throw new Error(response.message);
    } else {
      const selectedBlocks = response.data
      const urlBlocks = selectedBlocks.filter((b) => b.type === "urlBlock").map((b) => b as CraftUrlBlock);

      if (urlBlocks.length === 0) {
        if(process.env.NODE_ENV === "development") {
          const craftUrlBlock: CraftUrlBlock = {
            type: "urlBlock",
            url: "https://www.craft.do",
            title: "Craft Docs",
            pageDescription: "Craft Docs is a documentation platform for developers.",
            imageUrl: "https://craft.nyc3.cdn.digitaloceanspaces.com/people-of-craft/og/craft_og.png",
            id: "1",
            indentationLevel: 0,
            hasBlockDecoration: false,
            hasFocusDecoration: false,
            color: "blue",
            listStyle: null as unknown as ListStyle,
            layoutStyle: null as unknown as LayoutStyle,
          };
          setUrlBlock(craftUrlBlock);
        } else {
          setMessageText("No URL blocks selected");
        }
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
      <h5>URL Preview Editor</h5>
      <div className="message">{messageText}</div>
      {!urlBlock && (<button
        onClick={editUrlPreview}
      >
        Edit selected
      </button>)}
      {urlBlock && (
        <div className="urlBlockItem">
          <div className="form-element mt-1 mb-1">
            <label>URL</label>
            <input type="text" value={urlBlock.url} disabled={true} />
          </div>
          <div className="form-element mb-1">
            <label>Title</label>
            <input type="text" value={urlBlock.title} onChange={(e) => updateUrlBlock({ title: e.target.value } )} />
          </div>
          <div className="form-element mb-1">
            <label>Description</label>
            <input type="text" value={urlBlock.pageDescription} onChange={(e) => updateUrlBlock({ pageDescription: e.target.value } )}/>
          </div>
          <img className="coverImage mb-1" src={urlBlock.imageUrl} />
          {suggestionImages.length > 0 && (
            <>
              <label>More Images from URL</label>
              <div className="suggestionImages mb-1">
                <div className="suggestionImagesList">
                  {suggestionImages.map((image, index) => (
                    <img key={index} className="suggestionImage" src={image} onClick={() => updateUrlBlock({ imageUrl: image } )} />
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="form-element mb-1">
            <label>Image-URL</label>
            <input type="text" value={urlBlock.imageUrl} onChange={(e) => updateUrlBlock({ imageUrl: e.target.value } )}/>
          </div>
          <button className="mr-1" onClick={saveUrlBlock}>Save</button>
          <button onClick={() => setUrlBlock(undefined)}>Cancel</button>
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
