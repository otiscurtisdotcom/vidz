import React, { useEffect, useState } from 'react';
import './App.scss';

interface Archive {
  response: {
    docs: Docs[]
  }
}

interface Docs {
  identifier: string;
}

interface Item {
  d1: string;
  dir: string;
  files: {
    format: string;
    name: string;
    size: number;
  }[]
}

const App = () => {
  const [mouseDown, setMouseDown] = useState(false);
  const [tenDocs, setTenDocs] = useState<Docs[]>();
  const [vids, setVids] = useState<string[]>();
  const [loadedCount, setLoadedCount] = useState(0);

  const fetchData = async (url: string) => {
    const res = await fetch(url, { method: "GET" });
    return await res.json();
  };

  const videoPlayers = () => {
    return vids?.map((vid, i) =>
      <video loop key={i} onLoadedMetadata={() => setLoadedCount(loadedCount + 1)}>
        <source src={vid} type="video/mp4" />
      </video>
    )
  }

  const go = () => {
    fetchData(`${process.env.PUBLIC_URL}/archive.json`)
    .then((data: Archive) => {
      const docs: Docs[] = [];
      for (let i = 0; i < 10; i++) {
        const rndDoc = data.response.docs[Math.floor(Math.random() * data.response.docs.length)];
        docs.push(rndDoc);
      }
      setTenDocs(docs);
    })
  }

  useEffect(() => {
    if (tenDocs) {
      for (const doc of tenDocs) {
        fetchData(`https://archive.org/metadata/${doc.identifier}`)
        .then((data: Item) => {
          const mp4Vid = data.files?.find((file) =>
            // (file.format === "MPEG4" || file.format === "h.264" || file.format === "HiRes MPEG4" || file.format === "512Kb MPEG4") &&
            (file.name.indexOf("mp4") > -1)
          );

          console.log(mp4Vid);

          if (mp4Vid && mp4Vid.size < 400000000) {
            const vidPath = `https://${data.d1}${data.dir}/${mp4Vid.name}`
            setVids(current =>
              current ? [...current, vidPath] : [vidPath]
            );
          }
        })
      };
    }
  }, [tenDocs]);

  useEffect(() => {
    console.log(loadedCount, vids?.length);
    if (vids && loadedCount >= vids?.length - 1) {
      const video = document.querySelector('video')!;
      video.play();
      video.style.display = 'block';
    }
  }, [loadedCount]);

  return (
    <main
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL}/img/wallpaper.png")`,
        cursor: `url("${process.env.PUBLIC_URL}/img/cursor${mouseDown ? '-pressed' : ''}.png"), auto`
      }}
      onMouseDown={() => setMouseDown(true)}
      onMouseUp={() => setMouseDown(false)}
      onClick={() => go()}
    >
      <div className="vid">
        <div className="vidbucket">{videoPlayers()}</div>
        <button className={`${mouseDown ? 'pressed' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path d="M10.5 1.674V4a5 5 0 0 1-3 9 5 5 0 0 1-3-9V1.674a7 7 0 1 0 6 0z"/><path d="M8.5 7.003V.997A.996.996 0 0 0 7.5 0c-.553 0-1 .453-1 .997v6.006c0 .551.444.997 1 .997.553 0 1-.453 1-.997z"/></svg>
        </button>
      </div>

      <div id="info">
        <div id="loadingbar"><span></span></div>
        <p>Click anywhere to change the channel</p>
      </div>
    </main>
  );
}

export default App;
