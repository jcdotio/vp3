import React from 'react';
import { ipcRenderer } from 'electron';

const App = () => {
  const [currentSong, setCurrentSong] = React.useState(null);
  const audioRef = React.useRef(null);

  const handleSelectFiles = async () => {
    console.log('Select files button clicked'); // Debug log
    const filePaths = await ipcRenderer.invoke('select-files');
    console.log('Files selected:', filePaths); // Debug log

    if (filePaths.length > 0) {
      handlePlay(filePaths[0]);
    } else {
      console.error('No files selected'); // Error log
    }
  };

  const handlePlay = (url) => {
    const decodedUrl = decodeURIComponent(url);
    const filePath = `local://${decodedUrl}`;
    console.log('Playing file:', filePath); // Debug log
    setCurrentSong(filePath);
  };

  React.useEffect(() => {
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
      <button onClick={handleSelectFiles}>Select Files</button>
      <audio ref={audioRef} controls></audio>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>URL</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Year</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Genre</th>
          </tr>
        </thead>
        <tbody>
          {/* Add your table rows here */}
        </tbody>
      </table>
    </div>
  );
};

export default App;