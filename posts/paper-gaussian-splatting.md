---
title: 3D Gaussian Splatting 论文阅读笔记
date: 2025-11-09
excerpt: 深入解析 3D Gaussian Splatting 算法原理，包括数学推导、代码实现和优化思路。
tags: ['论文', '3DGS', '计算机视觉']
readTime: 15分钟
---

# 3D Gaussian Splatting 论文阅读笔记

> **论文标题**: 3D Gaussian Splatting for Real-Time Radiance Field Rendering  
> **作者**: Bernhard Kerbl et al.  
> **发表**: SIGGRAPH 2023

## 摘要

本文提出了一种基于 3D 高斯的新型辐射场表示方法，能够实现实时的高质量新视角合成。与 NeRF 相比，3DGS 通过显式的 3D 高斯表示和可微分的光栅化，实现了更快的训练和渲染速度。

## 核心思想

### 1. 3D 高斯表示

使用 3D 高斯函数来表示场景中的每个点：

```math
G(x) = e^{-\frac{1}{2}(x-\mu)^T \Sigma^{-1} (x-\mu)}
```

其中：
- $\mu$ 是高斯中心位置
- $\Sigma$ 是协方差矩阵，控制高斯的形状和方向

**协方差矩阵的参数化**：

```math
\Sigma = RSS^TR^T
```

其中 $R$ 是旋转矩阵（用四元数表示），$S$ 是缩放矩阵。

### 2. 可微分光栅化

对于每个像素，颜色通过 alpha blending 计算：

```math
C = \sum_{i=1}^N c_i \alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)
```

## 算法实现

### 初始化

使用 SfM 点云初始化高斯：

```python
def initialize_gaussians(point_cloud):
    """从点云初始化3D高斯"""
    positions = point_cloud.points  # [N, 3]
    colors = point_cloud.colors      # [N, 3]
    
    # 初始化协方差矩阵（各向同性）
    scales = estimate_scales(point_cloud)  # [N, 3]
    rotations = np.array([1, 0, 0, 0])     # [N, 4] 四元数
    
    # 初始化不透明度
    opacities = inverse_sigmoid(0.1 * np.ones(N))
    
    return {
        'positions': positions,
        'colors': colors,
        'scales': scales,
        'rotations': rotations,
        'opacities': opacities
    }
```

### 自适应密度控制

算法会根据梯度自适应地添加和删除高斯：

```python
def adaptive_density_control(gaussians, gradients, iteration):
    """自适应密度控制"""
    grad_threshold = 0.0002
    
    # 1. 克隆：梯度大的小高斯
    large_grads = gradients > grad_threshold
    small_gaussians = scales < percent_dense
    clone_mask = large_grads & small_gaussians
    
    # 2. 分裂：梯度大的大高斯
    split_mask = large_grads & ~small_gaussians
    
    # 3. 删除：不透明度低的高斯
    prune_mask = opacities < min_opacity
    
    return clone_mask, split_mask, prune_mask
```

## 实验结果

### 性能对比

| 方法 | FPS | PSNR | 训练时间 |
|------|-----|------|---------|
| NeRF | 0.1 | 31.0 | 24h |
| Instant-NGP | 30 | 30.5 | 5min |
| **3DGS** | **150** | **32.1** | **7min** |

### 可视化结果

实际应用中的渲染效果：

![3D Gaussian Splatting 渲染效果](https://siggraph.org/wp-content/uploads/2023/07/3dgs-teaser.jpg)

## 优化思路

### 1. 内存优化

对于大规模场景，可以采用分块策略：

```python
def hierarchical_rendering(scene, camera):
    """分层渲染"""
    # 使用八叉树组织高斯
    octree = build_octree(scene.gaussians)
    
    # 视锥剔除
    visible_nodes = frustum_culling(octree, camera)
    
    # 层次细节（LOD）
    gaussians_to_render = []
    for node in visible_nodes:
        distance = compute_distance(node, camera)
        lod_level = select_lod(distance)
        gaussians_to_render.extend(node.get_gaussians(lod_level))
    
    return render(gaussians_to_render, camera)
```

### 2. 训练加速

**梯度累积**策略：

```python
def train_with_gradient_accumulation(model, dataloader, steps=4):
    """使用梯度累积训练"""
    optimizer.zero_grad()
    
    for i, batch in enumerate(dataloader):
        loss = compute_loss(model, batch) / steps
        loss.backward()
        
        if (i + 1) % steps == 0:
            optimizer.step()
            optimizer.zero_grad()
```

## 局限性与未来方向

1. **动态场景**: 当前方法主要针对静态场景，如何扩展到动态场景是重要研究方向

2. **材质建模**: 缺乏对复杂材质（如镜面反射）的建模

3. **内存消耗**: 复杂场景需要大量高斯，内存占用较大

## 视频演示

可以嵌入 YouTube 视频展示渲染效果：

```html
<iframe width="100%" height="400" src="https://www.youtube.com/embed/your-video-id" 
        frameborder="0" allowfullscreen></iframe>
```

## 参考文献

1. Kerbl, B., et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering. *SIGGRAPH 2023*.

2. Mildenhall, B., et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields. *ECCV 2020*.

3. Müller, T., et al. (2022). Instant Neural Graphics Primitives. *SIGGRAPH 2022*.

## 总结

3D Gaussian Splatting 是一个优雅且高效的解决方案，通过显式表示和可微分渲染实现了实时的高质量新视角合成。其核心创新在于：

- ✅ 显式的 3D 高斯表示
- ✅ 高效的可微分光栅化
- ✅ 自适应的密度控制
- ✅ 实时渲染性能

对于后续研究，可以考虑：
1. 扩展到动态场景
2. 改进材质建模
3. 优化内存占用

---

*最后更新: 2025年11月9日*
