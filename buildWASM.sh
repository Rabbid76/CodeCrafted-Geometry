#!/bin/sh

function contains {
    return $([[ $1 =~ (^|[[:space:]])"$2"($|[[:space:]]) ]] && echo 0 || echo 1)
}

arguments="$@"
debug_build=$(contains "$arguments" "debug" && echo 1 || echo 0)
clean_build=$(contains "$arguments" "clean" && echo 1 || echo 0)
gnu_build=$(contains "$arguments" "gnu" && echo 1 || echo 0)

cmake_program="cmake"
cmake_configuration=""
make_program="make"
make_configuration=""

if (($debug_build != 0)); then
    cmake_configuration="$cmake_configuration -D CMAKE_BUILD_TYPE=Debug -D ADD_DEBUG_INFO=ON" 
    echo "build with DEBUG configuration"
else
    cmake_configuration="$cmake_configuration -DCMAKE_BUILD_TYPE=MinSizeRel" 
    echo "build with RELEASE configuration"
fi
if (($clean_build != 0)); then
    make_configuration="$make_configuration -j8 clean all" 
    echo "clean all, build"
else
    make_configuration="$make_configuration -j8 " 
fi

if (($gnu_build != 0)); then
    gnu_gcc=gcc-12
    gnu_gpp=g++-12
    gnu_make=gmake
    if [ -f $(which $gnu_gcc) ]; then
        echo $(which $gnu_gcc)
        cmake_configuration="$cmake_configuration -D CMAKE_C_COMPILER=$gnu_gcc"
    fi
    if [ -f $(which $gnu_gpp) ]; then
        echo $(which $gnu_gpp)
        cmake_configuration="$cmake_configuration -D CMAKE_CXX_COMPILER=$gnu_gpp"
    fi
    if [ -f $(which $gnu_make) ]; then
        echo $(which $gnu_make)
        make_program=$gnu_make
        cmake_configuration="$cmake_configuration -D CMAKE_MAKE_PROGRAM=$gnu_make"
    fi
fi 

emscripten_tool_chain_file="/Users/$USER/source/emscripten/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake" 
if [ ! -f $emscripten_tool_chain_file ]; then
    emscripten_tool_chain_file="/Users/$USER/Dev/devtools/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake" 
    if [ ! -f $emscripten_tool_chain_file ]; then
        echo "EMSCRIPTEN toolchain not found"
    fi
fi    
WASM_build_directory="./buildWasm"

mkdir -p $WASM_build_directory
$cmake_program \
    install \
    -S ./ \
    -B $WASM_build_directory \
    -G "Unix Makefiles" \
    -D CMAKE_TOOLCHAIN_FILE=$emscripten_tool_chain_file \
    $cmake_configuration

cd $WASM_build_directory
$make_program $make_configuration
cd ..