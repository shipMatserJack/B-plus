import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import vue from "rollup-plugin-vue";
import typescript from "rollup-plugin-typescript2";
import { parallel } from "gulp";
import path from "path";
import { outDir, projectRoot, bpRoot } from "./utils/paths";
import { rollup ,OutputOptions} from "rollup";
import fs from 'fs/promises'
import { buildConfig } from "./utils/config";
import { pathRewriter } from "./utils";

/**
 * 打包完整组件
 * @returns 
 */
const buildFull = async () => {
  // rollup打包的配置信息
  const config = {
    input: path.resolve(bpRoot, "index.ts"), // 打包的入口
    plugins: [nodeResolve(), typescript(), vue(), commonjs()],
    external: (id) => /^vue/.test(id), // 表示打包的时候不打包vue代码
  };
  // 整个组件库 两种使用方式 import 导入组件库 在浏览器中使用 script
  // esm umd
  const buildConfig = [
    {
      format: "umd", // 打包的个数
      file: path.resolve(outDir, "index.js"),
      name: "BPlus", // 全局的名字
      exports: "named", // 导出的名字 用命名的方式导出  liraryTarget:"var" name:""
      globals: {
        // 表示使用的vue是全局的
        vue: "Vue",
      },
    },
    {
        format:'esm',
        file: path.resolve(outDir, "index.esm.js")
    }
  ];
  let bundle = await rollup(config);

  return Promise.all(buildConfig.map(config=>bundle.write(config as OutputOptions)))
};

/**
 * 打包组件库入口 bi-plus
 * @returns 
 */
async function buildEntry() {
  const entryFiles = await fs.readdir(bpRoot, { withFileTypes: true });
  const entryPoints = entryFiles
    .filter((f) => f.isFile())
    .filter((f) => !["package.json"].includes(f.name))
    .map((f) => path.resolve(bpRoot, f.name));

  const config = {
    input: entryPoints,
    plugins: [nodeResolve(), vue(), typescript()],
    external: (id: string) => /^vue/.test(id) || /^@bi-plus/.test(id),
  };
  const bundle = await rollup(config);
  return Promise.all(
    Object.values(buildConfig)
      .map((config) => ({
        format: config.format,
        dir: config.output.path,
        paths: pathRewriter(config.output.name),
      }))
      .map((option) => bundle.write(option as OutputOptions))
  );
}

export const buildFullComponent = parallel(buildFull, buildEntry);

// gulp适合流程控制 和 代码的转义 没有打包的功能
