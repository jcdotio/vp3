import React, { useState, useRef, useEffect } from 'react';

const Index = () => {
  const [playQueue, setPlayQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState('');
  const audioRef = useRef(null);

  const handleSelectFiles = async () => {
    console.log('Select files button clicked'); // Debug log
    if (window.electron && window.electron.selectFiles) {
      const filePaths = await window.electron.selectFiles();
      console.log('Selected files:', filePaths); // Debug log
      // Update play queue with selected files
      setPlayQueue([...playQueue, ...filePaths.map(filePath => {
        try {
          return { url: `local://${filePath}` };
        } catch (error) {
          console.error('Invalid file path:', filePath); // Error log
          return null;
        }
      }).filter(Boolean)]);
    } else {
      console.error('window.electron or window.electron.selectFiles is not defined'); // Error log
    }
  };

  const handlePlay = (url) => {
    console.log('Playing file:', url); // Debug log
    setCurrentSong(url);
  };

  useEffect(() => {
    if (audioRef.current && currentSong) {
      console.log('Setting audio src to:', currentSong); // Debug log
      audioRef.current.src = currentSong;
      audioRef.current.play().then(() => {
        console.log('Audio is playing'); // Debug log
      }).catch(error => {
        console.error('Error playing audio:', error); // Debug log
      });
    }
  }, [currentSong]);

  return (
    <div>
      <audio ref={audioRef} controls />
      <button onClick={handleSelectFiles}>Select Files</button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>URL</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Year</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Genre</th>
          </tr>
        </thead>
        <tbody>
          {playQueue.map((song, index) => (
            <tr key={index} onClick={() => handlePlay(song.url)} style={{ cursor: 'pointer', borderBottom: '1px solid #ccc' }}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {(() => {
                  try {
                    return decodeURIComponent(new URL(song.url).pathname);
                  } catch (error) {
                    console.error('Invalid URL:', song.url); // Error log
                    return 'Invalid URL';
                  }
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Index;