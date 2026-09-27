# Transformer 30 秒讲解视频

成品：`transformer_30s.mp4`（1920×1080，30fps，30 秒，无音轨）

| 时间 | 内容 |
|---|---|
| 0–3.4s | 标题：让每个词，都能看见所有词 |
| 3.4–7.2s | RNN 串行逐字读 vs Transformer 并行全连接 |
| 7.2–10.6s | 第一步：词 → 向量 + 位置编码 |
| 10.6–18.4s | 第二步：自注意力（「它」→「小猫」62%）+ 公式 |
| 18.4–22s | 多头注意力：指代 / 相邻 / 因果 / 动宾 |
| 22–25.2s | 第三步：注意力 + 前馈网络 × N 层 |
| 25.2–28s | 第四步：预测下一个词（饱了 71%） |
| 28–30s | 总结 |

## 重新渲染

动画全部在 `index.html` 的 canvas 中按时间 `render(t)` 逐帧绘制（浏览器直接打开可循环预览）。

```bash
NODE_PATH=$(npm root -g) FFMPEG=ffmpeg node render.js          # 输出 transformer_30s.mp4
NODE_PATH=$(npm root -g) node render.js --stills 5,14,27     # 只导出几张截图
```

依赖：Playwright（Chromium）、ffmpeg，首次加载需联网获取 Google Fonts。
