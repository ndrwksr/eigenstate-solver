//
// Created by Andrew Kaiser on 4/4/21.
//

#ifndef QUANTUM3_SOLVER_H
#define QUANTUM3_SOLVER_H

#endif //QUANTUM3_SOLVER_H

#include <complex>
#include <Eigen/Core>
#include <Eigen/SparseCore>
#include <Spectra/SymEigsSolver.h>
#include <Spectra/MatOp/SparseSymMatProd.h>

#include "DenseMatrix.h"
#include "SparseMatrix.h"

class Solver {

public:
    static DenseMatrix<std::complex<double>> sparseEigenSolve(SparseMatrix<double> &M, int n) {
        Spectra::SparseSymMatProd<double> matrixOperation(M.data);

        // ncv = 2n+1 as recommended by docs
        Spectra::SymEigsSolver<Spectra::SparseSymMatProd<double>> eigenSolver(matrixOperation, n, (2 * n) + 1);

        eigenSolver.init();
        eigenSolver.compute(Spectra::SortRule::SmallestMagn);

        if (eigenSolver.info() != Spectra::CompInfo::Successful)
            throw;

        // Convert Eigen matrix to DenseMatrix, because we have bindings for that
        DenseMatrix<std::complex<double>> denseComplexMatrix(eigenSolver.eigenvectors());
        return denseComplexMatrix;
    }
};
