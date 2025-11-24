# FastGS 论文与代码详细概述

## 1. 研究背景与要解决的问题

### 1.1 背景：3DGS 的优势与瓶颈

- **3D Gaussian Splatting (3DGS)** 已成为 NeRF 之后非常重要的显式表示方案：
  - 高质量新视角合成；
  - 训练和渲染速度远快于 NeRF。
- 典型 3DGS 流程：
  - 用 SfM/ COLMAP 得到稀疏点云初始化高斯；
  - 通过可微分光栅化，在多视角 RGB 监督下优化高斯参数（位置、尺度、旋转、不透明度、SH 颜色）。

但原始 3DGS 仍存在关键瓶颈：

- **训练时间仍然较长**：每个场景通常需要十几到几十分钟，不利于交互式应用。
- 根本原因在于 **自适应密度控制（ADC, densification + pruning）不够高效**：
  - densification 过度：产生大量冗余 Gaussians；
  - pruning 不够精准：要么删不干净，要么删掉了有用的 Gaussians，导致质量下降。

### 1.2 FastGS 要解决的核心问题

论文指出现有加速方法（如 Taming-3DGS、DashGaussian、Speedy-Splat 等）在两个方面仍不理想：

- **没有真正基于“多视角一致性”来衡量每个 Gaussian 的重要性**：
  - 只看单视角或仅基于 Gaussian 自身属性（opacity、scale、梯度等）打分；
  - 或间接使用 Hessian 近似等统计量，而非“真实的多视角重建质量贡献”。
- 结果是：
  - 要么要保留数百万个 Gaussians 才能保证质量（冗余严重）；
  - 要么剪得太狠导致明显的质量退化。

**FastGS 的目标**：

> 在保证与当前 SOTA 相当的渲染质量前提下，将单场景训练时间压缩到 **约 100 秒级别**，并且方法足够简单、通用，易于移植到各种 3DGS 变体与任务上。

---

## 2. 方法总览：FastGS 做了什么？

### 2.1 总体思路

FastGS 并不是重新设计一种新的场景表示，而是一个 **通用的 3DGS 加速框架**，核心思想：

> 对每一个 Gaussian，用**多视图下真实重建误差**来度量它的重要性，从而做：
>
> - 高效的多视图一致 densification（VCD）  
> - 高效的多视图一致 pruning（VCP）  
> - 配合一次渲染中更紧凑的 tile 选择（Compact Box）

三大模块：

1. **Multi-view Consistent Densification (VCD)**  
   - 决定“哪些 Gaussians 应该被复制或细分”，以**修复高误差区域**；
2. **Multi-view Consistent Pruning (VCP)**  
   - 决定“哪些 Gaussians 是冗余或有害的”，应当删除；
3. **Compact Box (CB)**  
   - 在光栅化阶段减少几乎不贡献像素的 Gaussian–tile 对，进一步提速。

其余部分（场景表示、渲染器、损失函数）基本保持与原始 3DGS 一致。

---

## 3. 算法/网络结构图（文字重构）

论文 Figure 3 展示了 FastGS 的整体 pipeline，结合代码可概括为下面的“模块图”。

### 3.1 输入与场景表示

**输入：**

- 多视角有相机参数的图像集合：
  - 真实数据：COLMAP 输出（`sparse` + `images` 等）；
  - 合成数据：Blender 格式（`transforms_train.json` 等）。
- 初始 SfM 点云：用于初始化 Gaussians 位置和颜色。

