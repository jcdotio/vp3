import { useState, useRef } from 'react';

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setCurrentSong(fileURL);
    }
  };

  return (
    <div>
      <h1>Simple MP3 Player</h1>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      {currentSong && (
        <audio ref={audioRef} controls>
          <source src={currentSong} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}