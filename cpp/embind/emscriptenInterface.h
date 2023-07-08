//#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <array>
#include <cmath>
#include <iostream>
#include <numbers>
#include <numeric>
#include <sstream>
#include <string>

emscripten::val globalIOContext = emscripten::val::null();

namespace
{
   void log(const std::string &message)
   {
      if (!globalIOContext.isNull() && globalIOContext.hasOwnProperty("log"))
      {
         globalIOContext.call<void>("log", "LOG: " + message);
      }
      else
      {
         std::cout << "stream-log: " << message << std::endl;
      }
   }

   std::string getVersion()
   {
      return "0.0.1";
   }

   void setIOContext(emscripten::val ioContext)
   {
      globalIOContext = ioContext;
   }

   std::array<float, 3> pointOnSphere(float theta, float phi) {
      float sinTheta = std::sin(theta);
      float cosTheta = std::cos(theta);
      float sinPhi = std::sin(phi);
      float cosPhi = std::cos(phi);
      return { cosTheta * sinPhi, cosTheta * cosPhi, sinTheta };
   }

   std::array<float, 3> sub(const std::array<float, 3> &a, const std::array<float, 3> &b) {
      return { b[0]-a[0], b[1]-a[1], b[2]-a[2] };
   }

   std::array<float, 3> cross(const std::array<float, 3> &a, const std::array<float, 3> &b) {
      return { a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] };
   }

   std::array<float, 3> normalize(const std::array<float, 3> &v) {
      const auto l = std::sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); 
      return { v[0] / l, v[1] / l, v[2] / l };
   }

   void createMesh(std::string id, float size)
   {
      log((std::stringstream() << "LOG: " << "createMesh" << " " << id << " " << size).str());

      std::vector<float> vertices;
      std::vector<float> normals;
      std::vector<float> uvs;
      std::vector<uint32_t> indices;

      const float pi = std::numbers::pi_v<float>;
      const float l = size / 2.0f;
      auto pointOnMesh = [&](float u, float v) -> std::array<float, 3> {
         auto phi = u * pi * 2.0f;
         auto theta = (1.0f - 2.0f * v) * pi / 2.0f;
         auto p = pointOnSphere(theta, phi);
         const auto d = l * (0.9f + 0.1f * std::cos((2.0f * v - 1.0f) * pi * 10.0f) * std::cos(u * pi * 10.0f));
         return {d * p[0], d * p[1], d * p[2]};
      }; 
      
      const uint32_t nLayer = 128;
      const uint32_t nCircum = 128;
      for (uint32_t li = 0; li <= nLayer; li++ ) {
         const float v = static_cast<float>(li)/static_cast<float>(nLayer);
         for (uint32_t ci = 0; ci <= nCircum; ++ ci) {
            const float u = static_cast<float>(ci)/static_cast<float>(nCircum);
            const auto pd0 = pointOnMesh(u, v);
            const auto pd1 = pointOnMesh(u+0.001f, v);
            const auto pd2 = pointOnMesh(u, v+0.001f);
            const auto nv = li == 0 ? std::array<float, 3>{ 0, 0, 1.0f } : (li == nLayer ? std::array<float, 3>{ 0, 0, -1.0f } : normalize(cross(sub(pd1, pd0), sub(pd2, pd0))));
            vertices.insert(vertices.end(), {pd0[0], pd0[1], pd0[2]});
            normals.insert(normals.end(), {nv[0], nv[1], nv[2]});
            uvs.insert(uvs.end(), {u, 1.0f - v});
         }
      }
      auto cs = nCircum + 1;
      for (uint32_t ci = 0; ci < nCircum; ++ ci)
         indices.insert(indices.end(), {ci, cs + ci + 1, cs + ci});
      for (uint32_t li = 1; li < nLayer-1; li++ ) {
         auto csi = li * cs;
         for (uint32_t ci = 0; ci < nCircum; ++ ci)
            indices.insert(indices.end(), {csi + ci, csi + cs + ci + 1, csi + cs + ci, csi + ci, csi + ci + 1, csi + cs + ci + 1 });
      }
      auto csi = (nLayer-1) * cs;
      for (uint32_t ci = 0; ci < nCircum; ++ ci)
         indices.insert(indices.end(), {csi + ci, csi + ci + 1, csi + cs + ci});

      if (!globalIOContext.isNull() && globalIOContext.hasOwnProperty("newMesh"))
      {
         globalIOContext.call<void>(
            "newMesh",
            id,
            emscripten::val(emscripten::typed_memory_view(vertices.size(), vertices.data())),
            emscripten::val(emscripten::typed_memory_view(indices.size(), indices.data())),
            emscripten::val(emscripten::typed_memory_view(normals.size(), normals.data())),
            emscripten::val(emscripten::typed_memory_view(uvs.size(), uvs.data()))
         );
      }
   }
}