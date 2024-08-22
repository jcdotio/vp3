import React, { useState, useRef, useEffect } from 'react';
import jsmediatags from 'jsmediatags';
import { basename } from 'path';

const Index = () => {
  const [playQueue, setPlayQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState('');
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaElementSourceRef = useRef(null);
  const visualizerRef = useRef(null);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#333333';
    document.body.style.color = '#f5f5f5';
    document.body.style.fontFamily = 'Ubuntu, sans-serif';

    // Initialize AudioContext and AnalyserNode
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    // Set up audio context and analyser only once
    const setupAudio = async () => {
      try {
        await audioContextRef.current.resume();

        if (!mediaElementSourceRef.current) {
          mediaElementSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          mediaElementSourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }

        console.log('Audio setup complete');
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
    // Set the default volume to 10%
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
    }

    // Set up visualizer
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      visualizerRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = '#333333';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Reduce the gain by scaling down the bar height

        canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (visualizerRef.current) {
        cancelAnimationFrame(visualizerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSelectFiles = async () => {
    console.log('Select files button clicked');
    if (window.electron && window.electron.selectFiles) {
      const filePaths = await window.electron.selectFiles();
      console.log('Selected files:', filePaths);
  
      const newPlayQueue = await Promise.all(filePaths.map(async (filePath) => {
        try {
          const supportedExtensions = ['mp3', 'wav', 'flac'];
          const fileExtension = filePath.split('.').pop().toLowerCase();
  
          if (!supportedExtensions.includes(fileExtension)) {
            throw new Error(`Unsupported file format: ${fileExtension}`);
          }
  
          // Use a timeout to prevent hanging on problematic files
          const metadata = await Promise.race([
            new Promise((resolve, reject) => {
              jsmediatags.read(filePath, {
                onSuccess: (tag) => resolve(tag),
                onError: (error) => reject(error),
              });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Metadata read timeout')), 5000))
          ]);
  
          console.log('Extracted metadata for file:', filePath, metadata);
  
          return {
            url: `local://${filePath}`,
            lastPlayed: null,
            title: metadata.tags.title || basename(filePath),
            artist: metadata.tags.genre || 'Unknown Artist',
            album: metadata.tags.album || 'Unknown Album',
          };
        } catch (error) {
          console.error('Error reading metadata for file:', filePath, error);
          return null;
        }
      }));

      setPlayQueue(newPlayQueue.filter(song => song !== null));
    }
  };

  const handleClearQueue = async () => {
    console.log('Clear queue button clicked');
    if (window.electron && window.electron.clearQueue) {
      await window.electron.clearQueue();
      setPlayQueue([]); // Clear the play queue in the UI
      console.log('Play queue cleared');
    } else {
      console.error('window.electron or window.electron.clearQueue is not defined');
    }
  };

  const handlePlay = (url, index) => {
    console.log('Playing file:', url);
    setCurrentSong(url);
    setCurrentSongIndex(index);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const playNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % playQueue.length;
    if (nextIndex !== currentSongIndex) {
      handlePlay(playQueue[nextIndex].url, nextIndex);
    }
  };

  const handlePreviousSong = () => {
    const prevIndex = (currentSongIndex - 1 + playQueue.length) % playQueue.length;
    if (prevIndex !== currentSongIndex) {
      handlePlay(playQueue[prevIndex].url, prevIndex);
    }
  };

  const handleNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % playQueue.length;
    if (nextIndex !== currentSongIndex) {
      handlePlay(playQueue[nextIndex].url, nextIndex);
    }
  };

  useEffect(() => {
    if (window.electron && window.electron.saveState) {
      console.log('Saving state:', playQueue);
      window.electron.saveState(playQueue);
    }
  }, [playQueue]);

  useEffect(() => {
    if (window.electron && window.electron.onLoadState) {
      console.log('Setting up onLoadState listener');
      const removeListener = window.electron.onLoadState((savedState) => {
        console.log('Loaded state from main process:', savedState);
        setPlayQueue(savedState);
      });

      if (window.electron.rendererReady) {
        console.log('Signaling renderer ready to main process');
        window.electron.rendererReady();
      } else {
        console.error('window.electron.rendererReady is not defined');
      }

      return () => {
        if (removeListener) removeListener();
      };
    } else {
      console.error('window.electron or window.electron.onLoadState is not defined');
    }
  }, []);

  return (
    <div style={{ backgroundColor: '#333333', color: '#f5f5f5', fontFamily: 'Ubuntu, sans-serif' }}>
      <h1>
        <audio ref={audioRef} controls onEnded={playNextSong} /> 
      </h1>
      <button onClick={handlePreviousSong}>Previous</button>
      <button onClick={handleNextSong}>Next</button>
      <button onClick={handleSelectFiles}>Select Files</button>
      <button onClick={handleClearQueue}>Clear Queue</button>


      <canvas ref={canvasRef} width="300" height="50" style={{ display: 'block', margin: '10px auto' }}></canvas>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Title</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Artist</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Album</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>File Path</th>
          </tr>
        </thead>
        <tbody>
  {playQueue.map((song, index) => (
    <tr
      key={index}
      onClick={() => handlePlay(song.url, index)}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid #ccc',
        backgroundColor: song.url === currentSong ? '#555555' : 'transparent'
      }}
    >
      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{song.title || 'Unknown Title'}</td>
      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{song.artist || 'Unknown Artist'}</td>
      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{song.album || 'Unknown Album'}</td>
      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{decodeURIComponent(new URL(song.url).pathname).replace(/^\/+/, '/')}</td>
    </tr>
  ))}
</tbody>
      </table>
      <a target="_BLANK" href="https://jc.io">docs</a>
    </div>
  );
};

export default Index;