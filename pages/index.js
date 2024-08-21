import React, { useState, useRef, useEffect } from 'react';

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
        barHeight = dataArray[i];

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
      setPlayQueue(prevQueue => [
        ...prevQueue,
        ...filePaths.map(filePath => {
          try {
            return { url: `local://${filePath}`, lastPlayed: null };
          } catch (error) {
            console.error('Invalid file path:', filePath);
            return null;
          }
        }).filter(Boolean)
      ]);
    } else {
      console.error('window.electron or window.electron.selectFiles is not defined');
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
        <audio ref={audioRef} controls onEnded={playNextSong} /> - VP3 Player --{' '}
      </h1>
      <button onClick={handleSelectFiles}>Select Files</button>
      <button onClick={() => setPlayQueue([])}>Clear Queue</button>
      <canvas ref={canvasRef} width="300" height="50" style={{ display: 'block', margin: '10px auto' }}></canvas>
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
            <tr
              key={index}
              onClick={() => handlePlay(song.url, index)}
              style={{
                cursor: 'pointer',
                borderBottom: '1px solid #ccc',
                backgroundColor: song.url === currentSong ? '#555555' : 'transparent'
              }}
            >
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {(() => {
                  try {
                    return decodeURIComponent(new URL(song.url).pathname);
                  } catch (error) {
                    console.error('Invalid URL:', song.url);
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
      <a target="_BLANK" href="https://jc.io">docs</a>
    </div>
  );
};

export default Index;