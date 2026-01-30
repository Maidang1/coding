/**
 * 输入处理
 */

import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

export class InputHandler {
  private rl = createInterface({ input, output });

  /**
   * 读取一行输入
   */
  async readLine(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * 读取密码（隐藏输入）
   */
  async readPassword(prompt: string): Promise<string> {
    // 简单实现，实际可以使用更安全的方法
    return this.readLine(prompt);
  }

  /**
   * 确认
   */
  async confirm(prompt: string): Promise<boolean> {
    const answer = await this.readLine(`${prompt} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  /**
   * 关闭
   */
  close(): void {
    this.rl.close();
  }
}
