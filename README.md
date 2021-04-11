# Single Confined Particle Eigenstate Solver

## Acknowledgements & Story of Development
###### "...it is by standing on the shoulders of giants."<br />-Isaac Newton

The `hamiltonian` method, which comprises a majority of the functionality of this application, was created using 
[an example in Python](https://github.com/marl0ny/SPS-QM-2D/blob/main/self_contained_example.py)
written by [marl0ny](https://github.com/marl0ny) as a reference. Their solution was indispensable in verifying
functional correctness of my solution. Their list of references was also very valuable for building understanding of how
to compute the eigenstates of a discrete Hamiltonian.

The original implementation of the `hamiltonian` method used only [mathjs](https://mathjs.org/), but this proved to be
far too computationally inefficient to be useful, with simulations of width 15 taking upwards of five minutes.
This inefficiency led to the utilization of [eigen-js](https://github.com/BertrandBev/eigen-js), a JS library which 
exposes JS bindings for [Eigen](https://eigen.tuxfamily.org/index.php?title=Main_Page). This brought a major performance
improvement and got the simulation time down to around thirty seconds for a width of 25. This, however, was still not up
to standards.

A final, much more involved optimization step was taken to accelerate the simulation even further. Using eigen-js as a
reference, a custom build of an eigen-js-like custom library was created that includes [Specta](https://spectralib.org/)
for efficient computation of eigenvectors for large symmetric sparse matrices. This custom library is exposed to JS with
a set of bindings built with [emscripten](https://emscripten.org/), the build artifacts of which are trivially 
hand-edited to be made usable from web workers. Much of the hard work in building this custom eigensolver was in getting
this build process correct, for which eigen-js served as an ideal example. Many of the files used to build this custom
library were copied directly from eigen-js, or were written using files from eigen-js as templates.

## Build Process
The build process for this project is unfortunately somewhat manual and imperative. emscripten does not build modules
that can be used from web workers, so that final conversion must be performed manually.
Pull requests welcome!

Thankfully, these steps are necessary **only** for rebuilding the custom eigensolver library. If that part of the project is
not being changed, these steps can be skipped. The build artifacts are checked in to this repo, so they do not need to
be rebuilt to run this project locally.

#### Prerequisites
You must have `emcc` from emscripten installed and available in the project directory for the build script step.
The installation instructions for emscripten can be found [here](https://emscripten.org/docs/getting_started/Tutorial.html).
You can verify that `emcc` is available in the working directory with:
```bash
emcc -v
```

#### Clone dependencies
First, clone Eigen and Spectra into the `src/lib` folder.
```bash
cd src/lib
git clone https://github.com/yixuan/spectra
git clone https://gitlab.com/libeigen/eigen
```

#### Run build script
Then, run the build script. This will invoke emscripten 
```bash
yarn clib
```
```bash
npm run clib
```

#### Tweak `eigen_gen.js`
The line specifying where `eigen_gen.wasm` in the file `src/build/eigen_gen.js` is must be changed to:
```js
var wasmBinaryFile = './eigen_gen.wasm';
```

Further, `Module` is exported at the end of `eigen_gen`. Remove this block at the bottom of the file.

#### Move `eigen_gen.wasm`
Move `src/build/eigen_gen.wasm` to `src/react/lib/img/eigen_gen.wasm`.
This is done to make it easy to import from a web worker.

#### Strip exports from `GC.mjs` and `eigen.mjs`
We're using these build artifacts in a web worker, so their exports must all be removed.
This will become unnecessary when module workers are widely supported, but that won't be for a while.
A simple find-and-replace with the search value being `export ` and the replace value being empty will handle this step.
