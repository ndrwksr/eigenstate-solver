//
// Created by Andrew Kaiser on 4/3/21.
//

#include <emscripten/bind.h>
#include <Eigen/Dense>
#include <vector>

#include "DenseMatrix.h"
#include "SparseMatrix.h"
#include "Solver.h"

using namespace std;
using namespace emscripten;

using DDM = DenseMatrix<double>;
using CDM = DenseMatrix<complex<double>>;
using SDM = SparseMatrix<double>;

EMSCRIPTEN_BINDINGS(Module)
{
    // Double vector
    emscripten::register_vector<double>("Vector");
    emscripten::register_vector<vector<double>>("Vector2d");

    // Complex numbers
    class_<complex<double>>("Complex")
            .constructor<double, double>()
            .function("real", select_overload<double(const complex<double> &)>(&real))
            .function("imag", select_overload<double(const complex<double> &)>(&imag));

    // Dense Matrix
    class_<DDM>("Matrix") // TODO: rename
            .constructor<int, int>()
            .constructor<const DDM &>()
            .class_function("identity", &DDM::identity)
            .class_function("ones", &DDM::ones)
            .class_function("constant", &DDM::constant)
            .class_function("random", &DDM::random)
            .class_function("diagonal", &DDM::diagonal)
            .class_function("fromVector", &DDM::fromVector)
            .function("transpose", &DDM::transpose)
            .function("transposeSelf", &DDM::transposeSelf)
            .function("inverse", &DDM::inverse)
            .function("rows", &DDM::rows)
            .function("cols", &DDM::cols)
            .function("norm", &DDM::norm)
            .function("normSqr", &DDM::normSqr)
            .function("l1Norm", &DDM::l1Norm)
            .function("lInfNorm", &DDM::lInfNorm)
            .function("rank", &DDM::rank)
            .function("det", &DDM::det)
            .function("sum", &DDM::sum)
            .function("block", &DDM::block)
            .function("setBlock", &DDM::setBlock)
            .function("mul", &DDM::mul)
            .function("mulSelf", &DDM::mulSelf)
            .function("div", &DDM::div)
            .function("divSelf", &DDM::divSelf)
            .function("matAdd", &DDM::matAdd, allow_raw_pointers())
            .function("matAddSelf", &DDM::matAddSelf, allow_raw_pointers())
            .function("matSub", &DDM::matSub, allow_raw_pointers())
            .function("matSubSelf", &DDM::matSubSelf, allow_raw_pointers())
            .function("matMul", &DDM::matMul, allow_raw_pointers())
            .function("matMulSelf", &DDM::matMulSelf, allow_raw_pointers())
            .function("get", &DDM::get)
            .function("set", &DDM::set)
            .function("hcat", &DDM::hcat, allow_raw_pointers())
            .function("vcat", &DDM::vcat, allow_raw_pointers())
            .function("print", &DDM::print)
            .function("clamp", &DDM::clamp)
            .function("clampSelf", &DDM::clampSelf)
            // Vector ops
            .function("length", &DDM::length)
            .function("vGet", &DDM::vGet)
            .function("vSet", &DDM::vSet)
            .function("dot", &DDM::dot);

    // Complex Dense Matrix
    class_<CDM>("ComplexDenseMatrix")
            .constructor<int, int>()
            .constructor<const CDM &>()
            .class_function("identity", &CDM::identity)
            .class_function("ones", &CDM::ones)
            .class_function("constant", &CDM::constant)
            .class_function("random", &CDM::random)
            .function("transpose", &CDM::transpose)
            .function("inverse", &CDM::inverse)
            .function("conjugate", &CDM::conjugate)
            .function("rows", &CDM::rows)
            .function("cols", &CDM::cols)
            .function("norm", &CDM::norm)
            .function("rank", &CDM::rank)
            .function("sum", &CDM::sum)
            .function("block", select_overload<CDM(int, int, int, int) const>(&CDM::block))
            .function("mul", &CDM::mul)
            .function("div", &CDM::div)
            .function("matAdd", &CDM::matAdd, allow_raw_pointers())
            .function("matSub", &CDM::matSub, allow_raw_pointers())
            .function("matMul", &CDM::matMul, allow_raw_pointers())
            .function("get", &CDM::get)
            .function("set", &CDM::set)
            .function("hcat", &CDM::hcat, allow_raw_pointers())
            .function("vcat", &CDM::vcat, allow_raw_pointers())
            .function("print", &CDM::print);

    // Triplet
    class_<TripletVector<double>>("TripletVector")
            .constructor<int>()
            .function("add", &TripletVector<double>::add)
            .function("addDiag", &TripletVector<double>::addDiag)
            .function("addBlock", &TripletVector<double>::addBlock);

    class_<SDM>("SparseMatrix")
            .constructor<int, int>()
            .constructor<int, int, TripletVector<double> *>()
            .constructor<DDM>()
//            .constructor<SDM>()
            .class_function("identity", &SDM::identity)
            .class_function("diag", &SDM::diag)
            .function("transpose", &SDM::transpose)
            .function("rows", &SDM::rows)
            .function("cols", &SDM::cols)
            .function("nonZeros", &SDM::nonZeros)
            .function("frobeniusNorm", &SDM::frobeniusNorm)
            .function("block", &SDM::block)
            .function("toDense", &SDM::toDense)
            .function("mul", &SDM::mul)
            .function("mulSelf", &SDM::mulSelf)
            .function("div", &SDM::div)
            .function("divSelf", &SDM::divSelf)
            .function("matAdd", &SDM::matAdd, allow_raw_pointers())
            .function("matAddSelf", &SDM::matAddSelf, allow_raw_pointers())
            .function("matSub", &SDM::matSub, allow_raw_pointers())
            .function("matSubSelf", &SDM::matSubSelf, allow_raw_pointers())
            .function("matMul", &SDM::matMul, allow_raw_pointers())
            .function("get", &SDM::get)
            .function("set", &SDM::set)
            .function("print", &SDM::print);

    class_<Solver>("Solver")
            .class_function("sparseEigenSolve", &Solver::sparseEigenSolve);
}