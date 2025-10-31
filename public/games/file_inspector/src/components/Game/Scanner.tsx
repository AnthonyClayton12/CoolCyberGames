import React, { useState } from 'react';

const Scanner: React.FC = () => {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);

    const startScan = () => {
        setScanning(true);
        setProgress(0);
        setResults([]);

        // Simulate scanning process
        const totalFiles = 10; // Example total files to scan
        let scannedFiles = 0;

        const interval = setInterval(() => {
            if (scannedFiles < totalFiles) {
                scannedFiles++;
                setProgress((prev) => Math.min(prev + (100 / totalFiles), 100));
                setResults((prev) => [...prev, `File ${scannedFiles} scanned`]);
            } else {
                clearInterval(interval);
                setScanning(false);
            }
        }, 500); // Simulate time taken to scan each file
    };

    return (
        <div className="scanner">
            <h2>File Scanner</h2>
            <button onClick={startScan} disabled={scanning}>
                {scanning ? 'Scanning...' : 'Start Scan'}
            </button>
            {scanning && (
                <div className="progress">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                    <p>{progress.toFixed(0)}% completed</p>
                </div>
            )}
            <div className="results">
                {results.map((result, index) => (
                    <p key={index}>{result}</p>
                ))}
            </div>
        </div>
    );
};

export default Scanner;