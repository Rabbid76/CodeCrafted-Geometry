cmake_minimum_required(VERSION 3.12)
set(CMAKE_CXX_STANDARD 20)

project(CodeCraftedGeometryTestSuite)

add_compile_options(
    -Wno-error
    -Wno-sign-conversion
    )

include_directories (
    "./"
    "../"
    "../../submodules/Catch2/extras"
    )

set(
    Catch2SourceFiles
    ../../submodules/Catch2/extras/catch_amalgamated.cpp
    )

set(
    CodeCraftedGeometrySourceFiles
    )

file(GLOB CodeCraftedGeometryTestFiles
    "*/*.cpp"
    "*/*.h"
    "./*.cpp"
    "./*.h"
    )

add_compile_options(
    -Wno-unused-but-set-variable
    )

add_executable(
    CodeCraftedGeometryTest
    ${Catch2SourceFiles}
    ${CodeCraftedGeometrySourceFiles}
    ${CodeCraftedGeometryTestFiles}
    )

enable_testing()

add_test(NAME CodeCraftedGeometryTest COMMAND MeshUtilityTest "MeshUtilityTest")