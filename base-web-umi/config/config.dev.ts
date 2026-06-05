// https://umijs.org/config/
import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    APP_CONFIG_LIBRARY_API: 'http://127.0.0.1:8000/api/v1',
  },
  plugins: [
    // https://github.com/zthxxx/react-dev-inspector
    'react-dev-inspector/plugins/umi/react-inspector',
  ],
  // https://github.com/zthxxx/react-dev-inspector#inspector-loader-props
  inspectorConfig: {
    exclude: [],
    babelPlugins: [],
    babelOptions: {},
  },
});
