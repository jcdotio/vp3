import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setCurrentSong(fileURL);
    }
  };

  useEffect(() => {
    if (audioRef.current && canvasRef.current) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];

          canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
          canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

          x += barWidth + 1;
        }
      };

      draw();

      return () => {
        cancelAnimationFrame(animationRef.current);
        audioCtx.close();
      };
    }
  }, [currentSong]);

  return (
    <div>
      <h1>Simple MP3 Player</h1>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      {currentSong && (
        <div>
          <audio ref={audioRef} controls>
            <source src={currentSong} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <canvas ref={canvasRef} width="600" height="200"></canvas>
        </div>
      )}
    </div>
  );
}