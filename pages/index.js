import React, { useState, useRef, useEffect } from 'react';

const Index = () => {
  const [playQueue, setPlayQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState('');
  const audioRef = useRef(null);

  // remove this once you setup styles correctly
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#333333';
    document.body.style.color = '#f5f5f5';
    document.body.style.fontFamily = 'Ubuntu, sans-serif';
  }, []);

  const handleSelectFiles = async () => {
    console.log('Select files button clicked'); // Debug log
    if (window.electron && window.electron.selectFiles) {
      const filePaths = await window.electron.selectFiles();
      console.log('Selected files:', filePaths); // Debug log
      // Update play queue with selected files
      setPlayQueue([...playQueue, ...filePaths.map(filePath => {
        try {
          return { url: `local://${filePath}`, lastPlayed: null };
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
    setPlayQueue(playQueue.map(song => song.url === url ? { ...song, lastPlayed: new Date().toISOString() } : song));
  };

  useEffect(() => {
    if (audioRef.current && currentSong) {
      console.log('Setting audio src to:', currentSong); // Debug log
      audioRef.current.src = currentSong;
      audioRef.current.play().then(() => {
        console.log('Audio is playing'); // Debug log
      }).catch(error => {
        console.error('Error playing audio:', error); // Error log
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if (window.electron && window.electron.saveState) {
      console.log('Saving state:', playQueue); // Debug log
      window.electron.saveState(playQueue);
    }
  }, [playQueue]);

  useEffect(() => {
    if (window.electron && window.electron.onLoadState) {
      console.log('Setting up onLoadState listener'); // Debug log
      const removeListener = window.electron.onLoadState((savedState) => {
        console.log('Loaded state from main process:', savedState); // Debug log
        setPlayQueue(savedState);
      });

      // Signal to the main process that the renderer is ready
      if (window.electron.rendererReady) {
        console.log('Signaling renderer ready to main process'); // Debug log
        window.electron.rendererReady();
      } else {
        console.error('window.electron.rendererReady is not defined'); // Error log
      }

      return () => {
        if (removeListener) removeListener();
      };
    } else {
      console.error('window.electron or window.electron.onLoadState is not defined'); // Error log
    }
  }, []);

  return (
    <div style={{ backgroundColor: '#333333', color: '#f5f5f5', fontFamily: 'Ubuntu, sans-serif' }}>
      <h1>VP3 Player</h1>
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
              <td style={{ border: '1px solid #ccc', padding: '8px' }}></td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Index;