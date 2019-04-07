import * as fs from 'fs-extra';
import * as path from 'path';
import * as yamljs from 'yamljs';
import { spawn } from 'child_process';
import { window } from 'vscode';
import { configs } from '../configs';
import { IHexoMetadata } from '../hexoMetadata';

function getPkg() {
  const rootPath = configs.hexoRoot;
  if (!rootPath) {
    return null;
  }

  const pkgPath = path.join(rootPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return null;
  }

  const pkg = fs.readFileSync(pkgPath, { encoding: 'utf-8' });

  return JSON.parse(pkg);
}

function isHexoProject(): boolean {
  const pkg = getPkg();
  return !!(pkg && pkg.dependencies && pkg.dependencies.hexo);
}

function exec(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: configs.hexoRoot,
      shell: true,
    });

    proc.on('exit', () => {
      resolve();
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * true if yse
 * @param placeHolder msg
 */
async function askForNext(placeHolder: string): Promise<boolean> {
  const replace = await window.showQuickPick(['yes', 'no'], {
    placeHolder,
  });

  return replace === 'yes';
}

async function getMDFileMetadata(path: string) {
  const content = await fs.readFile(path, { encoding: 'utf-8' });
  // /---(data)---/ => $1 === data
  const yamlReg = /^---((.|\n|\r)+?)---$/m;

  const yamlData = yamlReg.exec(content);

  return yamljs.parse(yamlData![1]) as IHexoMetadata;
}

export { isHexoProject, askForNext, exec, getMDFileMetadata };
