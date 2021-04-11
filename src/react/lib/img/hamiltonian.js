self.postMessage({status: 'import'}, self.opener);
importScripts('https://unpkg.com/mathjs@9.3.1/lib/browser/math.js');
importScripts('/src/build/GC', '/src/build/eigen_gen', '/src/build/eigen');

// @ts-ignore
self.onmessage = (ev => hamiltonian(ev.data).then(buffers => self.postMessage({
  status: 'done',
  buffers
}, self.opener, buffers)))

const hamiltonian = async ({n, l}) => {
  const hBar = 1, mE = 1, potential = 400;

  // Custom array helpers. Many of these could be moved to C++ or mathjs, but none
  // are performance bottlenecks.
  const nArr = (n) => Array.from(Array(n).keys());

  // Make an X and Y linear space from the specified start and end values with n steps
  // Ex. {start: -1, end: 1, n: 5} =>
  // {
  //   X: [[   -1, -0.5,    0,  0.5,    1],
  //                    ...
  //       [   -1, -0.5,    0,  0.5,    1]],
  //   Y: [[   -1,   -1,   -1,   -1,   -1],
  //                    ...
  //       [    1,    1,    1,    1,    1]]
  // }
  const spaces = (args) => {
    const {start = -1, end = 1, n = 51} = args;
    const nA = nArr(n), spec = nA.map(i => (i * ((end - start) / (n - 1))) + start);

    const X = nA.map(() => spec);
    const Y_c = nA.map(i => (i * ((end - start) / (n - 1))) + start);
    const Y = nA.map(i => Array.from(Array(n).keys()).map(() => Y_c[i]));

    // @ts-ignore
    return {X, Y};
  };

  // Make an n by n matrix with values determined by func(x, y)
  const mat2Mk = (n, func) => nArr(n).map(y => nArr(n).map(x => func(x, y)));

  // Sum two 2d matrices
  const mat2Sum2 = (matA, matB) => mat2Trans2(matA, matB, (a, b) => a + b);

  // Scalar multiplication of a 2d matrix
  const mat2Scale = (mat, scalar) => mat2Trans1(mat, val => val * scalar);

  // Transform one 2d matrix into another with each cell being mapped by func
  const mat2Trans1 = (mat, func) => mat.map(matR => matR.map(func));

  // Transform two 2d matrices into another with each cell being computed by func,
  // whose first two arguments are the values of the cells in matA and matB, and whose
  // second two arguments are the indices in the output matrix of the current cell
  const mat2Trans2 = (matA, matB, func) =>
    matA.map((matAR, y) => matAR.map((matAC, x) => func(matAC, matB[y][x], x, y)));

  let X, Y, dx;
  try {
    self.postMessage({status: 'setup'}, self.opener);
    await eig.ready;

    const space = spaces({start: -l / 2, end: l / 2, n});
    X = space.X;
    Y = space.Y;
    dx = X[0][1] - X[0][0];
  } catch (e) {
    console.error('Error setting up', e);
    self.postMessage({status: 'setup', error: e.message}, self.opener);
    return;
  }

  let uDiag;
  try {
    self.postMessage({status: 'potential'}, self.opener);
    // Construct potential energy matrix
    const normX = mat2Trans1(X, v => Math.pow(v / l, 2)),
      normY = mat2Trans1(Y, v => Math.pow(v / l, 2));
    const sum = mat2Sum2(normX, normY);
    const V = mat2Scale(sum, mE * potential / 2);
    uDiag = self.math.diag(self.math.reshape(mat2Mk(n, (x, y) => V[x][y]), [n * n]));
  } catch (e) {
    console.error('Error computing potential energy matrix', e);
    self.postMessage({status: 'potential', error: e.message}, self.opener);
    return;
  }

  let t2d;
  try {
    self.postMessage({status: 'kinetic'}, self.opener);
    // Construct kinetic energy matrix
    const t = Math.pow(hBar, 2) / (2 * mE * Math.pow(dx, 2));
    const t1d = mat2Mk(n, (x, y) => x === y ? 2 * t : Math.abs(x - y) === 1 ? -t : 0);
    t2d = mat2Sum2(
      self.math.kron(t1d, mat2Mk(n, (x, y) => x === y ? 1 : 0)),
      self.math.kron(mat2Mk(n, (x, y) => x === y ? 1 : 0), t1d)
    );
  } catch (e) {
    console.error('Error computing kinetic energy matrix', e);
    self.postMessage({status: 'kinetic', error: e.message}, self.opener);
    return;
  }

  let H_sparse;
  try {
    self.postMessage({status: 'hamiltonian'}, self.opener);
    const t2d_eig = new eig.Matrix(t2d);
    const uDiag_eig = new eig.Matrix(uDiag);
    H_sparse = new eig.SparseMatrix(t2d_eig.matAdd(uDiag_eig));
  } catch (e) {
    console.error('Error computing hamiltonian matrix', e);
    self.postMessage({status: 'hamiltonian', error: e.message}, self.opener);
    return;
  }

  let eigenvectors
  try {
    self.postMessage({status: 'eigenstates'}, self.opener);
    eigenvectors = eig.Solver.sparseEigenSolve(H_sparse, n);
  } catch (e) {
    console.error('Error computing eigenstates', e);
    self.postMessage({status: 'eigenstates', error: e.message}, self.opener);
    return;
  }

  let buffers;
  try {
    self.postMessage({status: 'buffers'}, self.opener);
    const eig_t = eigenvectors.transpose()
    const state_eigs = nArr(n).map(i => eig_t.block(i, 0, 1, n * n));

    // Cross boundary from Eigen to direct 2d array for ease of processing into an image buffer
    const states = state_eigs.map(state_eig => // For every eigenvector,
      nArr(n).reverse() // For every "row" in the eigenvector,
        .map(y => state_eig.block(0, y * n, 1, n)) // Get the "row" (it's a 2d matrix in 1d form)
        .map(rowPtr => nArr(n).map(x => rowPtr.get(0, x)) // Get the cell for that "row"
          .map(cell => {
            // const mag = Math.hypot(cell.real(), cell.imag());

            // return [cell.real(), cell.imag()];
            return -cell.real();
          }) // Get the magnitude
        )
    ).map(state => self.math.transpose(state)).reverse();

    let max = 0, min = 0;
    states.forEach(state => state.forEach(row => row.forEach(cell => {
      max = Math.max(max, cell);
      min = Math.min(min, cell);
    })));
    const dynamicRange = max - min;

    buffers = states.map(state => {
      const buffer = new Uint8ClampedArray(n * n * 4);

      // Convert to image
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const stateXY = state[x][y], memOffset = (y * n + x) * 4;

          // Negatives just get clipped, can safely put out of bounds values in here
          buffer[memOffset] = stateXY < 0 ? 255 : 0
          buffer[memOffset + 2] = stateXY > 0 ? 255 : 0
          buffer[memOffset + 3] = Math.abs(stateXY) * (255 / (dynamicRange / 2));    // A
        }
      }

      return buffer;
    });

    GarbageCollector.flush();
  } catch (e) {
    console.error('Error computing buffers', e);
    self.postMessage({status: 'buffers', error: e.message}, self.opener);
    return;
  }

  return buffers;
};