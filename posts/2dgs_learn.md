---
title: 2dgs实验调试
date: 2025-11-13
excerpt: SIGGRAPH 2024 Conference Papers论文，2D Gaussian Splatting（2DGS）通过将3D高斯"扁平化"为带有固有法线的2D定向椭圆盘，并结合透视正确的光线-溅射相交算法和几何正则化损失（深度失真+法线一致性），在保持3DGS实时渲染速度（~10分钟训练）的同时，实现了显著优于3DGS和接近隐式方法（如NeuS）的几何重建精度（DTU Chamfer距离0.80 vs 3DGS的1.96），解决了体积3D高斯无法准确表示薄表面几何的核心问题。
tags: ['实验', '2DGS', 'SIGGRAPH']
readTime: 30分钟
---

# 原始train.py与train_maskloss.py结果差异分析

虽然两者使用相同的RGBA数据，但结果差异显著的原因在于它们处理mask(alpha通道)的方式根本不同：

## 1. 正则化约束的差异

**train_maskloss.py的优势**：

python





```
# 改进法线一致性约束，避免黑色区域问题
if gt_alpha is not None and lambda_normal > 0:
    # 只在mask区域计算法线约束
    masked_normal_error = normal_error * gt_alpha
    normal_loss = lambda_normal * (masked_normal_error).mean()
else:
    normal_loss = lambda_normal * (normal_error).mean()
```

这段代码是关键 - 它**仅在mask区域应用法线一致性约束**，而原始train.py会在整个图像上应用约束，包括背景区域。

## 2. 损失函数的差异

**train_maskloss.py**:

- 分别计算RGB和alpha损失
- 将背景区域明确设置为背景色: `gt_image = torch.where(gt_alpha == 0, background_expanded, gt_image)`
- 在损失计算中更加关注mask区域的重建质量

**原始train.py**:

- 将RGBA作为整体处理
- 没有特别强调mask区域
- 背景可能被错误地解释为需要重建的几何体

## 3. 背景处理的差异

即使输入相同的RGBA图像，两种算法对透明区域的处理不同：

- **train_maskloss.py** 将alpha=0的区域明确视为"不需要重建"的区域
- **原始train.py** 可能将这些区域视为"需要解释"的区域，尝试用高斯点来拟合

## 4. floaters和杂点的形成

**原始train.py中floaters的原因**：

- 优化算法尝试解释图像中的所有像素，包括背景中的噪声
- 没有明确的机制来抑制背景区域的高斯点
- 法线一致性约束在整个空间应用，导致背景中出现小团块

**train_maskloss.py中结果干净的原因**：

- 背景区域在损失计算中被有效忽略
- 法线一致性约束仅在mask区域应用
- alpha损失额外强化了对前景-背景边界的学习