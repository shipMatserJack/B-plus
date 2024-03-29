/**
 * 专门打包util ， 指令 ， hook的
 */

import { series, parallel, src, dest } from "gulp";
import { buildConfig } from "./utils/config";
import { outDir, projectRoot } from "./utils/paths";
import path from "path";
import ts from "gulp-typescript";
import { withTaskName } from "./utils";

export const buildPackages = (dirname: string, name: string) => {
  // 打包的格式需要是什么类型的？ 模块规范 cjs  es模块规范
  // umd 是在浏览器中用的
  // 可以用rollup， 这个逻辑只是让ts-> js即可
  const tasks = Object.entries(buildConfig).map(([module, config]) => {
    const output = path.resolve(outDir, config.output.name, name);
    return series(
      withTaskName(`buld:${dirname}`, () => {
        const tsConfig = path.resolve(projectRoot, "tsconfig.json"); // ts的配置文件的路径
        const inputs = ["**/*.ts", "!gulpfile.ts", "!node_modules"];
        return src(inputs)
          .pipe(
            ts.createProject(tsConfig, {
              declaration: true, // 需要生成声明文件
              strict: false,
              module: config.module,
            })()
          )
          .pipe(dest(output));
      })
    );
  });

  // console.log('tasks---', tasks);
  return parallel(...tasks);
  // 最终发布的是dist  最终在项目中引入的都是es6模块。  按需加载
};
