// vite.config.js
import { defineConfig } from "file:///C:/Users/rusar/Desktop/IMSS%20POS%20New/frontend/node_modules/vite/dist/node/index.js";
import preact from "file:///C:/Users/rusar/Desktop/IMSS%20POS%20New/frontend/node_modules/@preact/preset-vite/dist/esm/index.mjs";
import path from "path";
import { visualizer } from "file:///C:/Users/rusar/Desktop/IMSS%20POS%20New/frontend/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\Users\\rusar\\Desktop\\IMSS POS New\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    preact(),
    visualizer({
      // Optional: Generates a bundle analysis report
      open: true,
      // Automatically opens the report in the browser
      filename: "bundle-analysis.html"
      // Output file name
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
      // Alias '@' points to the 'src' directory
    }
  },
  build: {
    chunkSizeWarningLimit: 1e3,
    // Increase the chunk size warning limit (default is 500 kB)
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies into separate chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          // Add other large dependencies here
          // Example: Split a large library into its own chunk
          someLargeLibrary: ["some-large-library"]
        }
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
    // Pre-bundle these dependencies for faster dev server startup
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxydXNhclxcXFxEZXNrdG9wXFxcXElNU1MgUE9TIE5ld1xcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccnVzYXJcXFxcRGVza3RvcFxcXFxJTVNTIFBPUyBOZXdcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3J1c2FyL0Rlc2t0b3AvSU1TUyUyMFBPUyUyME5ldy9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcHJlYWN0IGZyb20gJ0BwcmVhY3QvcHJlc2V0LXZpdGUnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcic7IC8vIE9wdGlvbmFsOiBGb3IgYnVuZGxlIGFuYWx5c2lzXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHByZWFjdCgpLFxyXG4gICAgdmlzdWFsaXplcih7IC8vIE9wdGlvbmFsOiBHZW5lcmF0ZXMgYSBidW5kbGUgYW5hbHlzaXMgcmVwb3J0XHJcbiAgICAgIG9wZW46IHRydWUsIC8vIEF1dG9tYXRpY2FsbHkgb3BlbnMgdGhlIHJlcG9ydCBpbiB0aGUgYnJvd3NlclxyXG4gICAgICBmaWxlbmFtZTogJ2J1bmRsZS1hbmFseXNpcy5odG1sJywgLy8gT3V0cHV0IGZpbGUgbmFtZVxyXG4gICAgfSksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLCAvLyBBbGlhcyAnQCcgcG9pbnRzIHRvIHRoZSAnc3JjJyBkaXJlY3RvcnlcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyBJbmNyZWFzZSB0aGUgY2h1bmsgc2l6ZSB3YXJuaW5nIGxpbWl0IChkZWZhdWx0IGlzIDUwMCBrQilcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBTcGxpdCB2ZW5kb3IgZGVwZW5kZW5jaWVzIGludG8gc2VwYXJhdGUgY2h1bmtzXHJcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSwgLy8gQWRkIG90aGVyIGxhcmdlIGRlcGVuZGVuY2llcyBoZXJlXHJcbiAgICAgICAgICAvLyBFeGFtcGxlOiBTcGxpdCBhIGxhcmdlIGxpYnJhcnkgaW50byBpdHMgb3duIGNodW5rXHJcbiAgICAgICAgICBzb21lTGFyZ2VMaWJyYXJ5OiBbJ3NvbWUtbGFyZ2UtbGlicmFyeSddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sIC8vIFByZS1idW5kbGUgdGhlc2UgZGVwZW5kZW5jaWVzIGZvciBmYXN0ZXIgZGV2IHNlcnZlciBzdGFydHVwXHJcbiAgfSxcclxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFzVSxTQUFTLG9CQUFvQjtBQUNuVyxPQUFPLFlBQVk7QUFDbkIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsa0JBQWtCO0FBSDNCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQTtBQUFBLE1BQ1QsTUFBTTtBQUFBO0FBQUEsTUFDTixVQUFVO0FBQUE7QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLHVCQUF1QjtBQUFBO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUE7QUFBQSxVQUVqRCxrQkFBa0IsQ0FBQyxvQkFBb0I7QUFBQSxRQUN6QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQTtBQUFBLEVBQ3BEO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
