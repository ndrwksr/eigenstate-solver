import React, {FC, useEffect, useRef, useState} from "react";
import './quantum.css';
import _ from "lodash";
import {scaleBuff} from "./img";
import {motion} from 'framer-motion';

export const Quantum: FC<{
  n: number,
  l: number,
  selected: number | null,
  done: () => void
}> = ({n, l, selected, done}) => {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const [buffers, setBuffers] = useState<Uint8ClampedArray[] | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [status, _setStatus] = useState<string>('Loading...'),
    setStatus = _.debounce(_setStatus, 300);
  const [substatus, _setSubstatus] = useState<string | null>(null),
    setSubstatus = _.debounce(_setSubstatus, 300);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workerRef.current = new Worker('src/react/lib/img/hamiltonian');
    workerRef.current.addEventListener('message', ev => {
      console.log(ev);

      if (ev.data.error) {
        setError(ev.data.error);
        setSimulating(false);
      }

      switch (ev.data.status) {
        case 'imports':
          setStatus('Importing web worker dependencies...');
          break;
        case 'setup':
          setStatus('Initializing eigensolver WASM module...');
          break;
        case 'potential':
          setStatus('Calculating potential energy...');
          break;
        case 'kinetic':
          setStatus('Calculating kinetic energy...');
          break;
        case 'hamiltonian':
          setStatus('Calculating kinetic energy...');
          break;
        case 'eigenstates':
          setStatus('Computing eigenstates...');
          setSubstatus('(this step can take a while)');
          break;
        case 'buffers':
          setStatus('Converting matrices to images...');
          setSubstatus('(almost there!)')
          break;
        case 'done':
          setStatus('Done.');
          setSubstatus(null);
          setSimulating(false);
          setBuffers(ev.data.buffers);
          done();
          break;
      }
    });
  }, []);

  // Compute eigenvectors of Hamiltonian as array of image buffers
  useEffect(() => {
    if (!simulating) {
      _setStatus('Loading...');
      setSimulating(true);
      console.log('Starting web worker with params:', {n, l})
      workerRef.current.postMessage({n, l});
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.rect(0, 0, n, n);
      context.fillStyle = 'black';
      context.fill();
    }
  }, [n, l]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const rect = canvas.parentNode.getBoundingClientRect();
    const size = rect.width - rect.width % n, scale = size / n; // Ensure is divisible by n
    canvas.width = size;
    canvas.height = size;
    canvas.scale = scale;

    const buffer = buffers?.[selected];
    if (buffer) {
      // context.clear();
      const scaledImage = context.createImageData(size, size);
      scaledImage.data.set(scaleBuff(buffer, n, scale));
      context.putImageData(scaledImage, 0, 0);
    } else {
      context.rect(0, 0, canvas.width, canvas.width);
      context.fillStyle = 'black';
      context.fill();
    }
  }, [buffers, selected]);

  return <div className="quantum">
    <motion.div
      animate={(simulating || error) ? {opacity: 1} : {opacity: 0}}
      className={`overlay ${simulating ? 'visible' : ''}`}
    >
      {simulating && <>
        <p className="status">{status}</p>
        <p className="substatus">{substatus}</p>
      </>}
      {error && <>
        <p className="status">Whoops! Something went wrong...</p>
        <p className="substatus truncate" style={{width: '16rem'}} >{error}</p>
      </>}
    </motion.div>
    <motion.canvas
      animate={simulating ? {opacity: 0} : {opacity: 1}}
      style={{width: '100%'}}
      ref={canvasRef}
    />
  </div>
}