/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("@kie-tools-core/webpack-base/webpack.common.config");
const patternflyBase = require("@kie-tools-core/patternfly-base");
const buildEnv = require("@kie-tools/build-env");

module.exports = (env) =>
  merge(common(env), {
    mode: "development",
    entry: {
      index: path.resolve(__dirname, "./index.tsx"),
      "serverless-workflow-mermaid-viewer-envelope": path.resolve(
        __dirname,
        "./envelope/ServerlessWorkflowMermaidViewerEnvelopeApp.ts"
      ),
    },
    output: {
      path: path.resolve("../dist-dev"),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.resolve(__dirname, "./static/index.html"), to: "./index.html" },
          { from: path.resolve(__dirname, "./static/favicon.ico"), to: "./favicon.ico" },
          {
            from: path.resolve(__dirname, "./static/envelope/serverless-workflow-mermaid-viewer-envelope.html"),
            to: "./serverless-workflow-mermaid-viewer-envelope.html",
          },
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
        ...patternflyBase.webpackModuleRules,
      ],
    },
    ignoreWarnings: [/Failed to parse source map/],
    devServer: {
      historyApiFallback: true,
      static: [{ directory: path.join(__dirname) }],
      compress: true,
      port: buildEnv.serverlessWorkflowMermaidViewer.dev.port,
    },
  });
