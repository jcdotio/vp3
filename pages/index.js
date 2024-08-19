import { useState, useRef } from 'react';

export default function Home() {
  const [playQueue, setPlayQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newQueue = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    setPlayQueue(prevQueue => [...prevQueue, ...newQueue]);
  };

  const handlePlay = (url) => {
    setCurrentSong(url);
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  return (
    <div>
      <h1>VP3 Player</h1>
      <input type="file" accept=".mp3" multiple onChange={handleFileChange} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {playQueue.map((song, index) => (
          <div key={index} onClick={() => handlePlay(song.url)} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            {song.name}
          </div>
        ))}
      </div>
      {currentSong && (
        <div>
          <audio ref={audioRef} controls>
            <source src={currentSong} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}