// Constants
const SHAPE_THRESHOLD = 200;
const NOTE_DURATION = 0.2;
const NOTES = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88
};

// Audio context
const audioCtx = new AudioContext();

// Camera
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(console.error);

// OpenCV.js
cv.onRuntimeInitialized = () => {
  const cap = new cv.VideoCapture(video);
  const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  const dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);

  setInterval(() => {
    // Capture frame
    cap.read(src);

    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

    // Detect shapes
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Map shapes to notes
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > SHAPE_THRESHOLD) {
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.04 * perimeter, true);
        const vertices = approx.rows;
        if (vertices === 3) {
          playSound('C');
        } else if (vertices === 4) {
          playSound('D');
        } else if (vertices > 4) {
          playSound('E');
        }
        approx.delete();
      }
      contour.delete();
    }

    // Clean up
    contours.delete();
    hierarchy.delete();
  }, 1000 / 30);

  function playSound(note) {
    const freq = NOTES[note];
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + NOTE_DURATION);
  }
};