**内部表示（[scene/gaussian_model.py](cci:7://file:///e:/windsurf/FastGS/scene/gaussian_model.py:0:0-0:0) 中的 [GaussianModel](cci:2://file:///e:/windsurf/FastGS/scene/gaussian_model.py:28:0-539:38)）：**

每个 Gaussian primitive \(G_i\) 的参数：

- `µ_i ∈ R^3`：3D 位置 `self._xyz`
- `s_i ∈ R^3`：尺度（对数空间存储，经过 `torch.exp` 激活）
- `r_i ∈ R^4`：四元数旋转（单位化激活）
- `σ_i ∈ [0,1)`：不透明度（通过 `sigmoid` 激活）
- `c_i ∈ R^{16×3}`：SH 颜色系数，分为 `features_dc` 和 `features_rest`  
  （最高阶由 `sh_degree` 控制）

这些参数通过 `GaussianRasterizer` 在 2D 图像平面上进行可微分 splatting。

### 3.2 渲染与误差评估模块

**渲染模块（`gaussian_renderer/render_fastgs`）：**

- 输入：
  - Camera（[scene/cameras.py::Camera](cci:2://file:///e:/windsurf/FastGS/scene/cameras.py:16:0-56:71)）
  - GaussianModel（位置、尺度、旋转、opacity、SH 等）
  - 背景颜色 `bg_color`
  - `mult`：紧凑盒（CB）控制参数
  - 可选 `metric_map` 与 `get_flag`（用于 FastGS 的统计）
- 过程：
  - 根据 FoV、相机位姿计算投影矩阵；
  - 通过 CUDA 实现的 `GaussianRasterizer`：
    - 生成像素颜色 `rendered_image`；
    - 输出每个 Gaussian 的 `radii`（屏幕空间半径）；
    - 在设置 `get_flag=True` 时，还会输出 `accum_metric_counts`：
      - 表示该 Gaussian 在当前视角内覆盖多少“高误差像素”。

**误差评价（论文 & [utils/fast_utils.py](cci:7://file:///e:/windsurf/FastGS/utils/fast_utils.py:0:0-0:0)）：**

- 对每个视角 `v_j`：
  - 计算像素 L1 误差 \(e_{j,u,v}\)，再做 min–max 归一化；
  - 得到 loss map \(M_j\)，再用阈值 `τ`（代码中 `loss_thresh`）二值化为 mask：
    - `metric_map = (l1_loss_norm > loss_thresh).int()`
- 这些 “高误差像素” mask 用来驱动 VCD 和 VCP 的得分。

### 3.3 Multi-view Consistent Densification (VCD)

**论文公式：**

- 对每个 Gaussian \(G_i\)，在每个采样视角 j：
  - 统计其 2D footprint 内高误差像素个数；
- 在 K 个视角上取平均，得到 densification 重要性分数 \(s_i^+\)：
  \[
  s_i^+ = \frac{1}{K} \sum_{j=1}^K \sum_{p \in \Omega_i} \mathbb{I}(M_j^\text{mask}(p) = 1)
  \]

**代码实现对应：**

- 函数：[utils/fast_utils.py::compute_gaussian_score_fastgs(camlist, gaussians, pipe, bg, args, DENSIFY=True)](cci:1://file:///e:/windsurf/FastGS/utils/fast_utils.py:44:0-104:42)
  - 多次渲染不同相机，构造 `metric_map`；
  - 再次渲染时利用 rasterizer 输出 `accum_metric_counts`；
  - `full_metric_counts`：累积 K 个视角的计数；
  - 若 `DENSIFY=True`，返回 `importance_score = floor(full_metric_counts / K)`。

- 使用位置（[train.py](cci:7://file:///e:/windsurf/FastGS/train.py:0:0-0:0)）：
  - 每隔 `densification_interval` 步，在 `densify_from_iter ~ densify_until_iter` 之间：
    - 随机采样 10 个视角（[sampling_cameras](cci:1://file:///e:/windsurf/FastGS/utils/fast_utils.py:9:0-18:18)）；
    - 计算 `importance_score` 和 `pruning_score`；
    - 调用 [gaussians.densify_and_prune_fastgs(...)](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:467:4-525:32)。

- 具体 densification 方式（[GaussianModel](cci:2://file:///e:/windsurf/FastGS/scene/gaussian_model.py:28:0-539:38)）：
  - [densify_and_prune_fastgs](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:467:4-525:32) 内部：
    - 利用位置梯度统计（`xyz_gradient_accum` 和 `xyz_gradient_accum_abs`）和 scale 判定：
      - `all_clones`：小尺度 + 梯度较大 → 拷贝（clone）；
      - `all_splits`：大尺度 + 梯度较大 → 拆分（split）。
    - 再用多视图一致性 mask 进一步筛选：
      - `metric_mask = (importance_score > 5)`
    - 最终：
      - [densify_and_clone_fastgs(metric_mask, all_clones)](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:454:4-465:136)
      - [densify_and_split_fastgs(metric_mask, all_splits)](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:430:4-452:39)
  - [densify_and_split_fastgs](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:430:4-452:39)：
    - 在局部高斯协方差下采样多个点，进行局部细分；
  - [densify_and_clone_fastgs](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:454:4-465:136)：
    - 简单复制高斯参数。

**直观理解：**

> VCD 只在那些“在多个视角都处于高误差区域”的 Gaussians 上做 densification，避免为少数视角的小瑕疵无谓增加大量高斯。

### 3.4 Multi-view Consistent Pruning (VCP)

**论文公式（简化）：**

- 对每个视角 j 定义 photometric loss：
  \[
  E^{\text{photo}}_j = (1-\lambda)L^j_1 + \lambda (1 - L^j_{\text{SSIM}})
  \]
- 再结合高误差计数，得到 pruning score：
  \[
  s_i^- = \mathcal{N}\Big(\sum_j (\sum_{p\in\Omega_i}\mathbb{I}(M_j^\text{mask}(p)=1)) \cdot E^{\text{photo}}_j\Big)
  \]
  - 表示 Gaussian 对“整体重建质量恶化”的贡献。

**代码实现：**

- [compute_gaussian_score_fastgs](cci:1://file:///e:/windsurf/FastGS/utils/fast_utils.py:44:0-104:42) 中：
  - `photometric_loss` = L1 + SSIM；
  - `full_metric_score += photometric_loss * accum_loss_counts`；
  - 最后归一化为 `pruning_score` ∈ [0,1]。

- 使用地点：

  1. **联合 densification 阶段 ([densify_and_prune_fastgs](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:467:4-525:32))：**
     - 构建 `prune_mask` 为：
       - 低 opacity；
       - 过大尺度/半径；
     - 使用：
       - `scores = 1 - pruning_score`
       - 在 `prune_mask` 内按 `scores` 设预算随机子集删除（“预算机制对我们方法其实不是必须的”）。
  2. **后期 final pruning ([final_prune_fastgs](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:532:4-539:38))：**
     - 在第 15k~30k 迭代，每 3k 做一次只剪枝不加点：
       - `scores_mask = (pruning_score > 0.9)`
       - `final_prune = prune_mask (低不透明度) OR scores_mask`
     - 这一步对应论文中所说“在模型基本收敛后，进行更激进但安全的多视图剪枝”。

**直观理解：**

> VCP 删除的是那些“在多视图中经常处在高误差区域，但又没能有效降低全局 photometric loss 的高斯”，本质上是把“有害或没用的高斯”清除掉。

### 3.5 Compact Box (CB)

- 背景：原始 3DGS 在 rasterization 预处理阶段用 3-sigma 规则确定高斯 footprint，会产生很多几乎不贡献像素的 Gaussian–tile 对。
- Speedy-Splat 已经通过精确 tile-intersection 减少了一部分，但仍然有冗余。
- FastGS 提出 **Compact Box**：
  - 基于 Gaussian 在 tile 中心的马氏距离判断是否有显著贡献；
  - 筛掉“远离中心、贡献很小”的 tile；
  - 实现上与 `mult` 参数相关，控制 box 的紧凑程度。

在代码中，CB 的具体 CUDA 逻辑在 `diff_gaussian_rasterization_fastgs` 中（C++/CUDA），Python 部分通过：

- `GaussianRasterizationSettings` 中的 `mult` 进行控制；
- README 说明：`--mult` 是 “multiplier for the compact box to control the tile number of each splat”。

---

## 4. 整体训练与 IO：从代码角度看 FastGS

### 4.1 训练脚本与主流程

主入口：[train.py](cci:7://file:///e:/windsurf/FastGS/train.py:0:0-0:0)

- 命令行参数：
  - [ModelParams](cci:2://file:///e:/windsurf/FastGS/arguments/__init__.py:46:0-61:16)：数据路径、图像目录、分辨率、sh_degree、white_background 等；
  - [OptimizationParams](cci:2://file:///e:/windsurf/FastGS/arguments/__init__.py:72:0-112:59)：各种学习率、迭代数、densify/prune 参数、FastGS 特有参数；
  - [PipelineParams](cci:2://file:///e:/windsurf/FastGS/arguments/__init__.py:63:0-70:55)：是否在 Python 端计算 SH/cov 等。
- 核心调用：
  - 初始化：
    - `gaussians = GaussianModel(dataset.sh_degree, opt.optimizer_type)`
    - `scene = Scene(dataset, gaussians)`
      - 从 COLMAP / Blender 加载数据；
      - 初始化 Gaussians 或从 ply 恢复；
    - [gaussians.training_setup(opt)](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:191:4-214:98)：建立 optimizer、学习率调度器等。
  - 主循环 `for iteration in ...`：
    - 随机选取一个训练视角；
    - [render_fastgs(...)](cci:1://file:///e:/windsurf/FastGS/gaussian_renderer/__init__.py:17:0-109:56) 渲染当前图像；
    - 计算 L1 + SSIM loss 并反向传播；
    - 每隔指定步数执行：
      - 多视图 densification/pruning（VCD + VCP）；
      - 最终阶段的多视图 pruning；
    - 调用 [optimizer_step](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:224:4-243:62) 完成优化；
    - 在指定迭代保存模型与评估。

**损失函数：**

- 训练时：  
  `L = (1 - λ) * L1 + λ * (1 - SSIM)`，其中 λ=0.2  
  与原始 3DGS 一致。

### 4.2 输入输出数据形式

**输入（训练脚本的视角）：**

- 必须提供一个 **COLMAP 或 Blender 场景路径**：
  - `--source_path`：包含 `sparse/` 或 `transforms_train.json`；
  - `--images`：图像目录名（默认 `images`）。
- FastGS README 推荐的数据组织：
  - `datasets/mipnerf360/*`；
  - `datasets/db/*`（Deep Blending）；
  - `datasets/tanksandtemples/*`。

**输出：**

- `model_path` 目录（默认 `./output/<uuid>`）中主要包含：
  - `input.ply`：初始点云；
  - `cameras.json`：训练/测试相机列表；
  - `point_cloud/iteration_xxxxx/point_cloud.ply`：训练得到的最终高斯；
  - `cfg_args`：记录训练配置；
  - 如启用 TensorBoard，还会输出损失、PSNR、SSIM、LPIPS 等日志。

**网络/算法级别的 I/O 概括：**

- **输入到算法：**
  - 多视图图像（及相机内外参）；
  - 初始稀疏点云；
  - 超参数（学习率、densify/prune 阈值等）。
- **输出：**
  - 场景的高效 Gaussian 表示（数量大幅减少）；
  - 可用于实时渲染的新视角图像；
  - 训练时间与模型规模比原始 3DGS 大幅下降。

---

## 5. 是否可微调训练？如何微调？

注意：3DGS/ FastGS 的训练本质上是 **每个场景单独优化**，不像典型 CNN 那样“一个模型泛化到所有场景”。所以这里的“微调”主要有两层含义：

1. **继续优化同一场景（resume / fine-tune）**；
2. **将 FastGS 框架集成或微调到其他 3DGS 变体 / 任务中**。

### 5.1 继续训练同一场景（resume）

代码支持从 checkpoint 或已有 point_cloud 继续训练：

- 使用方式（命令行）：
  - `--start_checkpoint <path/to/checkpoint>`：从之前保存的 PyTorch checkpoint 继续；
  - 或者：把 `--model_path` 指向已有输出目录，[Scene](cci:2://file:///e:/windsurf/FastGS/scene/__init__.py:20:0-92:39) 会从 `point_cloud/iteration_xxxx/point_cloud.ply` 读取 Gaussians。

从代码角度：

- [GaussianModel.restore(...)](cci:1://file:///e:/windsurf/FastGS/scene/gaussian_model.py:107:4-127:52) 会重新加载参数与优化器状态；
- [Scene(..., load_iteration)](cci:2://file:///e:/windsurf/FastGS/scene/__init__.py:20:0-92:39) 加载上一轮的 ply，并重建相机信息；
- 再次运行 [training(...)](cci:1://file:///e:/windsurf/FastGS/train.py:36:0-179:41)，所有 densify/prune 逻辑仍然有效。

**典型用途：**

- 你可以先用默认 FastGS（30k iter）训练；
- 若某些视角质量欠佳，可降低 `loss_thresh`、调整 densify/prune 参数，然后从 checkpoint 继续少量迭代进行精修。

### 5.2 在新图像或新任务上“微调”已有 Gaussians

严格来说，FastGS 没有“跨场景的预训练 + 新场景微调”的统一模型；  
但可以在以下意义上使用“微调”：

- 对同一场景追加新的相机视角：
  - 确保新的 COLMAP 重建与原场景在同一坐标系；
  - 合并 SfM/相机文件，重新构造 [Scene](cci:2://file:///e:/windsurf/FastGS/scene/__init__.py:20:0-92:39)；
  - 使用之前的 `point_cloud.ply` 初始化，而不是重新从 SfM 点云初始化；
  - 再运行 FastGS 训练，即是“在旧 Gaussians 基础上微调以适配新增视角”。

- 对不同任务（动态场景、表面重建、稀疏视图等）：
  - 论文中展示了把 FastGS 嵌入到其他 backbone（Deformable-3DGS、PGSR、DropGaussian、OctreeGS、Photo-SLAM）中的效果；
  - 这类属于“结构微调 / 框架级微调”：在这些代码中替换/扩展其 densify 和 prune 模块为 FastGS 的 VCD/VCP + CB。

### 5.3 参数与策略的微调建议（从代码角度）

关键超参数（`arguments/OptimizationParams` 与 README）：

- **FastGS 特有：**
  - `loss_thresh`：loss map 二值化阈值（越低 → 认为误差高的像素越多 → densify/prune 更积极）；
  - `grad_abs_thresh`, `grad_thresh`：基于位置梯度的 densify 判定阈值；
  - `dense`：用于区分 clone / split 的尺度阈值；
  - `mult`：Compact Box 的紧凑系数（越小 → tile 更少 → 渲染更快，但有轻微风险损失质量）。

- **3DGS 通用：**
  - `densification_interval`、`densify_from_iter`、`densify_until_iter`；
  - `opacity_reset_interval`；
  - 不同参数组的学习率（位置、SH、opacity、scale、rotation）。

**实践上：**

- 想要 **更快（牺牲少量质量）**：
  - 增大 `loss_thresh`（只在误差很大的区域 densify）；
  - 缩短 densification 时间窗或降低 densify 频率；
  - 调大 `mult`（更紧的 Compact Box）。
- 想要 **更高质量（允许更长训练时间）**：
  - 降低 `loss_thresh`，增大 densify 视角数；
  - 使用 FastGS-Big variant（论文与 README 提供，`train_big.sh`）：
    - 频繁 densify；
    - 最终高斯数略多，但质量更高。

---

## 6. 实验数据集与任务设置

### 6.1 静态场景新视角合成（主实验）

论文主要在三个真实场景数据集上验证 FastGS：

- **Mip-NeRF 360** [Barron et al., CVPR 2022]
- **Deep Blending** [Hedman et al., TOG 2018]
- **Tanks & Temples** [Knapitsch et al., TOG 2017]

对比方法涵盖：

- 原始 3DGS、3DGS-accel（结合 Taming-3DGS 优化）；
- Mini-Splatting；
- Speedy-Splat；
- Taming-3DGS；
- DashGaussian（当前加速 SOTA）。

**指标：**

- 质量：
  - PSNR；
  - SSIM；
  - LPIPS。
- 速度与紧凑性：
  - 总训练时间（分钟）；
  - 高斯数量（NGS）；
  - 渲染 FPS。

**关键结论（Tab.1）：**

- 标准 FastGS 配置：
  - Mip-NeRF 360 平均训练时间约 **1.9 分钟**（单场景约 100 秒级）；
  - Deep Blending 上相对 vanilla 3DGS 加速 **15.45×**；
  - 相比 DashGaussian，Mip-NeRF 360 上加速 **3.32×**；
  - 高斯数量约为几百 K（远低于多方法的几百万）。

- FastGS-Big：
  - 相比 DashGaussian：
    - PSNR 提升约 0.2 dB；
    - 高斯数量减少一半以上；
    - 训练时间缩短约 43.7%。

### 6.2 泛化能力实验：多种任务上的加速（Sec. 5.3）

论文进一步把 FastGS 集成到不同任务/框架中：

1. **动态场景重建**（Tab.3）：
   - 基于 Deformable-3DGS：
     - 数据集：NeRF-DS、Neu3D；
     - FastGS 带来约 2.6× 的训练加速，同时保持或略微提升 PSNR/SSIM。

2. **表面重建**（Tab.4）：
   - 基于 PGSR（Planar-based Gaussian Splatting for Surface Reconstruction）：
     - 数据集：Tanks & Temples、Mip-NeRF 360；
     - FastGS 实现 2～7× 加速，F1/PSNR 基本不变。

3. **稀疏视角重建**：
   - 基于 DropGaussian；
   - 数据集：LLFF、BungeeNeRF 等。

4. **大规模场景重建**：
   - 基于 OctreeGS；
   - 数据集：Replica 室内大场景。

5. **SLAM**：
   - 基于 Photo-SLAM；
   - 在单目/双目/RGB-D 场景上展示实时建图时的训练加速。

**总体结论：**

> 在几乎所有任务和 backbone 上，FastGS 都可以带来 **2–14×** 的训练加速，同时高斯数量平均减少 ~77%，渲染质量保持基本不变或略有提升，说明多视图一致性设计具有很强的通用性。

---

## 7. FastGS 与原始 3DGS / 其他加速方法的差异

- **与原始 3DGS：**
  - 3DGS 的 densification/pruning 只依赖单视角梯度与简单阈值，不考虑多视角重建质量；
  - FastGS 在 densification + pruning 两个环节都引入了显式的 **多视图一致性度量**。

- **与 Taming-3DGS：**
  - Taming-3DGS 引入 per-splat 反向传播和 budget 约束，提升效率；
  - 但其重要性评分仍然主要依赖 Gaussian 自身属性（opacity、scale、gradient 等），多视图信息利用不充分；
  - FastGS 能在无 budget 的条件下，仍然维持较小高斯数和较高质量。

- **与 DashGaussian：**
  - DashGaussian 通过精细设计的 budget 和优化流程，在质量和速度之间取得了很好的折中；
  - 但缺少有效的 pruning 策略，仍然保留了大量冗余 Gaussians；
  - FastGS 借助多视图一致性 densification + pruning，使高斯数和时间进一步降低。

- **与 Speedy-Splat：**
  - Speedy-Splat 的剪枝依赖 Hessian 近似和稀疏像素策略，剪得更“狠”，速度很快；
  - 但由于多视图信息利用不足，会造成明显质量下降；
  - FastGS 在 **质量不降** 的前提下做到类似甚至更好的加速。

---

## 8. 概括 FastGS

一段话概括：

> FastGS 提出了一种基于多视图一致性约束的 3D Gaussian Splatting 加速框架，针对现有方法在自适应密度控制中存在的高斯冗余和质量-速度权衡不佳的问题，设计了多视图一致的 densification（VCD）与 pruning（VCP）策略，并结合 Compact Box 进一步减少光栅化时的无效计算。与原始 3DGS 及后续加速方法仅基于高斯自身属性或梯度近似进行密度控制不同，FastGS 直接利用多视图重建误差图，精确评估每个高斯对多视图渲染质量的真实贡献，从而在保持甚至略微提升渲染质量的前提下，将高斯数量大幅压缩，并把单场景训练时间缩短到 100 秒量级。大量实验表明，FastGS 在静态场景新视角合成、动态场景重建、表面重建、稀疏视角、大规模重建和 SLAM 等多种任务与 3DGS 变体上均能带来 2–14 倍的训练加速，体现出很强的通用性和实用价值。

