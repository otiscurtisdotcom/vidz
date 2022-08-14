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
  const [clicked, setClicked] = useState(false);
  const [started, setStarted] = useState(false);
  const [loadingBar, setLoadingBar] = useState(0);
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

  const getTen = () => {
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

  const changeChannel = () => {
    const video = document.querySelector('video')!;
    video.remove();
    
    // Get another batch if running low...
    if (document.querySelectorAll('video').length === 2 || vids && vids.length < 2) {
      getTen();
    }

    const newVideo = document.querySelector('video');
    if (newVideo) {
      // DEBUGGING
      if (newVideo.duration) {
        newVideo.currentTime = Math.floor(Math.random() * newVideo.duration);
      }
      newVideo.style.display = 'block';
      newVideo.play();
    }
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
    if (vids) {
      setLoadingBar(loadedCount / vids?.length * 100);
    }

    // Play first video
    if (vids && loadedCount >= vids?.length - 1) {
      const video = document.querySelector('video')!;

      if (video.duration) {
        video.currentTime = Math.floor(Math.random() * video.duration);
      }
      video.play();
      video.style.display = 'block';
      setStarted(true);
    }
  }, [loadedCount]);

  useEffect(()=> {
    const img = new Image();
    img.src = `${process.env.PUBLIC_URL}/img/cursor-pressed.png`;
  }, [])

  return (
    <main
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL}/img/wallpaper.png")`,
        cursor: `url("${process.env.PUBLIC_URL}/img/cursor${mouseDown ? '-pressed' : ''}.png"), auto`
      }}
      onMouseDown={() => setMouseDown(true)}
      onMouseUp={() => setMouseDown(false)}
      onClick={() => {
        if (!clicked) {
          getTen();
          setClicked(true);
        } else {
          if (started) {
            changeChannel();
          }
        }
      }}
    >
      {!started &&
        <div className="loadingbar">
          <span style={{width: `${loadingBar}%`}}></span>
        </div>
      }

      <div
        className="vidbucket"
        style={started ? {
          backgroundImage: `url("${process.env.PUBLIC_URL}/img/static.gif")`
        } : {}}
      >
        {!started &&
          <p>Click anywhere to change the channel</p>
        }
        {videoPlayers()}
        <span className={`button ${mouseDown ? 'pressed' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path d="M10.5 1.674V4a5 5 0 0 1-3 9 5 5 0 0 1-3-9V1.674a7 7 0 1 0 6 0z"/><path d="M8.5 7.003V.997A.996.996 0 0 0 7.5 0c-.553 0-1 .453-1 .997v6.006c0 .551.444.997 1 .997.553 0 1-.453 1-.997z"/></svg>
        </span>
      </div>
    </main>
  );
}

export default App;
