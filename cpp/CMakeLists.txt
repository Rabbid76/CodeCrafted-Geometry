add_compile_options(
    -Wall
    -Wextra
    -Wsign-conversion
    -Wno-unused-parameter
    -Wno-unused-command-line-argument
    -Werror
    )

if(CMAKE_BUILD_TYPE MATCHES Debug)
    set(DEBUG TRUE)
    add_compile_options(
        -g 
        -O0
        )
endif()

set(EMSCRIPTEN_OPTIONS
    "SHELL:-s DISABLE_EXCEPTION_CATCHING=0"
    "SHELL:-s FILESYSTEM=0"
    "SHELL:-s MODULARIZE=1"
    "-lembind"
    )

if (DEBUG)
    list(APPEND EMSCRIPTEN_OPTIONS
        -g
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s DEMANGLE_SUPPORT=1"
        "SHELL:-s ASSERTIONS=2"
    )
else(DEBUG)
    # Optimizations
    # see <https://emscripten.org/docs/optimizing/Optimizing-Code.html>
    list(APPEND EMSCRIPTEN_OPTIONS
        -Oz                         # Agressively reduce code size at the expense of performance
        -flto                       # link time optimization
        "SHELL:--closure 1"         # Use the closure compiler; reduce the size of the support JavaScript code
    )
endif()

add_compile_definitions(USE_MAKE_SHARED_BYPASS)

add_executable(
    CodeCraftedGeometryWasm
    emscriptenBindings.cpp
    )
target_compile_options(CodeCraftedGeometryWasm PRIVATE
    ${EMSCRIPTEN_OPTIONS}
    "SHELL:-s WASM=1"
    )
target_link_options(CodeCraftedGeometryWasm PRIVATE 
    ${EMSCRIPTEN_OPTIONS}
    "SHELL:-s WASM=1" 
    "SHELL:-s EXPORT_NAME=\"'CodeCraftedGeometry'\""
    "SHELL:-s ENVIRONMENT=web"
    #"-lnodefs.js"
    )

set(EMSCRIPTEN_ASMJS_OPTIONS
    ${EMSCRIPTEN_OPTIONS}
    "SHELL:-s WASM=0"
    "SHELL:--memory-init-file 1"
    )
add_executable(
    CodeCraftedGeometryJs
    emscriptenBindings.cpp
    )
target_compile_options(CodeCraftedGeometryJs PRIVATE ${EMSCRIPTEN_ASMJS_OPTIONS})
target_link_options(CodeCraftedGeometryJs PRIVATE ${EMSCRIPTEN_ASMJS_OPTIONS} "SHELL:-s EXPORT_NAME=\"'CodeCraftedGeometry'\"")