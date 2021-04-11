import React, {CSSProperties, useEffect, useRef, useState} from 'react'
import './App.scss'
import './range.css';
import {Quantum} from "./lib/Quantum";
import {useForm} from "react-hook-form";

const maxW = 65;

function App() {
  const {register, handleSubmit, watch, formState: {errors, isDirty}, reset} = useForm<{ w: number, l: number }>();

  const onSubmit = data => {
    let {w: newW, l: newL} = data;

    // There is a bug in react-hook-form causing these to erratically come through as strings
    newW = typeof newW === 'string' ? parseInt(newW) : newW;
    newL = typeof newL === 'string' ? parseFloat(newL) : newL;

    if (newW !== w || newL !== l) {
      setW(newW);
      setL(newL);
      setSimulating(true);
      reset({w: newW, l: newL});
    }
  }

  const defaultN = 5, defaultW = 15, defaultL = 1;
  const [n, _setN] = useState<number>(defaultN),
    setN = (newN) => {
      const clamped = Math.max(0, Math.min(newN, w - 1));
      _setN(clamped);
    }; // No debounce necessary
  const [w, setW] = useState<number>(defaultW);
  const [l, setL] = useState<number>(defaultL);
  const [simulating, setSimulating] = useState<boolean>(true);
  const inputRef = useRef(null);

  useEffect(() => {
    // These are clamped in the set proxies
    const plus = (ev) => ev.key === 'ArrowRight' && (setN(n + 1));
    const minus = (ev) => ev.key === 'ArrowLeft' && (setN(n - 1));

    addEventListener('keydown', plus);
    addEventListener('keydown', minus);

    return () => {
      removeEventListener('keydown', plus);
      removeEventListener('keydown', minus);
    }
  }, [n]);

  return (
    <div className="App">
      <div className="main">
        <div className="simulation">
          <h2>Single Particle Eigenstate Solver</h2>
          <div className="simulation-body-top" />
          <div className="simulation-body">
            <div className="mx-auto flex flex-col lg:flex-row">
              <div className="quantum-container">
                <Quantum n={w} l={l} selected={n} done={() => setSimulating(false)}/>
              </div>
              <div className="controls">
                <label htmlFor='n' style={{'--index': 0} as CSSProperties}>Eigenstate <span
                  className="opacity-50">(N)</span></label>
                <div className="selected-container">
                  <button
                    id="decrement"
                    style={{borderColor: 'red'}}
                    onClick={() => setN(Math.max(n - 1, 0))}
                    disabled={n === 0}
                  >-</button>
                  <input type="number" value={n} id="n" ref={inputRef}
                         onChange={e => setN(parseInt(e.target.value) || 1)}/>
                  <button
                    id="increment"
                    style={{borderColor: 'blue'}}
                    onClick={() => setN(Math.min(n + 1, w - 1))}
                    disabled={n === w - 1}
                  >+</button>
                </div>
                <h6 className="opacity-50">0 &#8804; N &#8804; {w - 1} </h6>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <label htmlFor='w' style={{'--index': 1} as CSSProperties}>Resolution <span
                    className="opacity-50">(R)</span></label>
                  <input
                    defaultValue={defaultW}
                    className={`${errors?.w?.type === 'required' ? 'required' : ''}`}
                    {...register("w", {required: true, min: 11, max: maxW})}
                  />
                  <div className="flex flex-row justify-between">
                    <h6>
                      <span style={errors?.w?.type === 'min'
                        ? {color: 'red', opacity: 1}
                        : {color: 'white', opacity: 0.5}
                      }>11 &#8804;</span>
                      <span style={errors?.w?.type === 'min' || errors?.w?.type === 'max'
                        ? {color: 'red', opacity: 1}
                        : {color: 'white', opacity: 0.5}
                      }>&nbsp;R&nbsp;</span>
                      <span style={errors?.w?.type === 'max'
                        ? {color: 'red', opacity: 1}
                        : {color: 'white', opacity: 0.5}
                      }>&#8804;{maxW}</span>
                    </h6>
                    {errors?.w?.type === 'required' && <span style={{color: 'red'}}>Required</span>}
                  </div>

                  <label htmlFor='l' style={{'--index': 2} as CSSProperties}>Length <span
                    className="opacity-50">(L)</span></label>
                  <div>
                    <input
                      defaultValue={defaultL}
                      type="range"
                      min={0.1}
                      step={0.1}
                      max={3}
                      {...register("l", {required: true})}
                    />
                    <div className="flex flex-row justify-between text-white mb-8">
                      <span className="opacity-50 w-8">0.1</span>
                      <span className="font-bold">{watch('l') || defaultL}</span>
                      <span className="opacity-50  w-8 text-right">3</span>
                    </div>
                  </div>

                  <input
                    disabled={simulating || !isDirty}
                    type="submit"
                    className={simulating ? '' : 'border-gradient border-gradient-blue-red'}
                    value={simulating ? 'Simulating...' :
                      isDirty ? "Run Simulation" : 'Simulation Done'}
                  />
                </form>
              </div>
            </div>
          </div>
          <div className="simulation-body-bottom" />
        </div>
      </div>
    </div>
  )
}

export default App
